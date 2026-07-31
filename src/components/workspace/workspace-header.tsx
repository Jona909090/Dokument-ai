"use client";

import Link from "next/link";
import { Building2, ContactRound, FileText, Files, LayoutDashboard, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkspaceHeader({ title }: { title: string }) { return <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl"><div className="mx-auto flex min-h-16 max-w-[1500px] flex-wrap items-center gap-2 px-4 py-3 sm:px-7"><Link href="/dashboard" className="mr-3 flex items-center gap-2 font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FileText className="size-4" /></span>Dokument AI</Link><nav className="flex flex-1 flex-wrap items-center gap-1 text-sm"><Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-muted"><LayoutDashboard className="mr-1 inline size-4" /> Dashboard</Link><Link href="/documents" className="rounded-lg px-3 py-2 hover:bg-muted"><Files className="mr-1 inline size-4" /> Dokumenti</Link><Link href="/company" className="rounded-lg px-3 py-2 hover:bg-muted"><Building2 className="mr-1 inline size-4" /> Firma</Link><Link href="/contacts" className="rounded-lg px-3 py-2 hover:bg-muted"><ContactRound className="mr-1 inline size-4" /> Kontakti</Link></nav><span className="hidden text-sm font-medium text-muted-foreground lg:block">{title}</span><Link href="/wizard" className={cn(buttonVariants({ size: "sm" }), "ml-auto")}><Sparkles className="size-4" /> Novi dokument</Link></div></header>; }
