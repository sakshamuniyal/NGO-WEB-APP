// server/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, User as PrismaUser, Address as PrismaAddress } from '@prisma/client';
import prisma from '../prisma'; // ✅ Import your configured singleton

// Extend the Express Request interface to include a user property
declare global {
  namespace Express {
    // Define a simplified User type for the `req.user` object
    interface User extends Pick<PrismaUser, 'id' | 'phoneNumber' | 'firstName' | 'lastName' | 'email' | 'companyName' | 'panCard'> {
      address?: PrismaAddress | null;
    }

    interface Request {
      user?: User; // Attach the user object to the request
    }
  }
}

// ⭐ MODIFIED 'protect' to be non-blocking if no valid token is found ⭐
export const protectUser = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  // 1. Check for token in cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    // console.log('Auth Middleware: No token found. Proceeding as unauthenticated.'); // Optional: log for debugging
    return next(); // ⭐ IMPORTANT: Just call next(), don't send 401. User will be unauthenticated. ⭐
  }

  try {
    // 2. Verify token
    if (!process.env.JWT_SECRET) {
        console.error("Auth Middleware: JWT_SECRET is not defined in environment variables!");
        // For a non-blocking protect, if config is bad, we still call next()
        // but the user won't be authenticated. Log the error.
        return next();
    }
    const verified = jwt.verify(token, process.env.JWT_SECRET as string);
    const userId =
      typeof verified === 'object' &&
      verified !== null &&
      'userId' in verified &&
      typeof (verified as { userId: unknown }).userId === 'string'
        ? (verified as { userId: string }).userId
        : null;

    if (!userId) {
        console.warn('Auth Middleware: JWT decoded but missing userId. Proceeding as unauthenticated.');
        return next();
    }

    // 3. Find user by ID from token payload (fetch from DB to get full profile)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { // Select only the fields you need for req.user
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        companyName: true,
        panCard: true,
        address: true,
      },
    });

    if (!user) {
      console.warn(`Auth Middleware: User with ID ${userId} not found in DB after token verification. Proceeding as unauthenticated.`);
      return next();
    }

    // 4. Attach user to request object
    req.user = user;
    // console.log(`Auth Middleware: User ${user.id} authenticated.`); // Optional: log for debugging
    next(); // User authenticated and attached to req.user. Proceed.
  } catch (error) {
    console.error('Auth Middleware: Error during token verification (non-blocking):', error);
    // Log the error but still call next() to allow subsequent middleware/routes to run.
    // req.user will remain undefined.
    next();
  }
};