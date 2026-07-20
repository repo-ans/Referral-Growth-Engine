import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Only ever call this after
// verifyAdmin() (lib/admin-dal.ts) has confirmed the requester's email is
// allow-listed. No cookies/session involved, so a fresh instance per call
// is cheap and safe to share.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
