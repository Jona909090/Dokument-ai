"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

import { BenefitsSection } from "@/components/landing/benefits-section";
import { CtaSection } from "@/components/landing/cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PopularDocuments } from "@/components/landing/popular-documents";
import { detectDocumentType } from "@/lib/document-types";

export function LandingPage() {
  const router = useRouter();
  const [request, setRequest] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const toastTimer = useRef<number | null>(null);

  function selectDocument(prompt: string) {
    setRequest(prompt);
    document.querySelector("#document-request")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => document.querySelector<HTMLTextAreaElement>("#document-request")?.focus(), 500);
  }

  function showMessage(message: string) {
    setToastMessage(message);
    setShowToast(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setShowToast(false), 4500);
  }

  function startGenerator() {
    const type = detectDocumentType(request);
    if (!type) {
      showMessage("Nismo prepoznali vrstu dokumenta. Pokušajte navesti CV, fakturu, ponudu, ugovor, zahtjev, otkaz, narudžbenicu, zapisnik, potvrdu ili poslovno pismo.");
      return;
    }
    setLoading(true);
    router.push(`/wizard?type=${type}&prompt=${encodeURIComponent(request.trim())}`);
  }

  return (
    <>
      <HeroSection value={request} onValueChange={setRequest} onSubmit={startGenerator} loading={loading} />
      <PopularDocuments onSelect={selectDocument} />
      <HowItWorks />
      <BenefitsSection />
      <CtaSection />
      {showToast && (
        <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-5 z-[70] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4 text-sm text-slate-700 shadow-2xl">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden="true" />
          <p className="flex-1 font-medium leading-5">{toastMessage}</p>
          <button type="button" onClick={() => setShowToast(false)} className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Zatvori obaveštenje"><X className="size-4" /></button>
        </div>
      )}
    </>
  );
}
