"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminByEmail = void 0;
// src/services/admin/authServices.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAdminByEmail = async (email) => {
    return prisma.admin.findUnique({
        where: { email },
        include: { role: { include: { permissions: true } } },
    });
};
exports.getAdminByEmail = getAdminByEmail;
