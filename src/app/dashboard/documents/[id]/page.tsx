import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/dashboard/document-editor";
import type { GeneratedDocument } from "@/lib/generated-document";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: PageProps<"/dashboard/documents/[id]">) {
  const { id } = await params; const supabase = await createClient();
  const { data } = await supabase.from("documents").select("id,content,open_count").eq("id", id).single();
  if (!data) notFound();
  await supabase.from("documents").update({ open_count: (data.open_count ?? 0) + 1, last_opened_at: new Date().toISOString() }).eq("id", id);
  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10"><div className="mb-7"><p className="text-sm font-semibold text-primary">Uređivanje dokumenta</p><h1 className="mt-2 text-3xl font-semibold">Ponovno otvorite i uredite</h1></div><section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8"><DocumentEditor id={data.id} initialDocument={data.content as GeneratedDocument} /></section></main>;
}
