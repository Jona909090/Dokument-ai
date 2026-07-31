import { requestPasswordReset } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) { const { message } = await searchParams; return <AuthShell title="Reset lozinke" description="Poslat ćemo vam sigurnu poveznicu za postavljanje nove lozinke." message={typeof message === "string" ? message : undefined}><form action={requestPasswordReset} className="space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-semibold">Email</label><Input id="email" name="email" type="email" required autoComplete="email" /></div><Button type="submit" className="w-full">Pošalji poveznicu</Button></form></AuthShell>; }
