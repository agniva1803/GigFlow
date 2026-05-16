import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Lead from '../models/Lead';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/gigflow';

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Lead.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const salesPassword = await bcrypt.hash('sales123', 12);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@gigflow.com',
    password: adminPassword,
    role: 'admin',
  });

  const sales = await User.create({
    name: 'Sales Rep',
    email: 'sales@gigflow.com',
    password: salesPassword,
    role: 'sales',
  });

  console.log('👤 Created users: admin@gigflow.com / admin123, sales@gigflow.com / sales123');

  // Create sample leads
  const sampleLeads = [
    { name: 'Priya Sharma', email: 'priya.sharma@example.com', status: 'Qualified', source: 'Website', notes: 'Interested in premium plan', createdBy: admin._id },
    { name: 'Rahul Mehta', email: 'rahul.mehta@example.com', status: 'Contacted', source: 'Instagram', createdBy: sales._id },
    { name: 'Anita Patel', email: 'anita.patel@example.com', status: 'New', source: 'Referral', notes: 'Referred by Priya', createdBy: admin._id },
    { name: 'Vikram Singh', email: 'vikram.singh@example.com', status: 'Lost', source: 'Website', notes: 'Budget constraints', createdBy: sales._id },
    { name: 'Neha Gupta', email: 'neha.gupta@example.com', status: 'New', source: 'Instagram', createdBy: admin._id },
    { name: 'Amit Kumar', email: 'amit.kumar@example.com', status: 'Contacted', source: 'Website', createdBy: sales._id },
    { name: 'Sunita Rao', email: 'sunita.rao@example.com', status: 'Qualified', source: 'Referral', notes: 'Ready to close', createdBy: admin._id },
    { name: 'Deepak Joshi', email: 'deepak.joshi@example.com', status: 'New', source: 'Website', createdBy: sales._id },
    { name: 'Kavita Nair', email: 'kavita.nair@example.com', status: 'Contacted', source: 'Instagram', createdBy: admin._id },
    { name: 'Arun Krishnan', email: 'arun.krishnan@example.com', status: 'Lost', source: 'Referral', createdBy: sales._id },
  ];

  await Lead.insertMany(sampleLeads);
  console.log(`📋 Created ${sampleLeads.length} sample leads`);

  await mongoose.disconnect();
  console.log('✅ Seeding complete! Disconnected from MongoDB.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
