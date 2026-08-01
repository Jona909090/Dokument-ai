import { localIsoDate, purchaseOrderUnits } from "@/lib/purchase-order";

export const quotationUnits = [
  ...purchaseOrderUnits.filter((unit) => unit !== "drugo"),
  "paušal",
  "drugo",
] as const;
export type QuotationTemplate = "classic" | "modern" | "minimal";
export type QuotationHeaderLayout =
  "logo-left" | "logo-top" | "no-logo" | "minimal";
export type QuotationStatus =
  "nacrt" | "poslana" | "prihvaćena" | "odbijena" | "istekla" | "arhivirana";

export type QuotationCompany = {
  name: string;
  address: string;
  cityPostalCode: string;
  taxNumber: string;
  vatNumber: string;
  phone: string;
  email: string;
  website: string;
  iban: string;
  swift: string;
  bankName: string;
  visible: Record<Exclude<keyof QuotationCompany, "visible">, boolean>;
};
export type QuotationCustomer = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  taxNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
};
export type QuotationBlock = {
  id: string;
  title: string;
  content: string;
  visible: boolean;
};
export type QuotationItem = {
  id: string;
  code: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  note: string;
  includedInCalculation: boolean;
  visible: boolean;
};
export type QuotationGroup = {
  id: string;
  name: string;
  visible: boolean;
  collapsed: boolean;
  discountRate: number;
  items: QuotationItem[];
};
export type QuotationVariant = {
  id: string;
  name: string;
  recommended: boolean;
  selectedForExport: boolean;
  visible: boolean;
  groups: QuotationGroup[];
};
export type QuotationCharge = {
  id: string;
  name: string;
  amount: number;
  taxRate: number;
  includedInCalculation: boolean;
  visible: boolean;
};
export type QuotationSignature = {
  id: string;
  title: string;
  name: string;
  role: string;
  date: string;
  visible: boolean;
};
export type QuotationData = {
  company: QuotationCompany;
  customer: QuotationCustomer;
  headerLayout: QuotationHeaderLayout;
  template: QuotationTemplate;
  number: string;
  issueDate: string;
  issuePlace: string;
  validUntil: string;
  referenceNumber: string;
  subject: string;
  project: string;
  site: string;
  responsiblePerson: string;
  salesRepresentative: string;
  currency: string;
  language: "hr" | "en";
  status: QuotationStatus;
  introBlocks: QuotationBlock[];
  variants: QuotationVariant[];
  charges: QuotationCharge[];
  globalDiscountRate: number;
  showPrices: boolean;
  conditions: QuotationBlock[];
  signatures: QuotationSignature[];
  acceptanceText: string;
  showAcceptanceText: boolean;
  includeSavedSignature: boolean;
  includeStamp: boolean;
};

export type QuotationItemAmounts = {
  grossCents: number;
  discountCents: number;
  netCents: number;
  taxCents: number;
  totalCents: number;
};
export type QuotationSummary = {
  grossCents: number;
  discountCents: number;
  chargesCents: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  taxByRate: Record<string, number>;
};
const cents = (value: number) =>
  Math.round((Number.isFinite(value) ? value : 0) * 100);
const rate = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

export function calculateQuotationItem(
  item: QuotationItem,
  groupDiscount = 0,
  globalDiscount = 0,
): QuotationItemAmounts {
  if (!item.includedInCalculation)
    return {
      grossCents: 0,
      discountCents: 0,
      netCents: 0,
      taxCents: 0,
      totalCents: 0,
    };
  const grossCents = Math.round(
    cents(item.unitPrice) * Math.max(0, item.quantity),
  );
  const afterItem =
    grossCents - Math.round((grossCents * rate(item.discountRate)) / 100);
  const afterGroup =
    afterItem - Math.round((afterItem * rate(groupDiscount)) / 100);
  const netCents =
    afterGroup - Math.round((afterGroup * rate(globalDiscount)) / 100);
  const discountCents = grossCents - netCents;
  const taxCents = Math.round((netCents * rate(item.taxRate)) / 100);
  return {
    grossCents,
    discountCents,
    netCents,
    taxCents,
    totalCents: netCents + taxCents,
  };
}

