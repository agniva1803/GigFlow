import { Router, Request, Response } from 'express';
import User from '../models/User';
import Lead from '../models/Lead';

const router = Router();

const runSeed = async (req: Request, res: Response): Promise<void> => {
  const secret = req.headers['x-seed-secret'] || req.query['secret'];
  if (secret !== 'gigflow-seed-2024') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // Prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  try {
    await User.deleteMany({});
    await Lead.deleteMany({});

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@gigflow.com',
      password: 'admin123',
      role: 'admin'
    });

    const sales = await User.create({
      name: 'Sales Rep',
      email: 'sales@gigflow.com',
      password: 'sales123',
      role: 'sales'
    });

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

    const adminUser = await User.findOne({ email: 'admin@gigflow.com' }).select('+password');
    const passwordCheck = adminUser ? await adminUser.comparePassword('admin123') : false;

    res.json({
      success: true,
      message: '✅ Database seeded!',
      passwordVerified: passwordCheck,
      adminId: admin._id,
      users: ['admin@gigflow.com / admin123', 'sales@gigflow.com / sales123'],
      leads: '10 leads created'
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

router.get('/run', runSeed);
router.post('/run', runSeed);

export default router;
