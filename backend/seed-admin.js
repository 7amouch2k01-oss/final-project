/**
 * seed-admin.js
 * Run once: node seed-admin.js
 * Creates a superadmin account if it does not already exist, or updates it with correct password hash.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');

const ADMIN = {
  name:     'Super Admin',
  email:    'admin@tunistudy.tn',
  password: 'Admin@123456',   // plain text so the pre-save hook hashes it exactly once!
  role:     'admin',
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clean up any existing admin to avoid double-hashing confusion
    await User.deleteOne({ email: ADMIN.email });
    console.log('🧹 Cleaned up old admin user (if any)');

    // This calls User.create() which triggers pre-save hook to hash the password properly
    await User.create(ADMIN);

    console.log('🎉 Admin account created successfully with proper single hashing!');
    console.log('   Email:   ', ADMIN.email);
    console.log('   Password:', ADMIN.password);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
