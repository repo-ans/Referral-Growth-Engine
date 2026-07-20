"use server";

import { revalidatePath } from "next/cache";
import { isAdminUser, verifySession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export type SetAdminStatusResult = { ok: true } | { ok: false; error: string };

// Not verifyAdmin() (lib/admin-dal.ts) on purpose — that redirects, which
// is wrong for a button click that fails a permission check. This is a
// mutation, so it reports failure back to the caller instead.
export async function setAdminStatus(
  profileId: string,
  nextIsAdmin: boolean
): Promise<SetAdminStatusResult> {
  const user = await verifySession();

  if (!(await isAdminUser())) {
    return { ok: false, error: "Not authorized." };
  }

  if (profileId === user.id && !nextIsAdmin) {
    return { ok: false, error: "You can't remove your own admin access." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_admin: nextIsAdmin })
    .eq("id", profileId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}
