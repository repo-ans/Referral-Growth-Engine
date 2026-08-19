"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { resolveGhlContactId } from "@/lib/ghl";
import {
  LoginFormSchema,
  type LoginFormState,
  SignupFormSchema,
  type SignupFormState,
} from "@/lib/definitions";

export async function signup(
  _state: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const validatedFields = SignupFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email, phone, password } =
    validatedFields.data;
  const referredByCode = formData.get("referralCode")?.toString() || undefined;

  // Resolve (find-or-create) the GoHighLevel contact before creating the
  // Supabase user: the referral link is keyed off ghl_contact_id, so a
  // profile can't be useful without one. See lib/ghl.ts.
  //
  // Every /register signup is a partner, full stop — this page is only
  // ever reached by someone trying to join the referral program (referred
  // customers book anonymously through /refer/[code] instead and never
  // see this form at all). isExistingContact ("did GHL already know this
  // phone/email") used to be the partner signal, back when /register also
  // served referred customers — that's stale now and would incorrectly
  // gate out anyone whose phone/email GHL hadn't already seen. See
  // handle_new_user() in supabase/006_partner_detection.sql for the
  // trigger that actually creates the partners row from this flag.
  let ghlContactId: string;
  const isPartner = true;
  try {
    const resolved = await resolveGhlContactId({ firstName, lastName, email, phone });
    ghlContactId = resolved.contactId;
  } catch (err) {
    console.error("GHL contact resolution failed:", err);
    return {
      message:
        "We couldn't set up your account right now. Please try again in a moment.",
    };
  }

  const supabase = await createClient();

  // Derived from the actual incoming request, not NEXT_PUBLIC_SITE_URL:
  // Supabase's confirmation is PKCE-based, so the code verifier cookie is
  // scoped to whatever origin the signup happened on. Redirecting the
  // confirmation link to a fixed (e.g. production) URL when someone signs
  // up on localhost sends them to a different origin than the cookie is
  // on, and exchangeCodeForSession() fails with confirmation-failed.
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol =
    headersList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
        referred_by_code: referredByCode,
        ghl_contact_id: ghlContactId,
        is_partner: isPartner,
      },
    },
  });

  if (error) {
    console.error("Supabase signUp error:", error.status, error.code, error.message, error);
    return { message: error.message || "Sign up failed. Please try again." };
  }

  redirect("/register/check-email");
}

export async function login(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(
    validatedFields.data
  );

  if (error) {
    return { message: "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
