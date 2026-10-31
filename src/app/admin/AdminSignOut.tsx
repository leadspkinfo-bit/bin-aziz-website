"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminSignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-night-950 transition hover:bg-gold-400"
    >
      Sign out
    </button>
  );
}
