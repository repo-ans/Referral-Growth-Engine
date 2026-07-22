"use client";

import { useState, useSyncExternalStore } from "react";
import {
  LinkIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  ShareIcon,
} from "./icons";

// Web Share API support never changes at runtime, so "subscribing" is a
// no-op — this only exists to read the value once, safely, after
// hydration (getServerSnapshot forces the SSR/first-paint render to
// say "unsupported" so client and server markup always match).
function subscribeNever() {
  return () => {};
}
function getShareSupport() {
  return typeof navigator !== "undefined" && !!navigator.share;
}
function getShareSupportServer() {
  return false;
}

export function ReferralLinkReveal({
  referralUrl,
  qrCodeDataUrl,
}: {
  referralUrl: string;
  qrCodeDataUrl: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(
    subscribeNever,
    getShareSupport,
    getShareSupportServer
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    try {
      const res = await fetch(qrCodeDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "referral-qr-code.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "My referral link",
          text: "Sign up using my referral link:",
          url: referralUrl,
          files: [file],
        });
      } else {
        await navigator.share({ title: "My referral link", url: referralUrl });
      }
    } catch {
      // User cancelled the share sheet, or sharing failed — nothing to do.
    }
  }

  if (!revealed) {
    return (
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
          Your referral link
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Generate your unique link to start referring customers.
        </p>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          <LinkIcon className="h-4 w-4" />
          Generate Link
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        Your referral link
      </p>

      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element -- server-generated data: URI, not an optimizable remote image */}
        <img
          src={qrCodeDataUrl}
          alt="QR code for your referral link"
          width={128}
          height={128}
          className="h-32 w-32 shrink-0 rounded-md border border-zinc-200 dark:border-zinc-800"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900">
              {referralUrl}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy referral link"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all active:scale-95 cursor-pointer dark:bg-zinc-900 dark:border-zinc-700 dark:text-slate-200 dark:hover:bg-zinc-800"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          {copied && (
            <p className="-mt-2 text-xs text-green-600">Copied to clipboard</p>
          )}

          <div className="flex flex-wrap gap-2">
            <a
              href={qrCodeDataUrl}
              download="referral-qr-code.png"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all active:scale-95 cursor-pointer dark:bg-zinc-900 dark:border-zinc-700 dark:text-slate-200 dark:hover:bg-zinc-800"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              Download QR code
            </a>

            {canShare && (
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all active:scale-95 cursor-pointer dark:bg-zinc-900 dark:border-zinc-700 dark:text-slate-200 dark:hover:bg-zinc-800"
              >
                <ShareIcon className="h-3.5 w-3.5" />
                Share
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
