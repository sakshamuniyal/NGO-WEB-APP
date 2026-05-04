// backend/src/routes/user/donationRoutes.ts
import express from 'express';
import { protectUser } from '../../middleware/userAuthMiddleware';
import {
  initiateDonation,
  handleDonationStatusCheck,
  handlePhonePeWebhook,
  getUserDonations,
  getUserDonationsImpactCtrl,
  getDonationReceiptDownload,
  exportImpactReportPlaceholder,
} from '../../controllers/user/donationController';

const router = express.Router();

// Route to initiate a new donation payment
router.post('/donate', protectUser, initiateDonation);

// Route for PhonePe to redirect to after payment completion
// This route does NOT use protectUser middleware because PhonePe redirects directly,
// and we need to handle the status regardless of user login state.
router.get('/check-donation-status', handleDonationStatusCheck);
router.post('/phonepe/webhook', handlePhonePeWebhook);

// Static paths must be registered before '/donations/:donationId/*'
router.get('/donations/impact', protectUser, getUserDonationsImpactCtrl);
router.get('/donations/reports/export', protectUser, exportImpactReportPlaceholder);
router.get('/donations/:donationId/receipt', protectUser, getDonationReceiptDownload);
router.get('/donations', protectUser, getUserDonations);

export default router;
