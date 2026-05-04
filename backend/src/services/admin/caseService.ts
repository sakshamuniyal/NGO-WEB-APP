// backend\src\services\admin\caseService.ts

console.log("[DEBUG] Loaded caseService.ts");

import { Prisma, CaseType as PrismaRawCaseType } from '@prisma/client';
import {
  Case, // Backend's DTO definition for Case
  Admin, // Backend's DTO definition for Admin
  Donation, // Backend's DTO definition for Donation
  User, // Backend's DTO definition for User
  Role,
  Permission,
  CaseType,
  PaymentMode,
  PaymentStatus,
  PrismaCaseWithRelations, // Raw Prisma type with includes for Case
  AdminWithRolePrisma, // Raw Prisma type for Admin with role/permissions
  PrismaDonationWithRelations, // Raw Prisma type for Donation with includes
  CaseCreateInput,
  CaseUpdateInput,
  AuditLog as BackendAuditLog, // Backend's DTO definition for AuditLog
} from '../../types/admin';

import prisma from '../../prisma'; // ✅ Import your configured singleton

// Helper to convert raw Prisma Admin object to Backend Admin DTO object (with string dates)
const convertPrismaAdminToBackendAdmin = (prismaAdmin: AdminWithRolePrisma): Admin => {
  return {
    id: prismaAdmin.id,
    name: prismaAdmin.name,
    email: prismaAdmin.email,
    password: prismaAdmin.password,
    roleId: prismaAdmin.roleId,
    createdAt: prismaAdmin.createdAt.toISOString(),
    updatedAt: prismaAdmin.updatedAt.toISOString(),
    role: {
      id: prismaAdmin.role.id,
      name: prismaAdmin.role.name,
      // ⭐ FIX: Removed description, as it's not in schema.prisma for Permission ⭐
      permissions: prismaAdmin.role.permissions.map(p => ({
        id: p.id,
        name: p.name,
      })),
    } as Role, // Cast to backend's Role type
  };
};

// Helper to convert raw Prisma User object to Backend User DTO object (with string dates)
const convertPrismaUserToBackendUser = (prismaUser: Prisma.UserGetPayload<{ include: { address: true } }>): User => {
  return {
    ...prismaUser,
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString(),
    address: prismaUser.address ? {
      ...prismaUser.address,
    } : null,
    // ⭐ REMOVED: isProfileComplete - Not in your provided schema.prisma for User ⭐
  };
};

// Helper to convert raw Prisma Donation object to Backend Donation DTO object (string dates, number amounts)
const convertPrismaDonationToBackendDonation = (prismaDonation: PrismaDonationWithRelations): Donation => {
  const convertedUser = prismaDonation.user ? convertPrismaUserToBackendUser(prismaDonation.user) : null;

  // For the nested case, we need to avoid infinite recursion.
  // The 'case' property in PrismaDonationWithRelations should *already* have 'createdBy' if specified in the include.
  const convertedNestedCase = prismaDonation.case ? {
    id: prismaDonation.case.id,
    patientName: prismaDonation.case.patientName,
    age: prismaDonation.case.age,
    nationality: prismaDonation.case.nationality,
    typeOfCase: prismaDonation.case.typeOfCase as CaseType,
    title: prismaDonation.case.title,
    description: prismaDonation.case.description,
    targetAmount: prismaDonation.case.targetAmount, // Float in schema, so it's a number
    raisedAmount: prismaDonation.case.raisedAmount, // Float in schema, so it's a number
    isActive: prismaDonation.case.isActive,
    createdAt: prismaDonation.case.createdAt.toISOString(),
    updatedAt: prismaDonation.case.updatedAt.toISOString(),
    phoneNumber: prismaDonation.case.phoneNumber || null,
    permanentAddress: prismaDonation.case.permanentAddress || null,
    currentAddress: prismaDonation.case.currentAddress || null,
    pdfUrls: prismaDonation.case.pdfUrls || null,
    imageUrls: prismaDonation.case.imageUrls || null,
    videoUrls: prismaDonation.case.videoUrls || null,
    // ⭐ FIX: Ensure createdBy is correctly typed and converted from Prisma's payload ⭐
    createdBy: prismaDonation.case.createdBy ? convertPrismaAdminToBackendAdmin(prismaDonation.case.createdBy as AdminWithRolePrisma) : null,
    donations: [], // Explicitly empty to prevent recursion
  } as Case : null;


  return {
    id: prismaDonation.id,
    userId: prismaDonation.userId || null,
    caseId: prismaDonation.caseId || null,
    amount: prismaDonation.amount.toNumber(), // Convert Decimal to number (correct for Donation.amount)
    currency: prismaDonation.currency,
    paymentMode: prismaDonation.paymentMode as PaymentMode, // Cast to DTO enum type
    transactionId: prismaDonation.transactionId,
    isAnonymous: prismaDonation.isAnonymous,
    timeOfPayment: prismaDonation.timeOfPayment.toISOString(), // Convert Date to ISO string
    paymentStatus: prismaDonation.paymentStatus as PaymentStatus, // Cast to DTO enum type
    gatewayTransactionId: prismaDonation.gatewayTransactionId || null,
    donorName: prismaDonation.donorName || null,
    donorEmail: prismaDonation.donorEmail || null,
    donorPhoneNumber: prismaDonation.donorPhoneNumber || null,
    user: convertedUser,
    case: convertedNestedCase,
    receipt: prismaDonation.receipt ? {
      id: prismaDonation.receipt.id,
      fileUrl: prismaDonation.receipt.fileUrl,
      receiptNo: prismaDonation.receipt.receiptNo ?? null,
      createdAt: prismaDonation.receipt.createdAt.toISOString(),
      donationId: prismaDonation.receipt.donationId,
    } : null,
  };
};

