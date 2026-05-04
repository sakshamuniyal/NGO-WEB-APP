"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const protectAdmin = async (req, res, next) => {
    let token;
    console.log(`[protectAdmin] Incoming request: ${req.method} ${req.originalUrl}`);
    console.log(`[protectAdmin] Incoming cookies:`, req.cookies); // This log is key!
    if (req.cookies && req.cookies.adminToken) {
        token = req.cookies.adminToken;
        console.log(`[protectAdmin] Found 'adminToken' in cookies. Token length: ${token?.length}`);
    }
    else {
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
        }
        else {
            console.warn(`[protectAdmin] No token or JWT_SECRET for protected route ${req.originalUrl}. Sending 401.`);
            return res.status(401).json({ error: 'Authentication required: No admin token or server config missing.' });
        }
    }
    // --- Attempt to verify the token ---
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log(`[protectAdmin] Token verified for ID: ${decoded.id} for route: ${req.originalUrl}`);
        if (!decoded || !decoded.id) {
            console.warn('[protectAdmin] JWT decoded but missing id. Invalid token payload.');
            if (isStatusCheckRoute) {
                req.admin = undefined;
                return next();
            }
            return res.status(401).json({ error: 'Invalid token payload' });
        }
        const admin = await prisma.admin.findUnique({
            where: { id: decoded.id },
            include: { role: { include: { permissions: true } } },
        });
        if (!admin) {
            console.warn(`[protectAdmin] Admin with ID ${decoded.id} not found in DB.`);
            if (isStatusCheckRoute) {
                req.admin = undefined;
                return next();
            }
            return res.status(401).json({ error: 'Admin not found' });
        }
        req.admin = admin; // Assign the authenticated admin to the request
        console.log(`[protectAdmin] Admin ${admin.id} successfully authenticated for route ${req.originalUrl}.`);
        next(); // Proceed to the next middleware/controller
    }
    catch (error) {
        console.error(`[protectAdmin] Error during token verification for ${req.originalUrl}:`, error);
        if (isStatusCheckRoute) {
            req.admin = undefined; // Ensure admin is undefined
            return next(); // Allow the request to proceed
        }
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.protectAdmin = protectAdmin;
