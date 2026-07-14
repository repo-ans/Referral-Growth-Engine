import { getProfile, getReferralStats } from "@/lib/dal";
import { logout } from "@/lib/actions/auth";

export default async function DashboardPage() {
  const profile = await getProfile();
  const { clickCount, referrals } = await getReferralStats();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const referralUrl = profile
    ? `${siteUrl}/refer/${profile.referral_code}`
    : null;

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">
        Welcome{profile ? `, ${profile.first_name}` : ""}
      </h1>

      {referralUrl && (
        <div className="mt-6 rounded-md border border-zinc-300 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Your referral link
          </p>
          <p className="mt-1 break-all font-mono text-sm">{referralUrl}</p>
        </div>
      )}

      <div className="mt-6 rounded-md border border-zinc-300 p-4 dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Link clicks
        </p>
        <p className="mt-1 text-2xl font-semibold">{clickCount}</p>
      </div>

      <div className="mt-6 rounded-md border border-zinc-300 p-4 dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          People who signed up with your link ({referrals.length})
        </p>
        {referrals.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No signups yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {referrals.map((referral) => (
              <li
                key={`${referral.created_at}-${referral.first_name}-${referral.last_name}`}
                className="flex items-baseline justify-between text-sm"
              >
                <span>
                  {referral.first_name} {referral.last_name}
                </span>
                <span className="text-zinc-500">
                  {new Date(referral.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={logout} className="mt-8">
        <button type="submit" className="cursor-pointer text-sm underline">
          Log out
        </button>
      </form>
    </div>
  );
}
