"use client";
import { Download, Eye, FileText } from "lucide-react";
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
export function InlineA4Preview({
  document,
  onExpand,
}: {
  document: GeneratedDocument;
  onExpand: () => void;
}) {
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
      <div className="aspect-[210/297] w-full overflow-hidden rounded-xl border bg-white shadow-2xl">
        {visibleDocument.invoice ? (
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
        <span className="font-bold text-blue-600">DOKUMENT AI</span>
        <span>{document.title}</span>
      </header>
      <h2 className="mt-5 text-[16px] font-bold">{document.title}</h2>
      <p className="mt-1 text-slate-400">Profesionalno pripremljen dokument</p>
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
