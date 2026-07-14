"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import type { LoginFormState } from "@/lib/definitions";

const inputClasses =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 dark:border-zinc-700 dark:bg-zinc-900";
const errorClasses = "mt-1 text-sm text-red-600";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginFormState, FormData>(
    login,
    undefined
  );

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={inputClasses}
        />
        {state?.errors?.email && (
          <p className={errorClasses}>{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className={inputClasses}
        />
        {state?.errors?.password && (
          <p className={errorClasses}>{state.errors.password[0]}</p>
        )}
      </div>

      {state?.message && <p className={errorClasses}>{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 cursor-pointer rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
