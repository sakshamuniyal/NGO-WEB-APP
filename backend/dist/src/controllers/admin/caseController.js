"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCaseById = exports.deleteCase = exports.updateCase = exports.getCases = exports.createCase = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createCase = async (data, adminId) => {
    return prisma.case.create({
        data: { ...data, createdById: adminId },
        include: { createdBy: true, donations: true },
    });
};
exports.createCase = createCase;
const getCases = async (filters) => {
    const { typeOfCase, isActive, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    return prisma.case.findMany({
        where: { typeOfCase, isActive },
        skip,
        take: limit,
        include: { createdBy: true, donations: true },
    });
};
exports.getCases = getCases;
const updateCase = async (id, data) => {
    return prisma.case.update({
        where: { id },
        data,
        include: { createdBy: true, donations: true },
    }).catch(() => null);
};
exports.updateCase = updateCase;
const deleteCase = async (id) => {
    await prisma.case.delete({ where: { id } }).catch(() => { });
    return true;
};
exports.deleteCase = deleteCase;
const getCaseById = async (id) => {
    return prisma.case.findUnique({
        where: { id },
        include: { createdBy: true, donations: true },
    });
};
exports.getCaseById = getCaseById;
