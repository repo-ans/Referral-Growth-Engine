"use client";

import { useState } from "react";
import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import type { SignupFormState } from "@/lib/definitions";
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
} from "@/components/auth/icons";

const inputClasses =
  "w-full rounded-md border border-zinc-300 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30";
const errorClasses = "mt-1 text-sm text-red-600";

export function SignupForm({ referralCode }: { referralCode?: string }) {
  const [state, action, pending] = useActionState<SignupFormState, FormData>(
    signup,
    undefined
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      {referralCode && (
        <input type="hidden" name="referralCode" value={referralCode} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
            First name
          </label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              className={inputClasses}
            />
          </div>
          {state?.errors?.firstName && (
            <p className={errorClasses}>{state.errors.firstName[0]}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Last name
          </label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              className={inputClasses}
            />
          </div>
          {state?.errors?.lastName && (
            <p className={errorClasses}>{state.errors.lastName[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Email
        </label>
        <div className="relative">
          <MailIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={inputClasses}
          />
        </div>
        {state?.errors?.email && (
          <p className={errorClasses}>{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Phone
        </label>
        <div className="relative">
          <PhoneIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClasses}
          />
        </div>
        {state?.errors?.phone && (
          <p className={errorClasses}>{state.errors.phone[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Password
        </label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className={inputClasses + " pr-9"}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-600"
          >
            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
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
        className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowRightIcon className="h-4 w-4" />
        {pending ? "Creating account…" : "Sign Up"}
      </button>
    </form>
  );
}
