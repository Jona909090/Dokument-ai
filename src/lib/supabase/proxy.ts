import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(
        new URL(
          "/login?message=Supabase nije konfiguriran. Dodajte vrijednosti u .env.local.",
          request.url,
        ),
      );
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
  const protectedRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const authRoute = request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register";
  if (protectedRoute && !user) return NextResponse.redirect(new URL("/login?message=Prijavite se za pristup dashboardu.", request.url));
  if (authRoute && user) return NextResponse.redirect(new URL("/dashboard", request.url));
  return response;
}
