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

export type CommissionStatus = "pending" | "approved" | "paid" | "clawed_back";
export type SetCommissionStatusResult = { ok: true } | { ok: false; error: string };

export async function setCommissionStatus(
  commissionId: number,
  nextStatus: CommissionStatus
): Promise<SetCommissionStatusResult> {
  if (!(await isAdminUser())) {
    return { ok: false, error: "Not authorized." };
  }

  const admin = createAdminClient();
  // payout_date is only ever set, never cleared — a commission clawed back
  // after being paid should still show when it was originally paid, not
  // lose that history.
  const update: { status: CommissionStatus; payout_date?: string } = {
    status: nextStatus,
  };
  if (nextStatus === "paid") {
    update.payout_date = new Date().toISOString();
  }

  const { error } = await admin
    .from("commissions")
    .update(update)
    .eq("id", commissionId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}
