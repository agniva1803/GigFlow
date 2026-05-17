"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', statusCode = 200, pagination) => {
    const response = {
        success: true,
        message,
        data,
        ...(pagination && { pagination }),
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 500, errors) => {
    const response = {
        success: false,
        message,
        ...(errors && { errors }),
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
//# sourceMappingURL=response.js.map