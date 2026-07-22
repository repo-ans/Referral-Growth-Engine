import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <>
      <h1 className="text-center text-2xl font-bold text-slate-900">
        Referral Portal
      </h1>
      <p className="mt-1 text-center text-sm text-zinc-500">
        Sign in to access your dashboard
      </p>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-orange-600 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
