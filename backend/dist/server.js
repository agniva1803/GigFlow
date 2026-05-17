"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // loads .env if present, skips if not (uses Render env vars)
const app_1 = __importDefault(require("./app"));
const database_1 = __importDefault(require("./config/database"));
const PORT = process.env.PORT ?? 5000;
console.log('Starting GigFlow API...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV ?? 'development');
console.log('MongoDB URI set:', !!process.env.MONGODB_URI);
console.log('JWT Secret set:', !!process.env.JWT_SECRET);
const startServer = async () => {
    try {
        await (0, database_1.default)();
        app_1.default.listen(PORT, () => {
            console.log(`🚀 GigFlow API running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map