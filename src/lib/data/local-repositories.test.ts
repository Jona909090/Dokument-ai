import { describe, expect, it, vi } from "vitest";
import { createDebouncedSave } from "./autosave";
import { demoCompany, demoContacts, demoDocuments, demoUser } from "./demo-data";
import { applyCompany, applyContact, filterAndSortDocuments } from "./document-helpers";
import { createLocalRepositories, MemoryStorage } from "./local-repositories";
import { downloadDocx, downloadPdf } from "../document-export";

function setup() { return createLocalRepositories(new MemoryStorage(), true); }

describe("local SaaS data architecture", () => {
  it("kreira novi dokument", () => { const repo = setup(); const saved = repo.documents.save({ ...demoDocuments[0], id: "", title: "Novi dokument" }); expect(saved.id).toBeTruthy(); expect(repo.documents.get(saved.id)?.title).toBe("Novi dokument"); });
  it("automatski sprema nacrt nakon debouncea", () => { vi.useFakeTimers(); const save = vi.fn(); const autosave = createDebouncedSave(save,900); autosave.schedule("prvo"); autosave.schedule("zadnje"); vi.advanceTimersByTime(899); expect(save).not.toHaveBeenCalled(); vi.advanceTimersByTime(1); expect(save).toHaveBeenCalledWith("zadnje"); vi.useRealTimers(); });
  it("ponovno otvara dokument", () => { const repo = setup(); expect(repo.documents.get("doc-offer")?.content.title).toBe("Ponuda za završne radove"); });
  it("uređuje i ponovno sprema", () => { const repo = setup(); const source = repo.documents.get("doc-offer")!; repo.documents.save({ ...source, title: "Uređena ponuda" }); expect(repo.documents.get(source.id)?.title).toBe("Uređena ponuda"); });
  it("duplicira dokument kao nacrt", () => { const copy = setup().documents.duplicate("doc-invoice"); expect(copy?.status).toBe("draft"); expect(copy?.title).toContain("kopija"); });
  it("arhivira dokument", () => { expect(setup().documents.archive("doc-order")?.status).toBe("archived"); });
  it("briše dokument", () => { const repo = setup(); repo.documents.delete("doc-cv"); expect(repo.documents.get("doc-cv")).toBeNull(); });
  it("filtrira, pretražuje i sortira", () => { const result = filterAndSortDocuments(demoDocuments,{ query:"faktura",type:"invoice",status:"paid",sort:"amount" }); expect(result.map((item) => item.id)).toEqual(["doc-invoice"]); });
  it("izbor kontakta popunjava klijenta", () => { const source = { ...demoDocuments[0], content: { ...demoDocuments[0].content, fields: [{ label:"Kupac",value:"" }] } }; const result = applyContact(source,demoContacts[0]); expect(result.contactId).toBe(demoContacts[0].id); expect(result.content.fields[0].value).toBe(demoContacts[0].companyName); });
  it("automatski popunjava podatke firme", () => { const source = { ...demoDocuments[0], content: { ...demoDocuments[0].content, fields: [{ label:"Naziv firme",value:"" }] } }; expect(applyCompany(source,demoCompany).content.fields[0].value).toBe(demoCompany.companyName); });
  it("spremljeni dokument podržava PDF i DOCX izvozni ugovor", () => { const content = setup().documents.get("doc-offer")?.content; expect(content?.type).toBe("offer"); expect(downloadPdf).toBeTypeOf("function"); expect(downloadDocx).toBeTypeOf("function"); });
  it("demo session koristi izmišljeni lokalni profil", () => { expect(setup().users.getCurrent()).toEqual(demoUser); expect(demoUser.email.endsWith(".local")).toBe(true); });
});
