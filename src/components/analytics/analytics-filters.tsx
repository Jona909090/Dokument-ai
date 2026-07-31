"use client";

import { Filter } from "lucide-react";
import { documentTypeDefinitions } from "@/lib/document-types";
import { templateGroups } from "@/lib/wizard";
import type { AnalyticsFilter } from "@/lib/analytics/types";

const options = {
  period: [["7d", "7 dana"], ["30d", "30 dana"], ["90d", "90 dana"], ["all", "Sve vrijeme"]],
  language: [["all", "Svi jezici"], ["hr", "Hrvatski"], ["en", "Engleski"]],
  device: [["all", "Svi uređaji"], ["desktop", "Desktop"], ["tablet", "Tablet"], ["mobile", "Mobilni"]],
  completion: [["all", "Svi statusi"], ["completed", "Završeno"], ["abandoned", "Napušteno"]],
  exportType: [["all", "Svi izvozi"], ["pdf", "PDF"], ["docx", "DOCX"]],
} as const;

export function AnalyticsFilters({ value, onChange }: { value: AnalyticsFilter; onChange: (filter: AnalyticsFilter) => void }) {
  function field<K extends keyof AnalyticsFilter>(key: K, next: AnalyticsFilter[K]) { onChange({ ...value, [key]: next }); }
  const selectClass = "h-10 rounded-xl border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  return <section className="rounded-2xl border bg-card p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Filter className="size-4 text-primary" /> Filteri izvještaja</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7"><select aria-label="Vremensko razdoblje" value={value.period} onChange={(event) => field("period", event.target.value as AnalyticsFilter["period"])} className={selectClass}>{options.period.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select><select aria-label="Vrsta dokumenta" value={value.documentType} onChange={(event) => field("documentType", event.target.value as AnalyticsFilter["documentType"])} className={selectClass}><option value="all">Sve vrste</option>{Object.entries(documentTypeDefinitions).map(([id,item]) => <option key={id} value={id}>{item.label}</option>)}</select><select aria-label="Kategorija" value={value.category} onChange={(event) => field("category", event.target.value as AnalyticsFilter["category"])} className={selectClass}><option value="all">Sve kategorije</option>{templateGroups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}</select>{(["language", "device", "completion", "exportType"] as const).map((key) => <select key={key} aria-label={key} value={value[key]} onChange={(event) => field(key, event.target.value as never)} className={selectClass}>{options[key].map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select>)}</div></section>;
}
