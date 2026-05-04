// backend/src/routes/admin/adminDonationRoutes.ts
import express from 'express';
import { getAllDonations } from '../../controllers/admin/donationController'; // Import the controller
import { protectAdmin } from '../../middleware/adminAuthMiddleware'; // Import admin protection middleware
import { checkPermission } from '../../middleware/roleMiddleware'; // Import permission check middleware

const router = express.Router();

// Apply protectAdmin to all routes in this router.
// This ensures the admin is authenticated before any other middleware or controller runs.
router.use(protectAdmin);

// GET /admin/donations - Retrieve a list of all donations (for admin view)
router.get(
  '/donations',
  checkPermission('view_donations'), // Ensure admin has 'view_donations' permission
  getAllDonations
);

export default router;
