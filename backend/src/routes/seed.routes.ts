import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Lead from '../models/Lead';

const router = Router();

router.post('/run', async (req: Request, res: Response): Promise<void> => {
  const secret = req.headers['x-seed-secret'];
  if (secret !== 'gigflow-seed-2024') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  try {
    await User.deleteMany({});
    await Lead.deleteMany({});

    const adminPass = await bcrypt.hash('admin123', 12);
    const salesPass = await bcrypt.hash('sales123', 12);

    const admin = await User.create({ name: 'Admin User', email: 'admin@gigflow.com', password: adminPass, role: 'admin' });
    const sales = await User.create({ name: 'Sales Rep', email: 'sales@gigflow.com', password: salesPass, role: 'sales' });

    await Lead.insertMany([
      { name: 'Priya Sharma', email: 'priya.sharma@example.com', status: 'Qualified', source: 'Website', notes: 'Interested in premium plan', createdBy: admin._id },
      { name: 'Rahul Mehta', email: 'rahul.mehta@example.com', status: 'Contacted', source: 'Instagram', notes: 'Follow up next week', createdBy: sales._id },
      { name: 'Anita Patel', email: 'anita.patel@example.com', status: 'New', source: 'Referral', notes: 'Referred by Priya', createdBy: admin._id },
      { name: 'Vikram Singh', email: 'vikram.singh@example.com', status: 'Lost', source: 'Website', notes: 'Budget constraints', createdBy: sales._id },
      { name: 'Neha Gupta', email: 'neha.gupta@example.com', status: 'New', source: 'Instagram', createdBy: admin._id },
      { name: 'Amit Kumar', email: 'amit.kumar@example.com', status: 'Contacted', source: 'Website', createdBy: sales._id },
      { name: 'Sunita Rao', email: 'sunita.rao@example.com', status: 'Qualified', source: 'Referral', notes: 'Ready to close', createdBy: admin._id },
      { name: 'Deepak Joshi', email: 'deepak.joshi@example.com', status: 'New', source: 'Website', createdBy: sales._id },
      { name: 'Kavita Nair', email: 'kavita.nair@example.com', status: 'Contacted', source: 'Instagram', createdBy: admin._id },
      { name: 'Arun Krishnan', email: 'arun.krishnan@example.com', status: 'Lost', source: 'Referral', createdBy: sales._id },
    ]);

    res.json({ success: true, message: 'Database seeded! 2 users + 10 leads created.', users: ['admin@gigflow.com / admin123', 'sales@gigflow.com / sales123'] });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
