import { Suspense, type ReactNode } from "react";
import { getAdmin } from "@/lib/admin";
import type { createClient } from "@/lib/supabase/server";
import { AdminShell, NoAdminAccess } from "../AdminShell";

type Client = Awaited<ReturnType<typeof createClient>>;

async function Gate({ title, render }: { title: string; render: (supabase: Client) => Promise<ReactNode> }) {
  const { supabase, user, isAdmin } = await getAdmin();
  if (!isAdmin) return <NoAdminAccess email={user.email} />;
  return (
    <AdminShell email={user.email}>
      <h1 className="mt-10 font-display text-4xl md:text-5xl">{title}</h1>
      {await render(supabase)}
    </AdminShell>
  );
}

/** Admin-only page chrome for the rate and quotation sections. */
export function AdminPage({ title, render }: { title: string; render: (supabase: Client) => Promise<ReactNode> }) {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ivory-100/50">Loading…</div>}>
      <Gate title={title} render={render} />
    </Suspense>
  );
}

export const MISSING_SQL = (
  <p className="mt-8 rounded-2xl bg-red-500/10 p-6 text-red-200">
    Tables not found. Run <code>supabase/migrations/011_quotation_system.sql</code> in the Supabase SQL Editor.
  </p>
);
