"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileCheck2, ShieldCheck } from "lucide-react";

import { CategoryForm } from "@/components/generator/category-form";
import { CommerceForm } from "@/components/generator/commerce-form";
import { DocumentPreview } from "@/components/generator/document-preview";
import { documentTypeDefinitions, documentTypes, type DocumentType } from "@/lib/document-types";
import type { DocumentLocale, GeneratedDocument } from "@/lib/generated-document";
import { cn } from "@/lib/utils";

type DocumentGeneratorProps = { initialType: DocumentType; originalPrompt?: string };

export function DocumentGenerator({ initialType, originalPrompt }: DocumentGeneratorProps) {
  const router = useRouter();
  const [type, setType] = useState(initialType);
  const [locale, setLocale] = useState<DocumentLocale>("hr");
  const [preview, setPreview] = useState<GeneratedDocument | null>(null);
  const definition = documentTypeDefinitions[type];

  function changeType(nextType: DocumentType) {
    setType(nextType);
    router.replace(`/generator?type=${nextType}`, { scroll: false });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <Link href="/#top" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"><ArrowLeft className="size-4" /> Nazad na početnu</Link>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700"><FileCheck2 className="size-4" /> Generator dokumenta</div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{definition.label}</h1>
              <p className="mt-3 text-base leading-7 text-slate-600">{definition.description}</p>
              {originalPrompt && <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900"><span className="font-semibold">Vaš zahtjev:</span> “{originalPrompt}”</p>}
            </div>
            <div className="space-y-3 lg:text-right">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 lg:justify-end"><ShieldCheck className="size-4 text-emerald-600" /> Lokalna obrada bez slanja podataka</div>
              <div className="inline-flex rounded-xl border bg-slate-50 p-1" aria-label="Format datuma">
                <button type="button" onClick={() => setLocale("hr")} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold", locale === "hr" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500")}>HR datum</button>
                <button type="button" onClick={() => setLocale("en")} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold", locale === "en" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500")}>EN date</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-10 lg:py-12">
        <aside>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Vrsta dokumenta</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {documentTypes.map((documentType) => (
              <button key={documentType} type="button" onClick={() => changeType(documentType)} className={cn("rounded-xl px-3 py-2.5 text-left text-sm font-medium transition", type === documentType ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700")}>
                {documentTypeDefinitions[documentType].label}
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <div className="mb-8 border-b pb-6">
            <p className="text-sm text-slate-500">Polja označena zvjezdicom su obavezna.</p>
          </div>
          {type === "invoice" || type === "offer" ? <CommerceForm key={type} type={type} locale={locale} onPreview={setPreview} /> : <CategoryForm key={type} type={type} locale={locale} onPreview={setPreview} />}
        </section>
      </div>
      {preview && <DocumentPreview document={preview} onClose={() => setPreview(null)} />}
    </main>
  );
}
