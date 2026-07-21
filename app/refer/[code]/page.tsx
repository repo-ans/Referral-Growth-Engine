import { redirect } from "next/navigation";
import Image from "next/image";
import logo from "@/public/isael logo.webp";
import { createClient } from "@/lib/supabase/server";
import { CustomerBookingForm } from "@/components/customer-booking/booking-form";

// Public, no-account entry point: A shares this link, B clicks it and
// books directly — no /register, no Supabase Auth account for B at all.
// Previously a route.ts that logged the click then redirected to
// /register?ref=code; a route segment can't have both a route.ts and a
// page.tsx, so that handler was replaced by this page outright.
export default async function ReferPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  // referral_codes is a public view exposing only id + referral_code +
  // ghl_contact_id — never the profiles table directly.
  const { data: referral } = await supabase
    .from("referral_codes")
    .select("ghl_contact_id")
    .eq("ghl_contact_id", code)
    .maybeSingle();

  if (!referral) {
    redirect("/");
  }

  await supabase.from("referral_clicks").insert({ ghl_contact_id: code });

  return (
    <div className="flex min-h-full flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-zinc-900">
      <Image src={logo.src} alt="Isael logo" width={100} height={20} priority />
      <div className="mt-8 w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <CustomerBookingForm code={code} />
      </div>
    </div>
  );
}
