import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const examples = [
  "Napravi ponudu za izvođenje radova",
  "Napiši reklamaciju dobavljaču",
  "Napravi dnevni izveštaj sa gradilišta",
  "Napravi profesionalan CV",
];

type HeroSectionProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
};

export function HeroSection({ value, onValueChange, onSubmit }: HeroSectionProps) {
  return (
    <section id="top" className="relative scroll-mt-24 overflow-hidden pt-18 sm:pt-24 lg:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-96 max-w-5xl rounded-full bg-blue-100/70 blur-3xl" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            <Sparkles className="size-4" aria-hidden="true" />
            Pametniji način za izradu dokumenata
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-7xl lg:leading-[1.05]">
            Napravite profesionalan dokument za nekoliko minuta.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">
            Opišite šta vam treba, odgovorite na nekoliko pitanja i pripremite profesionalan dokument brzo i jednostavno.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.3)] sm:p-4">
          <label htmlFor="document-request" className="sr-only">Opišite dokument koji želite da napravite</label>
          <Textarea
            id="document-request"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Opišite dokument koji želite da napravite..."
            className="min-h-36 border-0 bg-slate-50 p-5 text-base shadow-none focus-visible:ring-0 sm:text-lg"
          />
          <div className="flex justify-end pt-3">
            <Button size="lg" onClick={onSubmit} className="w-full sm:w-auto">
              Kreiraj dokument <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
          <span className="w-full pb-1 text-center text-sm text-slate-500 sm:w-auto sm:py-2">Probajte primer:</span>
          {examples.map((example) => (
            <button key={example} type="button" onClick={() => onValueChange(example)} className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 sm:text-sm">
              {example}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
