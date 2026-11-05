"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const field =
  "mt-1.5 w-full rounded-xl border border-night-900/12 bg-white px-4 py-3 text-night-900 outline-none transition focus:border-gold-500 focus:ring-4 focus:ring-gold-500/15";

/**
 * `onSuccess` replaces the default jump to /admin (the calculator signs in without leaving the page).
 * `noAutofill`: the browser must not fill in a saved email/password (the calculator's ADMIN asks for them
 * every time): the fields stay read-only until touched, which browsers never autofill.
 */
export function AdminLoginForm({ onSuccess, noAutofill = false }: { onSuccess?: () => void; noAutofill?: boolean }) {
  const router = useRouter();
  const [guarded, setGuarded] = useState(noAutofill);
  const guard = noAutofill ? { readOnly: guarded, onFocus: () => setGuarded(false), onPointerDown: () => setGuarded(false) } : {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    if (signInError) {
      setLoading(false);
      return setError("Email or password is incorrect.");
    }

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      setLoading(false);
      return setError("This account does not have admin access.");
    }
    if (onSuccess) {
      setLoading(false);
      onSuccess();
    } else {
      // back to the admin page that sent here; only same-site admin paths are allowed
      const next = new URLSearchParams(window.location.search).get("next") ?? "";
      router.push(/^\/admin(1998)?(\/|$)/.test(next) ? next : "/admin");
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete={noAutofill ? "off" : "username"} required className={field} {...guard} />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input name="password" type="password" autoComplete={noAutofill ? "new-password" : "current-password"} required className={field} {...guard} />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-night-900 px-6 py-3.5 font-semibold text-ivory-50 transition hover:bg-night-700 disabled:opacity-60"
      >
        {loading ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
