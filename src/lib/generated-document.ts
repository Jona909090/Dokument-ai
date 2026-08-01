import type { DocumentType } from "@/lib/document-types";
import type { PurchaseOrderData } from "@/lib/purchase-order";
import type { QuotationData } from "@/lib/quotation";
import type { InvoiceData } from "@/lib/invoice";
import type { DocumentVisibilitySettings } from "@/lib/document-visibility";

export type DocumentLocale = "hr" | "en";

export type GeneratedField = {
  label: string;
  value: string;
  type?: "date" | "multiline";
};

export type GeneratedLineItem = {
  description: string;
  quantity: number;
  price: number;
  amount: number;
};

export type GeneratedTotals = {
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
};

export type GeneratedImages = {
  logo?: string;
  signature?: string;
  stamp?: string;
};

export type GeneratedDocument = {
  type: DocumentType;
  title: string;
  locale: DocumentLocale;
  fields: GeneratedField[];
  items?: GeneratedLineItem[];
  totals?: GeneratedTotals;
  images?: GeneratedImages;
  purchaseOrder?: PurchaseOrderData;
  quotation?: QuotationData;
  invoice?: InvoiceData;
  visibility?: DocumentVisibilitySettings;
};

export function formatDocumentDate(value: string, locale: DocumentLocale) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "hr" ? "hr-HR" : "en-GB", {
    day: "2-digit",
    month: locale === "hr" ? "2-digit" : "long",
    year: "numeric",
  }).format(date);
}

export function safeDocumentFilename(
  document: GeneratedDocument,
  extension: "pdf" | "docx",
) {
  const base = document.title
    .toLocaleLowerCase("hr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "dokument"}.${extension}`;
}
