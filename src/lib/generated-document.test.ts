import { describe, expect, it } from "vitest";

import { formatDocumentDate, safeDocumentFilename } from "./generated-document";

describe("document output helpers", () => {
  it("formatira hrvatski i engleski datum", () => {
    expect(formatDocumentDate("2026-07-31", "hr")).toBe("31. 07. 2026.");
    expect(formatDocumentDate("2026-07-31", "en")).toContain("31 July 2026");
  });

  it("generira siguran naziv datoteke s Unicode naslova", () => {
    const filename = safeDocumentFilename(
      { type: "request", title: "Zahtjev za godišnji odmor", locale: "hr", fields: [] },
      "pdf",
    );
    expect(filename).toBe("zahtjev-za-godisnji-odmor.pdf");
  });
});
