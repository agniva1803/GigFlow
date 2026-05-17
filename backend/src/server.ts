import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/database';

const PORT = process.env.PORT ?? 5000;

// Start HTTP server first, then connect to DB
const server = app.listen(PORT, () => {
  console.log(`🚀 GigFlow API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`🔑 MongoDB URI set: ${!!process.env.MONGODB_URI}`);
});

// Connect to MongoDB after server is already listening
connectDB().then(() => {
  console.log('✅ Ready to handle requests');
}).catch((err) => {
  console.error('❌ MongoDB connection failed:', err.message);
  // Don't exit - keep server running so Render doesn't restart loop
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
