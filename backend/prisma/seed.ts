// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed process...");

  try {
    // Define the permissions for super_admin
    const superAdminPermissions = [
      "create_case",
      "view_logs",
      "view_cases",
      "manage_roles",
      "edit_case",
      "delete_case",
      "view_donations",
      "view_users",
      "create_admin",
      "edit_admin",
      "delete_admin",
      "view_admin"
    ];

    // Upsert all permissions
    for (const perm of superAdminPermissions) {
      await prisma.permission.upsert({
        where: { name: perm },
        update: {},
        create: { name: perm },
      });
    }

    // Get all permission records for the role
    const allPerms = await prisma.permission.findMany({
      where: { name: { in: superAdminPermissions } },
    });

    // Upsert the super_admin role and connect all permissions
    let superAdminRole = await prisma.role.upsert({
      where: { name: "super_admin" },
      update: {
        permissions: {
          set: [], // Remove all current permissions
          connect: allPerms.map(p => ({ id: p.id })),
        },
      },
      create: {
        name: "super_admin",
        permissions: {
          connect: allPerms.map(p => ({ id: p.id })),
        },
      },
    });
    console.log("Super_admin role upserted with ID:", superAdminRole.id);

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
    } else {
      console.log("Super admin already exists with email:", superAdmin.email);
    }

    // --- Admin role with only view_donations permission ---
    const adminPermissions = ["view_donations"];
    for (const perm of adminPermissions) {
      await prisma.permission.upsert({
        where: { name: perm },
        update: {},
        create: { name: perm },
      });
    }
    const adminPerms = await prisma.permission.findMany({
      where: { name: { in: adminPermissions } },
    });
    let adminRole = await prisma.role.upsert({
      where: { name: "admin" },
      update: {
        permissions: {
          set: [],
          connect: adminPerms.map(p => ({ id: p.id })),
        },
      },
      create: {
        name: "admin",
        permissions: {
          connect: adminPerms.map(p => ({ id: p.id })),
        },
      },
    });
    console.log("Admin role upserted with ID:", adminRole.id);
  } catch (error) {
    console.error("Seed script failed:", error);
    
  }
}

main()
  .catch((e) => console.error("Main execution failed:", e))
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma disconnected.");
  });