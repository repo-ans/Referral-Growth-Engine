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
export async function resolveGhlContactId(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<string> {
  const byPhone = await findGhlContact("number", input.phone);
  if (byPhone) return byPhone.id;

  const byEmail = await findGhlContact("email", input.email);
  if (byEmail) return byEmail.id;

  const created = await createGhlContact(input);
  return created.id;
}
