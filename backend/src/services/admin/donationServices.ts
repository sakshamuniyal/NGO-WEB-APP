// backend/src/services/admin/adminDonationService.ts
import { PaymentStatus, Donation } from '@prisma/client';
import prisma from '../../prisma'; 

interface GetDonationsFilters {
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}

// ⭐ NEW: Define a type for the processed donation, where 'amount' is a number ⭐
type ProcessedDonation = Omit<Donation, 'amount' | 'timeOfPayment'> & {
  amount: number;
  timeOfPayment: string; // Keep as string for consistency with frontend, or convert to Date if needed
};


/**
 * Fetches donation records for the admin panel.
 * Converts Prisma Decimal 'amount' to a JavaScript number.
 *
 * @param filters - An object containing optional filters.
 * @returns A Promise that resolves to an array of ProcessedDonation objects, including related case and user data.
 */
export const getAdminDonations = async (filters: GetDonationsFilters): Promise<ProcessedDonation[]> => {
  const { status, page = 1, limit = 10 } = filters;

  const skip = (page - 1) * limit;

  const whereClause: { paymentStatus?: PaymentStatus } = {};
  if (status) {
    whereClause.paymentStatus = status;
  }

  try {
    // Prisma will return Donation type objects here, where amount is Decimal
    const donations = await prisma.donation.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: {
        timeOfPayment: 'desc',
      },
      include: {
        case: {
          select: {
            id: true,
            patientName: true,
            typeOfCase: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Map over donations to convert 'amount' from Decimal (or string) to number
    const processedDonations: ProcessedDonation[] = donations.map(donation => ({
      ...donation,
      // Ensure 'amount' is converted to a number.
      // Prisma's Decimal type has a .toNumber() method.
      // If it's already a number or string number (less likely after Prisma), Number() handles it.
      amount: typeof donation.amount === 'object' && donation.amount !== null && 'toNumber' in donation.amount
              ? donation.amount.toNumber() // If it's a Decimal object
              : parseFloat(String(donation.amount)), // Fallback for safety (e.g., if already stringified)
      timeOfPayment: donation.timeOfPayment.toISOString(), // Convert Date object to ISO string for consistency
    }));

    return processedDonations; // Now correctly typed as ProcessedDonation[]
  } catch (error) {
    console.error('Error in adminDonationService.getAdminDonations:', error);
    throw new Error('Failed to retrieve donations from the database.');
  }
};
