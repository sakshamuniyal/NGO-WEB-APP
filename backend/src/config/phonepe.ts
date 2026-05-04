// backend/src/config/phonepe.ts
import { StandardCheckoutClient, Env } from 'pg-sdk-node';

const isProduction = process.env.NODE_ENV === 'production';

const PHONEPE_CLIENT_ID = isProduction
  ? process.env.PHONEPE_MERCHANT_ID_PROD
  : process.env.PHONEPE_MERCHANT_ID_DEV;

const PHONEPE_SALT_KEY = isProduction
  ? process.env.PHONEPE_SALT_KEY_PROD
  : process.env.PHONEPE_SALT_KEY_DEV;

const PHONEPE_SDK_ENV = isProduction ? Env.PRODUCTION : Env.SANDBOX;
const PHONEPE_CLIENT_VERSION = 1;

export const FRONTEND_URL = process.env.FRONTEND_URL;
export const BACKEND_URL = process.env.BACKEND_URL;
export const PHONEPE_WEBHOOK_USERNAME = isProduction
  ? process.env.PHONEPE_WEBHOOK_USERNAME_PROD
  : process.env.PHONEPE_WEBHOOK_USERNAME_DEV;
export const PHONEPE_WEBHOOK_PASSWORD = isProduction
  ? process.env.PHONEPE_WEBHOOK_PASSWORD_PROD
  : process.env.PHONEPE_WEBHOOK_PASSWORD_DEV;

const hasValue = (value: string | undefined): boolean => Boolean(value && value.trim().length > 0);

// Safe startup diagnostics to quickly validate environment wiring without leaking secrets.
console.info('[PhonePe Config] Environment selection:', {
  nodeEnv: process.env.NODE_ENV || 'undefined',
  phonePeSdkEnv: isProduction ? 'PRODUCTION' : 'SANDBOX',
  usingCredentialsSet: isProduction ? 'PROD' : 'DEV',
});
console.info('[PhonePe Config] Required variable presence:', {
  PHONEPE_CLIENT_ID: hasValue(PHONEPE_CLIENT_ID),
  PHONEPE_SALT_KEY: hasValue(PHONEPE_SALT_KEY),
  PHONEPE_WEBHOOK_USERNAME: hasValue(PHONEPE_WEBHOOK_USERNAME),
  PHONEPE_WEBHOOK_PASSWORD: hasValue(PHONEPE_WEBHOOK_PASSWORD),
  FRONTEND_URL: hasValue(FRONTEND_URL),
  BACKEND_URL: hasValue(BACKEND_URL),
});

// Initialize PhonePe SDK client
export const phonePeClient = StandardCheckoutClient.getInstance(
  PHONEPE_CLIENT_ID!,
  PHONEPE_SALT_KEY!, // Use SALT_KEY as the secret
  PHONEPE_CLIENT_VERSION,
  PHONEPE_SDK_ENV
);

// Basic validation for critical environment variables
if (
  !PHONEPE_CLIENT_ID ||
  !PHONEPE_SALT_KEY ||
  !FRONTEND_URL ||
  !BACKEND_URL ||
  !PHONEPE_WEBHOOK_USERNAME ||
  !PHONEPE_WEBHOOK_PASSWORD
) {
  console.error("Missing critical PhonePe SDK config (client credentials, callback credentials, or FRONTEND/BACKEND URL) for the current NODE_ENV. Please check your .env file.");
  // In a production environment, you might want to throw an error or exit the process here
  // process.exit(1);
}
