import { describe, expect, it, vi } from "vitest";
import { MockAIProvider } from "./mock-provider";
import { applyDiff, convertDraft, createDiff, protectedTranslationPatterns, validateDraft } from "./operations";
import { checkAndConsumeCredits, creditCosts } from "./limits";
import { providerResultSchema } from "./schemas";
import type { AIDocumentDraft, AIRequest } from "./types";

function request(prompt: string, extra: Partial<AIRequest> = {}): AIRequest { return { prompt, action: "draft", idempotencyKey: crypto.randomUUID(), ...extra }; }
const provider = new MockAIProvider();

describe("AI Document Copilot", () => {
  it("prepoznaje ponudu", async () => expect((await provider.generate(request("Napravi ponudu za radove"))).classification.documentType).toBe("offer"));
  it("prepoznaje fakturu", async () => expect((await provider.generate(request("Treba mi faktura"))).classification.documentType).toBe("invoice"));
  it("nejasan zahtjev traži pojašnjenje", async () => expect((await provider.generate(request("Napravi nešto poslovno"))).classification.requiresClarification).toBe(true));
  it("izdvaja količinu i jedinicu", async () => { const result = await provider.generate(request("Napravi ponudu za 120 m² hidroizolacije")); expect(result.draft.items[0]).toMatchObject({ quantity: 120, unit: "m²" }); });
  it("ne izmišlja cijenu", async () => expect((await provider.generate(request("Naruči 10 m³ batude"))).draft.items[0].unitPrice).toBeNull());
  it("označava izostavljena obavezna polja", async () => expect((await provider.generate(request("Napravi fakturu"))).draft.missingFields.length).toBeGreaterThan(2));
  it("vraća structured output koji prolazi Zod shemu", async () => expect(providerResultSchema.safeParse(await provider.generate(request("Napravi ponudu"))).success).toBe(true));
  it("stvara diff prije primjene", () => expect(createDiff({ subject: "Staro" }, [{ field: "subject", value: "Novo", source: "user", confidence: .9, wasInferred: false, requiresConfirmation: false, reason: "Navedeno" }])).toHaveLength(1));
  it("podržava djelomično prihvaćanje", () => { const diff = createDiff({}, [{ field: "a", value: "A", source: "user", confidence: 1, wasInferred: false, requiresConfirmation: false, reason: "x" }, { field: "b", value: "B", source: "user", confidence: 1, wasInferred: false, requiresConfirmation: false, reason: "x" }]); expect(applyDiff({}, diff, new Set(["a"])).next).toEqual({ a: "A" }); });
  it("čuva Undo snapshot", () => { const current = { name: "Prije" }; const diff = createDiff(current, [{ field: "name", value: "Poslije", source: "user", confidence: 1, wasInferred: false, requiresConfirmation: false, reason: "x" }]); expect(applyDiff(current, diff, new Set(["name"])).undo).toEqual(current); });
  it("konverzija ne mijenja original", async () => { const source = (await provider.generate(request("Napravi ponudu"))).draft; const converted = convertDraft(source, "proforma"); expect(source.metadata.documentType).toBe("offer"); expect(converted.metadata.documentType).toBe("proforma"); });
  it("priprema građevinski dnevni izvještaj", async () => expect((await provider.generate(request("Napravi dnevni izvještaj: danas 6 radnika"))).classification.documentType).toBe("daily-report"));
  it("simulira korisnika bez kredita", async () => await expect(provider.generate(request("Napravi CV", { simulation: "limit" }))).rejects.toThrow("AI_LIMIT_EXCEEDED"));
  it("simulira provider grešku", async () => await expect(provider.generate(request("Napravi CV", { simulation: "error" }))).rejects.toThrow("AI_PROVIDER_UNAVAILABLE"));
  it("podržava prekid zahtjeva", async () => { const controller = new AbortController(); const pending = provider.generate(request("Napravi CV"), controller.signal); controller.abort(); await expect(pending).rejects.toMatchObject({ name: "AbortError" }); });
  it("ne označava normalne poslovne dokumente kao štetne", async () => expect(await provider.moderate("Napravi fakturu")).toEqual({ flagged: false, categories: [] }));
  it("štiti identifikatore pri prijevodu", () => expect(protectedTranslationPatterns.some((pattern) => pattern.test("HR1210010051863000160"))).toBe(true));
  it("validira količinu bez jedinice", async () => { const draft = (await provider.generate(request("Napravi ponudu"))).draft as AIDocumentDraft; draft.items.push({ id: "1", name: "Rad", description: "", quantity: 1, unit: "", unitPrice: null, taxRate: null, group: null, note: null, confidence: 1, requiresConfirmation: true, visible: true, includeInCalculation: true }); expect(validateDraft(draft).some((issue) => issue.field === "unit")).toBe(true); });
  it("različite AI akcije imaju različit trošak", () => expect(creditCosts.draft).toBeGreaterThan(creditCosts.rewrite));
  it("limit sustav vraća preostale kredite", () => expect(checkAndConsumeCredits(`test-${crypto.randomUUID()}`, "classify").remaining).toBe(29));
  it("timeout scenarij se može prekinuti", async () => { vi.useFakeTimers(); const controller = new AbortController(); const pending = provider.generate(request("Napravi CV", { simulation: "timeout" }), controller.signal); controller.abort(); await expect(pending).rejects.toMatchObject({ name: "AbortError" }); vi.useRealTimers(); });
});

