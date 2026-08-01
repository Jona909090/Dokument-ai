import type { Metadata } from "next";
import { SmartWizard } from "@/components/wizard/smart-wizard";
import { DocumentGenerator } from "@/components/generator/document-generator";
import { isDocumentType } from "@/lib/document-types";

export const metadata: Metadata = {
  title: "Smart Document Wizard — Dokument AI",
  description:
    "Opišite dokument i izradite ga korak po korak uz lokalnu pametnu logiku.",
};

export default async function WizardPage({
  searchParams,
}: PageProps<"/wizard">) {
  const params = await searchParams;
  const typeValue = typeof params.type === "string" ? params.type : undefined;
  const prompt = typeof params.prompt === "string" ? params.prompt : undefined;
  if (typeValue === "purchase-order" || typeValue === "offer")
    return (
      <DocumentGenerator initialType={typeValue} originalPrompt={prompt} />
    );
  return (
    <SmartWizard
      initialType={isDocumentType(typeValue) ? typeValue : null}
      initialPrompt={prompt}
    />
  );
}
