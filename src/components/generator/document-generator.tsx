"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileCheck2,
  Redo2,
  Search,
  ShieldCheck,
  Undo2,
} from "lucide-react";

import { CategoryForm } from "@/components/generator/category-form";
import { InvoiceForm } from "@/components/generator/invoice-form";
import { PurchaseOrderForm } from "@/components/generator/purchase-order-form";
import { QuotationForm } from "@/components/generator/quotation-form";
import { DocumentPreview } from "@/components/generator/document-preview";
import { InlineA4Preview } from "@/components/generator/inline-a4-preview";
import { Button } from "@/components/ui/button";
import {
  documentTypeDefinitions,
  documentTypes,
  type DocumentType,
} from "@/lib/document-types";
import type {
  DocumentLocale,
  GeneratedDocument,
} from "@/lib/generated-document";
import { saveEditorDraft } from "@/lib/data/draft-service";
import { cn } from "@/lib/utils";

type DocumentGeneratorProps = {
  initialType: DocumentType;
  originalPrompt?: string;
};

function emptyDocument(
  type: DocumentType,
  locale: DocumentLocale,
): GeneratedDocument {
  return {
    type,
    title: documentTypeDefinitions[type].label,
    locale,
    fields: [],
  };
}

export function DocumentGenerator({
  initialType,
  originalPrompt,
}: DocumentGeneratorProps) {
  const router = useRouter();
  const history = useRef<GeneratedDocument[]>([]);
  const historyIndex = useRef(-1);
  const autosaveTimer = useRef<number | null>(null);
  const [type, setType] = useState(initialType);
  const [locale, setLocale] = useState<DocumentLocale>("hr");
  const [search, setSearch] = useState("");
  const [liveDocument, setLiveDocument] = useState<GeneratedDocument>(() =>
    emptyDocument(initialType, "hr"),
  );
  const [modal, setModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [, forceHistoryRender] = useState(0);
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  });
  const visibleTypes = useMemo(
    () =>
      documentTypes.filter((item) =>
        documentTypeDefinitions[item].label
          .toLocaleLowerCase("hr")
          .includes(search.toLocaleLowerCase("hr")),
      ),
    [search],
  );

  const updateLive = useCallback((next: GeneratedDocument) => {
    setLiveDocument(next);
    history.current = [
      ...history.current.slice(0, historyIndex.current + 1),
      next,
    ].slice(-60);
    historyIndex.current = history.current.length - 1;
    forceHistoryRender((value) => value + 1);
    setHistoryState({ canUndo: historyIndex.current > 0, canRedo: false });
    setSaved(false);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      saveEditorDraft(next);
      setSaved(true);
    }, 800);
  }, []);

  function changeType(nextType: DocumentType) {
    setType(nextType);
    setLiveDocument(emptyDocument(nextType, locale));
    router.replace(`/generator?type=${nextType}`, { scroll: false });
  }
  function moveHistory(direction: -1 | 1) {
    const next = historyIndex.current + direction;
    if (next < 0 || next >= history.current.length) return;
    historyIndex.current = next;
    setLiveDocument(history.current[next]);
    setHistoryState({
      canUndo: next > 0,
      canRedo: next < history.current.length - 1,
    });
    forceHistoryRender((value) => value + 1);
  }
  useEffect(() => {
    function shortcuts(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveEditorDraft(liveDocument);
        setSaved(true);
      }
      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        moveHistory(1);
      } else if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        moveHistory(1);
      }
    }
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [liveDocument]);

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex size-10 items-center justify-center rounded-xl border hover:bg-muted"
            aria-label="Natrag"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-4 text-primary" />
              <h1 className="truncate font-semibold">
                {documentTypeDefinitions[type].label}
              </h1>
            </div>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Profesionalni editor dokumenata
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              {saved ? (
                <>
                  <Check className="size-3.5 text-emerald-500" /> Skica
                  spremljena
                </>
              ) : (
                "Spremanje…"
              )}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => moveHistory(-1)}
              disabled={!historyState.canUndo}
              aria-label="Poništi"
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => moveHistory(1)}
              disabled={!historyState.canRedo}
              aria-label="Ponovi"
            >
              <Redo2 className="size-4" />
            </Button>
            <div className="ml-2 inline-flex rounded-xl border bg-muted p-1">
              <button
                onClick={() => setLocale("hr")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold",
                  locale === "hr" && "bg-card shadow-sm",
                )}
              >
                HR
              </button>
              <button
                onClick={() => setLocale("en")}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold",
                  locale === "en" && "bg-card shadow-sm",
                )}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[230px_minmax(480px,1fr)_minmax(330px,430px)]">
        <aside className="border-b bg-card p-4 lg:border-b-0 lg:border-r">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pretraži dokumente"
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Kategorije
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
            {visibleTypes.map((item) => (
              <button
                key={item}
                onClick={() => changeType(item)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-left text-sm font-medium transition hover:translate-x-0.5 hover:bg-muted",
                  type === item &&
                    "bg-primary text-primary-foreground shadow-md hover:bg-primary",
                )}
              >
                {documentTypeDefinitions[item].label}
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-muted p-4">
            <ShieldCheck className="size-5 text-emerald-500" />
            <p className="mt-3 text-sm font-medium">Lokalni autosave</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Vaša skica automatski ostaje u ovom pregledniku.
            </p>
          </div>
        </aside>
        <section className="min-w-0 border-b p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <p className="text-sm font-semibold text-primary">
                Sadržaj dokumenta
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                {documentTypeDefinitions[type].label}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {documentTypeDefinitions[type].description}
              </p>
              {originalPrompt && (
                <p className="mt-3 rounded-xl bg-primary/10 p-3 text-sm">
                  “{originalPrompt}”
                </p>
              )}
            </div>
            <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
              {type === "invoice" ? (
                <InvoiceForm
                  key={type}
                  locale={locale}
                  onPreview={() => setModal(true)}
                  onLiveChange={updateLive}
                />
              ) : type === "offer" ? (
                <QuotationForm
                  key={type}
                  locale={locale}
                  onPreview={() => setModal(true)}
                  onLiveChange={updateLive}
                />
              ) : type === "purchase-order" ? (
                <PurchaseOrderForm
                  key={type}
                  locale={locale}
                  onPreview={() => setModal(true)}
                  onLiveChange={updateLive}
                />
              ) : (
                <CategoryForm
                  key={type}
                  type={type}
                  locale={locale}
                  onPreview={() => setModal(true)}
                  onLiveChange={updateLive}
                />
              )}
            </div>
          </div>
        </section>
        <aside className="bg-muted/40 p-4 sm:p-6">
          <InlineA4Preview
            document={liveDocument}
            onExpand={() => setModal(true)}
          />
        </aside>
      </div>
      {modal && (
        <DocumentPreview
          document={liveDocument}
          onClose={() => setModal(false)}
        />
      )}
    </main>
  );
}