// Helper to convert raw Prisma Case object to Backend Case DTO object (with string dates, number amounts)
const convertPrismaCaseToBackendCase = (prismaCase: PrismaCaseWithRelations): Case => {
  return {
    ...prismaCase,
    // Case.targetAmount & raisedAmount are Float in schema, so no .toNumber() needed
    targetAmount: prismaCase.targetAmount,
    raisedAmount: prismaCase.raisedAmount,
    // Convert Date to ISO string
    createdAt: prismaCase.createdAt.toISOString(),
    updatedAt: prismaCase.updatedAt.toISOString(),
    // Handle optional string fields (Prisma returns null, so map to null/undefined directly)
    phoneNumber: prismaCase.phoneNumber || null,
    permanentAddress: prismaCase.permanentAddress || null,
    currentAddress: prismaCase.currentAddress || null,
    pdfUrls: prismaCase.pdfUrls || null,
    imageUrls: prismaCase.imageUrls || null,
    videoUrls: prismaCase.videoUrls || null,
    // Convert nested createdBy (Admin)
    createdBy: prismaCase.createdBy ? convertPrismaAdminToBackendAdmin(prismaCase.createdBy as AdminWithRolePrisma) : null,

    // Convert nested donations
    donations: prismaCase.donations ? prismaCase.donations.map(d => convertPrismaDonationToBackendDonation(d as PrismaDonationWithRelations)) : [],

    // Add title to the returned object
    title: prismaCase.title,
  };
};


interface GetCasesFilters {
  typeOfCase?: CaseType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}


export const getAdminCases = async (filters?: GetCasesFilters): Promise<Case[]> => {
  const { typeOfCase, isActive, page = 1, limit = 10 } = filters || {};
  const skip = (page - 1) * limit;

  try {
    const prismaCases: PrismaCaseWithRelations[] = await prisma.case.findMany({
      where: {
        typeOfCase: typeOfCase ? typeOfCase as PrismaRawCaseType : undefined,
        isActive: isActive,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          include: { role: { include: { permissions: true } } }
        },
        donations: {
          include: {
            user: { include: { address: true } },
            case: { include: { createdBy: { include: { role: { include: { permissions: true } } } } } },
            receipt: true
          }
        },
      },
    });
    return prismaCases.map(convertPrismaCaseToBackendCase);
  } catch (error: unknown) {
    console.error('Error in caseService.getAdminCases:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to retrieve cases from the database: ${errorMessage}`);
  }
};

