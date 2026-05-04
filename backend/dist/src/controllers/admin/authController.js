"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutAdmin = exports.getAdminStatus = exports.loginAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await prisma.admin.findUnique({
            where: { email },
            include: { role: { include: { permissions: true } } },
        });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = await bcrypt_1.default.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.id, email: admin.email, roleId: admin.roleId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('adminToken', token, { httpOnly: true, secure: true });
        res.json({ admin });
    }
    catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.loginAdmin = loginAdmin;
const getAdminStatus = async (req, res) => {
    try {
        const admin = req.admin; // From authMiddleware
        if (!admin) {
            return res.json({ isLoggedIn: false, admin: null });
        }
        res.json({ isLoggedIn: true, admin });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin status' });
    }
};
exports.getAdminStatus = getAdminStatus;
const logoutAdmin = async (req, res) => {
    try {
        res.clearCookie('adminToken');
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
};
exports.logoutAdmin = logoutAdmin;
