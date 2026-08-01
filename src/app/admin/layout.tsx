import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPermissionDenied } from "@/components/admin/permission-denied";
import { getPlatformAdminAccess } from "@/lib/admin/service";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const access = await getPlatformAdminAccess(); if (!access.allowed || !access.role) return <AdminPermissionDenied />; return <AdminShell role={access.role} displayName={access.displayName} demo={access.demo}>{children}</AdminShell>; }

