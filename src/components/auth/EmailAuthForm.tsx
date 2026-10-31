"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const field =
  "mt-1.5 w-full rounded-xl border border-night-900/12 bg-white px-4 py-3 text-night-900 outline-none transition placeholder:text-ink/35 focus:border-gold-500 focus:ring-4 focus:ring-gold-500/15";

// Supabase messages are technical; show visitors something friendlier.
function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "Email or password is incorrect.";
  if (/already registered/i.test(message)) return "This email already has an account — please log in instead.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox for our link.";
  if (/rate limit/i.test(message)) return "Too many attempts. Please wait a few minutes and try again.";
  return message;
}

export function EmailAuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("full_name") ?? "").trim();

    setError(null);
    setNotice(null);
    if (mode === "signup" && fullName.length < 2) return setError("Please enter your name.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    const supabase = createClient();
    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (result.error) return setError(friendly(result.error.message));
    if (!result.data.session) {
      // Email confirmation is switched on in Supabase: the account is active once they click the link.
      return setNotice(`We’ve sent a confirmation link to ${email}. Open it to activate your account.`);
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-2 rounded-full bg-ivory-200/60 p-1 text-sm font-semibold" role="tablist">
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            className={`rounded-full py-2.5 transition ${mode === m ? "bg-night-900 text-ivory-50" : "text-ink/60 hover:text-night-900"}`}
          >
            {m === "signup" ? "Sign up" : "Log in"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {mode === "signup" && (
          <label className="block text-sm font-medium text-night-900">
            Full name
            <input name="full_name" autoComplete="name" required className={field} placeholder="Your name" />
          </label>
        )}
        <label className="block text-sm font-medium text-night-900">
          Email
          <input name="email" type="email" autoComplete="email" required className={field} placeholder="you@example.com" />
        </label>
        <label className="block text-sm font-medium text-night-900">
          Password
          <input
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            className={field}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-night-900 px-6 py-3.5 font-semibold text-ivory-50 transition hover:bg-night-700 disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>
    </div>
  );
}
