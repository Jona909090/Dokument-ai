import { updatePassword } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function UpdatePasswordPage({ searchParams }: PageProps<"/update-password">) { const { message } = await searchParams; return <AuthShell title="Nova lozinka" description="Unesite novu sigurnu lozinku za svoj račun." message={typeof message === "string" ? message : undefined}><form action={updatePassword} className="space-y-5"><div><label htmlFor="password" className="mb-2 block text-sm font-semibold">Nova lozinka</label><Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" /></div><Button type="submit" className="w-full">Spremi novu lozinku</Button></form></AuthShell>; }
