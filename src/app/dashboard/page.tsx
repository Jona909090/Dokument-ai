import { LocalDashboardOverview } from "@/components/dashboard/local-dashboard-overview";
import { CloudDashboardOverview } from "@/components/dashboard/cloud-dashboard-overview";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AICopilot } from "@/components/ai/ai-copilot";

export default function DashboardPage() {
  return <>
    <div className="mx-auto max-w-[1500px] px-4 pt-7 sm:px-7 lg:px-9"><AICopilot compact /></div>
    {isSupabaseConfigured() ? <CloudDashboardOverview /> : <LocalDashboardOverview />}
  </>;
}
