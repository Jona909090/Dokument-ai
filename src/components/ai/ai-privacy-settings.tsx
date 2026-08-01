"use client";

import { useEffect, useState } from "react";

const options = [
  ["enabled", "AI uključen"],
  ["company", "Dopusti podatke firme"],
  ["contact", "Dopusti podatke kontakta"],
  ["document", "Dopusti sadržaj aktivnog dokumenta"],
  ["preferences", "Dopusti prethodne preferencije"],
] as const;

export function AIPrivacySettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>({ enabled: true, company: false, contact: false, document: false, preferences: false });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = JSON.parse(localStorage.getItem("dokument-ai-ai-settings") || "null"); if (saved) setSettings(saved); } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  function update(key: string, value: boolean) { const next = { ...settings, [key]: value }; setSettings(next); localStorage.setItem("dokument-ai-ai-settings", JSON.stringify(next)); }
  return <section className="rounded-3xl border bg-card p-6"><h2 className="font-semibold">AI i privatnost</h2><p className="mt-2 text-sm text-muted-foreground">Dopuštenja su isključena po načelu najmanjeg potrebnog konteksta. Promjene se pamte lokalno.</p><div className="mt-4 space-y-2">{options.map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-xl bg-muted p-4 text-sm"><span>{label}</span><input type="checkbox" checked={settings[key]} onChange={(event) => update(key, event.target.checked)} className="size-4 accent-blue-600" /></label>)}</div><p className="mt-4 text-xs text-muted-foreground">AI ne šalje, objavljuje, zaključava niti briše dokumente. Financijske i pravne izmjene uvijek zahtijevaju potvrdu.</p></section>;
}
