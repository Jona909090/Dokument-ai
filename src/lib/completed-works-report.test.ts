import { describe, expect, it } from "vitest";
import { calculateCompletedWorksSummary, createCompletedWorksReport, createReportRecord, recalculateWork } from "@/lib/completed-works-report";

describe("completed works report", () => {
  it("creates a report with the current year and safe empty totals", () => {
    const report = createCompletedWorksReport();
    expect(report.number).toContain(String(new Date().getFullYear()));
    expect(calculateCompletedWorksSummary(report).total).toBe(0);
  });
  it("calculates quantities and completion", () => {
    const work = createReportRecord("works", "Hidroizolacija podruma");
    work.fields["ugovorena količina"] = 100;
    work.fields["ranije izvedena količina"] = 25;
    work.fields["izvedeno u razdoblju"] = 50;
    const result = recalculateWork(work);
    expect(result.fields["ukupno izvedeno"]).toBe(75);
    expect(result.fields.preostalo).toBe(25);
    expect(result.fields["završenost %"]).toBe(75);
  });
  it("uses precise line calculations with multiple VAT rates and deductions", () => {
    const report = createCompletedWorksReport();
    const first = createReportRecord("works"), second = createReportRecord("works");
    Object.assign(first.fields, { "izvedeno u razdoblju": 2, "jedinična cijena": 100, "PDV %": 25 });
    Object.assign(second.fields, { "izvedeno u razdoblju": 3, "jedinična cijena": 50, "PDV %": 13 });
    const deduction = createReportRecord("deductions");
    Object.assign(deduction.fields, { iznos: 25, "uključi u izračun": true });
    report.sections.works = [first, second]; report.sections.deductions = [deduction];
    expect(calculateCompletedWorksSummary(report)).toMatchObject({ net: 325, tax: 69.5, total: 394.5 });
  });
  it("handles more than 100 works and Croatian Unicode", () => {
    const report = createCompletedWorksReport();
    report.sections.works = Array.from({ length: 101 }, (_, index) => {
      const work = createReportRecord("works", `Čelični nosač ž${index}`);
      work.fields["izvedeno u razdoblju"] = 1;
      return work;
    });
    expect(calculateCompletedWorksSummary(report).works).toBe(101);
    expect(report.sections.works[0].title).toContain("Čelični");
  });
  it("excludes hidden and statistical opt-out records", () => {
    const report = createCompletedWorksReport();
    const hidden = createReportRecord("workforce"), ignored = createReportRecord("workforce");
    hidden.fields["broj radnika"] = 10; hidden.visible = false;
    ignored.fields["broj radnika"] = 5; ignored.includeInStatistics = false;
    report.sections.workforce = [hidden, ignored];
    expect(calculateCompletedWorksSummary(report).workers).toBe(0);
  });
});
