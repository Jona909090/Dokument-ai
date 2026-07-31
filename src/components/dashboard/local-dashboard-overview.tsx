"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  Download,
  FileCheck2,
  FilePlus2,
  Files,
  Sparkles,
  Trash2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useLocalSession } from "@/components/session/local-session-provider";
import { documentTypeDefinitions } from "@/lib/document-types";
import { useRepositories } from "@/lib/data/use-local-data";

export function LocalDashboardOverview() {
  const repositories = useRepositories();
  const { user } = useLocalSession();
  const [, refresh] = useState(0);
  if (!repositories)
    return (
      <div className="space-y-5 p-8">
        <div className="skeleton h-48 rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="skeleton h-28 rounded-2xl" key={index} />
          ))}
        </div>
      </div>
    );
  const documents = repositories.documents
    .list(user.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const drafts = documents.filter((item) => item.status === "draft").length;
  const completed = documents.filter((item) =>
    ["completed", "sent", "accepted", "paid"].includes(item.status),
  ).length;
  const counts = new Map<string, number>();
  documents.forEach((item) =>
    counts.set(item.documentType, (counts.get(item.documentType) ?? 0) + 1),
  );
  const frequent = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const stats = [
    { label: "Spremljeni dokumenti", value: documents.length, Icon: Files },
    { label: "Nacrti", value: drafts, Icon: Archive },
    { label: "Završeni", value: completed, Icon: FileCheck2 },
    { label: "PDF / DOCX izvozi", value: "0 / 0", Icon: Download },
  ];
  function clearDemo() {
    if (!repositories) return;
    repositories.clearDemoData();
    refresh((value) => value + 1);
  }
  return (
    <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-2xl sm:p-10">
        <div className="absolute -right-12 -top-20 size-64 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-300">
              Free paket · lokalni demo
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Pozdrav, {user.firstName}.
            </h1>
            <p className="mt-3 max-w-xl text-slate-300">
              Svi dokumenti i poslovni podaci trenutno se čuvaju samo u ovom
              pregledniku.
            </p>
          </div>
          <Link href="/wizard" className={buttonVariants({ size: "lg" })}>
            <Sparkles className="size-4" /> Novi dokument
          </Link>
        </div>
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, Icon }) => (
          <article
            key={label}
            className="rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <span className="rounded-xl bg-primary/10 p-2 text-primary">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Posljednji dokumenti</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Nastavite uređivanje lokalno spremljenih dokumenata.
              </p>
            </div>
            <Link
              href="/documents"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Prikaži sve
            </Link>
          </div>
          {documents.length ? (
            <div className="mt-5 divide-y">
              {documents.slice(0, 5).map((document) => (
                <Link
                  key={document.id}
                  href={`/documents/${document.id}`}
                  className="flex items-center gap-4 py-4 transition hover:translate-x-1"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Files className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {document.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {documentTypeDefinitions[document.documentType].label} ·{" "}
                      {document.status}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("hr-HR", {
                      dateStyle: "medium",
                    }).format(new Date(document.updatedAt))}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed p-10 text-center">
              <FilePlus2 className="mx-auto size-8 text-primary" />
              <h3 className="mt-3 font-semibold">Nema lokalnih dokumenata</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pokrenite wizard i spremite prvi nacrt.
              </p>
            </div>
          )}
        </div>
        <aside className="space-y-5">
          <section className="rounded-3xl border bg-card p-5">
            <h2 className="font-semibold">Najčešće vrste</h2>
            <div className="mt-4 space-y-3">
              {frequent.length ? (
                frequent.map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span>
                      {
                        documentTypeDefinitions[
                          type as keyof typeof documentTypeDefinitions
                        ].label
                      }
                    </span>
                    <strong>{count}</strong>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nema podataka.</p>
              )}
            </div>
          </section>
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
            <h2 className="font-semibold text-amber-900 dark:text-amber-100">
              Demo podaci
            </h2>
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              Možete obrisati sve lokalne demo dokumente, kontakte i firmu.
            </p>
            <button
              onClick={clearDemo}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:underline"
            >
              <Trash2 className="size-4" /> Obriši demo podatke
            </button>
          </section>
        </aside>
      </section>
    </main>
  );
}
