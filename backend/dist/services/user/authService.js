"use strict";
// src/services/user/authService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPRequest = sendOTPRequest;
exports.verifyOTP = verifyOTP;
const otpService_1 = require("./otpService");
const jwt_1 = require("../../utils/jwt");
const client_1 = require("@prisma/client"); // Import Prisma's User and Address types
const userService_1 = require("../user/userService"); // Renamed import to avoid conflict
const prisma = new client_1.PrismaClient();
/**
 * Initiates OTP sending via Twilio Verify.
 * @param fullPhoneNumber The phone number in E.164 format (e.g., "+919876543210").
 */
async function sendOTPRequest(fullPhoneNumber) {
    console.log(`[authService] Initiating Twilio OTP for ${fullPhoneNumber}...`);
    await (0, otpService_1.initiateTwilioVerification)(fullPhoneNumber);
}
/**
 * Verifies OTP and handles user login or registration.
 * Sets an HttpOnly cookie with JWT token.
 * @param fullPhoneNumber The phone number in E.164 format.
 * @param inputOTP The OTP entered by the user.
 * @param res The Express response object to set the cookie.
 * @returns An object indicating if the user is new, if their profile is complete, and the user object itself.
 */
async function verifyOTP(fullPhoneNumber, inputOTP, res) {
    // 1. Verify OTP using Twilio
    const isValid = await (0, otpService_1.checkTwilioVerification)(fullPhoneNumber, inputOTP);
    if (!isValid) {
        throw new Error("Invalid or expired OTP");
    }
    // 2. Find or create the user in the database
    // IMPORTANT: Include the address relation here so that isProfileComplete can check it
    let user = await prisma.user.findUnique({
        where: { phoneNumber: fullPhoneNumber },
        include: {
            address: true, // Include the address relation
        },
    });
    let isNewUser = false;
    if (!user) {
        user = await prisma.user.create({
            data: { phoneNumber: fullPhoneNumber },
            include: {
                address: true,
            }
        });
        isNewUser = true; // Mark as a new user
    }
    // 3. Determine if the user's profile is complete
    // Pass the Prisma user object (which now potentially includes 'address')
    const profileStatus = (0, userService_1.isProfileComplete)(user);
    // 4. Create a comprehensive user object to be returned to the frontend
    const userWithProfileStatus = {
        ...user, // Spread all properties from the Prisma user object (including address)
        isProfileComplete: profileStatus, // Explicitly add the calculated status
    };
    // 5. Generate a JWT token for the user
    const tokenPayload = {
        userId: user.id, // Always include the user ID
        isProfileComplete: profileStatus, // Include profile completeness
        email: user.email || undefined, // Include email if it exists
        phoneNumber: user.phoneNumber, // Include phone number
        firstName: user.firstName || undefined, // Include first name
        lastName: user.lastName || undefined, // Include last name
        companyName: user.companyName || undefined, // Include company name
        panCard: user.panCard || undefined, // Include PAN card
        // ... include other relevant user data in the token payload if needed for /status endpoint
    };
    const token = (0, jwt_1.generateToken)(tokenPayload); // Pass the entire payload object
    console.log(token);
    // 6. Set the JWT token as an HttpOnly cookie
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
    });
    // 7. Return user status and the user object for client-side redirection and state update
    return {
        isProfileComplete: profileStatus,
        isNewUser,
        user: userWithProfileStatus,
    };
}
