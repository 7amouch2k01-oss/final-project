const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Auto-ensure default super admin account exists
    const User = require('../models/User');
    const University = require('../models/University');
    const Stage = require('../models/Stage');
    const Job = require('../models/Job');
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
    } else if (adminUser.role !== 'admin' || !adminUser.isActive) {
      adminUser.role = 'admin';
      adminUser.isActive = true;
      await adminUser.save();
    }

    // Auto-seed initial catalog only if ALL three catalog collections are empty
    const [uniCount, stageCount, jobCount] = await Promise.all([
      University.countDocuments({ deletedAt: null }),
      Stage.countDocuments({ deletedAt: null }),
      Job.countDocuments({ deletedAt: null }),
    ]);

    if (uniCount === 0 && stageCount === 0 && jobCount === 0) {
      console.log('🌱 All catalog collections are empty. Auto-seeding catalog...');
      try {
        const seedFunc = require('../seed');
        if (typeof seedFunc === 'function') {
          await seedFunc(false); // seed without wiping existing data
        }
      } catch (seedErr) {
        console.warn('⚠️ Auto-seed encountered an error (non-fatal):', seedErr.message);
      }
    }
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
