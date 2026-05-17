"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const response_1 = require("../utils/response");
const notFound = (req, res) => {
    (0, response_1.sendError)(res, `Route ${req.originalUrl} not found`, 404);
};
exports.notFound = notFound;
const errorHandler = (err, _req, res, _next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    // Mongoose duplicate key error
    if (err.code === 11000) {
        (0, response_1.sendError)(res, 'Resource already exists with this data', 409);
        return;
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        (0, response_1.sendError)(res, err.message, 400);
        return;
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        (0, response_1.sendError)(res, 'Invalid token', 401);
        return;
    }
    const statusCode = err.statusCode ?? 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;
    (0, response_1.sendError)(res, message, statusCode);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map