"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
// src/utils/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generates a JWT token.
 * @param payload The data object to be signed into the token (e.g., { userId, isProfileComplete, email }).
 * @returns The generated JWT string.
 */
function generateToken(payload) {
    console.log('Generating token with payload:', payload); // Debugging log
    // The first argument to jwt.sign is the payload object
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}
/**
 * Verifies a JWT token.
 * @param token The JWT string to verify.
 * @returns The decoded payload if the token is valid, otherwise null.
 */
function verifyToken(token) {
    try {
        // jwt.verify returns the decoded payload, which we cast to our JwtPayload interface
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}
// // src/utils/jwt.ts
// import jwt from 'jsonwebtoken';
// export function generateToken(userId: string): string {
//   console.log('Generating token for userId:', userId); // Debugging log
//   return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
// }
// export function verifyToken(token: string) {
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
//     return decoded;  // Return the decoded data if the token is valid
//   } catch (error) {
//     console.error('Error verifying token:', error);
//     return null;  // If the token is invalid or expired, return null
//   }
// }
