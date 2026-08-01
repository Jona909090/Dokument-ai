export const organizationRoles = ["owner","admin","manager","editor","viewer","accountant"] as const;
export type OrganizationRole = (typeof organizationRoles)[number];
export type Permission = "organization:delete"|"members:manage"|"billing:manage"|"documents:read"|"documents:write"|"financial:read"|"projects:manage"|"templates:manage";
const grants: Record<OrganizationRole, Permission[]> = {
  owner:["organization:delete","members:manage","billing:manage","documents:read","documents:write","financial:read","projects:manage","templates:manage"],
  admin:["members:manage","documents:read","documents:write","financial:read","projects:manage","templates:manage"],
  manager:["documents:read","documents:write","projects:manage"], editor:["documents:read","documents:write"], viewer:["documents:read"], accountant:["documents:read","documents:write","financial:read"],
};
export const hasPermission=(role:OrganizationRole,permission:Permission)=>grants[role].includes(permission);
export function requirePermission(role:OrganizationRole,permission:Permission){if(!hasPermission(role,permission))throw new Error("Nemate dozvolu za ovu radnju.");}
