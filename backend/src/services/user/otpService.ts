// src/services/otpService.ts (Updated for dev/prod environment)

import dotenv from 'dotenv';
import twilio from 'twilio';
import * as devOtpStore from './devOtpStore'; // Import your dev store

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;


const client = twilio(apiKey, apiSecret, {accountSid: accountSid});

// Check if we are in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export async function initiateTwilioVerification(fullPhoneNumber: string): Promise<void> {
  if (isDevelopment && process.env.FORCE_TWILIO_IN_DEV !== 'true') {
    // In development, generate and log a mock OTP
    devOtpStore.generateAndSaveDevOTP(fullPhoneNumber);
    return; // Skip Twilio call
  }

  // --- Production/Forced Twilio Logic ---
  if (!accountSid || !apiKey || !apiSecret || !verifyServiceSid) {
    console.error('Twilio Verify credentials not fully configured. Cannot initiate SMS.');
    throw new Error('Twilio Verify service not configured correctly.');
  }

  try {
    const verification = await client.verify.v2.services(verifyServiceSid)
      .verifications
      .create({ to: fullPhoneNumber, channel: 'sms' });
    console.log(`[otpService] Twilio Verify initiation successful: ${verification.sid}, Status: ${verification.status}`);
  } catch (twilioError) {
    const message =
      twilioError instanceof Error ? twilioError.message : String(twilioError);
    console.error(`[otpService] Error initiating Twilio verification for ${fullPhoneNumber}:`, message);
    throw new Error('Failed to initiate OTP verification via SMS service.');
  }
}

export async function checkTwilioVerification(fullPhoneNumber: string, inputOTP: string): Promise<boolean> {
  if (isDevelopment && process.env.FORCE_TWILIO_IN_DEV !== 'true') {
    // In development, verify against the mock OTP
    return devOtpStore.verifyDevOTP(fullPhoneNumber, inputOTP);
  }

  // --- Production/Forced Twilio Logic ---
  if (!accountSid || !apiKey || !apiSecret || !verifyServiceSid) {
    console.error('Twilio Verify credentials not fully configured. Cannot verify OTP.');
    throw new Error('Twilio Verify service not configured correctly.');
  }

  try {
    const verificationCheck = await client.verify.v2.services(verifyServiceSid)
      .verificationChecks
      .create({ to: fullPhoneNumber, code: inputOTP });

    console.log(`[otpService] Twilio Verify check result for ${fullPhoneNumber}: Status: ${verificationCheck.status}, Valid: ${verificationCheck.valid}`);
    return verificationCheck.valid;
  } catch (twilioError) {
    const message =
      twilioError instanceof Error ? twilioError.message : String(twilioError);
    console.error(`[otpService] Error checking Twilio verification for ${fullPhoneNumber}:`, message);
    throw new Error('OTP verification failed with SMS service.');
  }
}