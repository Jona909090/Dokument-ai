"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileText, RotateCcw, Sparkles } from "lucide-react";
import { DocumentPreview } from "@/components/generator/document-preview";
import { InlineA4Preview } from "@/components/generator/inline-a4-preview";
import { WizardStart } from "@/components/wizard/wizard-start";
import { WizardProgress, WizardStep } from "@/components/wizard/wizard-step";
import { Button } from "@/components/ui/button";
import {
  documentTypeDefinitions,
  type DocumentType,
} from "@/lib/document-types";
import { buildWizardDocument, wizardQuestions } from "@/lib/wizard";
import { categoryForDocument, trackEvent } from "@/lib/analytics/service";
import { useRepositories } from "@/lib/data/use-local-data";
import { useLocalSession } from "@/components/session/local-session-provider";
import type { SavedDocument } from "@/lib/data/models";
import { answersFromAIDraft, loadAIHandoff } from "@/lib/ai/handoff";

export function SmartWizard({
  initialType,
  initialPrompt,
  aiRequestId,
}: {
  initialType: DocumentType | null;
  initialPrompt?: string;
  aiRequestId?: string;
}) {
  const [type, setType] = useState<DocumentType | null>(initialType);
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [complete, setComplete] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const repositories = useRepositories();
  const { user } = useLocalSession();
  const activeRef = useRef(false);
  const completedRef = useRef(false);
  const trackedTypeRef = useRef<DocumentType | null>(initialType);
  const startedAtRef = useRef(0);
  const [aiPrepared, setAIPrepared] = useState(false);
  const questions = type ? wizardQuestions[type] : [];
  const question = questions[step];
  const document = useMemo(
    () => (type ? buildWizardDocument(type, answers) : null),
    [answers, type],
  );

  useEffect(() => {
    if (!initialType) return;
    activeRef.current = true;
    startedAtRef.current = performance.now();
    const metadata = { document_type: initialType, document_category: categoryForDocument(initialType), language: "hr" as const };
    trackEvent("document_type_viewed", metadata);
    trackEvent("document_started", metadata);
  }, [initialType]);
  useEffect(() => {
    if (!aiRequestId || !initialType) return;
    const handoff = loadAIHandoff(aiRequestId);
    if (!handoff || handoff.result.classification.documentType !== initialType) return;
    const prepared = answersFromAIDraft(handoff.result);
    const firstMissing = wizardQuestions[initialType].findIndex((item) => item.required && !prepared[item.id]?.trim());
    const timer = window.setTimeout(() => {
      setAnswers(prepared);
      setStep(firstMissing < 0 ? 0 : firstMissing);
      setAIPrepared(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [aiRequestId, initialType]);
  useEffect(() => {
    if (!repositories || !type || Object.keys(answers).length) return;
    const company = repositories.companies.getByUser(user.id);
    if (!company) return;
    const defaults: Record<string, string> = { company: company.companyName, companyTaxId: company.taxNumber };
    const timer = window.setTimeout(() => setAnswers(defaults), 0);
    return () => window.clearTimeout(timer);
  }, [answers, repositories, type, user.id]);
  useEffect(() => () => {
    const trackedType = trackedTypeRef.current;
    if (activeRef.current && !completedRef.current && trackedType) trackEvent("document_abandoned", { document_type: trackedType, document_category: categoryForDocument(trackedType), language: "hr", duration_seconds: (performance.now() - startedAtRef.current) / 1000 });
  }, []);

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape" && previewOpen) setPreviewOpen(false);
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [previewOpen]);

  function start(nextType: DocumentType, nextPrompt: string) {
    setType(nextType);
    setPrompt(nextPrompt);
    setStep(0);
    setAnswers({});
    setComplete(false);
    activeRef.current = true; completedRef.current = false; trackedTypeRef.current = nextType; startedAtRef.current = performance.now();
    const metadata = { document_type: nextType, document_category: categoryForDocument(nextType), language: "hr" as const };
    trackEvent("document_type_viewed", metadata); trackEvent("document_started", metadata);
    window.history.pushState(
      null,
      "",
      `/wizard?type=${nextType}&prompt=${encodeURIComponent(nextPrompt)}`,
    );
  }
  function reset() {
    if (activeRef.current && !completedRef.current && trackedTypeRef.current) trackEvent("document_abandoned", { document_type: trackedTypeRef.current, document_category: categoryForDocument(trackedTypeRef.current), language: "hr", duration_seconds: (performance.now() - startedAtRef.current) / 1000 });
    activeRef.current = false;
    setType(null);
    setStep(0);
    setAnswers({});
    setComplete(false);
    setError("");
    setSavedDocumentId(null);
    window.history.pushState(null, "", "/wizard");
  }
  function next() {
    if (!question || !type) return;
    if (question.required && !answers[question.id]?.trim()) {
      setError(
        `${question.label} je obavezno polje. Unesite podatak prije nastavka.`,
      );
      return;
    }
    setError("");
    trackEvent("wizard_step_completed", { document_type: type, document_category: categoryForDocument(type), language: "hr", current_step: step + 1, total_steps: questions.length, duration_seconds: (performance.now() - startedAtRef.current) / 1000 });
    if (step === questions.length - 1) {
      setComplete(true);
      completedRef.current = true; activeRef.current = false;
      trackEvent("document_completed", { document_type: type, document_category: categoryForDocument(type), language: "hr", current_step: questions.length, total_steps: questions.length, duration_seconds: (performance.now() - startedAtRef.current) / 1000 });
      setPreviewOpen(true);
    } else setStep((value) => value + 1);
  }
  function saveLocally() {
    if (!repositories || !document) return;
    const timestamp = new Date().toISOString();
    const company = repositories.companies.getByUser(user.id);
    const record: SavedDocument = { id: savedDocumentId ?? "", userId: user.id, companyId: company?.id ?? null, contactId: null, documentType: document.type, documentCategory: categoryForDocument(document.type), title: document.title, documentNumber: `LOCAL-${timestamp.slice(0,10).replaceAll("-","")}`, status: complete ? "completed" : "draft", language: document.locale, currency: "EUR", subtotal: document.totals?.subtotal ?? 0, taxAmount: document.totals?.tax ?? 0, total: document.totals?.total ?? 0, formData: {}, content: document, createdAt: timestamp, updatedAt: timestamp, lastOpenedAt: timestamp };
    const result = repositories.documents.save(record); setSavedDocumentId(result.id); setSaved(true);
    trackEvent("document_saved", { document_type: document.type, document_category: categoryForDocument(document.type), language: document.locale });
  }
  if (!type || !document)
    return <WizardStart initialPrompt={prompt} onStart={start} />;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="flex size-10 items-center justify-center rounded-xl border transition hover:bg-muted"
            aria-label="Početna"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-semibold">
              Smart Wizard · {documentTypeDefinitions[type].label}
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {aiPrepared ? "AI prijedlog · provjerite podatke" : "Pametni dokument wizard"}
            </p>
          </div>
          <span className="ml-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
            {saved && (
              <>
                <Check className="size-3.5 text-emerald-500" /> Skica spremljena
              </>
            )}
          </span>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Novi wizard</span>
          </Button>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)]">
        <section className="flex min-h-[620px] items-center border-b p-5 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="mx-auto w-full max-w-2xl">
            <WizardProgress
              step={complete ? questions.length : step + 1}
              total={questions.length}
            />
            <div className="mt-10 rounded-3xl border bg-card p-6 shadow-sm sm:p-9">
              {complete ? (
                <div className="animate-in fade-in zoom-in-95 text-center">
                  <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <Check className="size-8" />
                  </span>
                  <h2 className="mt-5 text-3xl font-semibold">
                    Dokument je spreman.
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                    Pregledajte cijeli dokument, vratite se na bilo koji korak
                    ili ga izvezite u PDF i DOCX.
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setComplete(false);
                        setStep(questions.length - 1);
                      }}
                    >
                      Uredi odgovore
                    </Button>
                    <Button onClick={() => setPreviewOpen(true)}>
                      <FileText className="size-4" /> Otvori dokument
                    </Button>
                    <Button onClick={saveLocally} variant="outline">
                      {savedDocumentId ? "Dokument spremljen" : "Spremi dokument"}
                    </Button>
                  </div>
                </div>
              ) : (
                <><WizardStep
                  question={question}
                  value={answers[question.id] ?? ""}
                  error={error}
                  isFirst={step === 0}
                  isLast={step === questions.length - 1}
                  onChange={(value) => {
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: value,
                    }));
                    setError("");
                    setSaved(false);
                  }}
                  onBack={() => setStep((value) => Math.max(0, value - 1))}
                  onNext={next}
                />{repositories && ["buyer","recipient","partyTwo","supplier"].includes(question.id) && repositories.contacts.list(user.id).length > 0 && <div className="mt-4 border-t pt-4"><label className="mb-2 block text-xs font-semibold text-muted-foreground">Odaberi iz lokalnih kontakata</label><select onChange={(event) => { const contact = repositories.contacts.get(event.target.value); if (contact) setAnswers((current) => ({...current,[question.id]:contact.companyName})); }} className="h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="">Odaberite kontakt…</option>{repositories.contacts.list(user.id).map((contact) => <option key={contact.id} value={contact.id}>{contact.companyName}</option>)}</select></div>}</>
              )}
            </div>
            <p className="mt-5 text-center text-xs text-muted-foreground">
              {aiPrepared ? "AI je pripremio samo podatke iz vašeg zahtjeva. Provjerite važna polja prije izvoza." : "Odgovori se lokalno spremaju u vaš preglednik."}
            </p>
          </div>
        </section>
        <aside className="bg-muted/40 p-4 sm:p-7">
          <InlineA4Preview
            document={document}
            onExpand={() => setPreviewOpen(true)}
          />
        </aside>
      </div>
      {previewOpen && (
        <DocumentPreview
          document={document}
          allowSave={false}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </main>
  );
}
