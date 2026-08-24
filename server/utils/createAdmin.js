import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Admin',
      username: 'admin',
      password: 'admin123',
      isAdmin: true,
      onboardingCompleted: true
    });

    console.log('✅ Admin created:', admin.username);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();