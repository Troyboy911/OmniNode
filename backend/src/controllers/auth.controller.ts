import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { hashPassword, comparePassword } from '@/utils/password';
import { generateTokenPair } from '@/utils/jwt';
import { sendSuccess, sendCreated } from '@/utils/response';
import { AuthenticationError, ConflictError } from '@/types';

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        throw new ConflictError('User with this email or username already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = generateTokenPair({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      sendCreated(res, {
        user,
        ...tokens,
      }, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  // Login user
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const tokens = generateTokenPair({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        ...tokens,
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AuthenticationError('Refresh token is required');
      }

      // Verify refresh token
      const { verifyRefreshToken } = await import('@/utils/jwt');
      const decoded = verifyRefreshToken(refreshToken);

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = generateTokenPair({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });

      sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  // Logout (optional - mainly for client-side token removal)
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just send a success response
      sendSuccess(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }
}