"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Menu, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Početna", href: "/#top" },
  { label: "Dokumenti", href: "/#dokumenti" },
  { label: "Šabloni", href: "/templates" },
  { label: "Cene", href: "/pricing" },
  { label: "Kako funkcioniše", href: "/#kako-funkcionise" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link
          href="/#top"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
          onClick={() => setIsOpen(false)}
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg">Dokument AI</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Glavna navigacija">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-2")}>Demo dashboard</Link>
          <Link href="/wizard" className={cn(buttonVariants({ size: "sm" }), "ml-1")}>Novi dokument</Link>
        </nav>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted lg:hidden"
          aria-label={isOpen ? "Zatvori meni" : "Otvori meni"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {isOpen && (
        <nav id="mobile-navigation" className="border-t bg-background px-5 py-5 lg:hidden" aria-label="Mobilna navigacija">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigation.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setIsOpen(false)} className="rounded-xl px-4 py-3 font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-4">
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className={buttonVariants({ variant: "outline" })}>Demo dashboard</Link>
              <Link href="/wizard" onClick={() => setIsOpen(false)} className={buttonVariants()}>Novi dokument</Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