export function calculateQuotationVariant(
  variant: QuotationVariant,
  charges: QuotationCharge[],
  globalDiscountRate: number,
): QuotationSummary {
  const summary: QuotationSummary = {
    grossCents: 0,
    discountCents: 0,
    chargesCents: 0,
    subtotalCents: 0,
    taxCents: 0,
    totalCents: 0,
    taxByRate: {},
  };
  for (const group of variant.groups)
    for (const item of group.items) {
      const amount = calculateQuotationItem(
        item,
        group.discountRate,
        globalDiscountRate,
      );
      summary.grossCents += amount.grossCents;
      summary.discountCents += amount.discountCents;
      summary.subtotalCents += amount.netCents;
      summary.taxCents += amount.taxCents;
      summary.taxByRate[String(item.taxRate)] =
        (summary.taxByRate[String(item.taxRate)] ?? 0) + amount.taxCents;
    }
  for (const charge of charges.filter((entry) => entry.includedInCalculation)) {
    const amount = cents(charge.amount);
    const tax = Math.round((amount * rate(charge.taxRate)) / 100);
    summary.chargesCents += amount;
    summary.subtotalCents += amount;
    summary.taxCents += tax;
    summary.taxByRate[String(charge.taxRate)] =
      (summary.taxByRate[String(charge.taxRate)] ?? 0) + tax;
  }
  summary.totalCents = summary.subtotalCents + summary.taxCents;
  return summary;
}

export const createQuotationItem = (
  id = crypto.randomUUID(),
): QuotationItem => ({
  id,
  code: "",
  name: "",
  description: "",
  quantity: 1,
  unit: "kom",
  unitPrice: 0,
  discountRate: 0,
  taxRate: 25,
  note: "",
  includedInCalculation: true,
  visible: true,
});
export const createQuotationGroup = (
  name = "Nova grupa",
  id = crypto.randomUUID(),
): QuotationGroup => ({
  id,
  name,
  visible: true,
  collapsed: false,
  discountRate: 0,
  items: [createQuotationItem()],
});
export const createQuotationVariant = (
  name = "Osnovna",
  id = crypto.randomUUID(),
): QuotationVariant => ({
  id,
  name,
  recommended: true,
  selectedForExport: true,
  visible: true,
  groups: [createQuotationGroup("Stavke")],
});
const visibility = {
  name: true,
  address: true,
  cityPostalCode: true,
  taxNumber: true,
  vatNumber: true,
  phone: true,
  email: true,
  website: true,
  iban: true,
  swift: true,
  bankName: true,
};
export function createQuotationData(): QuotationData {
  const today = localIsoDate();
  return {
    company: {
      name: "",
      address: "",
      cityPostalCode: "",
      taxNumber: "",
      vatNumber: "",
      phone: "",
      email: "",
      website: "",
      iban: "",
      swift: "",
      bankName: "",
      visible: { ...visibility },
    },
    customer: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      taxNumber: "",
      contactPerson: "",
      phone: "",
      email: "",
    },
    headerLayout: "logo-left",
    template: "classic",
    number: `PON-${today.slice(0, 4)}-001`,
    issueDate: today,
    issuePlace: "",
    validUntil: "",
    referenceNumber: "",
    subject: "",
    project: "",
    site: "",
    responsiblePerson: "",
    salesRepresentative: "",
    currency: "EUR",
    language: "hr",
    status: "nacrt",
    introBlocks: [
      {
        id: crypto.randomUUID(),
        title: "Uvod",
        content:
          "Poštovani, zahvaljujemo na upitu. U nastavku dostavljamo ponudu za tražene radove i materijal.",
        visible: true,
      },
    ],
    variants: [createQuotationVariant()],
    charges: [],
    globalDiscountRate: 0,
    showPrices: true,
    conditions: [],
    signatures: [
      {
        id: crypto.randomUUID(),
        title: "Ponudu sastavio",
        name: "",
        role: "",
        date: today,
        visible: true,
      },
      {
        id: crypto.randomUUID(),
        title: "Odobrio",
        name: "",
        role: "",
        date: "",
        visible: true,
      },
      {
        id: crypto.randomUUID(),
        title: "Za naručioca",
        name: "",
        role: "",
        date: "",
        visible: true,
      },
      {
        id: crypto.randomUUID(),
        title: "Prihvat ponude",
        name: "",
        role: "",
        date: "",
        visible: true,
      },
    ],
    acceptanceText:
      "Potpisom potvrđujemo prihvat ove ponude i navedenih uvjeta.",
    showAcceptanceText: true,
    includeSavedSignature: true,
    includeStamp: true,
  };
}
