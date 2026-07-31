"use client";

import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WizardQuestion } from "@/lib/wizard";

export function WizardProgress({ step, total }: { step: number; total: number }) { const percent = Math.round((step / total) * 100); return <div><div className="flex items-center justify-between text-sm"><span className="font-semibold">Korak {step} od {total}</span><span className="text-muted-foreground">{percent}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total} aria-label={`Korak ${step} od ${total}`}><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500" style={{ width: `${percent}%` }} /></div></div>; }

export function WizardStep({ question, value, error, isFirst, isLast, onChange, onBack, onNext }: { question: WizardQuestion; value: string; error?: string; isFirst: boolean; isLast: boolean; onChange: (value: string) => void; onBack: () => void; onNext: () => void }) {
  const fieldId = `wizard-${question.id}`; const shared = { id: fieldId, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), placeholder: question.placeholder, "aria-invalid": Boolean(error), "aria-describedby": error ? `${fieldId}-error` : undefined };
  return <div key={question.id} className="animate-in fade-in slide-in-from-right-4 duration-300"><div className="mb-8"><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"><CheckCircle2 className="size-4" /> Jedno pitanje odjednom</span><h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{question.question}</h2><label htmlFor={fieldId} className="mt-3 block text-sm text-muted-foreground">{question.label}{question.required && " · obavezno"}</label></div>{question.type === "multiline" ? <Textarea {...shared} className="min-h-40 text-base" autoFocus /> : <Input {...shared} type={question.type ?? "text"} className="h-13 text-base" autoFocus onKeyDown={(event) => event.key === "Enter" && onNext()} />}{error && <p id={`${fieldId}-error`} role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p>}<div className="mt-8 flex items-center justify-between border-t pt-5"><Button variant="ghost" onClick={onBack} disabled={isFirst}><ArrowLeft className="size-4" /> Natrag</Button><Button onClick={onNext}>{isLast ? "Prikaži dokument" : "Nastavi"}<ArrowRight className="size-4" /></Button></div></div>;
}
