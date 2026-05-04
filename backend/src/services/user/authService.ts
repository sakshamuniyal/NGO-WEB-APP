// src/services/user/authService.ts

import { initiateTwilioVerification, checkTwilioVerification } from './otpService';
import { generateToken } from '../../utils/jwt';
import { PrismaClient, User as PrismaUser, Address } from '@prisma/client'; // Import Prisma's User and Address types
import { isProfileComplete as checkProfileCompletion } from '../user/userService'; // Renamed import to avoid conflict
import { Response } from 'express';

import prisma from '../../prisma'; 


// Define the User object structure as it will be used and returned
// This now accurately reflects the Prisma User model's properties
// and includes the 'address' relation as it will be fetched.
interface UserWithComputedStatus {
    id: string;
    phoneNumber: string;
    firstName: string | null; // Matches Prisma 'String?'
    lastName: string | null;  // Matches Prisma 'String?'
    companyName: string | null; // Matches Prisma 'String?'
    email: string | null;     // Matches Prisma 'String?'
    panCard: string | null;   // Matches Prisma 'String?'
    createdAt: Date;
    updatedAt: Date;
    address: Address | null;  // Explicitly include the address relation
    isProfileComplete: boolean; // Add the computed status
}

// Define the return type for verifyOTP function
interface VerifyOTPResult {
    isNewUser: boolean;
    isProfileComplete: boolean; // Still returned for direct use in authRoutes
    user: UserWithComputedStatus; // The actual user object with its profile status
}

/**
 * Initiates OTP sending via Twilio Verify.
 * @param fullPhoneNumber The phone number in E.164 format (e.g., "+919876543210").
 */
export async function sendOTPRequest(fullPhoneNumber: string) {
    console.log(`[authService] Initiating Twilio OTP for ${fullPhoneNumber}...`);
    await initiateTwilioVerification(fullPhoneNumber);
}

/**
 * Verifies OTP and handles user login or registration.
 * Sets an HttpOnly cookie with JWT token.
 * @param fullPhoneNumber The phone number in E.164 format.
 * @param inputOTP The OTP entered by the user.
 * @param res The Express response object to set the cookie.
 * @returns An object indicating if the user is new, if their profile is complete, and the user object itself.
 */
export async function verifyOTP(
    fullPhoneNumber: string,
    inputOTP: string,
    res: Response
): Promise<VerifyOTPResult> {
    // 1. Verify OTP using Twilio
    const isValid = await checkTwilioVerification(fullPhoneNumber, inputOTP);

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
            include: { // Also include address if created, to ensure consistency
                address: true,
            }
        });
        isNewUser = true; // Mark as a new user
    }

    // 3. Determine if the user's profile is complete
    // Pass the Prisma user object (which now potentially includes 'address')
    const profileStatus = checkProfileCompletion(user);

    // 4. Create a comprehensive user object to be returned to the frontend
    const userWithProfileStatus: UserWithComputedStatus = {
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
    const token = generateToken(tokenPayload);

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

