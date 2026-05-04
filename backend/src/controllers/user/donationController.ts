import { Request, Response } from 'express';
import { PaymentStatus } from '@prisma/client';
import * as donationService from '../../services/user/donationService';
import { generateAndSendReceipt } from '../../services/admin/receiptService';
import { FRONTEND_URL } from '../../config/phonepe';
import { InitiateDonationRequest } from '../../types/user/donation';

// --- NEW: Controller for manual receipt generation (Admin side) ---
export async function manualReceipt(req: Request, res: Response) {
  try {
    const { firstName, lastName, title, address, phoneNumber, pan, modeOfPayment, amount, createdAt, email } = req.body;
    
    if (!firstName || !title || !modeOfPayment || !amount || !createdAt || !email || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields (including phoneNumber).' });
    }

    const result = await generateAndSendReceipt({ 
      firstName, lastName, title, address, phoneNumber, pan, modeOfPayment, amount, createdAt, email 
    });

    res.json(result);
  } catch (error) {
    console.error('[manualReceipt] Error:', error);
    res.status(500).json({ error: 'Failed to generate/send receipt', details: error instanceof Error ? error.message : error });
  }
}

// --- Controller for initiating a donation ---
export const initiateDonation = async (req: Request, res: Response) => {
  const { amount, isAnonymous, caseId, donorDetails } = req.body as InitiateDonationRequest;
  const loggedInUserId = req.user?.id;

  try {
    const { paymentLink, newDonationId } = await donationService.initiatePhonePePayment(
      { amount, isAnonymous, caseId, donorDetails },
      loggedInUserId
    );

    res.status(200).json({
      message: 'Payment initiated, redirecting to PhonePe.',
      paymentLink: paymentLink,
      donationId: newDonationId,
    });
  } catch (error: unknown) {
    console.error("Error in initiateDonation controller:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    res.status(500).json({ message: errorMessage });
  }
};

// --- Controller for checking donation status (PhonePe redirect callback) ---
export const handleDonationStatusCheck = async (req: Request, res: Response) => {
  const { merchantTransactionId } = req.query;

  if (!merchantTransactionId || typeof merchantTransactionId !== 'string') {
    return res.redirect(`${FRONTEND_URL}/donation-failed?message=${encodeURIComponent('Missing transaction ID')}`);
  }

  try {
    const result = await donationService.checkDonationStatus(merchantTransactionId);

    const queryParams = new URLSearchParams();
    queryParams.append('status', result.status);
    queryParams.append('message', result.message);
    queryParams.append('reference', result.transactionId);

    let frontendRedirectPath: string;

    switch (result.status) {
      case 'SUCCESS':
        frontendRedirectPath = '/donation-success';
        if (result.donationDetails) {
            queryParams.append('amount', result.donationDetails.amount.toString());
            queryParams.append('donorName', result.donationDetails.donorName || '');
            queryParams.append('date', result.donationDetails.timeOfPayment);
            queryParams.append('paymentMode', result.donationDetails.paymentMode);
        }
        if (result.receiptUrl) queryParams.append('receiptUrl', result.receiptUrl);
        break;
      case 'PENDING':
        frontendRedirectPath = '/donation-pending';
        break;
      default:
        frontendRedirectPath = '/donation-failed';
        break;
    }

    return res.redirect(`${FRONTEND_URL}${frontendRedirectPath}?${queryParams.toString()}`);

  } catch (error: unknown) {
    console.error(`Error in handleDonationStatusCheck:`, error);
    return res.redirect(`${FRONTEND_URL}/donation-failed?transactionId=${merchantTransactionId}&status=FAILED`);
  }
};

export const handlePhonePeWebhook = async (req: Request, res: Response) => {
  const authorizationHeader = req.headers.authorization;
  const rawBody = (req as Request & { rawBody?: string }).rawBody;

  if (!authorizationHeader || !rawBody) {
    return res.status(400).json({ message: 'Missing webhook data.' });
  }

  try {
    await donationService.processPhonePeWebhook(authorizationHeader, rawBody);
    return res.status(200).json({ message: 'Webhook processed successfully.' });
  } catch (error: unknown) {
    console.error('Error in handlePhonePeWebhook:', error);
    return res.status(400).json({ message: 'Webhook processing failed.' });
  }
};

const paymentStatuses = new Set<PaymentStatus>(['PENDING', 'SUCCESS', 'FAILED']);

export const getUserDonations = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

  const rawPage = parseInt(String(req.query.page ?? '1'), 10);
  const rawLimit = parseInt(String(req.query.limit ?? '10'), 10);
  const page = Number.isFinite(rawPage) ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) ? rawLimit : 10;
  const statusParam =
    typeof req.query.paymentStatus === 'string' ? req.query.paymentStatus : undefined;
  const paymentStatus =
    statusParam && paymentStatuses.has(statusParam as PaymentStatus)
      ? (statusParam as PaymentStatus)
      : undefined;

  try {
    const data = await donationService.getUserDonationsPaginated(userId, {
      page,
      limit,
      paymentStatus,
    });
    res.status(200).json(data);
  } catch (error: unknown) {
    console.error('getUserDonations', error);
    res.status(500).json({ message: 'Failed to fetch donations.' });
  }
};

export const getUserDonationsImpactCtrl = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized.' });

  try {
    const data = await donationService.getUserDonationsImpact(userId);
    res.status(200).json(data);
  } catch (error: unknown) {
    console.error('getUserDonationsImpactCtrl', error);
    res.status(500).json({ message: 'Failed to fetch impact summary.' });
  }
};

export const getDonationReceiptDownload = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const donationId = req.params.donationId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized.' });
  if (!donationId) return res.status(400).json({ message: 'Missing donation id.' });

  try {
    const downloadUrl = await donationService.getReceiptSignedDownloadUrl(userId, donationId);
    if (!downloadUrl) {
      return res.status(404).json({
        message: 'Receipt not available yet. Completed payments generate a receipt automatically within a few minutes.',
      });
    }
    res.status(200).json({ downloadUrl });
  } catch (error: unknown) {
    console.error('getDonationReceiptDownload', error);
    res.status(500).json({ message: 'Failed to prepare receipt download.' });
  }
};

export const exportImpactReportPlaceholder = (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Impact report export is not configured yet.' });
};