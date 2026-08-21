const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Auto-ensure default super admin account exists
    const User = require('../models/User');
    const University = require('../models/University');
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@tunistudy.tn';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Password123!';
      adminUser = await User.create({
        name: 'Platform Super Admin',
        email: adminEmail,
        password: defaultPassword,
        role: 'admin',
        isActive: true,
      });
      console.log(`👑 Default admin created (${adminEmail})`);
    }

    // Auto-seed initial catalog if database is fresh/empty
    const uniCount = await University.countDocuments({ deletedAt: null });
    if (uniCount === 0) {
      console.log('🌱 Fresh database detected. Auto-seeding catalog...');
      const seedFunc = require('../seed');
      if (typeof seedFunc === 'function') {
        await seedFunc(false); // seed without wiping admin
      }
    }
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
