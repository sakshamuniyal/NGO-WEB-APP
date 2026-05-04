export * from '@shared-types';

import { Prisma } from '@prisma/client';

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  details: Prisma.JsonValue | null;
  createdAt: string;
}

export type AdminWithRolePrisma = Prisma.AdminGetPayload<{
  include: { role: { include: { permissions: true } } };
}>;

export type PrismaCaseWithRelations = Prisma.CaseGetPayload<{
  include: {
    createdBy: { include: { role: { include: { permissions: true } } } };
    donations: {
      include: {
        user: { include: { address: true } };
        case: {
          include: { createdBy: { include: { role: { include: { permissions: true } } } } };
        };
        receipt: true;
      };
    };
  };
}>;

export type PrismaDonationWithRelations = Prisma.DonationGetPayload<{
  include: {
    user: { include: { address: true } };
    case: {
      include: {
        createdBy: { include: { role: { include: { permissions: true } } } };
      };
    };
    receipt: true;
  };
}>;

export type CaseCreateInput = Omit<
  import('@shared-types').Case,
  'id' | 'createdAt' | 'updatedAt' | 'raisedAmount' | 'donations' | 'createdBy'
>;
export type CaseUpdateInput = Partial<CaseCreateInput>;

export type DonationCreateInput = Omit<
  import('@shared-types').Donation,
  | 'id'
  | 'timeOfPayment'
  | 'paymentStatus'
  | 'gatewayTransactionId'
  | 'user'
  | 'case'
  | 'receipt'
  | 'donorName'
  | 'donorEmail'
  | 'donorPhoneNumber'
> & {
  donorDetails?: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    address?: {
      line1: string;
      line2?: string;
      country: string;
      state: string;
      zipCode: string;
    };
  };
};
