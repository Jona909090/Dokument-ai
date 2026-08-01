import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, publicSupabaseKey } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    // Keep the local demo/fallback available when cloud mode is not configured.
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publicSupabaseKey(),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const protectedPrefixes = ["/dashboard","/documents","/contacts","/companies","/projects","/settings","/profile","/subscription","/billing","/analytics"];
  const protectedRoute = protectedPrefixes.some((prefix) => request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`));
  const authRoute = ["/login","/register","/reset-password"].includes(request.nextUrl.pathname);
  if (protectedRoute && !user) { const login = new URL("/login", request.url); login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`); login.searchParams.set("message", "Prijavite se za nastavak."); return NextResponse.redirect(login); }
  if (authRoute && user) return NextResponse.redirect(new URL("/dashboard", request.url));
  return response;
}
