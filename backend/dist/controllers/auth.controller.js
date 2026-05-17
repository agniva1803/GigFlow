"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            (0, response_1.sendError)(res, 'User with this email already exists', 409);
            return;
        }
        const user = await User_1.default.create({ name, email, password, role: role ?? 'sales' });
        const token = (0, jwt_1.generateToken)(user._id.toString(), user.role);
        (0, response_1.sendSuccess)(res, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        }, 'Registration successful', 201);
    }
    catch (error) {
        console.error('Register error:', error);
        (0, response_1.sendError)(res, 'Registration failed', 500);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            (0, response_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        const token = (0, jwt_1.generateToken)(user._id.toString(), user.role);
        (0, response_1.sendSuccess)(res, {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        }, 'Login successful');
    }
    catch (error) {
        console.error('Login error:', error);
        (0, response_1.sendError)(res, 'Login failed', 500);
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            (0, response_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const user = await User_1.default.findById(req.user.id);
        if (!user) {
            (0, response_1.sendError)(res, 'User not found', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        });
    }
    catch (error) {
        console.error('GetMe error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch user', 500);
    }
};
exports.getMe = getMe;
//# sourceMappingURL=auth.controller.js.map