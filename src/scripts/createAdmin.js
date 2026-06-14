import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../model/user.js';

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'mmoizsid@gmail.com';
    const password = 'cs221069';

    // Check if admin already exists
    const existing = await User.findOne({ email });
    if (existing) {
      // Update existing user to admin
      existing.role = 'admin';
      existing.emailVerified = true;
      const salt = await bcrypt.genSalt(10);
      existing.password = await bcrypt.hash(password, salt);
      await existing.save();
      console.log('✅ Existing user updated to ADMIN:', email);
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const admin = new User({
        fullname: 'Moiz Siddiqui',
        email,
        password: hashedPassword,
        number: '03001234567',
        favGame: 'FC 25',
        role: 'admin',
        emailVerified: true,
      });

      await admin.save();
      console.log('✅ Admin user CREATED successfully!');
      console.log('   Email   :', email);
      console.log('   Password:', password);
      console.log('   Role    : admin');
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
