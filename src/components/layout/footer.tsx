import Link from "next/link";
import { FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto] lg:px-10">
        <div className="max-w-md">
          <Link href="/#top" className="inline-flex items-center gap-2.5 text-lg font-semibold text-white">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600"><FileText className="size-5" aria-hidden="true" /></span>
            Dokument AI
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Jednostavniji put od ideje do profesionalno strukturiranog dokumenta.
          </p>
        </div>
        <nav className="flex flex-wrap content-start gap-x-7 gap-y-3 text-sm" aria-label="Pravne informacije">
          <Link href="/privacy" className="transition hover:text-white">Privatnost</Link>
          <Link href="/terms" className="transition hover:text-white">Uslovi korišćenja</Link>
          <Link href="/contact" className="transition hover:text-white">Kontakt</Link>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-5 text-xs text-slate-300 sm:px-8 lg:px-10">
          © {new Date().getFullYear()} Dokument AI. Sva prava zadržana.
        </div>
      </div>
    </footer>
  );
}
