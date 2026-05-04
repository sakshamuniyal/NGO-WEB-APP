"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/routes/donationRoutes.ts
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const pg_sdk_node_1 = require("pg-sdk-node");
const userAuthMiddleware_1 = require("../../middleware/userAuthMiddleware"); // RE-IMPORT PROTECT
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
// --- PhonePe Configuration & SDK Initialization ---
const isProduction = process.env.NODE_ENV === 'production';
const PHONEPE_CLIENT_ID = isProduction
    ? process.env.PHONEPE_MERCHANT_ID_PROD
    : process.env.PHONEPE_MERCHANT_ID_DEV;
const PHONEPE_CLIENT_SECRET = isProduction
    ? process.env.PHONEPE_SALT_KEY_PROD
    : process.env.PHONEPE_SALT_KEY_DEV;
const PHONEPE_SDK_ENV = isProduction ? pg_sdk_node_1.Env.PRODUCTION : pg_sdk_node_1.Env.SANDBOX;
const PHONEPE_CLIENT_VERSION = 1;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;
const phonePeClient = pg_sdk_node_1.StandardCheckoutClient.getInstance(PHONEPE_CLIENT_ID, PHONEPE_CLIENT_SECRET, PHONEPE_CLIENT_VERSION, PHONEPE_SDK_ENV);
if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET || !FRONTEND_URL || !BACKEND_URL) {
    console.error("Missing critical PhonePe SDK (Client ID/Secret) or FRONTEND/BACKEND_URL environment variables for the current NODE_ENV. Please check your .env file.");
}
// --- /donate Route - Initiate Payment with PhonePe SDK ---
router.post('/donate', userAuthMiddleware_1.protectUser, async (req, res) => {
    const { amount, isAnonymous, caseId, donorDetails } = req.body;
    const loggedInUserId = req.user?.id;
    console.log("Received payload in backend POST /donate:", req.body);
    console.log("isAnonymous in backend:", req.body.isAnonymous);
    console.log("loggedInUserId in backend:", loggedInUserId);
    console.log(`Backend isProduction: ${isProduction}`);
    // --- 1. Basic Validation ---
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        console.log("Validation Failed: Invalid amount.");
        return res.status(400).json({ message: 'Valid donation amount is required.' });
    }
    // --- 2. Anonymity and Amount Limit Validation ---
    if (isAnonymous) {
        if (amount > 50000) {
            console.log("Validation Failed: Anonymous donation amount exceeds limit.");
            return res.status(400).json({ message: 'Anonymous donations cannot exceed Rs 50,000.' });
        }
        if (donorDetails) {
            console.log("Validation Failed: Personal details provided for anonymous donation.");
            return res.status(400).json({ message: 'Personal details cannot be provided for anonymous donations.' });
        }
    }
    else {
        if (!loggedInUserId) {
            if (!donorDetails) {
                console.log("Validation Failed: Personal details missing for non-anonymous guest.");
                return res.status(400).json({ message: 'Personal details are required for non-anonymous donations from guests.' });
            }
            if (!donorDetails.firstName || !donorDetails.lastName || !donorDetails.phoneNumber ||
                !donorDetails.address?.line1 || !donorDetails.address?.country ||
                !donorDetails.address?.state || !donorDetails.address?.zipCode) {
                console.log("Validation Failed: Missing required personal or address details for non-anonymous guest donation.");
                return res.status(400).json({ message: 'Missing required personal or address details for non-anonymous donation.' });
            }
            if (typeof donorDetails.phoneNumber !== 'string' || donorDetails.phoneNumber.length < 10) {
                console.log("Validation Failed: Invalid phone number format/length for non-anonymous guest.");
                return res.status(400).json({ message: 'A valid phone number is required for non-anonymous guest donations.' });
            }
            if (donorDetails.email && (typeof donorDetails.email !== 'string' || (donorDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorDetails.email)))) {
                console.log("Validation Failed: Invalid email format for non-anonymous guest.");
                return res.status(400).json({ message: 'Invalid email format.' });
            }
        }
    }
    // --- 3. Determine User/Guest Details for Donation Record ---
    let userIdToLink = loggedInUserId || null;
    let guestDonorName = null;
    let guestDonorEmail = null;
    let guestDonorPhoneNumber = null;
    if (loggedInUserId && !isAnonymous && req.user) {
        userIdToLink = req.user.id;
        guestDonorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || null;
        guestDonorEmail = req.user.email || null;
        guestDonorPhoneNumber = req.user.phoneNumber || null;
    }
    else if (!loggedInUserId && !isAnonymous && donorDetails) {
        const existingUser = await prisma.user.findUnique({
            where: { phoneNumber: donorDetails.phoneNumber },
            select: { id: true }
        });
        if (existingUser) {
            userIdToLink = existingUser.id;
        }
        else {
            guestDonorName = `${donorDetails.firstName || ''} ${donorDetails.lastName || ''}`.trim() || null;
            guestDonorEmail = donorDetails.email || null;
            guestDonorPhoneNumber = donorDetails.phoneNumber || null;
        }
    }
    // --- 4. Initiate Payment with PhonePe SDK ---
    let newDonation;
    try {
        const merchantTransactionId = `TID_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        newDonation = await prisma.donation.create({
            data: {
                amount: new client_1.Prisma.Decimal(amount),
                currency: 'INR',
                paymentMode: 'OTHER', // Will be updated by polling
                transactionId: merchantTransactionId, // Your internal unique ID
                isAnonymous: isAnonymous,
                userId: userIdToLink,
                caseId: caseId || null,
                donorName: guestDonorName,
                donorEmail: guestDonorEmail,
                donorPhoneNumber: guestDonorPhoneNumber,
                paymentStatus: 'PENDING', // Initial status before PhonePe response/callback
            },
        });
        const phonePeRequest = pg_sdk_node_1.StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantTransactionId)
            .amount(amount * 100) // Amount in paisa
            .redirectUrl(`${FRONTEND_URL}/donation-status?phonepeTransactionId=${merchantTransactionId}`)
            .build();
        console.log("Initiating PhonePe payment via SDK with request:", phonePeRequest);
        const phonePeResponse = await phonePeClient.pay(phonePeRequest);
        if (phonePeResponse.redirectUrl) {
            console.log(`Sending redirect URL for transaction: ${merchantTransactionId}`);
            return res.status(200).json({
                message: 'Payment initiated, redirecting to PhonePe.',
                paymentLink: phonePeResponse.redirectUrl,
            });
        }
        else {
            console.error(`PhonePe SDK initiation failed for transaction ${merchantTransactionId}: No redirectUrl.`);
            await prisma.donation.update({
                where: { id: newDonation.id },
                data: { paymentStatus: 'FAILED' }
            });
            return res.status(500).json({
                message: 'Failed to initiate payment with PhonePe via SDK. Please try again.',
                details: phonePeResponse,
            });
        }
    }
    catch (error) {
        console.error('Error initiating PhonePe payment via SDK:', error);
        let errorMessage = 'Internal server error during payment initiation.';
        let errorDetails = undefined;
        if (error.response?.data) {
            errorMessage = error.response.data.message || errorMessage;
            errorDetails = error.response.data;
        }
        else if (error.message) {
            errorMessage = error.message;
            errorDetails = error.message;
        }
        if (newDonation && newDonation.id) {
            await prisma.donation.update({
                where: { id: newDonation.id },
                data: { paymentStatus: 'FAILED' }
            }).catch(dbError => {
                console.error("Failed to update donation status to FAILED in catch block (secondary error):", dbError);
            });
        }
        console.log(`Sending error response for transaction: ${newDonation?.transactionId || 'N/A'} in /donate catch block.`);
        res.status(500).json({
            message: errorMessage,
            details: errorDetails,
        });
    }
});
// --- NEW ROUTE: Get User Donations ---
router.get('/donations', userAuthMiddleware_1.protectUser, async (req, res) => {
    // Ensure a user is authenticated by the 'protect' middleware
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }
    try {
        const userId = req.user.id;
        console.log(`Fetching donations for user: ${userId}`);
        const donations = await prisma.donation.findMany({
            where: {
                userId: userId,
                // Optionally filter out 'PENDING' donations if you only want completed/failed ones
                // paymentStatus: {
                //   not: 'PENDING'
                // }
            },
            orderBy: {
                timeOfPayment: 'desc', // Order by most recent donations
            },
            select: {
                id: true,
                amount: true,
                currency: true,
                paymentMode: true,
                paymentStatus: true,
                transactionId: true, // Your internal ID
                gatewayTransactionId: true, // PhonePe's ID
                timeOfPayment: true,
                isAnonymous: true,
                case: {
                    select: {
                        patientName: true,
                        typeOfCase: true,
                    },
                },
            },
        });
        console.log(`Found ${donations.length} donations for user ${userId}.`);
        console.log(donations);
        res.status(200).json(donations);
    }
    catch (error) {
        console.error('Error fetching user donations:', error);
        res.status(500).json({ message: 'Failed to fetch donations.' });
    }
});
// --- NEW ROUTE: Check Donation Status (Frontend will call this after redirect) ---
router.get('/check-donation-status', async (req, res) => {
    const { merchantTransactionId } = req.query;
    if (!merchantTransactionId || typeof merchantTransactionId !== 'string') {
        console.log("Validation Failed: Missing merchantTransactionId in query.");
        return res.status(400).json({ message: 'Missing merchantTransactionId in query parameters.' });
    }
    try {
        // 1. Get transaction status from PhonePe using the SDK
        console.log(`Checking PhonePe status for transaction: ${merchantTransactionId}`);
        const statusResponse = await phonePeClient.getOrderStatus(merchantTransactionId);
        console.log("Full getOrderStatus Response:", JSON.stringify(statusResponse, null, 2));
        const responseData = statusResponse;
        if (!responseData || !responseData.state) {
            console.error(`PhonePe getOrderStatus response missing 'data' or 'state' for transactionId: ${merchantTransactionId}`);
            // if (statusResponse.code === 'BAD_REQUEST' || statusResponse.code === 'INTERNAL_SERVER_ERROR') {
            //      console.log(`Sending error response due to PhonePe API error (code: ${statusResponse.code}).`);
            //      return res.status(statusResponse.code === 'BAD_REQUEST' ? 400 : 500).json({
            //          message: statusResponse.message || 'Failed to get payment status due to PhonePe API error.',
            //          code: statusResponse.code
            //      });
            // }
            console.log("Sending error response: PhonePe data missing.");
            return res.status(500).json({ message: 'Failed to get payment status from PhonePe. Data missing.' });
        }
        const actualPhonePePaymentState = responseData.state;
        const actualPhonePeTransactionId = responseData.paymentDetails[0]?.transactionId;
        const actualPaymentInstrumentType = responseData.paymentDetails[0]?.paymentMode;
        // 2. Determine local PaymentStatus and PaymentMode
        let newPaymentStatus;
        let receivedPaymentMode = 'OTHER';
        if (actualPhonePePaymentState === 'COMPLETED') {
            newPaymentStatus = 'SUCCESS';
            if (actualPaymentInstrumentType === 'UPI_COLLECT' ||
                actualPaymentInstrumentType === 'UPI_INTENT' ||
                actualPaymentInstrumentType === 'UPI_QR') {
                receivedPaymentMode = 'UPI';
            }
            else if (actualPaymentInstrumentType === 'CARD') {
                receivedPaymentMode = 'CARD';
            }
            else if (actualPaymentInstrumentType === 'NET_BANKING') {
                receivedPaymentMode = 'NETBANKING';
            }
        }
        else if (actualPhonePePaymentState === 'PENDING') {
            newPaymentStatus = 'PENDING';
        }
        else if (actualPhonePePaymentState === 'FAILED' ||
            actualPhonePePaymentState === 'REVOKED' ||
            actualPhonePePaymentState === 'EXPIRED' ||
            actualPhonePePaymentState === 'USER_CANCELLED' ||
            actualPhonePePaymentState === 'DECLINED') {
            newPaymentStatus = 'FAILED';
        }
        else {
            newPaymentStatus = 'FAILED';
            console.warn(`Unhandled PhonePe status state '${actualPhonePePaymentState}' for transactionId: ${merchantTransactionId}. Mapping to FAILED.`);
        }
        // 3. Update donation record in database
        const updatedDonation = await prisma.donation.update({
            where: { transactionId: merchantTransactionId },
            data: {
                gatewayTransactionId: actualPhonePeTransactionId,
                paymentMode: receivedPaymentMode,
                paymentStatus: newPaymentStatus,
                timeOfPayment: statusResponse.paymentDetails?.[0]?.timestamp ? new Date(statusResponse.paymentDetails[0].timestamp) : new Date(), // Access timestamp safely
            },
            select: { id: true, amount: true, caseId: true, paymentStatus: true }
        });
        // 4. Update Case raisedAmount if successful
        if (newPaymentStatus === 'SUCCESS' && updatedDonation?.caseId) {
            const donationAmountNumber = updatedDonation.amount.toNumber();
            await prisma.case.update({
                where: { id: updatedDonation.caseId },
                data: {
                    raisedAmount: {
                        increment: donationAmountNumber,
                    },
                },
            });
        }
        // 5. Return the updated status to the frontend
        console.log(`Sending final response for transaction: ${merchantTransactionId} with status: ${updatedDonation.paymentStatus}.`);
        return res.status(200).json({
            message: 'Donation status checked successfully.',
            status: updatedDonation.paymentStatus,
        });
    }
    catch (error) {
        console.error(`Error checking PhonePe status for transaction ${merchantTransactionId}:`, error);
        let errorMessage = 'Failed to check payment status.';
        if (error.response?.data) {
            errorMessage = error.response.data.message || errorMessage;
        }
        else if (error.message) {
            errorMessage = error.message;
        }
        console.log(`Sending error response for transaction: ${merchantTransactionId} in /check-donation-status catch block.`);
        res.status(500).json({ message: errorMessage });
    }
});
exports.default = router;
