export const platformAdminRoles = ["super_admin","platform_admin","support_agent","billing_admin","content_admin","analyst","readonly_admin"] as const;
export type PlatformAdminRole = (typeof platformAdminRoles)[number];
export const adminPermissions = ["admins:manage","users:read","users:manage","organizations:read","organizations:manage","billing:read","billing:manage","content:read","content:manage","support:read","support:manage","analytics:read","ai:read","ai:manage","security:read","security:manage","audit:read","system:manage","exports:create"] as const;
export type AdminPermission = (typeof adminPermissions)[number];
const readAll: AdminPermission[] = ["users:read","organizations:read","billing:read","content:read","support:read","analytics:read","ai:read","security:read","audit:read"];
export const adminRoleGrants: Record<PlatformAdminRole, AdminPermission[]> = {
  super_admin: [...adminPermissions],
  platform_admin: [...readAll,"users:manage","organizations:manage","billing:manage","content:manage","support:manage","ai:manage","exports:create"],
  support_agent: ["users:read","organizations:read","support:read","support:manage","audit:read"],
  billing_admin: ["users:read","organizations:read","billing:read","billing:manage","audit:read","exports:create"],
  content_admin: ["content:read","content:manage","support:read","ai:read","audit:read"],
  analyst: ["analytics:read","billing:read","ai:read","content:read","audit:read","exports:create"],
  readonly_admin: readAll,
};
export const hasAdminPermission = (role: PlatformAdminRole, permission: AdminPermission) => adminRoleGrants[role].includes(permission);
export function requireAdminPermission(role: PlatformAdminRole, permission: AdminPermission) { if (!hasAdminPermission(role, permission)) throw new Error("PLATFORM_ADMIN_PERMISSION_DENIED"); }

