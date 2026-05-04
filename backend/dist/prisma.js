"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/prisma.ts
const client_1 = require("@prisma/client");
// Initialize PrismaClient
const prisma = global.prisma || new client_1.PrismaClient();
// In development, store the PrismaClient instance globally
if (process.env.NODE_ENV === 'development') {
    global.prisma = prisma;
}
exports.default = prisma;
