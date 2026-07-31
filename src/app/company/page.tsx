import type { Metadata } from "next";
import { CompanyPage } from "@/components/company/company-page";
export const metadata: Metadata = { title: "Podaci firme — Dokument AI" };
export default function Page() { return <CompanyPage />; }
