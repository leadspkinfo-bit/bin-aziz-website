"use client";

import { useEffect, useState, useTransition } from "react";
import { lockCalculatorAdmin, unlockCalculatorAdmin } from "@/app/(site)/calculator/actions";
import { AdminLoginForm } from "@/app/admin/login/AdminLoginForm";
import { ScanUploader } from "@/app/admin/scan/ScanUploader";
import { createClient } from "@/lib/supabase/client";

type Props = {
  unlocked: boolean;
  onUnlocked: (unlocked: boolean) => void;
  isAdmin: boolean;
  onAdmin: (admin: boolean) => void;
  onSynced: () => void;
  onClose: () => void;
};

/** The ADMIN button's own 6-digit code (checked on the server), asked before anything else. */
function AdminCode({ onUnlocked }: { onUnlocked: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const submit = () =>
    start(async () => {
      const res = await unlockCalculatorAdmin(code);
      if (!res.ok) {
        setError(true);
        setCode("");
        return;
      }
      onUnlocked();
    });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === 6) submit();
      }}
      className="rounded-2xl bg-ivory-50 p-6 text-center text-night-900"
    >
      <h2 className="font-display text-3xl">Admin</h2>
      <label htmlFor="calc-admin-code" className="mt-4 block text-sm font-semibold text-slate-600">
        Enter the 6-digit admin code
      </label>
      <input
        id="calc-admin-code"
        autoFocus
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
          setError(false);
        }}
        className="mx-auto mt-2 block w-full max-w-xs rounded-lg border border-slate-300 p-3 text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-[#8e1b34] focus:ring-3 focus:ring-[#8e1b34]/10"
      />
      <p aria-live="polite" className="mt-2 h-5 text-sm text-red-600">
        {error ? "Wrong code. Please try again." : ""}
      </p>
      <button
        type="submit"
        disabled={code.length !== 6 || pending}
        className="mx-auto mt-2 block w-full max-w-xs rounded-xl bg-[#8e1b34] py-3 text-sm font-bold tracking-wide text-white uppercase shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Open admin"}
      </button>
    </form>
  );
}

/** Admin code, then sign in, then scan rate lists — without leaving the calculator. */
export function AdminRatesPanel({ unlocked, onUnlocked, isAdmin, onAdmin, onSynced, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Admin" className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border-t-8 border-[#8e1b34] bg-night-950 p-6 text-ivory-50 shadow-2xl md:p-8">
        <button type="button" aria-label="Close" onClick={onClose} className="absolute top-4 right-4 grid size-9 place-items-center rounded-full border border-ivory-100/20 transition hover:border-gold-400">
          ✕
        </button>
        {!unlocked ? (
          <AdminCode onUnlocked={() => onUnlocked(true)} />
        ) : isAdmin ? (
          <>
            <h2 className="pr-10 font-display text-3xl">Scan rate lists</h2>
            <p className="mt-1 text-sm text-ivory-100/60">Upload the rate-list pictures. Each date range becomes its own season in the calculator.</p>
            <ScanUploader onSynced={onSynced} />
            <button
              type="button"
              onClick={async () => {
                await Promise.all([createClient().auth.signOut(), lockCalculatorAdmin()]);
                onAdmin(false);
                onUnlocked(false);
              }}
              className="mt-6 text-xs text-ivory-100/50 underline transition hover:text-gold-300"
            >
              Log out
            </button>
          </>
        ) : (
          <div className="rounded-2xl bg-ivory-50 p-6 text-night-900">
            <h2 className="font-display text-3xl">Admin login</h2>
            <AdminLoginForm onSuccess={() => onAdmin(true)} />
          </div>
        )}
      </div>
    </div>
  );
}
