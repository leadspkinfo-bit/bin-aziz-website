"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleButton({ next = "/packages", label = "Continue with Google" }: { next?: string; label?: string }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      console.error(error.message);
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-night-900/15 bg-white px-6 py-3.5 font-semibold text-night-900 shadow-sm transition hover:border-gold-500 hover:shadow-md disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-7.9z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z" />
        <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
      </svg>
      {loading ? "Redirecting…" : label}
    </button>
  );
}
