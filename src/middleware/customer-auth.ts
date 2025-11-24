import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { CustomerJwtPayload } from '../types/customer-auth.types';
import prisma from '../config/database';

/**
 * Extended Request interface with customer authentication
 */
export interface CustomerRequest extends Request {
  customer?: {
    id: string;
    email: string;
    name: string;
    status: string;
    emailVerified: boolean;
  };
}

/**
 * Middleware to authenticate customer JWT tokens
 * Validates the access token and attaches customer info to request
 */
export const authenticateCustomer = async (
  req: CustomerRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded: CustomerJwtPayload;
    try {
      decoded = jwt.verify(token, env.CUSTOMER_JWT_SECRET) as CustomerJwtPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }

    // Validate token type
    if (decoded.type !== 'customer') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Verify customer still exists and is active
    const customer = await prisma.customer.findFirst({
      where: {
        id: decoded.sub,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!customer) {
      throw new UnauthorizedError('Customer not found');
    }

    if (customer.status === 'SUSPENDED') {
      throw new ForbiddenError('Account suspended. Please contact support.');
    }

    if (customer.status === 'INACTIVE') {
      throw new ForbiddenError('Account inactive. Please reactivate your account.');
    }

    // Attach customer info to request
    req.customer = customer;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require email verification
 * Must be used after authenticateCustomer
 */
export const requireEmailVerification = (
  req: CustomerRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.customer) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!req.customer.emailVerified) {
    throw new ForbiddenError('Email verification required. Please check your email.');
  }

  next();
};

/**
 * Optional customer authentication
 * Attaches customer info if token is present and valid, but doesn't fail if not
 * Useful for endpoints that work for both guests and authenticated customers
 */
export const optionalCustomerAuth = async (
  req: CustomerRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // If no token, continue without customer info
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, env.CUSTOMER_JWT_SECRET) as CustomerJwtPayload;

      if (decoded.type === 'customer') {
        const customer = await prisma.customer.findFirst({
          where: {
            id: decoded.sub,
            deletedAt: null,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            emailVerified: true,
          },
        });

        if (customer) {
          req.customer = customer;
        }
      }
    } catch (error) {
      // Invalid token, but continue without customer info
    }

    next();
  } catch (error) {
    next(error);
  }
};
