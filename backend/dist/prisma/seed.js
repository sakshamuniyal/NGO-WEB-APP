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
// prisma/seed.ts
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Starting seed process...");
    try {
        // Check if super_admin role already exists
        let superAdminRole = await prisma.role.findUnique({
            where: { name: "super_admin" },
        });
        if (!superAdminRole) {
            console.log("Creating super_admin role...");
            superAdminRole = await prisma.role.create({
                data: {
                    name: "super_admin",
                    permissions: {
                        create: [
                            { name: "create_case" },
                            { name: "view_logs" },
                            { name: "view_cases" },
                            { name: "manage_roles" },
                            { name: "edit_case" },
                            { name: "delete_case" },
                        ],
                    },
                },
            });
            console.log("Super admin role created with ID:", superAdminRole.id);
        }
        else {
            console.log("Super_admin role already exists with ID:", superAdminRole.id);
        }
        // Hash the password
        const saltRounds = 10;
        const password = "696969"; // Replace with a secure password
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log("Password hashed successfully.");
        // Check if super admin already exists
        let superAdmin = await prisma.admin.findUnique({
            where: { email: "superadmin@example.com" },
        });
        if (!superAdmin) {
            console.log("Creating super admin...");
            superAdmin = await prisma.admin.create({
                data: {
                    name: "Super Admin",
                    email: "superadmin@example.com",
                    password: hashedPassword,
                    roleId: superAdminRole.id,
                },
            });
            console.log("Super admin created with email:", superAdmin.email);
        }
        else {
            console.log("Super admin already exists with email:", superAdmin.email);
        }
    }
    catch (error) {
        console.error("Seed script failed:", error);
    }
}
main()
    .catch((e) => console.error("Main execution failed:", e))
    .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma disconnected.");
});
