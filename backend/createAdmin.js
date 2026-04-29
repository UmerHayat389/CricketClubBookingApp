const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

const connectDB = require('./src/config/db');
const User = require('./src/models/User');

const createAdmin = async () => {
  await connectDB();

  try {
    const existing = await User.findOne({ email: 'admin@cricket.com' });

    if (existing) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const admin = new User({
      name: 'Admin',
      email: 'admin@cricket.com',
      password: hashedPassword,
      isAdmin: true,
    });

    await admin.save();
    console.log('✅ Admin created successfully!');
    console.log('Email:    admin@cricket.com');
    console.log('Password: Admin@123');
  } catch (error) {
    console.error('Error creating admin:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();