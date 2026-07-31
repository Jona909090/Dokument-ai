import { documentTypeDefinitions } from "../document-types";
import { templateGroups } from "../wizard";
import type { AnalyticsEvent, AnalyticsFilter, AnalyticsMetrics, RankedMetric, TrendPoint } from "./types";

const categoryLabels = Object.fromEntries(templateGroups.map((group) => [group.id, group.label]));
const typeLabel = (key: string) => documentTypeDefinitions[key as keyof typeof documentTypeDefinitions]?.label ?? key;

function countBy(events: AnalyticsEvent[], key: (event: AnalyticsEvent) => string | undefined, label: (key: string) => string = (value) => value): RankedMetric[] {
  const counts = new Map<string, number>(); events.forEach((event) => { const value = key(event); if (value) counts.set(value, (counts.get(value) ?? 0) + 1); });
  return [...counts].map(([name, value]) => ({ key: name, label: label(name), value })).sort((a, b) => b.value - a.value);
}

function trend(events: AnalyticsEvent[], mode: "day" | "week" | "month"): TrendPoint[] {
  const counts = new Map<string, number>();
  events.forEach((event) => { const date = new Date(event.created_at); let key = event.created_at.slice(0, 10); if (mode === "month") key = event.created_at.slice(0, 7); if (mode === "week") { const monday = new Date(date); const weekday = (monday.getUTCDay() + 6) % 7; monday.setUTCDate(monday.getUTCDate() - weekday); key = monday.toISOString().slice(0, 10); } counts.set(key, (counts.get(key) ?? 0) + 1); });
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).slice(mode === "day" ? -30 : mode === "week" ? -16 : -12).map(([label, value]) => ({ label, value }));
}

export function filterAnalyticsEvents(events: AnalyticsEvent[], filter: AnalyticsFilter) {
  const latest = Math.max(...events.map((event) => new Date(event.created_at).getTime()), Date.now()); const days = filter.period === "all" ? Infinity : Number.parseInt(filter.period);
  return events.filter((event) => {
    if (latest - new Date(event.created_at).getTime() > days * 86_400_000) return false;
    if (filter.documentType !== "all" && event.document_type !== filter.documentType) return false;
    if (filter.category !== "all" && event.document_category !== filter.category) return false;
    if (filter.language !== "all" && event.language !== filter.language) return false;
    if (filter.device !== "all" && event.device_type !== filter.device) return false;
    if (filter.completion === "completed" && event.event_name !== "document_completed") return false;
    if (filter.completion === "abandoned" && event.event_name !== "document_abandoned") return false;
    if (filter.exportType === "pdf" && event.event_name !== "document_exported_pdf") return false;
    if (filter.exportType === "docx" && event.event_name !== "document_exported_docx") return false;
    return true;
  });
}

export function calculateAnalyticsMetrics(events: AnalyticsEvent[]): AnalyticsMetrics {
  const named = (name: string) => events.filter((event) => event.event_name === name); const startedEvents = named("document_started"); const completedEvents = named("document_completed"); const abandonedEvents = named("document_abandoned"); const pdf = named("document_exported_pdf"); const docx = named("document_exported_docx");
  const started = startedEvents.length; const completed = completedEvents.length; const durations = completedEvents.map((event) => event.duration_seconds).filter((value): value is number => value !== undefined);
  const byTypeStarted = countBy(startedEvents, (event) => event.document_type, typeLabel); const byTypeCompleted = countBy(completedEvents, (event) => event.document_type, typeLabel); const byTypeExported = countBy([...pdf, ...docx], (event) => event.document_type, typeLabel);
  const highestAbandonment = countBy(abandonedEvents, (event) => event.document_type, typeLabel).map((item) => { const starts = byTypeStarted.find((row) => row.key === item.key)?.value ?? 1; return { ...item, value: Math.round((item.value / starts) * 100), secondary: `${item.value} odustajanja` }; }).sort((a, b) => b.value - a.value);
  const midpoint = events.length ? Math.max(...events.map((event) => new Date(event.created_at).getTime())) - 30 * 86_400_000 : 0; const recent = events.filter((event) => new Date(event.created_at).getTime() >= midpoint); const previous = events.filter((event) => { const time = new Date(event.created_at).getTime(); return time < midpoint && time >= midpoint - 30 * 86_400_000; });
  const fastestGrowing = countBy(recent, (event) => event.document_type, typeLabel).map((item) => { const before = countBy(previous, (event) => event.document_type).find((row) => row.key === item.key)?.value ?? 1; return { ...item, value: Math.round(((item.value - before) / before) * 100), secondary: "rast prema prethodnom razdoblju" }; }).sort((a, b) => b.value - a.value);
  return { started, completed, pdfExports: pdf.length, docxExports: docx.length, completionRate: started ? Math.round((completed / started) * 100) : 0, abandonmentRate: started ? Math.round((abandonedEvents.length / started) * 100) : 0, averageDurationSeconds: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0, topTypes: countBy(events, (event) => event.document_type, typeLabel).slice(0, 6), topCategories: countBy(events, (event) => event.document_category, (key) => categoryLabels[key] ?? key).slice(0, 6), topTemplates: countBy(events, (event) => event.template_id).slice(0, 6), byLanguage: countBy(events, (event) => event.language, (key) => key.toUpperCase()), byDevice: countBy(events, (event) => event.device_type), dailyTrend: trend(events, "day"), weeklyTrend: trend(events, "week"), monthlyTrend: trend(events, "month"), mostStarted: byTypeStarted.slice(0, 5), mostCompleted: byTypeCompleted.slice(0, 5), mostExported: byTypeExported.slice(0, 5), highestAbandonment: highestAbandonment.slice(0, 5), fastestGrowing: fastestGrowing.slice(0, 5) };
}
