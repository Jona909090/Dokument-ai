import Link from "next/link";
import { ShieldX } from "lucide-react";
export function AdminPermissionDenied() { return <main className="grid min-h-screen place-items-center bg-muted/20 p-6"><div className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-xl"><ShieldX className="mx-auto size-10 text-red-500" /><h1 className="mt-4 text-2xl font-semibold">Pristup nije dopušten</h1><p className="mt-2 text-sm text-muted-foreground">Nemate aktivnu platform-admin ulogu ili potrebnu server-side dozvolu. Privatni admin podaci nisu učitani.</p><Link href="/dashboard" className="mt-6 inline-block text-sm font-semibold text-primary">Natrag na dashboard</Link></div></main>; }

