import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// One client per request. Use this inside Server Components, Server
// Actions, and Route Handlers — never reuse a single instance across
// requests since it carries the caller's cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component, which can't set cookies.
            // Safe to ignore because proxy.ts refreshes the session
            // cookie on every request.
          }
        },
      },
    }
  );
}
