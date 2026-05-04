"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDonations = exports.checkDonationStatus = exports.initiatePhonePePayment = void 0;
// backend/src/services/user/donationService.ts
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const pg_sdk_node_1 = require("pg-sdk-node");
const phonepe_1 = require("../../config/phonepe");
const prisma_1 = __importDefault(require("../../prisma")); // Import the centralized prisma client
// --- Helper to convert Prisma Donation to UserDonation DTO ---
// This is crucial for ensuring the frontend receives consistent types (e.g., numbers for amounts, ISO strings for dates)
const convertPrismaDonationToUserDonation = (prismaDonation) => {
    return {
        id: prismaDonation.id,
        userId: prismaDonation.userId || null,
        caseId: prismaDonation.caseId || null,
        amount: prismaDonation.amount.toNumber(), // Convert Decimal to number
        currency: prismaDonation.currency,
        paymentMode: prismaDonation.paymentMode,
        transactionId: prismaDonation.transactionId,
        isAnonymous: prismaDonation.isAnonymous,
        timeOfPayment: prismaDonation.timeOfPayment.toISOString(), // Convert Date to ISO string
        paymentStatus: prismaDonation.paymentStatus,
        gatewayTransactionId: prismaDonation.gatewayTransactionId || null,
        donorName: prismaDonation.donorName || null,
        donorEmail: prismaDonation.donorEmail || null,
        donorPhoneNumber: prismaDonation.donorPhoneNumber || null,
        user: prismaDonation.user ? {
            id: prismaDonation.user.id,
            firstName: prismaDonation.user.firstName || null,
            lastName: prismaDonation.user.lastName || null,
            email: prismaDonation.user.email || null,
            phoneNumber: prismaDonation.user.phoneNumber,
        } : null,
        case: prismaDonation.case ? {
            id: prismaDonation.case.id,
            patientName: prismaDonation.case.patientName,
            typeOfCase: prismaDonation.case.typeOfCase,
        } : null,
        receipt: prismaDonation.receipt ? {
            id: prismaDonation.receipt.id,
            fileUrl: prismaDonation.receipt.fileUrl,
            createdAt: prismaDonation.receipt.createdAt.toISOString(),
            donationId: prismaDonation.receipt.donationId,
        } : null,
    };
};
// --- Service Function: Initiate PhonePe Payment ---
const initiatePhonePePayment = async (payload, loggedInUserId) => {
    const { amount, isAnonymous, caseId, donorDetails } = payload;
    // --- 1. Basic Validation ---
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('Valid donation amount is required.');
    }
    // --- 2. Anonymity and Amount Limit Validation ---
    if (isAnonymous) {
        if (amount > 50000) {
            throw new Error('Anonymous donations cannot exceed Rs 50,000.');
        }
        if (donorDetails) {
            throw new Error('Personal details cannot be provided for anonymous donations.');
        }
    }
    else { // This branch is for isAnonymous === false
        if (!loggedInUserId) { // If NOT logged in (i.e., it's a guest non-anonymous donation)
            if (!donorDetails) {
                throw new Error('Personal details are required for non-anonymous donations from guests.');
            }
            if (!donorDetails.firstName || !donorDetails.lastName || !donorDetails.phoneNumber ||
                !donorDetails.address?.line1 || !donorDetails.address?.country ||
                !donorDetails.address?.state || !donorDetails.address?.zipCode) {
                throw new Error('Missing required personal or address details for non-anonymous donation.');
            }
            if (typeof donorDetails.phoneNumber !== 'string' || donorDetails.phoneNumber.length < 10) {
                throw new Error('A valid phone number is required for non-anonymous guest donations.');
            }
            if (donorDetails.email && (typeof donorDetails.email !== 'string' || (donorDetails.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorDetails.email)))) {
                throw new Error('Invalid email format.');
            }
        }
    }
    // --- 3. Determine User/Guest Details for Donation Record ---
    let userIdToLink = loggedInUserId || null;
    let guestDonorName = null;
    let guestDonorEmail = null;
    let guestDonorPhoneNumber = null;
    if (loggedInUserId && !isAnonymous) { // User is logged in and not anonymous
        const user = await prisma_1.default.user.findUnique({ where: { id: loggedInUserId } });
        if (user) {
            userIdToLink = user.id;
            guestDonorName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;
            guestDonorEmail = user.email || null;
            guestDonorPhoneNumber = user.phoneNumber || null;
        }
    }
    else if (!loggedInUserId && !isAnonymous && donorDetails) { // Guest, non-anonymous
        const existingUser = await prisma_1.default.user.findUnique({
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
    let newDonation;
    try {
        const merchantTransactionId = `TID_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        newDonation = await prisma_1.default.donation.create({
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
            .redirectUrl(`${phonepe_1.BACKEND_URL}/api/user/check-donation-status?merchantTransactionId=${merchantTransactionId}`)
            .build();
        console.log("Initiating PhonePe payment via SDK with request:", phonePeRequest);
        const phonePeResponse = await phonepe_1.phonePeClient.pay(phonePeRequest);
        if (phonePeResponse.redirectUrl) {
            console.log(`PhonePe payment initiated, redirect URL: ${phonePeResponse.redirectUrl}`);
            return { paymentLink: phonePeResponse.redirectUrl, newDonationId: newDonation.id };
        }
        else {
            console.error(`PhonePe SDK initiation failed for transaction ${merchantTransactionId}: No redirectUrl.`);
            await prisma_1.default.donation.update({
                where: { id: newDonation.id },
                data: { paymentStatus: 'FAILED' }
            });
            throw new Error('Failed to initiate payment with PhonePe via SDK. No redirect URL received.');
        }
    }
    catch (error) {
        console.error('Error in initiatePhonePePayment:', error);
        if (newDonation && newDonation.id) {
            await prisma_1.default.donation.update({
                where: { id: newDonation.id },
                data: { paymentStatus: 'FAILED' }
            }).catch(dbError => {
                console.error("Failed to update donation status to FAILED in initiatePhonePePayment catch block (secondary error):", dbError);
            });
        }
        if (axios_1.default.isAxiosError(error) && error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        else if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred during payment initiation.');
    }
};
exports.initiatePhonePePayment = initiatePhonePePayment;
// --- Service Function: Check Donation Status from PhonePe Callback ---
const checkDonationStatus = async (merchantTransactionId) => {
    if (!merchantTransactionId) {
        throw new Error('Merchant transaction ID is required.');
    }
    let receiptUrl; // To store the S3 URL of the generated receipt
    try {
        // 1. Get transaction status from PhonePe using the SDK
        console.log(`Checking PhonePe status for transaction: ${merchantTransactionId}`);
        const statusResponse = await phonepe_1.phonePeClient.getOrderStatus(merchantTransactionId);
        console.log("Full getOrderStatus Response:", JSON.stringify(statusResponse, null, 2));
        const actualPhonePePaymentState = statusResponse.state;
        const actualPhonePeTransactionId = statusResponse.paymentDetails?.[0]?.transactionId;
        const actualPaymentInstrumentType = statusResponse.paymentDetails?.[0]?.paymentMode;
        const phonePeTimestamp = statusResponse.paymentDetails?.[0]?.timestamp;
        // 2. Determine local PaymentStatus and PaymentMode
        let newPaymentStatus;
        let receivedPaymentMode = 'OTHER';
        let redirectMessage;
        if (actualPhonePePaymentState === 'COMPLETED') {
            newPaymentStatus = 'SUCCESS';
            redirectMessage = 'Payment successful.';
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
            redirectMessage = 'Payment is still pending. Please check again later.';
        }
        else if (actualPhonePePaymentState === 'FAILED' ||
            actualPhonePePaymentState === 'REVOKED' ||
            actualPhonePePaymentState === 'EXPIRED' ||
            actualPhonePePaymentState === 'USER_CANCELLED' ||
            actualPhonePePaymentState === 'DECLINED') {
            newPaymentStatus = 'FAILED';
            redirectMessage = 'Payment failed or was cancelled.';
        }
        else {
            newPaymentStatus = 'FAILED';
            redirectMessage = 'Payment status unknown.';
            console.warn(`Unhandled PhonePe status state '${actualPhonePePaymentState}' for transactionId: ${merchantTransactionId}. Mapping to FAILED.`);
        }
        // 3. Update donation record in database
        const updatedDonation = await prisma_1.default.donation.update({
            where: { transactionId: merchantTransactionId },
            data: {
                gatewayTransactionId: actualPhonePeTransactionId || null,
                paymentMode: receivedPaymentMode,
                paymentStatus: newPaymentStatus,
                timeOfPayment: phonePeTimestamp ? new Date(phonePeTimestamp) : new Date(),
            },
            select: { id: true, amount: true, caseId: true, paymentStatus: true }
        });
        // 4. Update Case raisedAmount if successful
        if (newPaymentStatus === 'SUCCESS' && updatedDonation?.caseId) {
            const donationAmountNumber = updatedDonation.amount.toNumber();
            await prisma_1.default.case.update({
                where: { id: updatedDonation.caseId },
                data: {
                    raisedAmount: {
                        increment: donationAmountNumber,
                    },
                },
            });
            // ⭐ PDF Generation and S3 Upload will go here in a later step ⭐
            // For now, we'll simulate or leave it out until we implement it fully
            // Example:
            // const fullDonationDetails = await prisma.donation.findUnique({ where: { id: updatedDonation.id }, include: { user: true, case: true } });
            // if (fullDonationDetails) {
            //   const pdfBuffer = await generateReceiptPdf(fullDonationDetails);
            //   const s3Key = `receipts/${fullDonationDetails.transactionId}.pdf`;
            //   receiptUrl = await uploadFileToS3(s3Key, pdfBuffer, 'application/pdf');
            //   await prisma.receipt.create({ data: { donationId: fullDonationDetails.id, fileUrl: receiptUrl } });
            // }
        }
        return {
            message: redirectMessage,
            status: newPaymentStatus,
            transactionId: merchantTransactionId,
            receiptUrl: receiptUrl, // Will be undefined until PDF generation is added
        };
    }
    catch (error) {
        console.error(`Error in checkDonationStatus for transaction ${merchantTransactionId}:`, error);
        let errorMessage = 'Failed to check payment status due to a server error.';
        if (axios_1.default.isAxiosError(error) && error.response?.data?.message) {
            errorMessage = `Payment Gateway Error: ${error.response.data.message}`;
        }
        else if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new Error(`Failed to check payment status: ${errorMessage}`);
    }
};
exports.checkDonationStatus = checkDonationStatus;
// --- Service Function: Get User Donations ---
const getUserDonations = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to fetch donations.');
    }
    try {
        const donations = await prisma_1.default.donation.findMany({
            where: { userId: userId },
            orderBy: { timeOfPayment: 'desc' },
            include: {
                user: {
                    select: {
                        id: true, phoneNumber: true, firstName: true, lastName: true, companyName: true,
                        email: true, panCard: true, createdAt: true, updatedAt: true,
                        address: { select: { id: true, userId: true, country: true, state: true, line1: true, line2: true, zipCode: true } },
                    },
                },
                case: {
                    select: {
                        id: true, patientName: true, age: true, nationality: true, typeOfCase: true,
                        description: true, pdfUrls: true, imageUrls: true, videoUrls: true,
                        phoneNumber: true, permanentAddress: true, currentAddress: true,
                        targetAmount: true, raisedAmount: true, isActive: true, createdAt: true,
                        updatedAt: true, createdById: true,
                    },
                },
                receipt: { select: { id: true, fileUrl: true, createdAt: true, donationId: true } },
            },
        });
        return donations.map(convertPrismaDonationToUserDonation);
    }
    catch (error) {
        console.error('Error fetching user donations:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch donations: ${error.message}`);
        }
        throw new Error('Failed to fetch donations due to an unknown error.');
    }
};
exports.getUserDonations = getUserDonations;
