export const purchaseOrderUnits = [
  "kom", "m", "m²", "m³", "kg", "t", "l", "paket", "vreća", "rola", "paleta", "sat", "dan", "usluga", "drugo",
] as const;

export type PurchaseOrderParty = {
  name: string;
  address: string;
  cityPostalCode: string;
  taxNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
};

export type PurchaseOrderItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  isVisible?: boolean;
  includeInCalculation?: boolean;
};

export type PurchaseOrderSignature = {
  name: string;
  role: string;
  date: string;
  signature?: string;
};

export type PurchaseOrderData = {
  buyer: PurchaseOrderParty;
  supplier: PurchaseOrderParty;
  orderNumber: string;
  issueDate: string;
  issuePlace: string;
  desiredDeliveryDate: string;
  deliveryPlace: string;
  deliveryMethod: string;
  paymentDeadline: string;
  paymentMethod: string;
  currency: string;
  offerReference: string;
  project: string;
  responsiblePerson: string;
  note: string;
  deliveryTerms: string;
  paymentTerms: string;
  showPrices: boolean;
  items: PurchaseOrderItem[];
  orderedBy: PurchaseOrderSignature;
  approvedBy: PurchaseOrderSignature;
  supplierConfirmation: PurchaseOrderSignature;
  includeSavedSignature: boolean;
  includeStamp: boolean;
};

export type PurchaseOrderItemAmounts = PurchaseOrderItem & {
  gross: number;
  discount: number;
  net: number;
  tax: number;
  total: number;
};

export type PurchaseOrderTotals = {
  gross: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
};

export function calculatePurchaseOrderItem(item: PurchaseOrderItem): PurchaseOrderItemAmounts {
  const gross = item.quantity * item.unitPrice;
  const discount = gross * (item.discountRate / 100);
  const net = gross - discount;
  const tax = net * (item.taxRate / 100);
  return { ...item, gross, discount, net, tax, total: net + tax };
}

export function calculatePurchaseOrderTotals(items: PurchaseOrderItem[]): PurchaseOrderTotals {
  return items.filter((item) => item.includeInCalculation !== false).map(calculatePurchaseOrderItem).reduce(
    (totals, item) => ({
      gross: totals.gross + item.gross,
      discount: totals.discount + item.discount,
      subtotal: totals.subtotal + item.net,
      tax: totals.tax + item.tax,
      total: totals.total + item.total,
    }),
    { gross: 0, discount: 0, subtotal: 0, tax: 0, total: 0 },
  );
}

export function localIsoDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function emptyPurchaseOrderItem(id = crypto.randomUUID()): PurchaseOrderItem {
  return { id, name: "", description: "", quantity: 1, unit: "kom", unitPrice: 0, discountRate: 0, taxRate: 25, isVisible: true, includeInCalculation: true };
}
