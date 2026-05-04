import { Request, Response, NextFunction } from 'express';
import { AdminWithRolePrisma } from '../types/admin';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminWithRolePrisma; // Use the Prisma-generated type
    }
  }
}

export const checkPermission = (permission: string) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log(`[checkPermission] Checking permission '${permission}' for route: ${req.originalUrl}`);
    console.log(`[checkPermission] req.admin presence: ${!!req.admin}`);
    if (req.admin) {
        console.log(`[checkPermission] Admin ID: ${req.admin.id}`);
        console.log(`[checkPermission] Admin role name: ${req.admin.role.name}`);
        console.log(`[checkPermission] Admin role permissions:`, req.admin.role.permissions.map(p => p.name));
    }

    if (!req.admin) {
      console.warn(`[checkPermission] Admin object not found on request for route ${req.originalUrl}. Sending 401.`);
      return res.status(401).json({ error: 'Unauthorized: Admin context missing.' });
    }

    const hasPermission = req.admin.role.permissions.some((p) => p.name === permission);

    if (!hasPermission) {
      console.warn(`[checkPermission] Admin ${req.admin.id} DOES NOT have permission: ${permission}. Sending 403.`);
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions.' });
    }

    console.log(`[checkPermission] Admin ${req.admin.id} HAS permission: ${permission}. Proceeding.`);
    next();
  } catch (error) {
    console.error(`[checkPermission] Error during permission check for ${req.originalUrl}:`, error);
    res.status(500).json({ error: 'Internal server error during permission check.' });
  }
};
