// src/services/admin/authServices.ts
import prisma from '../../prisma';

export const getAdminByEmail = async (email: string) => {
  return prisma.admin.findUnique({
    where: { email },
    include: { role: { include: { permissions: true } } },
  });
};