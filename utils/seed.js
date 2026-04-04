/**
 * Seed Database Script
 * Chạy: node utils/seed.js
 * 
 * Tạo default roles và admin user
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/OmniShop';

// Dữ liệu roles mặc định
const defaultRoles = [
  {
    name: 'Admin',
    description: 'Administrator - Full access to all features',
    permissions: ['*'],
  },
  {
    name: 'Moderator',
    description: 'Moderator - Can manage products and users',
    permissions: ['products:read', 'products:create', 'products:update', 'users:read'],
  },
  {
    name: 'Staff',
    description: 'Staff - Can manage orders and support',
    permissions: ['orders:read', 'orders:update', 'messages:read', 'messages:create'],
  },
  {
    name: 'User',
    description: 'Regular User - Can browse and purchase',
    permissions: ['products:read', 'carts:manage', 'orders:create'],
  },
];

// Admin user mặc định
const defaultAdminUser = {
  username: 'admin',
  email: 'admin@omnishop.com',
  password: 'Admin@123456',
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if roles already exist
    const existingRoles = await Role.countDocuments();
    if (existingRoles === 0) {
      // Insert default roles
      const roles = await Role.insertMany(defaultRoles);
      console.log(`✓ Created ${roles.length} default roles`);

      // Get Admin role
      const adminRole = await Role.findOne({ name: 'Admin' });

      // Check if admin user exists
      const existingAdmin = await User.findOne({ email: defaultAdminUser.email });
      if (!existingAdmin) {
        // Create admin user
        const adminUser = new User({
          username: defaultAdminUser.username,
          email: defaultAdminUser.email,
          password: defaultAdminUser.password,
          role: adminRole._id,
        });

        await adminUser.save();
        console.log('✓ Created default admin user');
        console.log(`  Email: ${defaultAdminUser.email}`);
        console.log(`  Password: ${defaultAdminUser.password}`);
      } else {
        console.log('ℹ Admin user already exists');
      }
    } else {
      console.log('ℹ Roles already exist, skipping seed');
    }

    console.log('✓ Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
