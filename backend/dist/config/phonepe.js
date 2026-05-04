"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phonePeClient = exports.BACKEND_URL = exports.FRONTEND_URL = void 0;
// backend/src/config/phonepe.ts
const pg_sdk_node_1 = require("pg-sdk-node");
const isProduction = process.env.NODE_ENV === 'production';
const PHONEPE_CLIENT_ID = isProduction
    ? process.env.PHONEPE_MERCHANT_ID_PROD
    : process.env.PHONEPE_MERCHANT_ID_DEV;
const PHONEPE_SALT_KEY = isProduction
    ? process.env.PHONEPE_SALT_KEY_PROD
    : process.env.PHONEPE_SALT_KEY_DEV;
const PHONEPE_SDK_ENV = isProduction ? pg_sdk_node_1.Env.PRODUCTION : pg_sdk_node_1.Env.SANDBOX;
const PHONEPE_CLIENT_VERSION = 1;
exports.FRONTEND_URL = process.env.FRONTEND_URL;
exports.BACKEND_URL = process.env.BACKEND_URL;
// Initialize PhonePe SDK client
exports.phonePeClient = pg_sdk_node_1.StandardCheckoutClient.getInstance(PHONEPE_CLIENT_ID, PHONEPE_SALT_KEY, // Use SALT_KEY as the secret
PHONEPE_CLIENT_VERSION, PHONEPE_SDK_ENV);
// Basic validation for critical environment variables
if (!PHONEPE_CLIENT_ID || !PHONEPE_SALT_KEY || !exports.FRONTEND_URL || !exports.BACKEND_URL) {
    console.error("Missing critical PhonePe SDK (Client ID/Secret) or FRONTEND/BACKEND_URL environment variables for the current NODE_ENV. Please check your .env file.");
    // In a production environment, you might want to throw an error or exit the process here
    // process.exit(1);
}
