import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserRole, Section } from '@prisma/client';
import prisma from '../config/database';
import { env } from '../config/env';
import { UnauthorizedError, ValidationError, NotFoundError } from '../utils/errors';
import { AuthPayload } from '../middleware/auth';

interface UserTokenPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  assignedSection?: Section;
}

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
    assignedSection?: Section;
  }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || UserRole.STAFF,
        assignedSection: data.assignedSection,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedSection: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const userPayload: UserTokenPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      assignedSection: user.assignedSection ?? undefined,
    };
    const accessToken = this.generateAccessToken(userPayload);
    const refreshToken = this.generateRefreshToken(userPayload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        assignedSection: user.assignedSection,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload;

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.userId !== decoded.sub) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { token: refreshToken } });
        throw new UnauthorizedError('Refresh token expired');
      }

      // Generate new access token
      const userPayload: UserTokenPayload = {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
        assignedSection: storedToken.user.assignedSection ?? undefined,
      };
      const accessToken = this.generateAccessToken(userPayload);

      return { accessToken };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  private generateAccessToken(user: UserTokenPayload): string {
    const payload: Omit<AuthPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      assignedSection: user.assignedSection,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as SignOptions);
  }

  private generateRefreshToken(user: UserTokenPayload): string {
    const payload = {
      sub: user.id,
    };

    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    } as SignOptions);
  }
}

export const authService = new AuthService();
