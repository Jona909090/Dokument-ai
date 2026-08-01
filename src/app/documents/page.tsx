import type { Metadata } from "next";
import { DocumentsPage } from "@/components/documents/documents-page";
import { CloudDocumentsPage } from "@/components/documents/cloud-documents-page";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export const metadata: Metadata = { title: "Moji dokumenti — Dokument AI" };
export default async function Page({ searchParams }: PageProps<"/documents">) {
  const raw = await searchParams;
  const params = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  return isSupabaseConfigured() ? <CloudDocumentsPage searchParams={params} /> : <DocumentsPage />;
}
