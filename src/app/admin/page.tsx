import { Suspense } from "react";
import { getAdmin } from "@/lib/admin";
// TEMP: restore with the unlock check below
// import { hasControls } from "@/lib/controlsUnlock";
import type { SettingRow } from "@/lib/settings";
import { AdminShell, NoAdminAccess } from "./AdminShell";
import { InquiriesList, type Inquiry } from "./inquiries/InquiriesList";
// import { LockControls } from "./LockControls"; // TEMP
import { SecretUnlock } from "./SecretUnlock";
import { SettingsPanel } from "./SettingsPanel";

async function Dashboard() {
  const { supabase, user, isAdmin } = await getAdmin();
  if (!isAdmin) return <NoAdminAccess email={user.email} />;

  // Website controls render only after the hidden authenticator unlock (see SecretUnlock).
  // TEMP (user request, laptop clock ~2 min fast): authenticator unlock is off — every admin sees the controls.
  // To restore: delete the next line and uncomment the one after it (and the matching TEMP in actions.ts).
  const unlocked = true;
  // const unlocked = await hasControls(user.id);
  const [inquiries, settings] = await Promise.all([
    supabase
      .from("inquiries")
      .select("id, created_at, name, phone, email, service, travellers, travel_month, message, status")
      .order("created_at", { ascending: false })
      .limit(500),
    unlocked ? supabase.from("site_settings").select("key, label, grp, enabled").order("sort_order") : null,
  ]);

  // TEMP: lock button hidden while the unlock is off — restore: <AdminShell ... actions={unlocked ? <LockControls /> : null}>
  return (
    <AdminShell email={user.email}>
      <SecretUnlock />

      {unlocked && (
        <section className="mt-10 rounded-[2.5rem] border border-gold-500/25 bg-night-900/40 p-6 md:p-8">
          <h2 className="font-display text-4xl">Website controls</h2>
          {/* TEMP — restore: Unlocked for 15 minutes. Press “Lock controls” when you’re done. */}
          {settings?.error || !settings?.data?.length ? (
            <p className="mt-8 rounded-2xl bg-red-500/10 p-6 text-red-200">
              Settings table not found. Run <code>supabase/migrations/004_admin_settings.sql</code> in the Supabase SQL Editor.
            </p>
          ) : (
            <SettingsPanel rows={settings.data as SettingRow[]} />
          )}
        </section>
      )}

      <h1 className="mt-12 font-display text-4xl md:text-5xl">Inquiries</h1>
      <p className="mt-2 text-sm text-ivory-100/55">Everything sent from the website’s “Send an inquiry” form, newest first.</p>
      {inquiries.error ? (
        <p className="mt-8 rounded-2xl bg-red-500/10 p-6 text-red-200">
          Could not load inquiries. Run <code>supabase/migrations/005_admin_inquiries.sql</code> in the Supabase SQL Editor.
        </p>
      ) : (
        <InquiriesList initial={(inquiries.data ?? []) as Inquiry[]} />
      )}
    </AdminShell>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ivory-100/50">Loading…</div>}>
      <Dashboard />
    </Suspense>
  );
}
