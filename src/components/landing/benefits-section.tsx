import { Cloud, FileOutput, Languages, MonitorSmartphone, Palette, Zap } from "lucide-react";

const benefits = [
  { title: "Brza izrada", description: "Kraći put od zahteva do prve verzije dokumenta.", icon: Zap },
  { title: "Profesionalan izgled", description: "Dosledna struktura i uredno oblikovan sadržaj.", icon: Palette },
  { title: "Više jezika", description: "Priprema sadržaja za različita tržišta i sagovornike.", icon: Languages },
  { title: "PDF i Word izvoz", description: "Preuzimanje u formatima pogodnim za deljenje i uređivanje.", icon: FileOutput },
  { title: "Čuvanje dokumenata", description: "Organizovan pristup prethodno kreiranim dokumentima.", icon: Cloud },
  { title: "Pristup sa telefona i računara", description: "Udoban rad na uređaju koji vam je trenutno dostupan.", icon: MonitorSmartphone },
];

export function BenefitsSection() {
  return (
    <section className="bg-blue-50/60 py-22 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">Planirane mogućnosti</span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Sve što će vam trebati na jednom mestu</h2>
          <p className="mt-4 text-lg leading-7 text-slate-600">Ove mogućnosti predstavljaju plan razvoja proizvoda i još nisu dostupne u trenutnoj fazi.</p>
        </div>
        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article key={benefit.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm"><Icon className="size-5" aria-hidden="true" /></span>
                <div><h3 className="font-semibold text-slate-950">{benefit.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{benefit.description}</p></div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
