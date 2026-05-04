"use strict";
// src/services/devOtpStore.ts (new file)
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSaveDevOTP = generateAndSaveDevOTP;
exports.verifyDevOTP = verifyDevOTP;
const devOtpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
function generateAndSaveDevOTP(phoneNumber) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    devOtpStore.set(phoneNumber, { otp, timestamp: Date.now() });
    console.log(`[DEV-MODE] Generated & Stored OTP for ${phoneNumber}: ${otp}`);
    return otp;
}
function verifyDevOTP(phoneNumber, inputOtp) {
    const stored = devOtpStore.get(phoneNumber);
    if (!stored) {
        return false;
    }
    if (Date.now() - stored.timestamp > OTP_EXPIRY_MS) {
        devOtpStore.delete(phoneNumber); // Expired
        return false;
    }
    if (stored.otp === inputOtp) {
        devOtpStore.delete(phoneNumber); // OTP used, delete it
        return true;
    }
    return false;
}
