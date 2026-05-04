import prisma from '../../prisma';
import { isProfileComplete } from '../user/userService';
import bcrypt from 'bcrypt';
import type { Prisma } from '@prisma/client';

interface LookupUserParams {
  name?: string;
  phoneNumber?: string;
  id?: string;
}

export async function lookupUser({ name, phoneNumber, id }: LookupUserParams) {
  const where: Prisma.UserWhereInput = {};
  const or: Prisma.UserWhereInput[] = [];
  if (id) {
    or.push({ id: { contains: id, mode: 'insensitive' } });
  }
  if (phoneNumber) {
    or.push({ phoneNumber: { contains: phoneNumber, mode: 'insensitive' } });
  }
  if (name) {
    or.push({ firstName: { contains: name, mode: 'insensitive' } });
    or.push({ lastName: { contains: name, mode: 'insensitive' } });
  }
  if (or.length > 0) {
    where.OR = or;
  }
  const users = await prisma.user.findMany({ where, include: { address: true } });
  return users.map(user => ({
    ...user,
    isProfileComplete: isProfileComplete(user)
  }));
}

export async function getAllAdmins() {
  return prisma.admin.findMany({
    include: { role: { include: { permissions: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAdminRole(adminId: string, roleId: string) {
  return prisma.admin.update({
    where: { id: adminId },
    data: { roleId },
    include: { role: { include: { permissions: true } } },
  });
}

export async function createAdmin({ name, email, password, roleId }: { name: string; email: string; password: string; roleId: string; }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return prisma.admin.create({
    data: { name, email, password: hashedPassword, roleId },
    include: { role: { include: { permissions: true } } },
  });
}

export async function getAllRolesAndPermissions() {
  const roles = await prisma.role.findMany({ include: { permissions: true } });
  const permissions = await prisma.permission.findMany();
  return { roles, permissions };
}

export async function updateAdminPermissions(adminId: string, roleId: string, permissionIds: string[]) {
  // Update the admin's role
  const updatedAdmin = await prisma.admin.update({
    where: { id: adminId },
    data: { roleId },
    include: { role: { include: { permissions: true } } },
  });
  // Optionally, you can store custom permissions in a separate table if you want per-admin overrides
  // For now, just return the updated admin with the new role
  return updatedAdmin;
}

export async function deleteAdmin(adminId: string) {
  return prisma.admin.delete({ where: { id: adminId } });
}
