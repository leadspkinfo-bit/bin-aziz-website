import { Suspense } from "react";
import { getAdmin } from "@/lib/admin";
import { AdminShell, NoAdminAccess } from "./AdminShell";
import { InquiriesList, type Inquiry } from "./inquiries/InquiriesList";

// The website's on/off switches moved to /admin1998 (user request, 2026-11-02).
async function Dashboard() {
  const { supabase, user, isAdmin } = await getAdmin();
  if (!isAdmin) return <NoAdminAccess email={user.email} />;

  const inquiries = await supabase
    .from("inquiries")
    .select("id, created_at, name, phone, email, service, travellers, travel_month, message, status")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <AdminShell email={user.email}>
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
