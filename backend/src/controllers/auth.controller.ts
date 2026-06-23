import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendError(res, 'User with this email already exists', 409);
      return;
    }

    // Public registration always creates a "sales" account. Admin accounts
    // are never self-selected — accepting a client-supplied role here would
    // let anyone register as admin and get full cross-tenant lead access.
    // Admins are provisioned via the seed script or directly in the database.
    const user = await User.create({ name, email, password, role: 'sales' });

    const token = generateToken(user._id.toString(), user.role);

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      'Registration successful',
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 'Registration failed', 500);
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Login failed', 500);
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    sendError(res, 'Failed to fetch user', 500);
  }
};
