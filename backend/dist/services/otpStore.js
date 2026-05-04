"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = generateOTP;
exports.saveOTP = saveOTP;
exports.verifyOTP = verifyOTP;
const otpStore = {};
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function saveOTP(phoneNumber, otp) {
    const expiresAt = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes
    otpStore[phoneNumber] = { otp, expiresAt };
}
function verifyOTP(phoneNumber, inputOtp) {
    const data = otpStore[phoneNumber];
    if (!data || data.expiresAt < Date.now() || data.otp !== inputOtp) {
        return false;
    }
    console.log(otpStore);
    delete otpStore[phoneNumber]; // Remove OTP after successful verification
    return true;
}
