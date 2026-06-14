import User from '../model/user.js';
import bcrypt from 'bcrypt';
import generateToken from '../utils/token.js';
import sendVerificationOtp from '../utils/mailer.js';
import { sendPasswordResetOtp } from '../utils/mailer.js';
import { createOtpExpiry, generateOtp } from '../utils/otp.js';

const UserCreate = async (req, res) => {
    try {
    const { fullname, email, password ,number ,favGame } = req.body;

    if (!fullname || !email || !password || !number) { 
      return res
        .status(400)
        .json({ message: "Full name, email, password and number are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return res.status(400).json({ message: "User already exists" });
      }

      // If the user started signup before but did not verify yet,
      // update the pending account and resend a fresh OTP.
      const salt = await bcrypt.genSalt(10);
      existingUser.fullname = fullname;
      existingUser.password = await bcrypt.hash(password, salt);
      existingUser.number = number;
      existingUser.favGame = favGame;
      existingUser.verifyOtp = generateOtp();
      existingUser.otpExpiresAt = createOtpExpiry(10);
      existingUser.emailVerified = false;
      await existingUser.save();

      console.log(`Reused pending unverified account for ${existingUser.email}, OTP: ${existingUser.verifyOtp}`);

      let mailSent = false;
      try {
        await sendVerificationOtp(existingUser.email, existingUser.verifyOtp);
        mailSent = true;
      } catch (err) {
        console.error('Failed to send verification email:', err);
      }

      const resp = {
        message: mailSent
            ? 'Verification email resent. Please verify to complete registration.'
            : 'Pending account updated; verification email failed to send.',
        user: {
          fullname: existingUser.fullname,
          email: existingUser.email,
          number: existingUser.number,
          favGame: existingUser.favGame,
          role: existingUser.role,
          createdAt: existingUser.createdAt,
        },
      };

      if (process.env.NODE_ENV !== 'production') {
        resp.debugOtp = existingUser.verifyOtp;
      }

      return res.status(200).json(resp);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      number,
      favGame,
      verifyOtp: generateOtp(),
      otpExpiresAt: createOtpExpiry(10),
    });

    await newUser.save();
    console.log(`Generated OTP for ${newUser.email}: ${newUser.verifyOtp}`);

    let mailSent = false;
    try {
      await sendVerificationOtp(newUser.email, newUser.verifyOtp);
      mailSent = true;
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }

    const resp = {
      message: mailSent ? 'Verification email sent' : 'User created; verification email failed to send',
      user: {
        fullname: newUser.fullname,
        email: newUser.email,
        number: newUser.number,
        favGame: newUser.favGame,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    };

    // For development convenience include the OTP in the response so the app can proceed
    if (process.env.NODE_ENV !== 'production') {
      resp.debugOtp = newUser.verifyOtp;
    }

    return res.status(201).json(resp);
  
 } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email before logging in.",
      });
    }

    const token = generateToken(user, res);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        fullname: user.fullname,
        email: user.email,
        number: user.number,
        favGame: user.favGame,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification data' });
    }

    if (user.emailVerified) {
      return res.status(200).json({ message: 'Email already verified' });
    }

    if (!user.verifyOtp || user.verifyOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
    }

    user.emailVerified = true;
    user.verifyOtp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = generateToken(user, res);
    return res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: {
        fullname: user.fullname,
        email: user.email,
        number: user.number,
        favGame: user.favGame,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


async function updateDisplayName(req, res) {
  try {
    const userId = req.user.id;
    const { displayName } = req.body;

    if (!displayName || displayName.trim().length === 0) {
      return res.status(400).json({ message: 'Display name is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fullname = displayName.trim();
    await user.save();

    return res.status(200).json({
      message: 'Display name updated successfully',
      user: {
        fullname: user.fullname,
        email: user.email,
        number: user.number,
        favGame: user.favGame,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function updatePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      // Don't reveal whether user exists - just say email sent
      return res.status(200).json({ message: 'If that email is registered, a reset code has been sent.' });
    }

    // Generate OTP and set expiry
    const otp = generateOtp();
    user.verifyOtp = otp;
    user.otpExpiresAt = createOtpExpiry(10);
    await user.save();

    console.log(`Password reset OTP for ${user.email}: ${otp}`);

    let mailSent = false;
    try {
      await sendPasswordResetOtp(user.email, otp);
      mailSent = true;
    } catch (err) {
      console.error('Failed to send password reset email:', err);
    }

    const resp = {
      message: mailSent
        ? 'Password reset code sent to your email.'
        : 'Failed to send reset email. Please try again.',
    };

    // For development convenience, include the OTP
    if (process.env.NODE_ENV !== 'production') {
      resp.debugOtp = otp;
    }

    return res.status(200).json(resp);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset data' });
    }

    if (!user.verifyOtp || user.verifyOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new code.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.verifyOtp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function logoutUser(_req, res) {
  res.clearCookie("token");

  return res.status(200).json({
    message: "Logout successful",
  });
}

export default { UserCreate, loginUser, verifyEmail, logoutUser, updateDisplayName, updatePassword, forgotPassword, resetPassword };