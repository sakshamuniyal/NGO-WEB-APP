export * from "@shared-types";

export interface AdminPayload {
  id: string;
  email: string;
  roleId: string;
  permissions: string[];
}

export type AdminWithRole = import("@shared-types").Admin;
