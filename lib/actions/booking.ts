"use server";

import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/dal";
import {
  bookGhlAppointment,
  getFreeSlots,
  updateGhlContactDetails,
} from "@/lib/ghl";
import { BookingFormSchema, type BookingFormInput } from "@/lib/definitions";

// Raw GHL slot ISO strings for one day. The client applies the
// service-category filter (maintenance = weekday 10am-3pm only) itself,
// same as index.html's loadSlots() — this action just proxies GHL.
export async function getAvailableSlots(dateISO: string): Promise<string[]> {
  await verifySession();
  return getFreeSlots(dateISO);
}

export type SubmitBookingResult =
  | { ok: true; label: string }
  | { ok: false; error: string };

export async function submitBooking(
  input: BookingFormInput
): Promise<SubmitBookingResult> {
  const validated = BookingFormSchema.safeParse(input);
  if (!validated.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const {
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

  const user = await verifySession();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, ghl_contact_id")
    .eq("id", user.id)
    .single();

  if (!profile?.ghl_contact_id) {
    return {
      ok: false,
      error: "We couldn't find your contact record. Please contact support.",
    };
  }

  try {
    await updateGhlContactDetails({
      contactId: profile.ghl_contact_id,
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

  let ghlAppointmentId: string;
  try {
    const booked = await bookGhlAppointment({
      contactId: profile.ghl_contact_id,
      startTime,
      endTime,
      title: `${serviceType} — ${profile.first_name} ${profile.last_name}`,
      notes: noteLines.join("\n"),
    });
    ghlAppointmentId = booked.id;
  } catch (err) {
    console.error("GHL book appointment failed:", err);
    return {
      ok: false,
      error: "Booking failed. Please try again or call us.",
    };
  }

  const { error: insertError } = await supabase.from("service_appointments").insert({
    profile_id: user.id,
    ghl_appointment_id: ghlAppointmentId,
    ghl_contact_id: profile.ghl_contact_id,
    service_type: serviceType,
    urgency,
    address: address || null,
    city: city || null,
    state: state || null,
    postal_code: postalCode,
    notes: notes || null,
    start_time: startTime,
    end_time: endTime,
  });

  if (insertError) {
    // The GHL appointment is already booked at this point — logging for
    // manual reconciliation is preferable to telling the user it failed.
    console.error("Supabase appointment insert failed:", insertError);
  }

  return { ok: true, label: new Date(startTime).toLocaleString() };
}
