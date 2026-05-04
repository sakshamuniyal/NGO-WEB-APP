"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCases = exports.createCase = void 0;
// src/services/admin/caseServices.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createCase = async (data, adminId) => {
    const caseData = await prisma.case.create({
        data: {
            ...data,
            createdById: adminId,
        },
        include: {
            createdBy: true,
            donations: true,
        },
    });
    await prisma.auditLog.create({
        data: {
            adminId,
            action: 'create_case',
            details: { caseId: caseData.id },
        },
    });
    return caseData;
};
exports.createCase = createCase;
const getCases = async (filters) => {
    return prisma.case.findMany({
        where: filters,
        include: {
            createdBy: true,
            donations: true,
        },
    });
};
exports.getCases = getCases;
