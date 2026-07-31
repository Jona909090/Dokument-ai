import { CircleCheckBig, Download, MessageSquareText } from "lucide-react";

const steps = [
  { title: "Opišite dokument.", description: "Napišite kratko šta želite da pripremite i kome je dokument namenjen.", icon: MessageSquareText },
  { title: "Unesite potrebne podatke.", description: "Dopunite važne detalje kroz jednostavna i jasno postavljena pitanja.", icon: CircleCheckBig },
  { title: "Pregledajte i preuzmite dokument.", description: "Proverite sadržaj, unesite završne izmene i odaberite format.", icon: Download },
];

export function HowItWorks() {
  return (
    <section id="kako-funkcionise" className="scroll-mt-24 bg-slate-950 py-22 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">Jednostavan proces</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Kako funkcioniše</h2>
          <p className="mt-4 text-lg leading-7 text-slate-400">Od kratkog opisa do spremnog dokumenta u tri jasna koraka.</p>
        </div>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-blue-600"><Icon className="size-5" aria-hidden="true" /></span>
                  <span className="text-5xl font-semibold text-white/50">0{index + 1}</span>
                </div>
                <h3 className="mt-7 text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
