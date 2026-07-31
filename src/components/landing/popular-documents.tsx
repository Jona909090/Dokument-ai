import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, ClipboardList, FileChartColumn, FileText, Mail, ReceiptText, ShoppingCart, UserRound } from "lucide-react";

const documents: Array<{ name: string; description: string; prompt: string; icon: LucideIcon }> = [
  { name: "Ponuda", description: "Jasna poslovna ponuda za klijenta.", prompt: "Napravi profesionalnu ponudu za klijenta", icon: BriefcaseBusiness },
  { name: "Predračun", description: "Pregled stavki, količina i cena.", prompt: "Napravi predračun sa stavkama i cenama", icon: ReceiptText },
  { name: "Narudžbenica", description: "Uredna potvrda poslovne narudžbe.", prompt: "Napravi narudžbenicu za dobavljača", icon: ShoppingCart },
  { name: "Poslovni email", description: "Profesionalna i jasna komunikacija.", prompt: "Napiši profesionalan poslovni email", icon: Mail },
  { name: "CV", description: "Pregledno predstavljanje iskustva.", prompt: "Napravi profesionalan CV", icon: UserRound },
  { name: "Dnevni izveštaj", description: "Sažetak rada, događaja i napretka.", prompt: "Napravi dnevni izveštaj sa gradilišta", icon: FileChartColumn },
  { name: "Reklamacija", description: "Strukturisan zahtev za rešavanje problema.", prompt: "Napiši reklamaciju dobavljaču", icon: FileText },
  { name: "Zapisnik", description: "Važne odluke i zaključci sastanka.", prompt: "Napravi zapisnik sa poslovnog sastanka", icon: ClipboardList },
];

type PopularDocumentsProps = { onSelect: (prompt: string) => void };

export function PopularDocuments({ onSelect }: PopularDocumentsProps) {
  return (
    <section id="dokumenti" className="scroll-mt-24 py-22 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Najčešći izbori</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Popularni dokumenti</h2>
          <p className="mt-4 text-lg leading-7 text-slate-600">Izaberite vrstu dokumenta i odmah ćemo pripremiti polazni zahtev.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {documents.map((document) => {
            const Icon = document.icon;
            return (
              <button key={document.name} type="button" onClick={() => onSelect(document.prompt)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white"><Icon className="size-5" aria-hidden="true" /></span>
                <h3 className="mt-5 font-semibold text-slate-950">{document.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{document.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
