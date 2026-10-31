"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/components/auth/useUser";
import { createClient } from "@/lib/supabase/client";

/** Top-right Sign up button, or the signed-in user's menu. */
export function AuthButton() {
  const user = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    setMenu(false);
    router.refresh();
  }

  if (user === undefined) return <span className="h-10 w-24" aria-hidden />;

  if (!user) {
    const next = pathname === "/login" ? "/packages" : pathname;
    return (
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="inline-flex items-center justify-center rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-night-950 transition hover:bg-gold-400 sm:px-6"
      >
        Sign up
      </Link>
    );
  }

  const name: string = user.user_metadata?.full_name ?? user.email ?? "Account";
  const initial = name.trim().charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenu((v) => !v)}
        aria-expanded={menu}
        aria-label="Account menu"
        className="grid size-10 place-items-center rounded-full bg-gold-500 font-display text-xl font-semibold text-night-950"
      >
        {initial}
      </button>
      {menu && (
        <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-gold-500/20 bg-night-900 p-2 text-sm text-ivory-100 shadow-2xl">
          <p className="truncate px-3 py-2 text-ivory-100/60">{name}</p>
          <Link href="/packages" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 hover:bg-night-700">
            Premium packages
          </Link>
          <button type="button" onClick={signOut} className="block w-full rounded-xl px-3 py-2 text-left text-gold-400 hover:bg-night-700">
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
