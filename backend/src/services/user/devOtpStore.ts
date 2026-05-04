// src/services/devOtpStore.ts (new file)

const devOtpStore = new Map<string, { otp: string, timestamp: number }>();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function generateAndSaveDevOTP(phoneNumber: string): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    devOtpStore.set(phoneNumber, { otp, timestamp: Date.now() });
    console.log(`[DEV-MODE] Generated & Stored OTP for ${phoneNumber}: ${otp}`);
    return otp;
}

export function verifyDevOTP(phoneNumber: string, inputOtp: string): boolean {
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