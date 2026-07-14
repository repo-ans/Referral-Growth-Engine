import Link from "next/link";
import { SignupForm } from "./signup-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        {ref && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            You were referred by a friend — thanks for joining!
          </p>
        )}

        <SignupForm referralCode={ref} />

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
