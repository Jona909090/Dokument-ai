import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicSupabaseKey } from "@/lib/supabase/config";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publicSupabaseKey(),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components cannot write cookies. Proxy refreshes the session.
          }
        },
      },
    },
  );
}
