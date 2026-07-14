"use client";

import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import type { SignupFormState } from "@/lib/definitions";

const inputClasses =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 dark:border-zinc-700 dark:bg-zinc-900";
const errorClasses = "mt-1 text-sm text-red-600";

export function SignupForm({ referralCode }: { referralCode?: string }) {
  const [state, action, pending] = useActionState<SignupFormState, FormData>(
    signup,
    undefined
  );

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {referralCode && (
        <input type="hidden" name="referralCode" value={referralCode} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            className={inputClasses}
          />
          {state?.errors?.firstName && (
            <p className={errorClasses}>{state.errors.firstName[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            className={inputClasses}
          />
          {state?.errors?.lastName && (
            <p className={errorClasses}>{state.errors.lastName[0]}</p>
          )}
        </div>
      </div>

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
        <label htmlFor="phone" className="block text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className={inputClasses}
        />
        {state?.errors?.phone && (
          <p className={errorClasses}>{state.errors.phone[0]}</p>
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
          autoComplete="new-password"
          className={inputClasses}
        />
        {state?.errors?.password && (
          <ul className={errorClasses}>
            {state.errors.password.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      {state?.message && <p className={errorClasses}>{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 cursor-pointer rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
