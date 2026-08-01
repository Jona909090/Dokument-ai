import { describe, expect, it } from "vitest";
import {
  calculateInvoice,
  calculateInvoiceItem,
  createInvoiceData,
  createInvoiceItem,
} from "@/lib/invoice";

describe("invoice calculations", () => {
  it("uses cents for decimals, discounts and VAT", () => {
    const item = {
      ...createInvoiceItem("a"),
      quantity: 3,
      unitPrice: 0.1,
      discountRate: 10,
      taxRate: 25,
    };
    expect(calculateInvoiceItem(item)).toEqual({
      grossCents: 30,
      discountCents: 3,
      netCents: 27,
      taxCents: 7,
      totalCents: 34,
    });
  });
  it("handles 30+ items and several rates", () => {
    const data = createInvoiceData();
    data.groups[0].items = Array.from({ length: 31 }, (_, index) => ({
      ...createInvoiceItem(String(index)),
      unitPrice: 10,
      taxRate: index % 2 ? 25 : 13,
    }));
    const result = calculateInvoice(data);
    expect(result.totalCents).toBeGreaterThan(31000);
    expect(Object.keys(result.taxByRate)).toEqual(
      expect.arrayContaining(["13", "25"]),
    );
  });
  it.each(["nije-u-pdv", "reverse-charge"] as const)(
    "removes tax for %s",
    (taxMode) => {
      const data = createInvoiceData();
      data.taxMode = taxMode;
      data.groups[0].items[0].unitPrice = 100;
      expect(calculateInvoice(data).taxCents).toBe(0);
    },
  );
  it("deducts advance and tracks partial/full payments", () => {
    const data = createInvoiceData();
    data.type = "završna";
    data.previousAdvance = 25;
    data.groups[0].items[0].unitPrice = 100;
    data.payments = [
      {
        id: "p",
        date: data.issueDate,
        amount: 50,
        method: "bankovna uplata",
        reference: "",
        note: "čćžšđ",
      },
    ];
    expect(calculateInvoice(data).paymentStatus).toBe("djelimično plaćena");
    data.payments[0].amount = 100;
    expect(calculateInvoice(data).paymentStatus).toBe("plaćena");
  });
  it("supports negative cancellation items and charges", () => {
    const data = createInvoiceData();
    data.type = "storno";
    data.groups[0].items[0] = {
      ...createInvoiceItem(),
      quantity: -1,
      unitPrice: 100,
    };
    data.charges.push({
      id: "c",
      name: "Trošak",
      amount: 10,
      taxRate: 25,
      includedInCalculation: true,
      visible: true,
    });
    expect(calculateInvoice(data).totalCents).toBeLessThan(0);
  });
});
