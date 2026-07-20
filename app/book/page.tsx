import { redirect } from "next/navigation";
import { getProfile, getAppointment, verifySession } from "@/lib/dal";
import { BookingForm } from "@/components/booking/booking-form";

export default async function BookPage() {
  const user = await verifySession();
  const profile = await getProfile();

  // Anyone who came through a referral link is eligible, regardless of
  // is_partner — see canBookAppointment()'s comment in lib/dal.ts for why
  // that flag shouldn't gate this. Keep in sync with canBookAppointment().
  if (!profile?.referred_by) {
    redirect("/dashboard");
  }

  const appointment = await getAppointment();
  if (appointment) {
    redirect("/dashboard");
  }

  return (
    <BookingForm
      userId={user.id}
      firstName={profile.first_name}
      lastName={profile.last_name}
      phone={profile.phone ?? ""}
      email={user.email ?? ""}
    />
  );
}
