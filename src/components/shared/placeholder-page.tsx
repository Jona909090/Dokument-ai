import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

type PlaceholderPageProps = { title: string; description: string };

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-16">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-12">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Construction className="size-6" aria-hidden="true" /></span>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-600">U pripremi</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-4 leading-7 text-slate-600">{description}</p>
        <Link href="/" className={`${buttonVariants({ variant: "outline" })} mt-8`}><ArrowLeft className="size-4" aria-hidden="true" /> Nazad na početnu</Link>
      </section>
    </main>
  );
}
