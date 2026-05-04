"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ⭐ MODIFIED 'protect' to be non-blocking if no valid token is found ⭐
const protect = async (req, res, next) => {
    let token;
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Ensure the decoded token has a userId
        if (!decoded || !decoded.userId) {
            console.warn('Auth Middleware: JWT decoded but missing userId. Proceeding as unauthenticated:', decoded);
            return next();
        }
        // 3. Find user by ID from token payload (fetch from DB to get full profile)
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
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
            console.warn(`Auth Middleware: User with ID ${decoded.userId} not found in DB after token verification. Proceeding as unauthenticated.`);
            return next();
        }
        // 4. Attach user to request object
        req.user = user;
        // console.log(`Auth Middleware: User ${user.id} authenticated.`); // Optional: log for debugging
        next(); // User authenticated and attached to req.user. Proceed.
    }
    catch (error) {
        console.error('Auth Middleware: Error during token verification (non-blocking):', error);
        // Log the error but still call next() to allow subsequent middleware/routes to run.
        // req.user will remain undefined.
        next();
    }
};
exports.protect = protect;
