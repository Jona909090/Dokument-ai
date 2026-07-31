import type { DocumentType } from "../document-types";
import type { TemplateGroup } from "../wizard";

export const analyticsEventNames = ["document_type_viewed", "document_started", "document_completed", "document_saved", "document_exported_pdf", "document_exported_docx", "document_abandoned", "template_selected", "category_selected", "wizard_step_completed"] as const;
export type AnalyticsEventName = (typeof analyticsEventNames)[number];
export type DeviceType = "desktop" | "tablet" | "mobile";
export type AnalyticsLanguage = "hr" | "en";
export type DocumentCategory = TemplateGroup;

export type AnalyticsMetadata = {
  user_id?: string;
  document_type: DocumentType;
  document_category: DocumentCategory;
  template_id?: string;
  language: AnalyticsLanguage;
  current_step?: number;
  total_steps?: number;
  duration_seconds?: number;
};

export type AnalyticsEvent = AnalyticsMetadata & {
  event_id: string;
  event_name: AnalyticsEventName;
  anonymous_session_id: string;
  device_type: DeviceType;
  created_at: string;
};

export type AnalyticsFilter = {
  period: "7d" | "30d" | "90d" | "all";
  documentType: "all" | DocumentType;
  category: "all" | DocumentCategory;
  language: "all" | AnalyticsLanguage;
  device: "all" | DeviceType;
  completion: "all" | "completed" | "abandoned";
  exportType: "all" | "pdf" | "docx";
};

export type RankedMetric = { key: string; label: string; value: number; secondary?: string };
export type TrendPoint = { label: string; value: number };
export type AnalyticsMetrics = {
  started: number; completed: number; pdfExports: number; docxExports: number;
  completionRate: number; abandonmentRate: number; averageDurationSeconds: number;
  topTypes: RankedMetric[]; topCategories: RankedMetric[]; topTemplates: RankedMetric[];
  byLanguage: RankedMetric[]; byDevice: RankedMetric[];
  dailyTrend: TrendPoint[]; weeklyTrend: TrendPoint[]; monthlyTrend: TrendPoint[];
  mostStarted: RankedMetric[]; mostCompleted: RankedMetric[]; mostExported: RankedMetric[];
  highestAbandonment: RankedMetric[]; fastestGrowing: RankedMetric[];
};

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent): void | Promise<void>;
  readEvents(): AnalyticsEvent[] | Promise<AnalyticsEvent[]>;
}
