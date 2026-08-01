import type { QuotationItem } from "@/lib/quotation";
export type CatalogItem = Pick<
  QuotationItem,
  "code" | "name" | "description" | "unit" | "unitPrice" | "taxRate"
> & { id: string; category: string; active: boolean };
const key = "dokument-ai-quotation-catalog-v1";
const demo: CatalogItem[] = [
  {
    id: "cat-1",
    code: "MAT-001",
    name: "Građevinski materijal",
    description: "Materijal prema specifikaciji",
    unit: "kom",
    unitPrice: 25,
    taxRate: 25,
    category: "Materijal",
    active: true,
  },
  {
    id: "cat-2",
    code: "RAD-001",
    name: "Stručni rad",
    description: "Izvođenje radova",
    unit: "sat",
    unitPrice: 35,
    taxRate: 25,
    category: "Rad",
    active: true,
  },
];
export function listCatalogItems(): CatalogItem[] {
  if (typeof window === "undefined") return demo;
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null") as
      CatalogItem[] | null;
    return saved ?? demo;
  } catch {
    return demo;
  }
}
export function saveCatalogItems(items: CatalogItem[]) {
  if (typeof window !== "undefined")
    localStorage.setItem(key, JSON.stringify(items));
}
