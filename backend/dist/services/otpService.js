"use strict";
// src/services/otpService.ts (Updated for dev/prod environment)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateTwilioVerification = initiateTwilioVerification;
exports.checkTwilioVerification = checkTwilioVerification;
const twilio_1 = __importDefault(require("twilio"));
const dotenv_1 = __importDefault(require("dotenv"));
const devOtpStore = __importStar(require("./devOtpStore")); // Import your dev store
dotenv_1.default.config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const client = (0, twilio_1.default)(accountSid, authToken);
// Check if we are in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
async function initiateTwilioVerification(fullPhoneNumber) {
    // --- ADD THESE DEBUGGING LOGS HERE ---
    console.log('\n--- OTP Service Dev Mode Check ---');
    console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
    console.log('isDevelopment:', isDevelopment);
    console.log('process.env.FORCE_TWILIO_IN_DEV:', process.env.FORCE_TWILIO_IN_DEV);
    console.log('Condition: (isDevelopment && process.env.FORCE_TWILIO_IN_DEV !== \'true\')');
    console.log('Resulting evaluation:', isDevelopment && process.env.FORCE_TWILIO_IN_DEV !== 'true');
    console.log('--- End Dev Mode Check ---\n');
    // --- END DEBUGGING LOGS ---
    if (isDevelopment && process.env.FORCE_TWILIO_IN_DEV !== 'true') { // Add FORCE_TWILIO_IN_DEV env var to test Twilio in dev
        // In development, generate and log a mock OTP
        devOtpStore.generateAndSaveDevOTP(fullPhoneNumber);
        return; // Skip Twilio call
    }
    // --- Production/Forced Twilio Logic ---
    if (!accountSid || !authToken || !verifyServiceSid) {
        console.error('Twilio Verify credentials not fully configured. Cannot initiate SMS.');
        throw new Error('Twilio Verify service not configured correctly.');
    }
    try {
        const verification = await client.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: fullPhoneNumber, channel: 'sms' });
        console.log(`[otpService] Twilio Verify initiation successful: ${verification.sid}, Status: ${verification.status}`);
    }
    catch (twilioError) {
        console.error(`[otpService] Error initiating Twilio verification for ${fullPhoneNumber}:`, twilioError.message);
        throw new Error('Failed to initiate OTP verification via SMS service.');
    }
}
async function checkTwilioVerification(fullPhoneNumber, inputOTP) {
    if (isDevelopment && process.env.FORCE_TWILIO_IN_DEV !== 'true') {
        // In development, verify against the mock OTP
        return devOtpStore.verifyDevOTP(fullPhoneNumber, inputOTP);
    }
    // --- Production/Forced Twilio Logic ---
    if (!accountSid || !authToken || !verifyServiceSid) {
        console.error('Twilio Verify credentials not fully configured. Cannot verify OTP.');
        throw new Error('Twilio Verify service not configured correctly.');
    }
    try {
        const verificationCheck = await client.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: fullPhoneNumber, code: inputOTP });
        console.log(`[otpService] Twilio Verify check result for ${fullPhoneNumber}: Status: ${verificationCheck.status}, Valid: ${verificationCheck.valid}`);
        return verificationCheck.valid;
    }
    catch (twilioError) {
        console.error(`[otpService] Error checking Twilio verification for ${fullPhoneNumber}:`, twilioError.message);
        throw new Error('OTP verification failed with SMS service.');
    }
}
