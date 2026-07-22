import Link from "next/link";
import { SignupForm } from "./signup-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <>
      <h1 className="text-center text-2xl font-bold text-slate-900">
        Create your account
      </h1>
      <p className="mt-1 text-center text-sm text-zinc-500">
        Join the referral program
      </p>
      {ref && (
        <p className="mt-3 text-center text-sm text-zinc-600">
          You were referred by a friend — thanks for joining!
        </p>
      )}

      <SignupForm referralCode={ref} />

      <p className="mt-6 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-orange-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
