import { describe, expect, it } from "vitest";
import { buildWizardDocument, templateGroups, wizardQuestions } from "./wizard";

describe("local smart wizard", () => {
  it("svaki tip dokumenta ima strukturirana pitanja", () => {
    expect(Object.keys(wizardQuestions)).toHaveLength(14);
    for (const questions of Object.values(wizardQuestions)) {
      expect(questions.length).toBeGreaterThanOrEqual(5);
      expect(questions.some((question) => question.required)).toBe(true);
    }
  });

  it("pretvara odgovore u zajednički format dokumenta", () => {
    const document = buildWizardDocument("offer", { company: "Gradnja d.o.o.", buyer: "Kupac d.o.o.", date: "2026-07-31", subject: "Hidroizolacija", items: "Priprema podloge\nHidroizolacija" });
    expect(document.type).toBe("offer");
    expect(document.fields.find((field) => field.label === "Naziv firme")?.value).toBe("Gradnja d.o.o.");
    expect(document.items).toHaveLength(2);
  });

  it("nudi šest quick template grupa", () => {
    expect(templateGroups.map((group) => group.label)).toEqual(["Građevina", "Administracija", "Pravni", "Financije", "HR", "Privatni"]);
  });
});
