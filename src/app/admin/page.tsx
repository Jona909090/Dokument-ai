import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminDashboardMetrics, getPlatformAdminAccess } from "@/lib/admin/service";
export default async function AdminPage() { const access = await getPlatformAdminAccess(); const metrics = await getAdminDashboardMetrics(access); return <AdminDashboard access={access} metrics={metrics} />; }

