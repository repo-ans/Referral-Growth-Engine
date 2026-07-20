import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";

// No standalone landing page — verifySession() redirects to /login if
// there's no session; if there is one, send them on to /dashboard.
export default async function Home() {
  await verifySession();
  redirect("/dashboard");
}
