"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const PORT = process.env.PORT ?? 5000;
// Start HTTP server first, then connect to DB
const server = app_1.default.listen(PORT, () => {
    console.log(`🚀 GigFlow API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`🔑 MongoDB URI set: ${!!process.env.MONGODB_URI}`);
});
// Connect to MongoDB after server is already listening
(0, database_1.default)().then(() => {
    console.log('✅ Ready to handle requests');
}).catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    // Don't exit - keep server running so Render doesn't restart loop
});
server.on('error', (err) => {
    console.error('Server error:', err);
});
//# sourceMappingURL=server.js.map