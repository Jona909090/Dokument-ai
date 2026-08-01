import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAdminPermission, type AdminPermission, type PlatformAdminRole } from "./permissions";

export type PlatformAdminAccess = { allowed: boolean; demo: boolean; userId: string | null; role: PlatformAdminRole | null; displayName: string; permissions: AdminPermission[] };
export async function getPlatformAdminAccess(): Promise<PlatformAdminAccess> {
  if (!isSupabaseConfigured()) return { allowed: true, demo: true, userId: null, role: "super_admin", displayName: "Lokalni super admin", permissions: [] };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { allowed: false, demo: false, userId: null, role: null, displayName: "", permissions: [] };
  const { data } = await supabase.from("platform_admins").select("role,display_name,status").eq("user_id", user.id).eq("status", "active").maybeSingle();
  return data ? { allowed: true, demo: false, userId: user.id, role: data.role as PlatformAdminRole, displayName: data.display_name || user.email || "Admin", permissions: [] } : { allowed: false, demo: false, userId: user.id, role: null, displayName: user.email || "", permissions: [] };
}
export async function requirePlatformPermission(permission: AdminPermission) { const access = await getPlatformAdminAccess(); if (!access.allowed || !access.role || !hasAdminPermission(access.role, permission)) throw new Error("PLATFORM_ADMIN_PERMISSION_DENIED"); return access; }
export type AdminDashboardMetrics = { users: number; organizations: number; subscriptions: number; documents: number; aiRequests: number; openTickets: number; criticalBugs: number; failedPayments: number; storageBytes: number };
export async function getAdminDashboardMetrics(access: PlatformAdminAccess): Promise<AdminDashboardMetrics> {
  const empty = { users: 0, organizations: 0, subscriptions: 0, documents: 0, aiRequests: 0, openTickets: 0, criticalBugs: 0, failedPayments: 0, storageBytes: 0 };
  if (!access.allowed || !access.role || (!hasAdminPermission(access.role, "analytics:read") && access.role !== "super_admin") || access.demo || !process.env.SUPABASE_SERVICE_ROLE_KEY) return empty;
  const admin = createAdminClient();
  const queries = [admin.from("profiles").select("id",{count:"exact",head:true}),admin.from("organizations").select("id",{count:"exact",head:true}),admin.from("subscriptions").select("id",{count:"exact",head:true}).in("status",["active","trialing"]),admin.from("documents").select("id",{count:"exact",head:true}).is("deleted_at",null),admin.from("ai_requests").select("id",{count:"exact",head:true}),admin.from("support_tickets").select("id",{count:"exact",head:true}).in("status",["new","open","waiting_internal"]),admin.from("bugs").select("id",{count:"exact",head:true}).in("severity",["critical","blocker"]).not("status","in",'(fixed,verified,closed)'),admin.from("billing_invoices").select("id",{count:"exact",head:true}).eq("status","open")];
  const results = await Promise.all(queries);
  return { ...empty, users: results[0].count ?? 0, organizations: results[1].count ?? 0, subscriptions: results[2].count ?? 0, documents: results[3].count ?? 0, aiRequests: results[4].count ?? 0, openTickets: results[5].count ?? 0, criticalBugs: results[6].count ?? 0, failedPayments: results[7].count ?? 0 };
}
