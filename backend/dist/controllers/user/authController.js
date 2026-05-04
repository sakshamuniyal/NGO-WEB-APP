"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVerifyOTP = exports.requestOTP = exports.logout = exports.getAuthStatus = void 0;
const authService_1 = require("../../services/user/authService");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAuthStatus = async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ isLoggedIn: false, user: null });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userFromDb = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { address: true },
        });
        if (userFromDb) {
            res.json({
                isLoggedIn: true,
                user: {
                    id: userFromDb.id,
                    phoneNumber: userFromDb.phoneNumber,
                    firstName: userFromDb.firstName,
                    lastName: userFromDb.lastName,
                    companyName: userFromDb.companyName,
                    email: userFromDb.email,
                    panCard: userFromDb.panCard,
                    createdAt: userFromDb.createdAt.toISOString(),
                    updatedAt: userFromDb.updatedAt.toISOString(),
                    address: userFromDb.address,
                    isProfileComplete: decoded.isProfileComplete,
                },
            });
        }
        else {
            res.json({ isLoggedIn: false, user: null });
        }
    }
    catch (e) {
        console.error("JWT verification or user fetch failed for /status:", e);
        res.clearCookie("token", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
        res.json({ isLoggedIn: false, user: null });
    }
};
exports.getAuthStatus = getAuthStatus;
const logout = async (req, res) => {
    res.clearCookie("token", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
    res.status(200).json({ message: "Logged out successfully" });
};
exports.logout = logout;
const requestOTP = async (req, res) => {
    const { fullPhoneNumber } = req.body;
    if (!fullPhoneNumber) {
        return res.status(400).json({ message: "Phone number is required." });
    }
    try {
        await (0, authService_1.sendOTPRequest)(fullPhoneNumber);
        res.status(200).json({ message: "OTP sent successfully" });
    }
    catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Something went wrong while requesting OTP." });
    }
};
exports.requestOTP = requestOTP;
const handleVerifyOTP = async (req, res) => {
    const { fullPhoneNumber, otp } = req.body;
    if (!fullPhoneNumber || !otp) {
        return res.status(400).json({ message: "Phone number and OTP are required." });
    }
    try {
        const result = await (0, authService_1.verifyOTP)(fullPhoneNumber, otp, res); // Added res parameter
        res.status(200).json({
            message: "OTP verified successfully",
            isNewUser: result.isNewUser,
            isProfileComplete: result.isProfileComplete,
            user: result.user,
        });
    }
    catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : "Invalid OTP or server error." });
    }
};
exports.handleVerifyOTP = handleVerifyOTP;
