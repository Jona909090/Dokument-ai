import { LocalDashboardOverview } from "@/components/dashboard/local-dashboard-overview";
import { CloudDashboardOverview } from "@/components/dashboard/cloud-dashboard-overview";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export default function DashboardPage() { return isSupabaseConfigured() ? <CloudDashboardOverview /> : <LocalDashboardOverview />; }
