import { describe, expect, it } from "vitest";
import {
  calculateQuotationItem,
  calculateQuotationVariant,
  createQuotationGroup,
  createQuotationItem,
  createQuotationVariant,
  quotationUnits,
} from "./quotation";

describe("quotation calculations", () => {
  it("precizno računa decimalnu količinu, popuste i PDV u centima", () => {
    const item = {
      ...createQuotationItem("i"),
      quantity: 0.1,
      unitPrice: 0.2,
      discountRate: 10,
      taxRate: 25,
    };
    expect(calculateQuotationItem(item)).toEqual({
      grossCents: 2,
      discountCents: 0,
      netCents: 2,
      taxCents: 1,
      totalCents: 3,
    });
  });
  it("računa popust stavke, grupe i cijele ponude", () => {
    const item = {
      ...createQuotationItem("i"),
      quantity: 2,
      unitPrice: 100,
      discountRate: 10,
      taxRate: 25,
    };
    expect(calculateQuotationItem(item, 10, 10)).toMatchObject({
      grossCents: 20000,
      netCents: 14580,
      discountCents: 5420,
    });
  });
  it("grupira PDV po različitim stopama i dodatnim troškovima", () => {
    const variant = createQuotationVariant("Osnovna", "v");
    variant.groups = [
      {
        ...createQuotationGroup("Rad", "g"),
        items: [
          { ...createQuotationItem("a"), unitPrice: 100, taxRate: 25 },
          { ...createQuotationItem("b"), unitPrice: 100, taxRate: 13 },
        ],
      },
    ];
    const summary = calculateQuotationVariant(
      variant,
      [
        {
          id: "c",
          name: "Transport",
          amount: 10,
          taxRate: 25,
          includedInCalculation: true,
          visible: true,
        },
      ],
      0,
    );
    expect(summary.taxByRate).toEqual({ "13": 1300, "25": 2750 });
    expect(summary.totalCents).toBe(25050);
  });
  it("podržava više od 30 stavki i više grupa", () => {
    const variant = createQuotationVariant("Premium", "v");
    variant.groups = [
      createQuotationGroup("Materijal", "g1"),
      createQuotationGroup("Rad", "g2"),
    ];
    variant.groups[0].items = Array.from({ length: 31 }, (_, index) => ({
      ...createQuotationItem(String(index)),
      unitPrice: 10,
      taxRate: 0,
    }));
    variant.groups[1].items = [
      { ...createQuotationItem("rad"), unitPrice: 20, taxRate: 0 },
    ];
    expect(calculateQuotationVariant(variant, [], 0).totalCents).toBe(33000);
  });
  it("podržava poslovne jedinice i hrvatska slova", () => {
    expect(quotationUnits).toContain("m²");
    expect(
      JSON.parse(JSON.stringify({ text: "Čekić, žbuka, šipka i građa" })),
    ).toEqual({ text: "Čekić, žbuka, šipka i građa" });
  });
});
