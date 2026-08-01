import { describe, expect, it } from "vitest";
import { defaultPaperDesign, migratePaperDesign } from "./paper";

describe("paper wave decoration", () => {
  it("keeps the wave disabled for backward-compatible documents", () => {
    const migrated = migratePaperDesign({
      version: 1,
      presetId: "legacy",
      color: { value: "#ffffff", intensity: 0, source: "palette" },
    });

    expect(migrated.wave.enabled).toBe(false);
    expect(migrated.wave.style).toBe("corporate-ribbon");
  });

  it("preserves customized wave settings", () => {
    const paper = defaultPaperDesign();
    paper.wave = {
      ...paper.wave,
      enabled: true,
      style: "double-flow",
      position: "footer",
      primaryColor: "#123456",
      secondaryColor: "#abcdef",
      height: 24,
      offset: 72,
      flip: true,
    };

    expect(migratePaperDesign(paper).wave).toEqual(paper.wave);
  });
});
