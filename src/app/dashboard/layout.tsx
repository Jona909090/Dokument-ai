import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cloud = isSupabaseConfigured();
  let identity: { email: string; displayName: string } | undefined;
  if (cloud) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      identity = { email: user.email ?? "", displayName: profile?.display_name || user.email || "Korisnik" };
    }
  }
  return <DashboardShell cloud={cloud} identity={identity}>{children}</DashboardShell>;
}
