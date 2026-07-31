import { describe, expect, it } from "vitest";

import { detectDocumentType, isDocumentType } from "./document-types";

describe("document type detection", () => {
  it.each([
    ["Hoću napraviti CV", "cv"],
    ["Treba mi faktura", "invoice"],
    ["Napravi mi ponudu", "offer"],
    ["Treba mi ugovor o radu", "contract"],
    ["Zahtjev za godišnji odmor", "request"],
    ["Želim dati otkaz", "termination"],
    ["Nova narudžbenica", "purchase-order"],
    ["Zapisnik sa sastanka", "minutes"],
    ["Potvrda o zaposlenju", "certificate"],
    ["Napiši poslovno pismo", "business-letter"],
  ])("prepoznaje %s", (input, expected) => {
    expect(detectDocumentType(input)).toBe(expected);
  });

  it("odbija nepoznatu kategoriju", () => {
    expect(detectDocumentType("nešto sasvim drugo")).toBeNull();
    expect(isDocumentType("unknown")).toBe(false);
  });
});
