// backend/src/config/phonepe.ts
import { StandardCheckoutClient, Env } from 'pg-sdk-node';

/**
 * PhonePe Standard Checkout (`pg-sdk-node`) authenticates with OAuth **client_id** + **client_secret**
 * from the Payment Gateway merchant onboarding flow — not the legacy PG REST “Merchant ID” + “Salt Key”
 * used for checksum (X-VERIFY) APIs. If PhonePe returns `OIM007` / “Client Not Found”, the ID you passed
 * is not a registered Standard Checkout client for the selected environment.
 *
 * Set explicit credentials (recommended):
 *   PHONEPE_CLIENT_ID_PROD / PHONEPE_CLIENT_SECRET_PROD (and _DEV for sandbox)
 * Fallback (legacy names in this repo — only valid if they match what PhonePe issued for Standard Checkout):
 *   PHONEPE_MERCHANT_ID_* / PHONEPE_SALT_KEY_*
 *
 * Docs: https://developer.phonepe.com/payment-gateway/backend-sdk/nodejs-be-sdk/integration-steps
 */
const isProduction = process.env.NODE_ENV === 'production';

const hasValue = (value: string | undefined): boolean => Boolean(value && value.trim().length > 0);

const pickFirst = (...candidates: (string | undefined)[]): string | undefined => {
  for (const c of candidates) {
    if (hasValue(c)) return c!.trim();
  }
  return undefined;
};

const PHONEPE_CLIENT_ID = isProduction
  ? pickFirst(process.env.PHONEPE_CLIENT_ID_PROD, process.env.PHONEPE_MERCHANT_ID_PROD)
  : pickFirst(process.env.PHONEPE_CLIENT_ID_DEV, process.env.PHONEPE_MERCHANT_ID_DEV);

const PHONEPE_CLIENT_SECRET = isProduction
  ? pickFirst(process.env.PHONEPE_CLIENT_SECRET_PROD, process.env.PHONEPE_SALT_KEY_PROD)
  : pickFirst(process.env.PHONEPE_CLIENT_SECRET_DEV, process.env.PHONEPE_SALT_KEY_DEV);

const PHONEPE_SDK_ENV = isProduction ? Env.PRODUCTION : Env.SANDBOX;

const parsedClientVersion = Number.parseInt(process.env.PHONEPE_CLIENT_VERSION ?? '', 10);
const PHONEPE_CLIENT_VERSION =
  Number.isFinite(parsedClientVersion) && parsedClientVersion > 0 ? parsedClientVersion : 1;

export const FRONTEND_URL = process.env.FRONTEND_URL;
export const BACKEND_URL = process.env.BACKEND_URL;
export const PHONEPE_WEBHOOK_USERNAME = isProduction
  ? process.env.PHONEPE_WEBHOOK_USERNAME_PROD
  : process.env.PHONEPE_WEBHOOK_USERNAME_DEV;
export const PHONEPE_WEBHOOK_PASSWORD = isProduction
  ? process.env.PHONEPE_WEBHOOK_PASSWORD_PROD
  : process.env.PHONEPE_WEBHOOK_PASSWORD_DEV;

// Safe startup diagnostics to quickly validate environment wiring without leaking secrets.
console.info('[PhonePe Config] Environment selection:', {
  nodeEnv: process.env.NODE_ENV || 'undefined',
  phonePeSdkEnv: isProduction ? 'PRODUCTION' : 'SANDBOX',
  usingCredentialsSet: isProduction ? 'PROD' : 'DEV',
  clientVersion: PHONEPE_CLIENT_VERSION,
  clientIdSource: isProduction
    ? hasValue(process.env.PHONEPE_CLIENT_ID_PROD)
      ? 'PHONEPE_CLIENT_ID_PROD'
      : 'PHONEPE_MERCHANT_ID_PROD'
    : hasValue(process.env.PHONEPE_CLIENT_ID_DEV)
      ? 'PHONEPE_CLIENT_ID_DEV'
      : 'PHONEPE_MERCHANT_ID_DEV',
});
console.info('[PhonePe Config] Required variable presence:', {
  PHONEPE_CLIENT_ID: hasValue(PHONEPE_CLIENT_ID),
  PHONEPE_CLIENT_SECRET: hasValue(PHONEPE_CLIENT_SECRET),
  PHONEPE_WEBHOOK_USERNAME: hasValue(PHONEPE_WEBHOOK_USERNAME),
  PHONEPE_WEBHOOK_PASSWORD: hasValue(PHONEPE_WEBHOOK_PASSWORD),
  FRONTEND_URL: hasValue(FRONTEND_URL),
  BACKEND_URL: hasValue(BACKEND_URL),
});

// Initialize PhonePe SDK client
export const phonePeClient = StandardCheckoutClient.getInstance(
  PHONEPE_CLIENT_ID!,
  PHONEPE_CLIENT_SECRET!,
  PHONEPE_CLIENT_VERSION,
  PHONEPE_SDK_ENV
);

// Basic validation for critical environment variables
if (
  !PHONEPE_CLIENT_ID ||
  !PHONEPE_CLIENT_SECRET ||
  !FRONTEND_URL ||
  !BACKEND_URL ||
  !PHONEPE_WEBHOOK_USERNAME ||
  !PHONEPE_WEBHOOK_PASSWORD
) {
  console.error("Missing critical PhonePe SDK config (client credentials, callback credentials, or FRONTEND/BACKEND URL) for the current NODE_ENV. Please check your .env file.");
  // In a production environment, you might want to throw an error or exit the process here
  // process.exit(1);
}
