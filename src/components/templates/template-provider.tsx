"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { DocumentType } from "@/lib/document-types";
import { allTemplates, duplicateTemplate, emptyTemplateStore, resolveTemplate, TEMPLATE_STORAGE_KEY, validateTemplate } from "@/lib/templates/engine";
import type { DocumentTemplate, TemplateStore } from "@/lib/templates/types";
type Context = { ready: boolean; store: TemplateStore; templates: DocumentTemplate[]; resolve: (type: DocumentType) => DocumentTemplate; select: (type: DocumentType, id: string) => void; save: (template: DocumentTemplate) => void; duplicate: (template: DocumentTemplate) => void; remove: (id: string) => void; reset: () => void; importJson: (json: string) => void };
const TemplateContext = createContext<Context | null>(null);
export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<TemplateStore>(emptyTemplateStore);
  const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { try { setStore(JSON.parse(localStorage.getItem(TEMPLATE_STORAGE_KEY) ?? "null") ?? emptyTemplateStore()); } catch { setStore(emptyTemplateStore()); } setReady(true); }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (ready) localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(store)); }, [ready, store]);
  const save = useCallback((template: DocumentTemplate) => setStore((value) => ({ ...value, customTemplates: [...value.customTemplates.filter((item) => item.id !== template.id), { ...template, builtIn: false, updatedAt: new Date().toISOString() }] })), []);
  const value = useMemo<Context>(() => ({ ready, store, templates: allTemplates(store), resolve: (type) => resolveTemplate(store, type), select: (type, id) => setStore((current) => ({ ...current, selectedByDocument: { ...current.selectedByDocument, [type]: id } })), save, duplicate: (template) => save(duplicateTemplate(template)), remove: (id) => setStore((current) => ({ ...current, customTemplates: current.customTemplates.filter((item) => item.id !== id), selectedByDocument: Object.fromEntries(Object.entries(current.selectedByDocument).filter(([, value]) => value !== id)) })), reset: () => setStore(emptyTemplateStore()), importJson: (json) => save(validateTemplate(JSON.parse(json))) }), [ready, save, store]);
  return <TemplateContext.Provider value={value}>{children}</TemplateContext.Provider>;
}
export function useTemplateEngine() { const value = useContext(TemplateContext); if (!value) throw new Error("TemplateProvider nedostaje"); return value; }
