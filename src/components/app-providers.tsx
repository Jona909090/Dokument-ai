"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Moon, Search, Sun, X } from "lucide-react";

import { documentTypeDefinitions, type DocumentType } from "@/lib/document-types";

const commands: Array<{ type: DocumentType; keywords: string }> = [
  { type: "cv", keywords: "cv životopis" },
  { type: "invoice", keywords: "faktura račun" },
  { type: "offer", keywords: "ponuda predračun" },
  { type: "purchase-order", keywords: "narudžbenica" },
  { type: "contract", keywords: "ugovor" },
];

export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dokument-ai-theme");
    const enabled = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", enabled);
    const update = window.setTimeout(() => setDark(enabled), 0);
    return () => window.clearTimeout(update);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("dokument-ai-theme", next ? "dark" : "light");
  }

  const filtered = commands.filter(({ type, keywords }) => `${documentTypeDefinitions[type].label} ${keywords}`.toLocaleLowerCase("hr").includes(query.toLocaleLowerCase("hr")));

  return <>
    {children}
    <button type="button" onClick={toggleTheme} className="fixed bottom-5 right-5 z-50 flex size-11 items-center justify-center rounded-full border bg-background text-foreground shadow-lg transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2" aria-label={dark ? "Uključi svijetli način" : "Uključi tamni način"}>
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
    {paletteOpen && <div className="fixed inset-0 z-[100] bg-slate-950/55 p-4 pt-[12vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Command Palette" onMouseDown={(event) => event.target === event.currentTarget && setPaletteOpen(false)}>
      <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border bg-background shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 border-b px-5"><Search className="size-5 text-muted-foreground" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pretražite dokumente ili akcije…" className="h-16 min-w-0 flex-1 bg-transparent text-base outline-none" aria-label="Pretraži naredbe" /><kbd className="rounded-md border bg-muted px-2 py-1 text-xs">ESC</kbd><button onClick={() => setPaletteOpen(false)} aria-label="Zatvori"><X className="size-4" /></button></div>
        <div className="max-h-80 overflow-y-auto p-2">{filtered.map(({ type }) => <button key={type} onClick={() => { setPaletteOpen(false); setQuery(""); router.push(`/generator?type=${type}`); }} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-muted focus:bg-muted focus:outline-none"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600"><FileText className="size-5" /></span><span><span className="block font-medium">{documentTypeDefinitions[type].label}</span><span className="text-xs text-muted-foreground">Otvori novi obrazac</span></span></button>)}{!filtered.length && <p className="p-8 text-center text-sm text-muted-foreground">Nema rezultata.</p>}</div>
        <div className="border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">↑↓ navigacija · Enter odabir · Ctrl K otvaranje</div>
      </div>
    </div>}
  </>;
}
