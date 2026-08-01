import { describe, expect, it } from "vitest";
import { confidenceRange, discoverDocuments } from "./landing-discovery";

describe("landing document discovery", () => {
  it.each([
    ["Napravi ponudu za hidroizolaciju", "offer"],
    ["Treba mi faktura", "invoice"],
    ["Napravi narudžbenicu za materijal", "purchase-order"],
    ["Napiši poslovni email dobavljaču", "business-letter"],
    ["Napravi dnevni izvještaj sa gradilišta", "daily-report"],
  ])("prepoznaje %s", (query, type) => expect(discoverDocuments(query)[0]?.type).toBe(type));

  it("vraća više sigurnih prijedloga za neodređen račun", () => {
    const types = discoverDocuments("Treba mi račun ili avans").map((item) => item.type);
    expect(types).toContain("invoice");
    expect(types).toContain("proforma");
  });

  it("ne nagađa za nejasan unos", () => expect(discoverDocuments("Trebam nešto")).toEqual([]));
  it("grupira confidence bez spremanja prompta", () => expect(confidenceRange(0.9)).toBe("high"));
});
