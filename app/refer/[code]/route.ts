import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  // referral_codes is a public view exposing only id + referral_code —
  // never the profiles table directly, which also holds name/phone.
  const { data: referral } = await supabase
    .from("referral_codes")
    .select("referral_code")
    .eq("referral_code", code)
    .maybeSingle();

  if (!referral) {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  await supabase.from("referral_clicks").insert({ referral_code: code });

  return NextResponse.redirect(
    new URL(`/register?ref=${code}`, request.url)
  );
}
