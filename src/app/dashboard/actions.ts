"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { documentTypes } from "@/lib/document-types";
import type { GeneratedDocument } from "@/lib/generated-document";
import { createClient } from "@/lib/supabase/server";

const documentSchema = z.object({
  type: z.enum(documentTypes), title: z.string().min(1).max(200), locale: z.enum(["hr", "en"]),
  fields: z.array(z.object({ label: z.string(), value: z.string(), type: z.enum(["date", "multiline"]).optional() })),
  items: z.array(z.object({ description: z.string(), quantity: z.number(), price: z.number(), amount: z.number() })).optional(),
  totals: z.object({ subtotal: z.number(), taxRate: z.number(), tax: z.number(), total: z.number() }).optional(),
  images: z.object({ logo: z.string().optional(), signature: z.string().optional(), stamp: z.string().optional() }).optional(),
}).passthrough();

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

export async function saveGeneratedDocument(input: GeneratedDocument) {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return { error: "Dokument sadrži neispravne podatke." };
  const auth = await authenticatedClient();
  if (!auth) return { error: "Prijavite se kako biste spremili dokument." };
  const { data: profile } = await auth.supabase.from("profiles").select("current_organization_id").eq("id", auth.user.id).single();
  if (!profile?.current_organization_id) return { error: "Prvo kreirajte ili odaberite organizaciju." };
  const totals = parsed.data.totals;
  const { data, error } = await auth.supabase.from("documents").insert({ organization_id: profile.current_organization_id, owner_user_id: auth.user.id, title: parsed.data.title, document_type: parsed.data.type, document_category: "administration", language: parsed.data.locale, rendered_content: parsed.data, form_data: {}, subtotal_minor: Math.round((totals?.subtotal ?? 0) * 100), tax_minor: Math.round((totals?.tax ?? 0) * 100), total_minor: Math.round((totals?.total ?? 0) * 100) }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { id: data.id };
}

export async function updateGeneratedDocument(id: string, input: GeneratedDocument) {
  const validId = z.string().uuid().safeParse(id);
  const parsed = documentSchema.safeParse(input);
  if (!validId.success || !parsed.success) return { error: "Neispravni podaci dokumenta." };
  const auth = await authenticatedClient();
  if (!auth) return { error: "Sesija je istekla." };
  const totals = parsed.data.totals;
  const { error } = await auth.supabase.from("documents").update({ title: parsed.data.title, document_type: parsed.data.type, rendered_content: parsed.data, subtotal_minor: Math.round((totals?.subtotal ?? 0) * 100), tax_minor: Math.round((totals?.tax ?? 0) * 100), total_minor: Math.round((totals?.total ?? 0) * 100) }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard"); revalidatePath(`/dashboard/documents/${id}`);
  return { id };
}

export async function deleteDocument(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const auth = await authenticatedClient();
  if (!auth) redirect("/login");
  await auth.supabase.from("documents").update({ deleted_at: new Date().toISOString() }).eq("id", id.data);
  revalidatePath("/dashboard");
}

export async function toggleFavorite(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const favorite = formData.get("favorite") === "true";
  if (!id.success) return;
  const auth = await authenticatedClient();
  if (!auth) redirect("/login");
  await auth.supabase.from("documents").update({ is_favorite: !favorite }).eq("id", id.data);
  revalidatePath("/dashboard");
}

export async function updateProfile(formData: FormData) {
  const name = z.string().trim().min(2).max(100).safeParse(formData.get("fullName"));
  if (!name.success) redirect("/dashboard/profile?message=Ime mora imati najmanje 2 znaka.");
  const auth = await authenticatedClient();
  if (!auth) redirect("/login");
  const { error } = await auth.supabase.from("profiles").upsert({ id: auth.user.id, full_name: name.data });
  if (error) redirect(`/dashboard/profile?message=${encodeURIComponent(error.message)}`);
  redirect("/dashboard/profile?message=Profil je spremljen.");
}
