import { documentTypes } from "../document-types";
import { categoryForDocument } from "./service";
import type { AnalyticsEvent, AnalyticsEventName, DeviceType } from "./types";

const devices: DeviceType[] = ["desktop", "mobile", "desktop", "tablet"];

export function createDemoAnalyticsEvents(): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  for (let day = 0; day < 120; day += 1) {
    const date = new Date(Date.UTC(2026, 6, 31 - day, 10));
    const volume = 3 + ((day * 7) % 8);
    for (let session = 0; session < volume; session += 1) {
      const documentType = documentTypes[(day + session * 3) % documentTypes.length];
      const category = categoryForDocument(documentType); const sessionKey = `session-${day}-${session}`;
      const base = { anonymous_session_id: sessionKey, document_type: documentType, document_category: category, template_id: `template-${documentType}`, language: (day + session) % 5 === 0 ? "en" as const : "hr" as const, device_type: devices[(day + session) % devices.length], total_steps: 6, created_at: date.toISOString() };
      const add = (eventName: AnalyticsEventName, suffix: string, extra: Partial<AnalyticsEvent> = {}) => events.push({ ...base, event_id: `demo-${day}-${session}-${suffix}`, event_name: eventName, ...extra });
      add("template_selected", "template"); add("document_type_viewed", "viewed"); add("document_started", "started");
      const completedSteps = (day + session) % 5 === 0 ? 2 + (session % 4) : 6;
      for (let step = 1; step <= completedSteps; step += 1) add("wizard_step_completed", `step-${step}`, { current_step: step });
      if (completedSteps === 6) {
        const duration = 95 + ((day * 13 + session * 17) % 420); add("document_completed", "completed", { current_step: 6, duration_seconds: duration });
        if ((day + session) % 2 === 0) add("document_exported_pdf", "pdf");
        if ((day + session) % 3 === 0) add("document_exported_docx", "docx");
      } else add("document_abandoned", "abandoned", { current_step: completedSteps, duration_seconds: 35 + session * 11 });
    }
  }
  return events;
}
