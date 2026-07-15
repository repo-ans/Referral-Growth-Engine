"use server";

import { redirect } from "next/navigation";
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
  let ghlContactId: string;
  try {
    ghlContactId = await resolveGhlContactId({ firstName, lastName, email, phone });
  } catch (err) {
    console.error("GHL contact resolution failed:", err);
    return {
      message:
        "We couldn't set up your account right now. Please try again in a moment.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
        referred_by_code: referredByCode,
        ghl_contact_id: ghlContactId,
      },
    },
  });

  if (error) {
    return { message: error.message };
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
