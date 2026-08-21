const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Auto-ensure default super admin account exists
    const User = require('../models/User');
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@tunistudy.tn';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Password123!';
      await User.create({
        name: 'Platform Super Admin',
        email: adminEmail,
        password: defaultPassword,
        role: 'admin',
        isActive: true,
      });
      console.log(`👑 Default admin created (${adminEmail})`);
    }
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
