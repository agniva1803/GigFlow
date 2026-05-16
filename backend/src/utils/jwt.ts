import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

export const generateToken = (id: string, role: UserRole): string => {
  const jwtSecret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ id, role } as JwtPayload, jwtSecret, {
    expiresIn,
  } as jwt.SignOptions);
};
