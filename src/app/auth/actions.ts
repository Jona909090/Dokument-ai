"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(8).max(128);
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function authRedirect(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

export async function signIn(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const next = z.string().startsWith("/").max(500).safeParse(formData.get("next"));
  if (!email.success || !password.success) authRedirect("/login", "Unesite valjan email i lozinku od najmanje 8 znakova.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
  if (error) authRedirect("/login", "Prijava nije uspjela. Provjerite podatke i potvrdu email adrese.");
  redirect(next.success && !next.data.startsWith("//") ? next.data : "/dashboard");
}

export async function resendConfirmation(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) authRedirect("/confirm-email", "Unesite valjanu email adresu.");
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: email.data, options: { emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard` } });
  if (error) authRedirect("/confirm-email", "Potvrdu trenutačno nije moguće poslati.");
  authRedirect("/confirm-email", "Nova poveznica za potvrdu je poslana.");
}

export async function signUp(formData: FormData) {
  const fullName = z.string().trim().min(2).max(100).safeParse(formData.get("fullName"));
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!fullName.success || !email.success || !password.success) authRedirect("/register", "Provjerite ime, email i lozinku od najmanje 8 znakova.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: { data: { full_name: fullName.data }, emailRedirectTo: `${appUrl}/auth/callback?next=/dashboard` },
  });
  if (error) authRedirect("/register", error.message);
  redirect("/confirm-email");
}

export async function requestPasswordReset(formData: FormData) {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) authRedirect("/reset-password", "Unesite valjanu email adresu.");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${appUrl}/auth/callback?next=/update-password` });
  if (error) authRedirect("/reset-password", error.message);
  authRedirect("/reset-password", "Ako račun postoji, poslali smo poveznicu za promjenu lozinke.");
}

export async function updatePassword(formData: FormData) {
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) authRedirect("/update-password", "Lozinka mora imati najmanje 8 znakova.");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) authRedirect("/update-password", error.message);
  authRedirect("/login", "Lozinka je uspješno promijenjena. Možete se prijaviti.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
