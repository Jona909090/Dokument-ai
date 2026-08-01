import { describe, expect, it } from "vitest";
import { answersFromAIDraft } from "./handoff";
import type { AICopilotResult } from "./types";

describe("AI document handoff", () => {
  it("maps confirmed fields and structured items into wizard answers", () => {
    const result = {
      draft: {
        fields: [
          { field: "company", value: "Primjer d.o.o." },
          { field: "buyer", value: null },
        ],
        items: [
          { quantity: 12, unit: "m²", name: "Hidroizolacija", unitPrice: 25 },
          { quantity: 2, unit: "kom", name: "Slivnik", unitPrice: null },
        ],
      },
    } as unknown as AICopilotResult;

    expect(answersFromAIDraft(result)).toEqual({
      company: "Primjer d.o.o.",
      items: "12 m² Hidroizolacija po 25 EUR\n2 kom Slivnik",
    });
  });
});
