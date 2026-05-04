"use strict";
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDonations = exports.handleDonationStatusCheck = exports.initiateDonation = void 0;
const donationService = __importStar(require("../../services/user/donationService"));
const phonepe_1 = require("../../config/phonepe");
// --- Controller for initiating a donation ---
const initiateDonation = async (req, res) => {
    const { amount, isAnonymous, caseId, donorDetails } = req.body;
    const loggedInUserId = req.user?.id; // Assuming req.user is populated by protectUser middleware
    try {
        const { paymentLink, newDonationId } = await donationService.initiatePhonePePayment({ amount, isAnonymous, caseId, donorDetails }, loggedInUserId);
        res.status(200).json({
            message: 'Payment initiated, redirecting to PhonePe.',
            paymentLink: paymentLink,
            donationId: newDonationId, // Optionally return internal donation ID
        });
    }
    catch (error) {
        console.error("Error in initiateDonation controller:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during payment initiation.";
        res.status(500).json({ message: errorMessage });
    }
};
exports.initiateDonation = initiateDonation;
// --- Controller for checking donation status (PhonePe redirect callback) ---
const handleDonationStatusCheck = async (req, res) => {
    const { merchantTransactionId } = req.query;
    if (!merchantTransactionId || typeof merchantTransactionId !== 'string') {
        console.log("Validation Failed: Missing merchantTransactionId in query.");
        return res.redirect(`${phonepe_1.FRONTEND_URL}/donation-failed?message=${encodeURIComponent('Missing transaction ID')}`);
    }
    try {
        const result = await donationService.checkDonationStatus(merchantTransactionId);
        let frontendRedirectPath;
        switch (result.status) {
            case 'SUCCESS':
                frontendRedirectPath = '/donation-success';
                break;
            case 'PENDING':
                frontendRedirectPath = '/donation-pending';
                break;
            case 'FAILED':
            default: // Default to failed for any unhandled status
                frontendRedirectPath = '/donation-failed';
                break;
        }
        // Construct query parameters for frontend redirect
        const queryParams = new URLSearchParams();
        queryParams.append('transactionId', result.transactionId);
        queryParams.append('status', result.status);
        queryParams.append('message', result.message);
        if (result.receiptUrl) {
            queryParams.append('receiptUrl', result.receiptUrl);
        }
        console.log(`Redirecting to ${phonepe_1.FRONTEND_URL}${frontendRedirectPath}?${queryParams.toString()}`);
        return res.redirect(`${phonepe_1.FRONTEND_URL}${frontendRedirectPath}?${queryParams.toString()}`);
    }
    catch (error) {
        console.error(`Error in handleDonationStatusCheck controller for transaction ${merchantTransactionId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while checking payment status.";
        // Always redirect to failed page on backend error
        console.log(`Redirecting to ${phonepe_1.FRONTEND_URL}/donation-failed due to backend error for transaction: ${merchantTransactionId}.`);
        return res.redirect(`${phonepe_1.FRONTEND_URL}/donation-failed?transactionId=${merchantTransactionId}&status=FAILED&message=${encodeURIComponent(errorMessage)}`);
    }
};
exports.handleDonationStatusCheck = handleDonationStatusCheck;
// --- Controller for getting user's donation history ---
const getUserDonations = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        console.warn("Unauthorized access to /donations: User not logged in.");
        return res.status(401).json({ message: 'Unauthorized: User not logged in.' });
    }
    try {
        const donations = await donationService.getUserDonations(userId);
        res.status(200).json(donations);
    }
    catch (error) {
        console.error("Error in getUserDonations controller:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while fetching donations.";
        res.status(500).json({ message: errorMessage });
    }
};
exports.getUserDonations = getUserDonations;
