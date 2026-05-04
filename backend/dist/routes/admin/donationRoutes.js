"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/admin/adminDonationRoutes.ts
const express_1 = __importDefault(require("express"));
const donationController_1 = require("../../controllers/admin/donationController"); // Import the controller
const adminAuthMiddleware_1 = require("../../middleware/adminAuthMiddleware"); // Import admin protection middleware
const roleMiddleware_1 = require("../../middleware/roleMiddleware"); // Import permission check middleware
const router = express_1.default.Router();
// Apply protectAdmin to all routes in this router.
// This ensures the admin is authenticated before any other middleware or controller runs.
router.use(adminAuthMiddleware_1.protectAdmin);
// GET /admin/donations - Retrieve a list of all donations (for admin view)
router.get('/donations', (0, roleMiddleware_1.checkPermission)('view_donations'), // Ensure admin has 'view_donations' permission
donationController_1.getAllDonations);
exports.default = router;
