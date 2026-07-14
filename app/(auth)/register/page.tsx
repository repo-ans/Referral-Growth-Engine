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
      <h1 className="text-2xl font-bold text-(--brand-navy)">
        Create your account
      </h1>
      {ref && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          You were referred by a friend — thanks for joining!
        </p>
      )}

      <SignupForm referralCode={ref} />

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-orange-600 hover:underline dark:text-orange-400"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
