import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section className="py-22 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-blue-700 px-6 py-14 text-center text-white shadow-2xl shadow-blue-900/20 sm:px-12 sm:py-18">
          <div className="absolute -right-20 -top-24 size-72 rounded-full border-[48px] border-white/5" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Napravite prvi dokument potpuno besplatno.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-7 text-blue-100">Započnite jednostavno, bez komplikovanih obrazaca i dugog pisanja.</p>
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "mt-8 bg-white text-blue-700 hover:bg-blue-50")}>
              Počni odmah <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
