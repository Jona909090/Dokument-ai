"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CircleHelp, FilePlus2, FileText, Info, LayoutDashboard, LogOut, Menu, Search, Settings, Star, UserRound, X } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Pregled", icon: LayoutDashboard },
  { href: "/dashboard?view=favorites", label: "Omiljeni", icon: Star },
  { href: "/dashboard/settings", label: "Postavke", icon: Settings },
  { href: "/dashboard/help", label: "Centar za pomoć", icon: CircleHelp },
  { href: "/dashboard/about", label: "O aplikaciji", icon: Info },
];

export function DashboardNav({ email }: { email: string }) {
  const pathname = usePathname(); const router = useRouter();
  const [open, setOpen] = useState(false); const [notifications, setNotifications] = useState(false);
  function submitSearch(formData: FormData) { router.push(`/dashboard?q=${encodeURIComponent(String(formData.get("q") ?? ""))}`); }
  const sidebar = <div className="flex h-full flex-col bg-card p-4 text-card-foreground">
    <div className="flex h-14 items-center justify-between px-2"><Link href="/dashboard" className="flex items-center gap-2.5 font-semibold"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FileText className="size-5" /></span><span>Dokument AI</span></Link><button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Zatvori navigaciju"><X /></button></div>
    <Link href="/generator" className={cn(buttonVariants(), "mt-5 justify-start")}><FilePlus2 className="size-4" /> Novi dokument</Link>
    <nav className="mt-6 space-y-1" aria-label="Dashboard navigacija">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground", pathname === href && "bg-muted text-foreground")}><Icon className="size-4" />{label}</Link>)}</nav>
    <div className="mt-auto border-t pt-4"><Link href="/dashboard/profile" className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-medium">Moj profil</span><span className="block max-w-36 truncate text-xs text-muted-foreground">{email}</span></span></Link><form action={signOut} className="mt-2"><Button type="submit" variant="ghost" className="w-full justify-start"><LogOut className="size-4" /> Odjava</Button></form></div>
  </div>;
  return <><aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r lg:block">{sidebar}</aside>{open && <div className="fixed inset-0 z-[70] bg-slate-950/50 lg:hidden" onClick={() => setOpen(false)}><aside className="h-full w-72 border-r" onClick={(event) => event.stopPropagation()}>{sidebar}</aside></div>}<header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl lg:ml-64"><div className="flex h-16 items-center gap-3 px-4 sm:px-7"><button onClick={() => setOpen(true)} className="flex size-10 items-center justify-center rounded-xl border lg:hidden" aria-label="Otvori navigaciju"><Menu className="size-5" /></button><form action={submitSearch} className="relative max-w-xl flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input name="q" placeholder="Globalna pretraga…" className="h-10 w-full rounded-xl border bg-muted/50 pl-9 pr-14 text-sm outline-none focus:ring-2 focus:ring-ring" /><kbd className="absolute right-3 top-2.5 hidden rounded border bg-background px-1.5 text-xs text-muted-foreground sm:block">Ctrl K</kbd></form><div className="relative"><button onClick={() => setNotifications((v) => !v)} className="relative flex size-10 items-center justify-center rounded-xl border hover:bg-muted" aria-label="Obavijesti"><Bell className="size-4" /><span className="absolute right-2 top-2 size-2 rounded-full bg-blue-500" /></button>{notifications && <div className="absolute right-0 top-12 w-80 rounded-2xl border bg-card p-3 shadow-xl"><p className="px-2 py-1 text-sm font-semibold">Obavijesti</p><div className="mt-2 rounded-xl bg-muted p-3 text-sm"><p className="font-medium">Dobro došli u Dokument AI</p><p className="mt-1 text-xs text-muted-foreground">Vaš profesionalni radni prostor je spreman.</p></div></div>}</div></div></header></>;
}
