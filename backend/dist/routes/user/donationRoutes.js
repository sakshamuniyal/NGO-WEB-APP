"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/user/donationRoutes.ts
const express_1 = __importDefault(require("express"));
const userAuthMiddleware_1 = require("../../middleware/userAuthMiddleware");
const donationController_1 = require("../../controllers/user/donationController");
const router = express_1.default.Router();
// Route to initiate a new donation payment
router.post('/donate', userAuthMiddleware_1.protectUser, donationController_1.initiateDonation);
// Route for PhonePe to redirect to after payment completion
// This route does NOT use protectUser middleware because PhonePe redirects directly,
// and we need to handle the status regardless of user login state.
router.get('/check-donation-status', donationController_1.handleDonationStatusCheck);
// Route to get a user's donation history
router.get('/donations', userAuthMiddleware_1.protectUser, donationController_1.getUserDonations);
exports.default = router;
