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
exports.getAllDonations = void 0;
const adminDonationService = __importStar(require("../../services/admin/donationServices")); // Import the service
/**
 * Controller to handle fetching all donations for the admin panel.
 * Supports filtering by payment status and pagination.
 */
const getAllDonations = async (req, res, next) => {
    try {
        const { status, page, limit } = req.query; // Extract query parameters
        console.log(req.query.status);
        // Validate and type cast query parameters
        const filterStatus = status ? status.toUpperCase() : undefined;
        const pageNum = page ? parseInt(page, 10) : undefined;
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        // Basic validation for numbers (optional, Zod could do this too)
        if (pageNum && (isNaN(pageNum) || pageNum < 1)) {
            return res.status(400).json({ error: 'Invalid page number.' });
        }
        if (limitNum && (isNaN(limitNum) || limitNum < 1)) {
            return res.status(400).json({ error: 'Invalid limit number.' });
        }
        // Basic validation for status (optional, Zod could do this too)
        if (filterStatus && !['PENDING', 'SUCCESS', 'FAILED'].includes(filterStatus)) {
            return res.status(400).json({ error: 'Invalid payment status filter.' });
        }
        const donations = await adminDonationService.getAdminDonations({
            status: filterStatus,
            page: pageNum,
            limit: limitNum,
        });
        res.status(200).json(donations);
    }
    catch (error) {
        console.error('Error in adminDonationController.getAllDonations:', error);
        next(error); // Pass the error to the Express error handling middleware
    }
};
exports.getAllDonations = getAllDonations;
