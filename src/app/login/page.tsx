import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/app/auth/actions";
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { message, next } = await searchParams;
  const returnTo = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return <AuthShell title="Prijava" description="Pristupite svojim dokumentima i nastavite gdje ste stali." message={typeof message === "string" ? message : undefined}><form action={signIn} className="space-y-5"><input type="hidden" name="next" value={returnTo} /><div><label htmlFor="email" className="mb-2 block text-sm font-semibold">Email</label><Input id="email" name="email" type="email" required autoComplete="email" /></div><div><div className="mb-2 flex justify-between"><label htmlFor="password" className="text-sm font-semibold">Lozinka</label><Link href="/reset-password" className="text-xs font-semibold text-blue-700">Zaboravljena lozinka?</Link></div><Input id="password" name="password" type="password" required minLength={8} autoComplete="current-password" /></div><Button type="submit" className="w-full">Prijavi se</Button></form><p className="mt-6 text-center text-sm text-slate-600">Nemate račun? <Link href="/register" className="font-semibold text-blue-700">Registrirajte se</Link></p></AuthShell>;
}
