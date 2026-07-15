import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createClient();

  // referral_codes is a public view exposing only id + referral_code +
  // ghl_contact_id — never the profiles table directly, which also
  // holds name/phone. The referral link is keyed on ghl_contact_id.
  const { data: referral } = await supabase
    .from("referral_codes")
    .select("ghl_contact_id")
    .eq("ghl_contact_id", code)
    .maybeSingle();

  if (!referral) {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  await supabase.from("referral_clicks").insert({ ghl_contact_id: code });

  return NextResponse.redirect(
    new URL(`/register?ref=${code}`, request.url)
  );
}
