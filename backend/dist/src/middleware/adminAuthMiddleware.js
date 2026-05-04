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
    if (req.cookies && req.cookies.adminToken) {
        token = req.cookies.adminToken;
    }
    if (!token) {
        return res.status(401).json({ error: 'No admin token provided' });
    }
    try {
        if (!process.env.JWT_SECRET) {
            console.error('Admin Auth Middleware: JWT_SECRET is not defined');
            return res.status(500).json({ error: 'Server configuration error' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            console.warn('Admin Auth Middleware: JWT decoded but missing id:', decoded);
            return res.status(401).json({ error: 'Invalid token payload' });
        }
        const admin = await prisma.admin.findUnique({
            where: { id: decoded.id },
            include: { role: { include: { permissions: true } } },
        });
        if (!admin) {
            console.warn(`Admin Auth Middleware: Admin with ID ${decoded.id} not found`);
            return res.status(401).json({ error: 'Admin not found' });
        }
        req.admin = admin; // Directly assign the Prisma result, which matches AdminWithRole
        next();
    }
    catch (error) {
        console.error('Admin Auth Middleware: Error during token verification:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.protectAdmin = protectAdmin;
