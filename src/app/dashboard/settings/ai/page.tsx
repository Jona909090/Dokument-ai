import Link from "next/link";
import { AIPrivacySettings } from "@/components/ai/ai-privacy-settings";
export default function AISettingsPage() { return <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><Link href="/dashboard/settings" className="text-sm font-semibold text-primary">← Sve postavke</Link><h1 className="mt-4 text-3xl font-semibold">AI postavke</h1><p className="mt-2 mb-7 text-muted-foreground">Kontrolirajte podatke koje Copilot smije koristiti.</p><AIPrivacySettings /></main>; }
