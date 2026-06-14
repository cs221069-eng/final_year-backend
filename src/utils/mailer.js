import 'dotenv/config';
import nodemailer from 'nodemailer';

const host = process.env.EMAIL_HOST || 'smtp.mailtrap.io';
const port = Number(process.env.EMAIL_PORT || '2525');
const secure = process.env.EMAIL_SECURE === 'true';
const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';

console.log('Mailer config:', {
  host,
  port,
  secure,
  authUser: Boolean(user),
  authPass: Boolean(pass),
});

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user,
    pass,
  },
});

async function sendVerificationOtp(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_FROM ?? process.env.EMAIL_USER,
    to: email,
    subject: 'Verify your GenZ eSports account',
    html: `
      <p>Welcome to GenZ eSports!</p>
      <p>Your verification code is:</p>
      <h2>${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

async function sendPasswordResetOtp(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_FROM ?? process.env.EMAIL_USER,
    to: email,
    subject: 'Reset your GenZ eSports password',
    html: `
      <p>You requested a password reset for your GenZ eSports account.</p>
      <p>Your password reset code is:</p>
      <h2>${otp}</h2>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export default sendVerificationOtp;
export { sendPasswordResetOtp };
