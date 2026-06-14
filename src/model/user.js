import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  number: { type: String, required: true },
  favGame: { type: String },
  emailVerified: { type: Boolean, default: false },
  verifyOtp: { type: String },
  otpExpiresAt: { type: Date },
  role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

export default User;