import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole, Section } from '@prisma/client';

export interface AuthPayload {
  sub: string;
  email: string;
  role: UserRole;
  assignedSection?: Section;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

export const checkSectionAccess = (section: Section) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Admins have access to all sections
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // Managers can only access their assigned section
    if (req.user.role === UserRole.MANAGER) {
      if (req.user.assignedSection !== section) {
        throw new ForbiddenError(`You can only access ${req.user.assignedSection} section`);
      }
    }

    next();
  };
};
