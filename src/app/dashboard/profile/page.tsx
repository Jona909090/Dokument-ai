import { updateProfile } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export default async function ProfilePage({ searchParams }: PageProps<"/dashboard/profile">) { const { message } = await searchParams; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single(); return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><p className="text-sm font-semibold text-blue-700">Korisnički račun</p><h1 className="mt-2 text-3xl font-semibold">Profil</h1><section className="mt-7 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">{typeof message === "string" && <p className="mb-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}<form action={updateProfile} className="space-y-5"><div><label htmlFor="fullName" className="mb-2 block text-sm font-semibold">Ime i prezime</label><Input id="fullName" name="fullName" defaultValue={profile?.full_name ?? ""} required /></div><div><label className="mb-2 block text-sm font-semibold">Email</label><Input value={user?.email ?? ""} disabled /></div><Button type="submit">Spremi profil</Button></form></section></main>; }
