import type { AdminWithRolePrisma } from "../types/admin";

export function adminHasPermission(
  admin: AdminWithRolePrisma | undefined | null,
  permission: string
): boolean {
  return Boolean(
    admin?.role?.permissions?.some((p) => p.name === permission)
  );
}
