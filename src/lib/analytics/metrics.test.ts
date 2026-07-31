import { describe, expect, it } from "vitest";
import { createDemoAnalyticsEvents } from "./demo-data";
import { calculateAnalyticsMetrics, filterAnalyticsEvents } from "./metrics";

describe("privacy-safe analytics metrics", () => {
  const events = createDemoAnalyticsEvents();

  it("demo događaji sadrže samo dopuštena polja", () => {
    const forbidden = ["content", "text", "name", "address", "amount", "oib", "pib", "email"];
    for (const event of events) forbidden.forEach((key) => expect(event).not.toHaveProperty(key));
  });

  it("izračunava osnovne i trend metrike", () => {
    const metrics = calculateAnalyticsMetrics(events);
    expect(metrics.started).toBeGreaterThan(0);
    expect(metrics.completed).toBeGreaterThan(0);
    expect(metrics.completionRate).toBeLessThanOrEqual(100);
    expect(metrics.abandonmentRate).toBeLessThanOrEqual(100);
    expect(metrics.dailyTrend.length).toBeGreaterThan(0);
    expect(metrics.topTypes.length).toBeGreaterThan(0);
  });

  it("primjenjuje filtre bez mijenjanja izvora", () => {
    const filtered = filterAnalyticsEvents(events, { period: "30d", documentType: "invoice", category: "all", language: "hr", device: "all", completion: "all", exportType: "all" });
    expect(filtered.every((event) => event.document_type === "invoice" && event.language === "hr")).toBe(true);
    expect(events.length).toBeGreaterThan(filtered.length);
  });
});
