import { localIsoDate } from "@/lib/purchase-order";

export const invoiceUnits = [
  "kom",
  "m",
  "m²",
  "m³",
  "kg",
  "t",
  "l",
  "paket",
  "vreća",
  "rola",
  "paleta",
  "sat",
  "dan",
  "usluga",
  "paušal",
  "drugo",
] as const;
export const invoiceTaxRates = [0, 5, 10, 13, 17, 20, 21, 25] as const;
export type InvoiceTemplate = "classic" | "modern" | "minimal";
export type InvoiceHeaderLayout = "logo-left" | "logo-top" | "minimal";
export type InvoiceStatus =
  | "nacrt"
  | "izdana"
  | "poslana"
  | "djelimično plaćena"
  | "plaćena"
  | "dospjela"
  | "otkazana"
  | "stornirana"
  | "arhivirana";
export type InvoiceType =
  | "standardna"
  | "avansna"
  | "završna"
  | "djelimična"
  | "storno"
  | "proforma"
  | "bez-pdv"
  | "reverse-charge"
  | "inozemna";
export type InvoiceTaxMode =
  | "standard"
  | "nije-u-pdv"
  | "oslobođeno"
  | "reverse-charge"
  | "izvoz"
  | "eu"
  | "prilagođeno";
export type PaymentMethod =
  "bankovna uplata" | "gotovina" | "kartica" | "pouzeće" | "PayPal" | "drugo";

