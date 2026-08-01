"use client";
import { Download, Eye, FileText, Maximize2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { PurchaseOrderSheet } from "@/components/generator/purchase-order-sheet";
import { QuotationSheet } from "@/components/generator/quotation-sheet";
import { InvoiceSheet } from "@/components/generator/invoice-sheet";
import { Button } from "@/components/ui/button";
import { downloadDocx, downloadPdf } from "@/lib/document-export";
import {
  formatDocumentDate,
  type GeneratedDocument,
} from "@/lib/generated-document";
import { categoryForDocument, trackEvent } from "@/lib/analytics/service";
import { buildVisibleDocumentModel } from "@/lib/document-visibility";
import { DailyReportSheet } from "@/components/generator/daily-report-sheet";
import { CompletedWorksReportSheet } from "@/components/generator/completed-works-report-sheet";
import { WorkHandoverSheet } from "@/components/generator/work-handover-sheet";
import { TemplateSurface } from "@/components/templates/template-surface";
import { ComposerRenderer } from "@/components/composer/block-renderer";
export function InlineA4Preview({
  document,
  onExpand,
}: {
  document: GeneratedDocument;
  onExpand: () => void;
}) {
  const [zoom,setZoom]=useState(100);
  const [showMargins,setShowMargins]=useState(false);
  const visibleDocument = buildVisibleDocumentModel(document);
  async function exportDocument(format: "pdf" | "docx") {
    if (format === "pdf") await downloadPdf(document);
    else await downloadDocx(document);
    trackEvent(
      format === "pdf" ? "document_exported_pdf" : "document_exported_docx",
      {
        document_type: document.type,
        document_category: categoryForDocument(document.type),
        language: document.locale,
      },
    );
  }
  return (
    <div className="sticky top-20">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Live A4 preview</p>
          <p className="text-xs text-muted-foreground">Ažurira se dok pišete</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          Uživo
        </span>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1" aria-label="Kontrole pregleda"><button type="button" onClick={()=>setZoom(v=>Math.max(50,v-10))} className="rounded-lg p-2 hover:bg-muted" aria-label="Smanji pregled"><Minus className="size-3.5"/></button><span className="min-w-12 text-center text-xs font-semibold">{zoom}%</span><button type="button" onClick={()=>setZoom(v=>Math.min(150,v+10))} className="rounded-lg p-2 hover:bg-muted" aria-label="Povećaj pregled"><Plus className="size-3.5"/></button><button type="button" onClick={()=>setZoom(100)} className="rounded-lg px-2 py-1.5 text-xs hover:bg-muted">Fit page</button><button type="button" onClick={()=>setShowMargins(v=>!v)} className={`rounded-lg px-2 py-1.5 text-xs ${showMargins?'bg-muted':''}`}>Margine</button><button type="button" onClick={onExpand} className="ml-auto rounded-lg p-2 hover:bg-muted" aria-label="Cijeli zaslon"><Maximize2 className="size-3.5"/></button></div>
      <div className={`aspect-[210/297] w-full overflow-hidden rounded-xl border bg-white shadow-2xl ${showMargins?'ring-2 ring-inset ring-dashed ring-blue-400':''}`}>
        <div className="h-full origin-top-left" style={{transform:`scale(${zoom/100})`,width:`${10000/zoom}%`,height:`${10000/zoom}%`}}><TemplateSurface type={document.type} style={visibleDocument.style} className="h-full">
        {visibleDocument.composer ? <ComposerRenderer composer={visibleDocument.composer} compact /> : visibleDocument.workHandover ? (
          <WorkHandoverSheet data={visibleDocument.workHandover} compact />
        ) : visibleDocument.completedWorksReport ? (
          <CompletedWorksReportSheet data={visibleDocument.completedWorksReport} compact />
        ) : visibleDocument.dailyReport ? (
          <DailyReportSheet data={visibleDocument.dailyReport} compact />
        ) : visibleDocument.invoice ? (
          <InvoiceSheet data={visibleDocument.invoice} images={visibleDocument.images} compact />
        ) : visibleDocument.quotation ? (
          <QuotationSheet
            data={visibleDocument.quotation}
            images={visibleDocument.images}
            compact
          />
        ) : visibleDocument.purchaseOrder ? (
          <PurchaseOrderSheet
            data={visibleDocument.purchaseOrder}
            images={visibleDocument.images}
            compact
          />
        ) : (
          <GenericSheet document={visibleDocument} />
        )}
        </TemplateSurface></div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button size="sm" variant="outline" onClick={onExpand}>
          <Eye className="size-3.5" />
          Pregled
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => exportDocument("pdf")}
        >
          <Download className="size-3.5" />
          PDF
        </Button>
        <Button size="sm" onClick={() => exportDocument("docx")}>
          <FileText className="size-3.5" />
          DOCX
        </Button>
      </div>
    </div>
  );
}
function GenericSheet({ document }: { document: GeneratedDocument }) {
  return (
    <article className="h-full p-[7%] text-[7px] leading-relaxed text-slate-800">
      <header className="flex justify-between border-b pb-3">
        <span className="font-bold" style={{color:"var(--doc-accent)"}}>{document.title}</span>
        <span>{document.locale.toUpperCase()}</span>
      </header>
      <h2 className="mt-5 text-[16px] font-bold">{document.title}</h2>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {document.fields
          .filter((f) => f.value)
          .map((f) => (
            <div
              key={f.label}
              className={f.type === "multiline" ? "col-span-2" : ""}
            >
              <p className="font-semibold uppercase text-slate-400">
                {f.label}
              </p>
              <p className="whitespace-pre-wrap">
                {f.type === "date"
                  ? formatDocumentDate(f.value, document.locale)
                  : f.value}
              </p>
            </div>
          ))}
      </div>
      {document.items && (
        <table className="mt-5 w-full">
          <tbody>
            {document.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td>{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}
