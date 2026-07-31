import type { Metadata } from "next";

import { DocumentGenerator } from "@/components/generator/document-generator";
import { isDocumentType } from "@/lib/document-types";

export const metadata: Metadata = {
  title: "Generator dokumenta — Dokument AI",
  description: "Unesite podatke potrebne za pripremu profesionalnog dokumenta.",
};

export default async function GeneratorPage({ searchParams }: PageProps<"/generator">) {
  const params = await searchParams;
  const typeValue = typeof params.type === "string" ? params.type : undefined;
  const promptValue = typeof params.prompt === "string" ? params.prompt : undefined;

  return <DocumentGenerator initialType={isDocumentType(typeValue) ? typeValue : "cv"} originalPrompt={promptValue} />;
}
