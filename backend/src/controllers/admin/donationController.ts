// backend/src/controllers/admin/adminDonationController.ts
import { Request, Response, NextFunction } from 'express';
import * as adminDonationService from '../../services/admin/donationServices'; // Import the service
import { PaymentStatus } from '@prisma/client'; // Import Prisma types if needed for validation/typing

/**
 * Controller to handle fetching all donations for the admin panel.
 * Supports filtering by payment status and pagination.
 */
export const getAllDonations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, page, limit } = req.query; // Extract query parameters

    console.log(req.query.status);

    // Validate and type cast query parameters
    const filterStatus = status ? (status as string).toUpperCase() as PaymentStatus : undefined;
    const pageNum = page ? parseInt(page as string, 10) : undefined;
    const limitNum = limit ? parseInt(limit as string, 10) : undefined;

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
  } catch (error) {
    console.error('Error in adminDonationController.getAllDonations:', error);
    next(error); // Pass the error to the Express error handling middleware
  }
};
