import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { buttonVariants } from "@/components/ui/button";

export default function ConfirmEmailPage() { return <AuthShell title="Potvrdite email" description="Poslali smo vam poruku s poveznicom za potvrdu računa. Nakon potvrde automatski ćete biti vraćeni u aplikaciju."><div className="text-center"><MailCheck className="mx-auto size-12 text-blue-600" /><Link href="/login" className={`${buttonVariants({ variant: "outline" })} mt-7`}>Natrag na prijavu</Link></div></AuthShell>; }
