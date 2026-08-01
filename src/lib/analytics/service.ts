import type { DocumentType } from "../document-types";
import type { AnalyticsAdapter, AnalyticsEvent, AnalyticsEventName, AnalyticsMetadata, DeviceType, DocumentCategory } from "./types";

const STORAGE_KEY = "dokument-ai-analytics-events";
const SESSION_KEY = "dokument-ai-anonymous-session";

const categoryByType: Record<DocumentType, DocumentCategory> = {
  cv: "hr", invoice: "finance", proforma: "finance", offer: "construction", contract: "legal", request: "administration", termination: "hr", "purchase-order": "construction", minutes: "administration", certificate: "administration", "business-letter": "administration", "daily-report": "construction", "completed-works-report": "construction", "work-handover": "construction",
};

export function categoryForDocument(type: DocumentType) { return categoryByType[type]; }

function deviceType(): DeviceType { const width = window.innerWidth; return width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop"; }
function sessionId() { let id = sessionStorage.getItem(SESSION_KEY); if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, id); } return id; }

export class LocalAnalyticsAdapter implements AnalyticsAdapter {
  track(event: AnalyticsEvent) { const events = this.readEvents(); localStorage.setItem(STORAGE_KEY, JSON.stringify([...events, event].slice(-1000))); }
  readEvents(): AnalyticsEvent[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as AnalyticsEvent[]; } catch { return []; } }
}

let adapter: AnalyticsAdapter = new LocalAnalyticsAdapter();
export function setAnalyticsAdapter(next: AnalyticsAdapter) { adapter = next; }

export function trackEvent(eventName: AnalyticsEventName, metadata: AnalyticsMetadata) {
  if (typeof window === "undefined") return;
  const event: AnalyticsEvent = {
    event_id: crypto.randomUUID(), event_name: eventName, anonymous_session_id: sessionId(),
    document_type: metadata.document_type, document_category: metadata.document_category,
    language: metadata.language, device_type: deviceType(), created_at: new Date().toISOString(),
    ...(metadata.user_id ? { user_id: metadata.user_id } : {}),
    ...(metadata.template_id ? { template_id: metadata.template_id.slice(0, 80) } : {}),
    ...(metadata.current_step !== undefined ? { current_step: metadata.current_step } : {}),
    ...(metadata.total_steps !== undefined ? { total_steps: metadata.total_steps } : {}),
    ...(metadata.duration_seconds !== undefined ? { duration_seconds: Math.max(0, Math.round(metadata.duration_seconds)) } : {}),
  };
  void adapter.track(event);
}

export function getLocalAnalyticsEvents() { return adapter.readEvents(); }

export const landingEventNames = ["hero_prompt_started", "hero_prompt_submitted", "document_suggestion_shown", "document_suggestion_selected", "quick_action_selected", "manual_document_selected", "template_showcase_opened", "landing_cta_clicked", "smart_prompt_started", "smart_prompt_submitted", "suggested_document_selected", "frequent_document_selected", "signup_clicked", "login_clicked", "pricing_opened", "free_plan_selected", "help_opened"] as const;
export type LandingEventName = (typeof landingEventNames)[number];
export function trackLandingEvent(eventName: LandingEventName, metadata: { documentType?: DocumentType; confidence?: "low" | "medium" | "high"; success?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const safeEvent = { event_id: crypto.randomUUID(), event_name: eventName, anonymous_session_id: sessionId(), document_type: metadata.documentType, document_category: metadata.documentType ? categoryForDocument(metadata.documentType) : undefined, confidence: metadata.confidence, success: metadata.success, device_type: deviceType(), created_at: new Date().toISOString() };
  try { const key = "dokument-ai-landing-events"; const current = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown[]; localStorage.setItem(key, JSON.stringify([...current, safeEvent].slice(-500))); } catch { /* Analytics must never block navigation. */ }
}
