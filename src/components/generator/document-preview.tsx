"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, FileText, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadDocx, downloadPdf } from "@/lib/document-export";
import { formatDocumentDate, type GeneratedDocument } from "@/lib/generated-document";

const euro = new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" });

type DocumentPreviewProps = { document: GeneratedDocument; onClose: () => void };

export function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);

  async function handleDownload(format: "pdf" | "docx") {
    setDownloading(format);
    try {
      if (format === "pdf") await downloadPdf(document);
      else await downloadDocx(document);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <div className="mx-auto max-w-6xl">
        <div className="sticky top-3 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/95 p-3 text-white shadow-xl backdrop-blur sm:top-6 sm:p-4">
          <div><h2 id="preview-title" className="font-semibold">Pregled dokumenta</h2><p className="text-xs text-slate-400">A4 prikaz prije preuzimanja</p></div>
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => handleDownload("pdf")} disabled={downloading !== null} className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              {downloading === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} PDF
            </Button>
            <Button size="sm" onClick={() => handleDownload("docx")} disabled={downloading !== null}>
              {downloading === "docx" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} Word
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} className="text-white hover:bg-white/10" aria-label="Zatvori pregled"><X className="size-5" /></Button>
          </div>
        </div>

        <article className="mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col bg-white px-[8%] py-10 text-slate-900 shadow-2xl sm:px-[18mm] sm:py-[16mm]">
          <header className="flex min-h-14 items-start justify-between gap-6 border-b border-blue-100 pb-5">
            {document.images?.logo ? <Image src={document.images.logo} alt="Logotip firme" width={144} height={48} unoptimized className="max-h-12 max-w-36 object-contain" /> : <span className="text-sm font-bold tracking-wider text-blue-600">DOKUMENT AI</span>}
            <span className="text-right text-xs text-slate-400">{document.title}</span>
          </header>

          <div className="flex-1 py-9">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">{document.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{document.locale === "hr" ? "Profesionalno pripremljen dokument" : "Professionally prepared document"}</p>
            <dl className="mt-9 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {document.fields.map((field) => (
                <div key={`${field.label}-${field.value}`} className={field.type === "multiline" ? "sm:col-span-2" : undefined}>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{field.label}</dt>
                  <dd className="mt-1.5 whitespace-pre-wrap text-sm leading-6">{field.type === "date" ? formatDocumentDate(field.value, document.locale) : field.value || "-"}</dd>
                </div>
              ))}
            </dl>

            {document.items?.length ? (
              <div className="mt-10 overflow-x-auto">
                <h2 className="mb-4 text-lg font-semibold text-blue-900">Stavke</h2>
                <table className="w-full min-w-[560px] border-collapse text-left text-xs">
                  <thead><tr className="bg-blue-600 text-white"><th className="p-3">Opis</th><th className="p-3 text-right">Količina</th><th className="p-3 text-right">Cijena</th><th className="p-3 text-right">Iznos</th></tr></thead>
                  <tbody>{document.items.map((item, index) => <tr key={`${item.description}-${index}`} className="border-b"><td className="p-3">{item.description}</td><td className="p-3 text-right">{item.quantity}</td><td className="p-3 text-right">{euro.format(item.price)}</td><td className="p-3 text-right font-medium">{euro.format(item.amount)}</td></tr>)}</tbody>
                </table>
              </div>
            ) : null}

            {document.totals && <dl className="ml-auto mt-6 max-w-xs space-y-2 text-sm"><div className="flex justify-between"><dt>Ukupno bez PDV-a</dt><dd>{euro.format(document.totals.subtotal)}</dd></div><div className="flex justify-between"><dt>PDV ({document.totals.taxRate}%)</dt><dd>{euro.format(document.totals.tax)}</dd></div><div className="flex justify-between border-t pt-2 font-bold text-blue-700"><dt>Ukupno s PDV-om</dt><dd>{euro.format(document.totals.total)}</dd></div></dl>}

            {(document.images?.signature || document.images?.stamp) && <div className="mt-12 flex justify-end gap-8">{document.images.signature && <figure className="text-center"><Image src={document.images.signature} alt="Potpis" width={160} height={64} unoptimized className="h-16 max-w-40 object-contain" /><figcaption className="mt-1 text-[10px] text-slate-500">Potpis</figcaption></figure>}{document.images.stamp && <figure className="text-center"><Image src={document.images.stamp} alt="Pečat" width={112} height={80} unoptimized className="h-20 max-w-28 object-contain" /><figcaption className="mt-1 text-[10px] text-slate-500">Pečat</figcaption></figure>}</div>}
          </div>

          <footer className="flex items-center justify-between border-t pt-4 text-[10px] text-slate-400"><span>Dokument AI</span><span>1</span></footer>
        </article>
      </div>
    </div>
  );
}
