import { AdminModulePage } from "@/components/admin/admin-module-page";
import { AdminPermissionDenied } from "@/components/admin/permission-denied";
import { adminModules, isAdminModule, type AdminModuleKey } from "@/lib/admin/registry";
import { requirePlatformPermission } from "@/lib/admin/service";

async function isAllowed(module: AdminModuleKey) { try { await requirePlatformPermission(adminModules[module].permission); return true; } catch { return false; } }
export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) { const { module } = await params; if (!isAdminModule(module) || !await isAllowed(module)) return <AdminPermissionDenied />; return <AdminModulePage module={module} />; }
