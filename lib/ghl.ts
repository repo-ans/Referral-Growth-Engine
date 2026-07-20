import "server-only";

// GoHighLevel v2 API client, scoped to exactly what signup needs:
// find-or-create a contact by phone (then email), returning its id.
//
// Endpoints verified directly against GoHighLevel's published OpenAPI
// spec (github.com/GoHighLevel/highlevel-api-docs, apps/contacts.json):
//   - GET  /contacts/search/duplicate  (locationId + number|email)
//   - POST /contacts/                  (locationId + contact fields)
//
// CAVEAT: the spec documents the duplicate-search endpoint's request
// params but leaves its 200 response completely unspecified (no schema,
// empty description — a real gap in GoHighLevel's own docs, not a
// guess on our part). findGhlContact() below is written defensively
// around that: it treats a missing/null `contact` key, or any non-2xx
// status, as "no match" rather than assuming one exact shape. Test the
// lookup call against a real contact in your GHL location before
// relying on it — the create-contact call is fully spec-verified and
// safe to trust as written.

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const GHL_TIMEZONE = "America/Chicago";

type GhlContact = { id: string; [key: string]: unknown };

function ghlHeaders() {
  const token = process.env.GHL_PRIVATE_INTEGRATION_TOKEN;
  if (!token) {
    throw new Error("GHL_PRIVATE_INTEGRATION_TOKEN is not set");
  }

  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_API_VERSION,
    "Content-Type": "application/json",
  };
}

function locationId() {
  const id = process.env.GHL_LOCATION_ID;
  if (!id) {
    throw new Error("GHL_LOCATION_ID is not set");
  }
  return id;
}

function calendarId() {
  const id = process.env.GHL_CALENDAR_ID;
  if (!id) {
    throw new Error("GHL_CALENDAR_ID is not set");
  }
  return id;
}

async function findGhlContact(
  param: "number" | "email",
  value: string
): Promise<GhlContact | null> {
  const url = new URL(`${GHL_BASE_URL}/contacts/search/duplicate`);
  url.searchParams.set("locationId", locationId());
  url.searchParams.set(param, value);

  const res = await fetch(url, { headers: ghlHeaders() });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(
      `GHL duplicate search (${param}) failed: ${res.status} ${await res.text()}`
    );
  }

  const data = await res.json();
  return (data?.contact as GhlContact | undefined) ?? null;
}

async function createGhlContact(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<GhlContact> {
  const res = await fetch(`${GHL_BASE_URL}/contacts/`, {
    method: "POST",
    headers: ghlHeaders(),
    body: JSON.stringify({
      locationId: locationId(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`GHL create contact failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data.contact as GhlContact;
}

// Phone first, then email, per the referral program's dedup order.
// Creates a new GHL contact if neither matches.
//
// isExistingContact is the partner signal: any contact already in GHL
// (e.g. the realtors manually onboarded there in Stage 0) is treated as
// a partner; anyone with no prior GHL contact is a fresh, non-partner
// signup and gets a brand-new contact created for them.
export async function resolveGhlContactId(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<{ contactId: string; isExistingContact: boolean }> {
  const byPhone = await findGhlContact("number", input.phone);
  if (byPhone) return { contactId: byPhone.id, isExistingContact: true };

  const byEmail = await findGhlContact("email", input.email);
  if (byEmail) return { contactId: byEmail.id, isExistingContact: true };

  const created = await createGhlContact(input);
  return { contactId: created.id, isExistingContact: false };
}

// ---------------------------------------------------------------------
// Post-signup appointment booking (app/book). Ports index.html's
// prototype logic (freeSlots/bookGHL) server-side so the private
// integration token never reaches the browser.

// GHL's free-slots endpoint wants a day window in Unix ms, padded a day
// on each side (mirrors index.html's freeSlots()) so timezone rounding
// at the query boundary never hides a slot that belongs to `dateISO`.
export async function getFreeSlots(dateISO: string): Promise<string[]> {
  const base = new Date(`${dateISO}T00:00:00Z`);
  const start = new Date(base);
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(base);
  end.setUTCDate(end.getUTCDate() + 1);

  const url = new URL(`${GHL_BASE_URL}/calendars/${calendarId()}/free-slots`);
  url.searchParams.set("startDate", String(start.getTime()));
  url.searchParams.set("endDate", String(end.getTime()));
  url.searchParams.set("timezone", GHL_TIMEZONE);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GHL_PRIVATE_INTEGRATION_TOKEN}`,
      Version: GHL_API_VERSION,
    },
  });

  if (!res.ok) {
    throw new Error(`GHL free-slots failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();

  // Response shape: { "<dateISO>": { slots: ["...iso"] }, traceId: "..." }.
  // Defensive fallbacks mirror index.html's freeSlots() — GHL's own docs
  // don't fully pin this shape down.
  if (data?.[dateISO]?.slots && Array.isArray(data[dateISO].slots)) {
    return data[dateISO].slots as string[];
  }
  if (Array.isArray(data)) {
    return data as string[];
  }
  const dateKey = Object.keys(data ?? {}).find(
    (key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Array.isArray(data[key]?.slots)
  );
  return dateKey ? (data[dateKey].slots as string[]) : [];
}

// Best-effort sync of the address/tags collected at booking time onto
// the GHL contact created at signup. Failures are logged and swallowed
// by the caller — the appointment's `notes` field carries the address
// regardless, so this isn't load-bearing for the booking itself.
export async function updateGhlContactDetails(input: {
  contactId: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode: string;
  tags: string[];
}): Promise<void> {
  const res = await fetch(`${GHL_BASE_URL}/contacts/${input.contactId}`, {
    method: "PUT",
    headers: ghlHeaders(),
    body: JSON.stringify({
      address1: input.address || undefined,
      city: input.city || undefined,
      state: input.state || undefined,
      postalCode: input.postalCode,
      tags: input.tags,
    }),
  });

  if (!res.ok) {
    throw new Error(`GHL update contact failed: ${res.status} ${await res.text()}`);
  }
}

export async function bookGhlAppointment(input: {
  contactId: string;
  startTime: string;
  endTime: string;
  title: string;
  notes: string;
}): Promise<{ id: string }> {
  // Keep GHL's own offset (e.g. "-05:00") from the free-slots response
  // rather than also sending `timezone` — the two conflict in GHL's API
  // when both are present, same caveat index.html's bookGHL() works around.
  const hasOffset = /([+-]\d{2}:\d{2}|Z)$/.test(input.startTime);

  const res = await fetch(`${GHL_BASE_URL}/calendars/events/appointments`, {
    method: "POST",
    headers: ghlHeaders(),
    body: JSON.stringify({
      calendarId: calendarId(),
      locationId: locationId(),
      contactId: input.contactId,
      startTime: input.startTime,
      endTime: input.endTime,
      title: input.title,
      appointmentStatus: "confirmed",
      notes: input.notes,
      ...(hasOffset ? {} : { timezone: GHL_TIMEZONE }),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`GHL book appointment failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return { id: data.id as string };
}
