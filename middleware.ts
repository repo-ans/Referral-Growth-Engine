import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Intentionally named `middleware.ts`, not Next.js 16's `proxy.ts`.
// `proxy.ts` triggers a Windows-specific path-resolution bug in the
// Netlify Edge Functions bundler — confirmed locally via
// `netlify build --offline`, and matches a currently-open upstream
// issue: https://github.com/vercel/next.js/issues/85243 ("renaming
// proxy.ts to middleware.ts makes it work"). `middleware.ts` still
// works today (deprecated, not removed — only a build-time warning),
// and produces a clean Netlify build. Don't rename this back to
// proxy.ts without re-testing `netlify build --offline` first.
export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
