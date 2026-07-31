import { ArrowRight, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const examples = [
  "Napravi ponudu za hidroizolaciju podruma.",
  "Treba mi profesionalni CV.",
  "Napravi fakturu.",
  "Treba mi ugovor o radu.",
  "Napravi narudžbenicu.",
];

type HeroSectionProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export function HeroSection({ value, onValueChange, onSubmit, loading }: HeroSectionProps) {
  return (
    <section id="top" className="relative scroll-mt-24 overflow-hidden pb-12 pt-18 sm:pt-24 lg:pt-28">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-200/70 via-indigo-200/60 to-cyan-100/70 blur-3xl dark:from-blue-950/60 dark:via-indigo-950/50 dark:to-cyan-950/40" />
      <div className="animate-float pointer-events-none absolute right-[8%] top-28 -z-10 size-20 rounded-3xl border border-white/40 bg-white/30 shadow-xl backdrop-blur dark:bg-white/5" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex animate-in fade-in slide-in-from-bottom-2 items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
            <Sparkles className="size-4" aria-hidden="true" />
            Pametniji način za izradu dokumenata
          </div>
          <h1 className="animate-in fade-in slide-in-from-bottom-4 text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground duration-700 sm:text-5xl lg:text-7xl lg:leading-[1.05]">
            Šta želiš <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">napraviti danas?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            Opišite šta vam treba, odgovorite na nekoliko pitanja i pripremite profesionalan dokument brzo i jednostavno.
          </p>
        </div>

        <div className="group mx-auto mt-10 max-w-3xl rounded-[2rem] border bg-card/90 p-3 shadow-[0_30px_100px_-35px_rgba(37,99,235,0.5)] backdrop-blur transition duration-500 hover:-translate-y-1 hover:shadow-[0_35px_110px_-35px_rgba(37,99,235,0.65)] sm:p-4">
          <label htmlFor="document-request" className="sr-only">Opišite dokument koji želite da napravite</label>
          <Textarea
            id="document-request"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Opišite dokument koji želite da napravite..."
            className="min-h-36 border-0 bg-muted/60 p-5 text-base shadow-none transition group-hover:bg-muted focus-visible:ring-0 sm:text-lg"
          />
          <div className="flex justify-end pt-3">
            <Button size="lg" onClick={onSubmit} disabled={loading} className="w-full transition hover:scale-[1.02] active:scale-[.98] sm:w-auto">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" aria-hidden="true" />} {loading ? "Otvaranje wizarda…" : "Pokreni Smart Wizard"}
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
          <span className="w-full pb-1 text-center text-sm text-muted-foreground sm:w-auto sm:py-2">Probajte primjer:</span>
          {examples.map((example) => (
            <button key={example} type="button" onClick={() => onValueChange(example)} className="rounded-full border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950 sm:text-sm">
              {example}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
