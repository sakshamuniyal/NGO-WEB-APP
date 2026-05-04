"use strict";
// backend\src\services\admin\caseService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCaseById = exports.deleteCase = exports.updateCase = exports.createCase = exports.getAdminCases = void 0;
console.log("[DEBUG] Loaded caseService.ts");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Helper to convert raw Prisma Admin object to Backend Admin DTO object (with string dates)
const convertPrismaAdminToBackendAdmin = (prismaAdmin) => {
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
        }, // Cast to backend's Role type
    };
};
// Helper to convert raw Prisma User object to Backend User DTO object (with string dates)
const convertPrismaUserToBackendUser = (prismaUser) => {
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
const convertPrismaDonationToBackendDonation = (prismaDonation) => {
    const convertedUser = prismaDonation.user ? convertPrismaUserToBackendUser(prismaDonation.user) : null;
    // For the nested case, we need to avoid infinite recursion.
    // The 'case' property in PrismaDonationWithRelations should *already* have 'createdBy' if specified in the include.
    const convertedNestedCase = prismaDonation.case ? {
        id: prismaDonation.case.id,
        patientName: prismaDonation.case.patientName,
        age: prismaDonation.case.age,
        nationality: prismaDonation.case.nationality,
        typeOfCase: prismaDonation.case.typeOfCase,
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
        createdBy: prismaDonation.case.createdBy ? convertPrismaAdminToBackendAdmin(prismaDonation.case.createdBy) : null,
        donations: [], // Explicitly empty to prevent recursion
    } : null;
    return {
        id: prismaDonation.id,
        userId: prismaDonation.userId || null,
        caseId: prismaDonation.caseId || null,
        amount: prismaDonation.amount.toNumber(), // Convert Decimal to number (correct for Donation.amount)
        currency: prismaDonation.currency,
        paymentMode: prismaDonation.paymentMode, // Cast to DTO enum type
        transactionId: prismaDonation.transactionId,
        isAnonymous: prismaDonation.isAnonymous,
        timeOfPayment: prismaDonation.timeOfPayment.toISOString(), // Convert Date to ISO string
        paymentStatus: prismaDonation.paymentStatus, // Cast to DTO enum type
        gatewayTransactionId: prismaDonation.gatewayTransactionId || null,
        donorName: prismaDonation.donorName || null,
        donorEmail: prismaDonation.donorEmail || null,
        donorPhoneNumber: prismaDonation.donorPhoneNumber || null,
        user: convertedUser,
        case: convertedNestedCase,
        receipt: prismaDonation.receipt ? {
            id: prismaDonation.receipt.id,
            fileUrl: prismaDonation.receipt.fileUrl,
            createdAt: prismaDonation.receipt.createdAt.toISOString(), // Convert Receipt's date
            donationId: prismaDonation.receipt.donationId,
        } : null,
    };
};
// Helper to convert raw Prisma Case object to Backend Case DTO object (with string dates, number amounts)
const convertPrismaCaseToBackendCase = (prismaCase) => {
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
        createdBy: prismaCase.createdBy ? convertPrismaAdminToBackendAdmin(prismaCase.createdBy) : null,
        // Convert nested donations
        donations: prismaCase.donations ? prismaCase.donations.map(d => convertPrismaDonationToBackendDonation(d)) : [],
        // Add title to the returned object
        title: prismaCase.title,
    };
};
const getAdminCases = async (filters) => {
    const { typeOfCase, isActive, page = 1, limit = 10 } = filters || {};
    const skip = (page - 1) * limit;
    try {
        const prismaCases = await prisma.case.findMany({
            where: {
                typeOfCase: typeOfCase ? typeOfCase : undefined,
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
    }
    catch (error) {
        console.error('Error in caseService.getAdminCases:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to retrieve cases from the database: ${errorMessage}`);
    }
};
exports.getAdminCases = getAdminCases;
const createCase = async (data, adminId) => {
    try {
        const newPrismaCase = await prisma.case.create({
            data: {
                patientName: data.patientName,
                age: data.age,
                nationality: data.nationality,
                typeOfCase: data.typeOfCase,
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
        });
        await prisma.auditLog.create({
            data: {
                adminId,
                action: 'create_case',
                details: { caseId: newPrismaCase.id, patientName: newPrismaCase.patientName },
                createdAt: new Date(), // Prisma expects Date here
            }, // ⭐ FIX: Use AuditLogUncheckedCreateInput and removed entityId ⭐
        }).catch(auditError => console.error("Failed to create audit log for case creation:", auditError));
        return convertPrismaCaseToBackendCase(newPrismaCase);
    }
    catch (error) {
        console.error('Error in caseService.createCase:', error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new Error('A case with similar details already exists.');
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to create case: ${errorMessage}`);
    }
};
exports.createCase = createCase;
const updateCase = async (id, data) => {
    try {
        console.log("[DEBUG] Updating case with data:", JSON.stringify(data, null, 2));
        const updatedPrismaCase = await prisma.case.update({
            where: { id },
            data: {
                patientName: data.patientName,
                age: data.age,
                nationality: data.nationality,
                typeOfCase: data.typeOfCase ? data.typeOfCase : undefined,
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
        });
        console.log("[DEBUG] Updated case from DB:", JSON.stringify(updatedPrismaCase, null, 2));
        return convertPrismaCaseToBackendCase(updatedPrismaCase);
    }
    catch (error) {
        console.error(`Error in caseService.updateCase for ID ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return null;
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to update case: ${errorMessage}`);
    }
};
exports.updateCase = updateCase;
const deleteCase = async (id) => {
    try {
        await prisma.case.delete({ where: { id } });
        await prisma.auditLog.create({
            data: {
                adminId: "SYSTEM_OR_ADMIN_ID_ON_DELETE", // Placeholder - replace with actual adminId from context if available
                action: 'delete_case',
                details: { caseId: id },
                createdAt: new Date(), // Prisma expects Date here
            }, // ⭐ FIX: Use AuditLogUncheckedCreateInput and removed entityId ⭐
        }).catch(auditError => console.error("Failed to create audit log for case deletion:", auditError));
        return true;
    }
    catch (error) {
        console.error(`Error in caseService.deleteCase for ID ${id}:`, error);
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return false;
        }
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to delete case: ${errorMessage}`);
    }
};
exports.deleteCase = deleteCase;
const getCaseById = async (id) => {
    try {
        const prismaCase = await prisma.case.findUnique({
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
    }
    catch (error) {
        console.error(`Error in caseService.getCaseById for ID ${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Failed to retrieve case by ID from the database: ${errorMessage}`);
    }
};
exports.getCaseById = getCaseById;
