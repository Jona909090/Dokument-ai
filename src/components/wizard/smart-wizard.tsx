"use client";

import { useEffect, useMemo, useState } from "react";
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

export function SmartWizard({
  initialType,
  initialPrompt,
}: {
  initialType: DocumentType | null;
  initialPrompt?: string;
}) {
  const [type, setType] = useState<DocumentType | null>(initialType);
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [complete, setComplete] = useState(false);
  const [saved, setSaved] = useState(false);
  const questions = type ? wizardQuestions[type] : [];
  const question = questions[step];
  const document = useMemo(
    () => (type ? buildWizardDocument(type, answers) : null),
    [answers, type],
  );

  useEffect(() => {
    if (!type || !Object.keys(answers).length) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem(
        `dokument-ai-wizard-${type}`,
        JSON.stringify({ prompt, answers, step }),
      );
      setSaved(true);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [answers, prompt, step, type]);
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
    window.history.pushState(
      null,
      "",
      `/wizard?type=${nextType}&prompt=${encodeURIComponent(nextPrompt)}`,
    );
  }
  function reset() {
    setType(null);
    setStep(0);
    setAnswers({});
    setComplete(false);
    setError("");
    window.history.pushState(null, "", "/wizard");
  }
  function next() {
    if (!question) return;
    if (question.required && !answers[question.id]?.trim()) {
      setError(
        `${question.label} je obavezno polje. Unesite podatak prije nastavka.`,
      );
      return;
    }
    setError("");
    if (step === questions.length - 1) {
      setComplete(true);
      setPreviewOpen(true);
    } else setStep((value) => value + 1);
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
              Lokalna logika · bez AI API-ja
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
                  </div>
                </div>
              ) : (
                <WizardStep
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
                />
              )}
            </div>
            <p className="mt-5 text-center text-xs text-muted-foreground">
              Odgovori se lokalno spremaju u vaš preglednik. Ne šalju se
              vanjskim servisima.
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
