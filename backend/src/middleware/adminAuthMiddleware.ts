// backend/src/middleware/adminAuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma'; // ✅ Import your configured singleton
import { AdminWithRolePrisma } from '../types/admin';



declare global {
  namespace Express {
    interface Request {
      admin?: AdminWithRolePrisma;
    }
  }
}

export const protectAdmin = async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  console.log(`[protectAdmin] Incoming request: ${req.method} ${req.originalUrl}`);
  console.log(`[protectAdmin] Incoming cookies:`, req.cookies); // This log is key!

  if (req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken;
    console.log(`[protectAdmin] Found 'adminToken' in cookies. Token length: ${token?.length}`);
  } else {
    console.warn(`[protectAdmin] 'adminToken' cookie NOT found for route: ${req.originalUrl}`);
  }

  // ⭐ CRITICAL: Correctly identify the admin status check route ⭐
  // This must match the actual endpoint used by frontend for status checks (/api/admin/status)
  const isStatusCheckRoute = req.originalUrl === '/api/admin/status'; // ⭐ THIS IS THE CORRECTED PATH ⭐
  console.log(`[protectAdmin] Is status check route (${req.originalUrl} === '/api/admin/status')?: ${isStatusCheckRoute}`);


  // --- Handle cases where no token is provided or JWT_SECRET is missing ---
  if (!token || !process.env.JWT_SECRET) {
    if (isStatusCheckRoute) {
      console.log('[protectAdmin] No token or JWT_SECRET. Allowing /api/admin/status to proceed as unauthenticated.');
      req.admin = undefined; // Explicitly ensure req.admin is undefined
      return next(); // Allow the status check to proceed to getAdminStatus
    } else {
      console.warn(`[protectAdmin] No token or JWT_SECRET for protected route ${req.originalUrl}. Sending 401.`);
      return res.status(401).json({ error: 'Authentication required: No admin token or server config missing.' });
    }
  }

  // --- Attempt to verify the token ---
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET as string);
    const adminId =
      typeof verified === 'object' &&
      verified !== null &&
      'id' in verified &&
      typeof (verified as { id: unknown }).id === 'string'
        ? (verified as { id: string }).id
        : null;

    console.log(`[protectAdmin] Token verified for ID: ${adminId} for route: ${req.originalUrl}`);

    if (!adminId) {
      console.warn('[protectAdmin] JWT decoded but missing id. Invalid token payload.');
      if (isStatusCheckRoute) {
          req.admin = undefined;
          return next();
      }
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: { role: { include: { permissions: true } } },
    });

    if (!admin) {
      console.warn(`[protectAdmin] Admin with ID ${adminId} not found in DB.`);
      if (isStatusCheckRoute) {
          req.admin = undefined;
          return next();
      }
      return res.status(401).json({ error: 'Admin not found' });
    }

    req.admin = admin; // Assign the authenticated admin to the request
    console.log(`[protectAdmin] Admin ${admin.id} successfully authenticated for route ${req.originalUrl}.`);
    next(); // Proceed to the next middleware/controller
  } catch (error) {
    console.error(`[protectAdmin] Error during token verification for ${req.originalUrl}:`, error);

    if (isStatusCheckRoute) {
      req.admin = undefined; // Ensure admin is undefined
      return next(); // Allow the request to proceed
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
