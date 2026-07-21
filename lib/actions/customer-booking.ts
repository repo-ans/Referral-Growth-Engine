"use server";

import { createClient } from "@/lib/supabase/server";
import {
  bookGhlAppointment,
  getFreeSlots,
  resolveGhlContactId,
  updateGhlContactDetails,
} from "@/lib/ghl";
import {
  CustomerBookingFormSchema,
  type CustomerBookingFormInput,
} from "@/lib/definitions";

// Public, no-session slot lookup — unlike lib/actions/booking.ts's
// getAvailableSlots(), this must NOT call verifySession(): the whole point
// of app/refer/[code] is that B never has an account, so a login redirect
// here would break the page for every anonymous visitor.
export async function getAvailableSlots(dateISO: string): Promise<string[]> {
  return getFreeSlots(dateISO);
}

export type SubmitCustomerBookingResult =
  | { ok: true; label: string }
  | { ok: false; error: string };

export async function submitCustomerBooking(
  input: CustomerBookingFormInput
): Promise<SubmitCustomerBookingResult> {
  const validated = CustomerBookingFormSchema.safeParse(input);
  if (!validated.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const {
    code,
    firstName,
    lastName,
    phone,
    email,
    serviceType,
    urgency,
    address,
    city,
    state,
    postalCode,
    notes,
    startTime,
    endTime,
  } = validated.data;

  const supabase = await createClient();

  // Re-resolve the referring partner from the code ourselves — never trust
  // the client's own claim of who referred them. Same lookup the old
  // /refer/[code] route handler used.
  const { data: referral } = await supabase
    .from("referral_codes")
    .select("id, ghl_contact_id")
    .eq("ghl_contact_id", code)
    .maybeSingle();

  if (!referral) {
    return { ok: false, error: "This referral link is no longer valid." };
  }

  let ghlContactId: string;
  try {
    const resolved = await resolveGhlContactId({ firstName, lastName, email, phone });
    ghlContactId = resolved.contactId;
  } catch (err) {
    console.error("GHL contact resolution failed:", err);
    return {
      ok: false,
      error: "We couldn't set up your booking right now. Please try again in a moment.",
    };
  }

  try {
    await updateGhlContactDetails({
      contactId: ghlContactId,
      address,
      city,
      state,
      postalCode,
      tags: [serviceType, urgency === "emergency" ? "emergency" : undefined].filter(
        (t): t is string => !!t
      ),
    });
  } catch (err) {
    // Best-effort — the appointment notes below carry the address
    // regardless, so a failed contact sync shouldn't block booking.
    console.error("GHL contact update failed:", err);
  }

  const areaLine = address
    ? `Address: ${[address, city, state, postalCode].filter(Boolean).join(", ")}`
    : `Area: ${postalCode}`;
  const noteLines = [
    `Service: ${serviceType}`,
    `Urgency: ${urgency}`,
    areaLine,
    notes ? `Notes: ${notes}` : null,
  ].filter((line): line is string => !!line);

  try {
    await bookGhlAppointment({
      contactId: ghlContactId,
      startTime,
      endTime,
      title: `${serviceType} — ${firstName} ${lastName}`,
      notes: noteLines.join("\n"),
    });
  } catch (err) {
    console.error("GHL book appointment failed:", err);
    return {
      ok: false,
      error: "Booking failed. Please try again or call us.",
    };
  }

  const { error: insertError } = await supabase.from("customers").insert({
    referred_by: referral.id,
    ghl_contact_id: ghlContactId,
    first_name: firstName,
    last_name: lastName,
    phone,
    email,
    address: address || null,
    city: city || null,
    state: state || null,
    postal_code: postalCode,
    service_type: serviceType,
    urgency,
    notes: notes || null,
    start_time: startTime,
    end_time: endTime,
  });

  if (insertError) {
    // The GHL appointment is already booked at this point — logging for
    // manual reconciliation is preferable to telling the customer it failed.
    console.error("Supabase customer insert failed:", insertError);
  }

  return { ok: true, label: new Date(startTime).toLocaleString() };
}
