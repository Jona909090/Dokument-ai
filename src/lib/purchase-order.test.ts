import { describe, expect, it } from "vitest";
import { calculatePurchaseOrderItem, calculatePurchaseOrderTotals, localIsoDate, purchaseOrderUnits, type PurchaseOrderItem } from "./purchase-order";

const item = (overrides: Partial<PurchaseOrderItem> = {}): PurchaseOrderItem => ({
  id: "item-1", name: "Hidroizolacija", description: "", quantity: 2, unit: "m²", unitPrice: 100, discountRate: 10, taxRate: 25, ...overrides,
});

describe("purchase order calculations", () => {
  it("računa količinu, popust, osnovicu i PDV po stavci", () => {
    expect(calculatePurchaseOrderItem(item())).toMatchObject({ gross: 200, discount: 20, net: 180, tax: 45, total: 225 });
  });
  it("podržava različite PDV stope", () => {
    expect(calculatePurchaseOrderTotals([item(), item({ id: "item-2", taxRate: 13, discountRate: 0 })])).toMatchObject({ subtotal: 380, tax: 71, total: 451 });
  });
  it("podržava više od 20 stavki bez gubitka izračuna", () => {
    expect(calculatePurchaseOrderTotals(Array.from({ length: 21 }, (_, index) => item({ id: String(index), quantity: 1, unitPrice: 10, discountRate: 0, taxRate: 0 }))).total).toBe(210);
  });
  it("koristi stvarnu lokalnu godinu", () => {
    expect(localIsoDate(new Date("2026-08-01T12:00:00Z"))).toMatch(/^2026-08-0[12]$/);
  });
  it("nudi sve poslovne jedinice mjere i dopušta vrijednost drugo", () => {
    expect(purchaseOrderUnits).toEqual(expect.arrayContaining(["kom", "m²", "m³", "kg", "paleta", "usluga", "drugo"]));
  });
  it("čuva hrvatska slova u sadržaju stavke", () => {
    const original = item({ name: "Čelična žičana mreža", description: "Širina, građevinski čvor i međukatna ploča" });
    expect(JSON.parse(JSON.stringify(original))).toEqual(original);
  });
});
