import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-(--brand-navy)">Log in</h1>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-orange-600 hover:underline dark:text-orange-400"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
