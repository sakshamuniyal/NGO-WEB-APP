"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// authRoutes.ts
const express_1 = __importDefault(require("express"));
// Assuming verifyOTPFn will now return an object that includes `user` data
const authService_1 = require("../services/authService"); // Add UserProfileResult type if available
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client"); // Import your Prisma client instance
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Route to check login status
router.get('/status', async (req, res) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ isLoggedIn: false, user: null });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET); // Add phoneNumber to decoded type
        // ⭐ Fetch the full user profile from the database, including the address ⭐
        const userFromDb = await prisma.user.findUnique({
            where: { id: decoded.userId }, // Assuming userId is unique and correct from token
            // OR use phoneNumber if it's more reliable for finding the user
            // where: { phoneNumber: decoded.phoneNumber },
            include: { address: true }, // ⭐ THIS IS CRUCIAL: Include the address relation ⭐
        });
        if (userFromDb) {
            // You can also recalculate isProfileComplete here if it's not always in sync with DB
            // const isProfileComplete = yourIsProfileCompleteFunction(userFromDb);
            res.json({
                isLoggedIn: true,
                user: {
                    id: userFromDb.id,
                    phoneNumber: userFromDb.phoneNumber, // Include phone number
                    firstName: userFromDb.firstName,
                    lastName: userFromDb.lastName,
                    companyName: userFromDb.companyName,
                    email: userFromDb.email,
                    panCard: userFromDb.panCard,
                    createdAt: userFromDb.createdAt.toISOString(), // Convert DateTime to string
                    updatedAt: userFromDb.updatedAt.toISOString(), // Convert DateTime to string
                    address: userFromDb.address, // Include the full address object
                    isProfileComplete: decoded.isProfileComplete // Or userFromDb.isProfileComplete if stored in DB, or dynamically computed
                }
            });
        }
        else {
            // Token was valid, but user not found in DB (unlikely, but good to handle)
            console.warn(`User with ID ${decoded.userId} not found in DB after valid token.`);
            res.json({ isLoggedIn: false, user: null });
        }
    }
    catch (e) {
        console.error("JWT verification or user fetch failed for /status:", e);
        // Clear the token cookie if verification fails, as it's likely invalid/expired
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
        });
        res.json({ isLoggedIn: false, user: null });
    }
});
// Route to log out a user (remains the same)
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
    });
    res.status(200).json({ message: 'Logged out successfully' });
});
// Route to request OTP (remains the same)
router.post('/request-otp', async (req, res) => {
    console.log('Received POST /request-otp request');
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
    const { fullPhoneNumber } = req.body;
    if (!fullPhoneNumber) {
        console.error('Validation Error: fullPhoneNumber is missing from request body.');
        return res.status(400).json({ message: 'Phone number is required.' });
    }
    try {
        await (0, authService_1.requestOTP)(fullPhoneNumber);
        res.status(200).json({ message: 'OTP sent successfully' });
    }
    catch (error) {
        console.error('Error requesting OTP:', error);
        const errorMessage = error instanceof Error ? error.message : 'Something went wrong while requesting OTP.';
        res.status(400).json({ message: errorMessage });
    }
});
// Route to verify OTP and log in
router.post('/verify-otp', async (req, res) => {
    const { fullPhoneNumber, otp } = req.body;
    if (!fullPhoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required.' });
    }
    try {
        // verifyOTPFn should now return an object that includes the full user data
        // and the isProfileComplete flag.
        const result = await (0, authService_1.verifyOTP)(fullPhoneNumber, otp, res); // Pass `res` to set the cookie
        // Ensure 'result' contains the user object and isProfileComplete
        if (!result || !result.user || typeof result.isProfileComplete === 'undefined') {
            console.error("verifyOTPFn did not return expected user data.");
            return res.status(500).json({ message: "Login failed due to missing user data." });
        }
        res.status(200).json({
            message: 'OTP verified successfully',
            isNewUser: result.isNewUser, // Assuming this is also returned
            isProfileComplete: result.isProfileComplete,
            user: result.user // <--- NOW SEND THE USER OBJECT!
        });
    }
    catch (error) {
        console.error('Error verifying OTP:', error);
        const errorMessage = error instanceof Error ? error.message : 'Invalid OTP or server error.';
        res.status(400).json({ message: errorMessage });
    }
});
exports.default = router;
