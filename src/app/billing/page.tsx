import { BillingDashboard } from "@/components/billing/billing-dashboard";
import { getBillingConfig } from "@/lib/billing/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { planIds, type PlanId } from "@/lib/billing/types";

export default async function BillingPage() {
  const provider = getBillingConfig().provider;
  if (!isSupabaseConfigured()) return <BillingDashboard provider={provider} />;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("current_organization_id").eq("id", user.id).single();
  const { data } = profile?.current_organization_id ? await supabase.from("subscriptions").select("plan_id,plan,status").eq("organization_id", profile.current_organization_id).maybeSingle() : { data: null };
  const candidate = data?.plan_id ?? data?.plan ?? "free";
  const planId: PlanId = planIds.includes(candidate as PlanId) ? candidate as PlanId : "free";
  return <BillingDashboard provider={provider} planId={planId} status={data?.status ?? "free"} />;
}
