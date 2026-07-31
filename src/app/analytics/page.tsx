import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3, FileText } from "lucide-react";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const metadata: Metadata = { title: "Analytics — Dokument AI", description: "Administratorski pregled anonimnih i agregiranih događaja korištenja dokumenata." };

export default function AnalyticsPage() { return <main className="min-h-screen bg-background"><nav className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-7 lg:px-10"><Link href="/dashboard" className="flex size-10 items-center justify-center rounded-xl border hover:bg-muted" aria-label="Natrag na dashboard"><ArrowLeft className="size-4" /></Link><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FileText className="size-4" /></span><span className="font-semibold">Dokument AI</span><span className="ml-auto flex items-center gap-2 text-sm text-muted-foreground"><BarChart3 className="size-4" /> Analytics</span></div></nav><AnalyticsDashboard /></main>; }
