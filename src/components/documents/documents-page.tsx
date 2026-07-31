"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Copy,
  Download,
  FileText,
  Search,
  Trash2,
} from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalSession } from "@/components/session/local-session-provider";
import { useRepositories } from "@/lib/data/use-local-data";
import { documentTypeDefinitions } from "@/lib/document-types";
import { downloadDocx, downloadPdf } from "@/lib/document-export";
import { categoryForDocument, trackEvent } from "@/lib/analytics/service";
import type { DocumentStatus } from "@/lib/data/models";
import { filterAndSortDocuments } from "@/lib/data/document-helpers";

type Sort = "newest" | "oldest" | "title" | "amount";
export function DocumentsPage() {
  const repositories = useRepositories();
  const { user } = useLocalSession();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState<"all" | DocumentStatus>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [version, refresh] = useState(0);
  const documents = useMemo(() => {
    void version;
    if (!repositories) return [];
    return filterAndSortDocuments(repositories.documents.list(user.id), { query, type, status, sort });
  }, [query, repositories, sort, status, type, user.id, version]);
  if (!repositories)
    return (
      <>
        <WorkspaceHeader title="Moji dokumenti" />
        <div className="skeleton mx-auto mt-10 h-96 max-w-6xl rounded-3xl" />
      </>
    );
  async function exportFile(id: string, format: "pdf" | "docx") {
    const item = repositories!.documents.get(id);
    if (!item) return;
    if (format === "pdf") await downloadPdf(item.content);
    else await downloadDocx(item.content);
    trackEvent(
      format === "pdf" ? "document_exported_pdf" : "document_exported_docx",
      {
        document_type: item.documentType,
        document_category: categoryForDocument(item.documentType),
        language: item.language,
      },
    );
  }
  const statusOptions: DocumentStatus[] = [
    "draft",
    "completed",
    "sent",
    "accepted",
    "rejected",
    "paid",
    "archived",
  ];
  return (
    <>
      <WorkspaceHeader title="Moji dokumenti" />
      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-7">
        <div>
          <p className="text-sm font-semibold text-primary">
            Lokalni repository
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Moji dokumenti</h1>
          <p className="mt-2 text-muted-foreground">
            Otvorite, uredite, duplicirajte ili izvezite dokumente spremljene u
            ovom pregledniku.
          </p>
        </div>
        <section className="mt-7 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-[1fr_190px_170px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pretraži naziv ili broj…"
              className="pl-9"
            />
          </div>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="all">Sve vrste</option>
            {Object.entries(documentTypeDefinitions).map(([id, item]) => (
              <option key={id} value={id}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="all">Svi statusi</option>
            {statusOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="newest">Najnovije</option>
            <option value="oldest">Najstarije</option>
            <option value="title">Po nazivu</option>
            <option value="amount">Po iznosu</option>
          </select>
        </section>
        {documents.length ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
                <tr>
                  {[
                    "Dokument",
                    "Vrsta / broj",
                    "Datum",
                    "Status",
                    "Klijent",
                    "Iznos",
                    "Posljednja izmjena",
                    "Akcije",
                  ].map((label) => (
                    <th key={label} className="px-4 py-3">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((item) => {
                  const contact = item.contactId
                    ? repositories.contacts.get(item.contactId)
                    : null;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-4 font-medium">{item.title}</td>
                      <td className="px-4">
                        <span className="block">
                          {documentTypeDefinitions[item.documentType].label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.documentNumber}
                        </span>
                      </td>
                      <td className="px-4">
                        {new Intl.DateTimeFormat("hr-HR").format(
                          new Date(item.createdAt),
                        )}
                      </td>
                      <td className="px-4">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4">{contact?.companyName || "—"}</td>
                      <td className="px-4 font-medium">
                        {item.total
                          ? new Intl.NumberFormat("hr-HR", {
                              style: "currency",
                              currency: item.currency,
                            }).format(item.total)
                          : "—"}
                      </td>
                      <td className="px-4 text-muted-foreground">
                        {new Intl.DateTimeFormat("hr-HR", {
                          dateStyle: "medium",
                        }).format(new Date(item.updatedAt))}
                      </td>
                      <td className="px-4">
                        <div className="flex gap-1">
                          <Link
                            href={`/documents/${item.id}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                            })}
                          >
                            Otvori
                          </Link>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              repositories.documents.duplicate(item.id);
                              refresh((v) => v + 1);
                            }}
                            aria-label="Dupliciraj"
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              repositories.documents.archive(item.id);
                              refresh((v) => v + 1);
                            }}
                            aria-label="Arhiviraj"
                          >
                            <Archive className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => exportFile(item.id, "pdf")}
                            aria-label="Preuzmi PDF"
                          >
                            <Download className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => exportFile(item.id, "docx")}
                            aria-label="Preuzmi DOCX"
                          >
                            <FileText className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              repositories.documents.delete(item.id);
                              refresh((v) => v + 1);
                            }}
                            aria-label="Obriši"
                          >
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-7 rounded-3xl border border-dashed p-14 text-center">
            <FileText className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 font-semibold">Nema pronađenih dokumenata</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Promijenite filtre ili kreirajte novi dokument.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
