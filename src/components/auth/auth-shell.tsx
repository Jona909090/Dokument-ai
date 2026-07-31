import Link from "next/link";
import { FileText } from "lucide-react";

export function AuthShell({ title, description, message, children }: { title: string; description: string; message?: string; children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12"><section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9"><Link href="/" className="flex items-center gap-2 font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white"><FileText className="size-5" /></span>Dokument AI</Link><h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>{message && <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">{message}</div>}<div className="mt-7">{children}</div></section></main>;
}
