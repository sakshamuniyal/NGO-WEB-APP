import prisma from '../../prisma'; // ✅ Import your configured singleton
import { User, Address } from '@prisma/client';

// Define an interface for the user object when fetched with its address
// This is important because the 'address' relation might not always be included
interface UserWithAddress extends User {
  address?: Address | null; // Address is optional as per Prisma schema and include option
}

/**
* Determines if a user's profile is complete based on defined criteria.
* @param user The Prisma User object, potentially including its related Address.
* @returns true if the profile is considered complete, false otherwise.
*/
export function isProfileComplete(user: UserWithAddress): boolean {
  // Check essential direct user fields
  if (!user.firstName || user.firstName.trim() === '') return false;
  if (!user.lastName || user.lastName.trim() === '') return false;
  if (!user.email || user.email.trim() === '') return false;
  if (!user.panCard || user.panCard.trim() === '') return false;

  // Check if an address exists and its required fields are present
  if (!user.address) return false; // No address relation found
  if (!user.address.country || user.address.country.trim() === '') return false;
  if (!user.address.state || user.address.state.trim() === '') return false;
  if (!user.address.line1 || user.address.line1.trim() === '') return false;
  if (!user.address.zipCode || user.address.zipCode.trim() === '') return false;

  // If all checks pass, the profile is considered complete
  return true;
}

/**
 * Fetches the full user profile, including associated address.
 * @param phoneNumber The phone number of the user.
 * @returns The user object with address included, or null if not found.
 */
export async function getUserProfile(phoneNumber: string) {
  return await prisma.user.findUnique({
    where: { phoneNumber },
    include: { address: true }, // Include the address relation
  });
}

/**
 * Updates the user's profile and/or address.
 * Creates or updates the address record associated with the user.
 * @param phoneNumber The phone number of the user to update.
 * @param data An object containing user and address fields to update.
 * @returns The updated user object with address included.
 * @throws Error if the user with the given phone number does not exist.
 */
export async function updateUserProfile(
  phoneNumber: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    panCard?: string;
    companyName?: string;
    address: {
      line1: string;
      line2?: string;
      zipCode: string;
      country: string;
      state: string;
    };
  }
) {
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (!existingUser) {
    throw new Error(`User with phone number ${phoneNumber} does not exist.`);
  }

  // Separate address data from user data
  const { address, ...userData } = data;

  const updatedUser =  await prisma.user.update({
    where: { phoneNumber },
    data: {
      ...userData, // Spread user-specific data
      address: {
        upsert: { // Use upsert to create or update the address
          create: address, // Data to create if address doesn't exist
          update: address, // Data to update if address exists
        },
      },
    },
    include: { address: true }, // Include the updated address in the response
  });
  console.log('User object returned by Prisma update:', updatedUser);
  return updatedUser;
}