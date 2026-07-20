import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canBookAppointment } from "@/lib/dal";

// Supabase's confirmation email redirects here with a PKCE `?code=`.
// Exchange it for a session cookie, then send the user on.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // One-time default landing for referred signups: send them to the
      // booking form right after confirming. Not a gate — canBookAppointment()
      // is the same check the navbar button uses, so once they've booked
      // (or if they skip and come back later), /dashboard is reachable
      // directly and the navbar button is the way back to /book.
      const destination = (await canBookAppointment()) ? "/book" : "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation-failed`);
}