export type InvoiceParty = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  taxNumber: string;
  vatNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
};
export type InvoiceCompany = InvoiceParty & {
  registrationNumber: string;
  website: string;
  iban: string;
  swift: string;
  bankName: string;
  visible: Record<string, boolean>;
};
export type InvoiceItem = {
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
export type InvoiceGroup = {
  id: string;
  name: string;
  visible: boolean;
  collapsed: boolean;
  discountRate: number;
  items: InvoiceItem[];
};
export type InvoiceCharge = {
  id: string;
  name: string;
  amount: number;
  taxRate: number;
  includedInCalculation: boolean;
  visible: boolean;
};
export type InvoicePayment = {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  note: string;
};
export type InvoiceBlock = {
  id: string;
  title: string;
  content: string;
  visible: boolean;
  internal: boolean;
};
export type InvoiceSignature = {
  id: string;
  title: string;
  name: string;
  role: string;
  date: string;
  visible: boolean;
};
export type InvoiceData = {
  company: InvoiceCompany;
  customer: InvoiceParty;
  headerLayout: InvoiceHeaderLayout;
  template: InvoiceTemplate;
  number: string;
  numberFormat: string;
  automaticNumber: boolean;
  issueDate: string;
  dueDate: string;
  serviceDate: string;
  issuePlace: string;
  currency: string;
  language: "hr" | "en";
  status: InvoiceStatus;
  type: InvoiceType;
  customerReference: string;
  customerOrderNumber: string;
  project: string;
  site: string;
  responsiblePerson: string;
  note: string;
  groups: InvoiceGroup[];
  charges: InvoiceCharge[];
  globalDiscountRate: number;
  taxMode: InvoiceTaxMode;
  legalNote: string;
  showLegalNote: boolean;
  payment: {
    iban: string;
    swift: string;
    bankName: string;
    model: string;
    reference: string;
    description: string;
    deadline: string;
    method: PaymentMethod;
    showCodePlaceholder: boolean;
  };
  payments: InvoicePayment[];
  advancePercentage: number;
  advanceAmount: number;
  advanceReference: string;
  previousAdvance: number;
  cancelledInvoiceNumber: string;
  cancellationReason: string;
  cancellationDate: string;
  partialCancellation: boolean;
  blocks: InvoiceBlock[];
  signatures: InvoiceSignature[];
  includeSavedSignature: boolean;
  includeStamp: boolean;
};
export type InvoiceItemAmounts = {
  grossCents: number;
  discountCents: number;
  netCents: number;
  taxCents: number;
  totalCents: number;
};
export type InvoiceSummary = InvoiceItemAmounts & {
  chargesCents: number;
  paidCents: number;
  remainingCents: number;
  taxByRate: Record<string, { baseCents: number; taxCents: number }>;
  paymentStatus: "neplaćena" | "djelimično plaćena" | "plaćena";
};

const cents = (value: number) =>
  Math.round((Number.isFinite(value) ? value : 0) * 100);
const rate = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
export function calculateInvoiceItem(
  item: InvoiceItem,
  groupDiscount = 0,
  globalDiscount = 0,
  taxMode: InvoiceTaxMode = "standard",
): InvoiceItemAmounts {
  if (!item.includedInCalculation)
    return {
      grossCents: 0,
      discountCents: 0,
      netCents: 0,
      taxCents: 0,
      totalCents: 0,
    };
  const grossCents = Math.round(
    cents(item.unitPrice) *
      (Number.isFinite(item.quantity) ? item.quantity : 0),
  );
  const afterItem =
    grossCents - Math.round((grossCents * rate(item.discountRate)) / 100);
  const afterGroup =
    afterItem - Math.round((afterItem * rate(groupDiscount)) / 100);
  const netCents =
    afterGroup - Math.round((afterGroup * rate(globalDiscount)) / 100);
  const taxable = taxMode === "standard" || taxMode === "prilagođeno";
  const taxCents = taxable
    ? Math.round((netCents * rate(item.taxRate)) / 100)
    : 0;
  return {
    grossCents,
    discountCents: grossCents - netCents,
    netCents,
    taxCents,
    totalCents: netCents + taxCents,
  };
}
export function calculateInvoice(data: InvoiceData): InvoiceSummary {
  const summary: InvoiceSummary = {
    grossCents: 0,
    discountCents: 0,
    netCents: 0,
    taxCents: 0,
    totalCents: 0,
    chargesCents: 0,
    paidCents: 0,
    remainingCents: 0,
    taxByRate: {},
    paymentStatus: "neplaćena",
  };
  for (const group of data.groups)
    for (const item of group.items) {
      const value = calculateInvoiceItem(
        item,
        group.discountRate,
        data.globalDiscountRate,
        data.taxMode,
      );
      summary.grossCents += value.grossCents;
      summary.discountCents += value.discountCents;
      summary.netCents += value.netCents;
      summary.taxCents += value.taxCents;
      const key = String(item.taxRate);
      const tax = summary.taxByRate[key] ?? { baseCents: 0, taxCents: 0 };
      tax.baseCents += value.netCents;
      tax.taxCents += value.taxCents;
      summary.taxByRate[key] = tax;
    }
  for (const charge of data.charges.filter(
    (entry) => entry.includedInCalculation,
  )) {
    const base = cents(charge.amount);
    const taxable =
      data.taxMode === "standard" || data.taxMode === "prilagođeno";
    const taxValue = taxable
      ? Math.round((base * rate(charge.taxRate)) / 100)
      : 0;
    summary.chargesCents += base;
    summary.netCents += base;
    summary.taxCents += taxValue;
    const key = String(charge.taxRate);
    const tax = summary.taxByRate[key] ?? { baseCents: 0, taxCents: 0 };
    tax.baseCents += base;
    tax.taxCents += taxValue;
    summary.taxByRate[key] = tax;
  }
  summary.totalCents =
    summary.netCents +
    summary.taxCents -
    (data.type === "završna" ? cents(data.previousAdvance) : 0);
  summary.paidCents = data.payments.reduce(
    (sum, payment) => sum + cents(payment.amount),
    0,
  );
  summary.remainingCents = summary.totalCents - summary.paidCents;
  summary.paymentStatus =
    summary.paidCents <= 0
      ? "neplaćena"
      : summary.remainingCents > 0
        ? "djelimično plaćena"
        : "plaćena";
  return summary;
}
export function suggestedLegalNote(mode: InvoiceTaxMode) {
  return (
    {
      standard: "PDV je obračunat prema prikazanim stopama.",
      "nije-u-pdv": "Izdavatelj nije u sustavu PDV-a.",
      oslobođeno: "Isporuka je oslobođena PDV-a prema primjenjivom propisu.",
      "reverse-charge": "Prijenos porezne obveze (reverse charge).",
      izvoz:
        "Izvozna isporuka – porezni tretman provjeriti prema mjestu isporuke.",
      eu: "Isporuka unutar EU – porezni tretman provjeriti prema statusu kupca.",
      prilagođeno: "",
    } satisfies Record<InvoiceTaxMode, string>
  )[mode];
}
export const createInvoiceItem = (id = crypto.randomUUID()): InvoiceItem => ({
  id,
  code: "",
  name: "Nova stavka",
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
export const createInvoiceGroup = (
  name = "Stavke",
  id = crypto.randomUUID(),
): InvoiceGroup => ({
  id,
  name,
  visible: true,
  collapsed: false,
  discountRate: 0,
  items: [createInvoiceItem()],
});
export function createInvoiceData(): InvoiceData {
  const today = localIsoDate();
  const year = today.slice(0, 4);
  const visible = Object.fromEntries(
    [
      "name",
      "address",
      "city",
      "postalCode",
      "country",
      "taxNumber",
      "vatNumber",
      "registrationNumber",
      "contactPerson",
      "phone",
      "email",
      "website",
      "iban",
      "swift",
      "bankName",
    ].map((key) => [key, true]),
  );
  const party = (): InvoiceParty => ({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    taxNumber: "",
    vatNumber: "",
    contactPerson: "",
    phone: "",
    email: "",
  });
  return {
    company: {
      ...party(),
      registrationNumber: "",
      website: "",
      iban: "",
      swift: "",
      bankName: "",
      visible,
    },
    customer: party(),
    headerLayout: "logo-left",
    template: "classic",
    number: `RAC-${year}-001`,
    numberFormat: "RAC-{YYYY}-{NNN}",
    automaticNumber: true,
    issueDate: today,
    dueDate: today,
    serviceDate: today,
    issuePlace: "",
    currency: "EUR",
    language: "hr",
    status: "nacrt",
    type: "standardna",
    customerReference: "",
    customerOrderNumber: "",
    project: "",
    site: "",
    responsiblePerson: "",
    note: "",
    groups: [createInvoiceGroup()],
    charges: [],
    globalDiscountRate: 0,
    taxMode: "standard",
    legalNote: suggestedLegalNote("standard"),
    showLegalNote: true,
    payment: {
      iban: "",
      swift: "",
      bankName: "",
      model: "",
      reference: "",
      description: "Plaćanje fakture",
      deadline: "",
      method: "bankovna uplata",
      showCodePlaceholder: false,
    },
    payments: [],
    advancePercentage: 0,
    advanceAmount: 0,
    advanceReference: "",
    previousAdvance: 0,
    cancelledInvoiceNumber: "",
    cancellationReason: "",
    cancellationDate: today,
    partialCancellation: false,
    blocks: [],
    signatures: [
      {
        id: crypto.randomUUID(),
        title: "Fakturu sastavio",
        name: "",
        role: "",
        date: today,
        visible: true,
      },
      {
        id: crypto.randomUUID(),
        title: "Odgovorna osoba",
        name: "",
        role: "",
        date: today,
        visible: true,
      },
    ],
    includeSavedSignature: true,
    includeStamp: true,
  };
}
