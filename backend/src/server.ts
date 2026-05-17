import dotenv from 'dotenv';
dotenv.config(); // loads .env if present, skips if not (uses Render env vars)

import app from './app';
import connectDB from './config/database';

const PORT = process.env.PORT ?? 5000;

console.log('Starting GigFlow API...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV ?? 'development');
console.log('MongoDB URI set:', !!process.env.MONGODB_URI);
console.log('JWT Secret set:', !!process.env.JWT_SECRET);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 GigFlow API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