export const createCase = async (data: CaseCreateInput, adminId: string): Promise<Case> => {
  try {
    const newPrismaCase = await prisma.case.create({
      data: {
        patientName: data.patientName,
        age: data.age,
        nationality: data.nationality,
        typeOfCase: data.typeOfCase as PrismaRawCaseType,
        description: data.description,
        targetAmount: data.targetAmount, // Use number directly as schema is Float
        raisedAmount: 0, // Changed to 0 (number) for Float type
        isActive: data.isActive,
        phoneNumber: data.phoneNumber || null,
        permanentAddress: data.permanentAddress || null,
        currentAddress: data.currentAddress || null,
        pdfUrls: data.pdfUrls || [],
        imageUrls: data.imageUrls || [],
        videoUrls: data.videoUrls || [],
        title: data.title,
        createdById: adminId,
      },
      include: {
        createdBy: { include: { role: { include: { permissions: true } } } },
        donations: { include: { user: { include: { address: true } }, case: { include: { createdBy: { include: { role: { include: { permissions: true } } } } } }, receipt: true } },
      },
    }) as PrismaCaseWithRelations;

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'create_case',
        details: { caseId: newPrismaCase.id, patientName: newPrismaCase.patientName },
        createdAt: new Date(), // Prisma expects Date here
      } as Prisma.AuditLogUncheckedCreateInput, // ⭐ FIX: Use AuditLogUncheckedCreateInput and removed entityId ⭐
    }).catch(auditError => console.error("Failed to create audit log for case creation:", auditError));

    return convertPrismaCaseToBackendCase(newPrismaCase);
  } catch (error: unknown) {
    console.error('Error in caseService.createCase:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('A case with similar details already exists.');
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to create case: ${errorMessage}`);
  }
};

export const updateCase = async (id: string, data: CaseUpdateInput): Promise<Case | null> => {
  try {
    console.log("[DEBUG] Updating case with data:", JSON.stringify(data, null, 2));
    const updatedPrismaCase = await prisma.case.update({
      where: { id },
      data: {
        patientName: data.patientName,
        age: data.age,
        nationality: data.nationality,
        typeOfCase: data.typeOfCase ? data.typeOfCase as PrismaRawCaseType : undefined,
        description: data.description,
        targetAmount: data.targetAmount !== undefined ? data.targetAmount : undefined, // Use number directly as schema is Float
        isActive: data.isActive,
        phoneNumber: data.phoneNumber || null,
        permanentAddress: data.permanentAddress || null,
        currentAddress: data.currentAddress || null,
        pdfUrls: data.pdfUrls || [],
        imageUrls: data.imageUrls || [],
        videoUrls: data.videoUrls || [],
        title: data.title,
      },
      include: {
        createdBy: { include: { role: { include: { permissions: true } } } },
        donations: { include: { user: { include: { address: true } }, case: { include: { createdBy: { include: { role: { include: { permissions: true } } } } } }, receipt: true } },
      },
    }) as PrismaCaseWithRelations;
    console.log("[DEBUG] Updated case from DB:", JSON.stringify(updatedPrismaCase, null, 2));
    return convertPrismaCaseToBackendCase(updatedPrismaCase);
  } catch (error: unknown) {
    console.error(`Error in caseService.updateCase for ID ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null;
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to update case: ${errorMessage}`);
  }
};

export const deleteCase = async (id: string): Promise<boolean> => {
  try {
    await prisma.case.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        adminId: "SYSTEM_OR_ADMIN_ID_ON_DELETE", // Placeholder - replace with actual adminId from context if available
        action: 'delete_case',
        details: { caseId: id },
        createdAt: new Date(), // Prisma expects Date here
      } as Prisma.AuditLogUncheckedCreateInput, // ⭐ FIX: Use AuditLogUncheckedCreateInput and removed entityId ⭐
    }).catch(auditError => console.error("Failed to create audit log for case deletion:", auditError));

    return true;
  } catch (error: unknown) {
    console.error(`Error in caseService.deleteCase for ID ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return false;
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to delete case: ${errorMessage}`);
  }
};

export const getCaseById = async (id: string): Promise<Case | null> => {
  try {
    const prismaCase: PrismaCaseWithRelations | null = await prisma.case.findUnique({
      where: { id },
      include: {
        createdBy: { include: { role: { include: { permissions: true } } } },
        donations: { include: { user: { include: { address: true } }, case: { include: { createdBy: { include: { role: { include: { permissions: true } } } } } }, receipt: true } },
      },
    });
    if (!prismaCase) {
      return null;
    }
    return convertPrismaCaseToBackendCase(prismaCase);
  } catch (error: unknown) {
    console.error(`Error in caseService.getCaseById for ID ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to retrieve case by ID from the database: ${errorMessage}`);
  }
};
