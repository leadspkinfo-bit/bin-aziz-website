import { Suspense } from "react";
import { getAdmin } from "@/lib/admin";
// TEMP: restore with the unlock check below
// import { hasControls } from "@/lib/controlsUnlock";
import type { SettingRow } from "@/lib/settings";
import { AdminShell, NoAdminAccess } from "../admin/AdminShell";
// import { LockControls } from "../admin/LockControls"; // TEMP
import { SecretUnlock } from "../admin/SecretUnlock";
import { SettingsPanel } from "../admin/SettingsPanel";

// The website's on/off switches, on their own page (user request). Same admin login as /admin.
// Kept secret: nothing links here — open it by typing /admin1998.
async function Controls() {
  const { supabase, user, isAdmin } = await getAdmin("/admin1998");
  if (!isAdmin) return <NoAdminAccess email={user.email} />;

  // Website controls render only after the hidden authenticator unlock (see SecretUnlock).
  // TEMP (user request, laptop clock ~2 min fast): authenticator unlock is off — every admin sees the controls.
  // To restore: delete the next line and uncomment the one after it (and the matching TEMP in admin/actions.ts).
  const unlocked = true;
  // const unlocked = await hasControls(user.id);
  const settings = unlocked ? await supabase.from("site_settings").select("key, label, grp, enabled").order("sort_order") : null;

  // TEMP: lock button hidden while the unlock is off — restore: <AdminShell ... actions={unlocked ? <LockControls /> : null}>
  return (
    <AdminShell email={user.email} nav={false}>
      <SecretUnlock />
      {unlocked && (
        <section className="mt-10 rounded-[2.5rem] border border-gold-500/25 bg-night-900/40 p-6 md:p-8">
          <h1 className="font-display text-4xl">Website controls</h1>
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
    </AdminShell>
  );
}

export default function Admin1998Page() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ivory-100/50">Loading…</div>}>
      <Controls />
    </Suspense>
  );
}
