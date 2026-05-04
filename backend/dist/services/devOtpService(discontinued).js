"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = sendOTP;
// src/services/otpService.ts
const twilio_1 = __importDefault(require("twilio"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// The generateOTP function is now redundant here as OTP will be passed from authService.ts
// function generateOTP(): string {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }
// The sendOTP function should now receive the OTP and the full phone number
async function sendOTP(fullPhoneNumber, otp) {
    // The OTP is already generated and saved in authService.ts, so remove these lines:
    // const otp = generateOTP(); // This line is removed
    // saveOTP(phone, otp); // This line is removed
    console.log(`[otpService] Preparing to send OTP ${otp} to ${fullPhoneNumber}`); // More descriptive log
    // Twilio SMS sending (uncomment and use when ready)
    // Ensure fullPhoneNumber is used directly without prepending +91 again
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
        try {
            if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
                console.error('TWILIO_VERIFY_SERVICE_SID is not set. Cannot use Twilio Verify.');
                throw new Error('Twilio Verify Service SID not configured.');
            }
            await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
                .verifications
                .create({ to: fullPhoneNumber, channel: 'sms' }) // Use fullPhoneNumber directly
                .then(verification => console.log(`Twilio Verify initiated: ${verification.sid}, Status: ${verification.status}`));
        }
        catch (twilioError) {
            console.error('Error sending OTP via Twilio:', twilioError);
            // Re-throw the error to be caught by the calling service (authService)
            throw new Error('Failed to send OTP via SMS service.');
        }
    }
    else {
        console.warn('Twilio credentials not fully configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, or TWILIO_VERIFY_SERVICE_SID). Skipping actual SMS send.');
        // In a production environment, you might want to throw an error here if SMS is mandatory.
    }
    // --- Email sending part (commented out as it's not for phone OTP and uses phone as email) ---
    // If you intend to send OTP via email, this needs to be a separate function
    // or conditional logic based on the 'to' type (phone vs email).
    // Using a phone number string as an email 'to' address will cause errors.
    /*
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  
    const msg = {
      to: `${fullPhoneNumber}`, // This will likely fail if fullPhoneNumber is a phone number
      from: 'sakshamuniyal7@gmail.com', // Change to your verified sender
      subject: `Your OTP is ${otp}`,
      text: `Your OTP is ${otp}`,
      html: ` <html> ... your HTML ... </html>`,
    };
  
    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error('Error sending email:', error)
      });
    */
}
