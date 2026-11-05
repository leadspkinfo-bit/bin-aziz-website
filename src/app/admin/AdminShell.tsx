import type { ReactNode } from "react";
import Link from "next/link";
import { AdminSignOut } from "./AdminSignOut";

const SECTIONS = [
  ["/admin", "Inquiries"],
  ["/admin/quotations", "Quotations"],
  ["/admin/spos", "SPO activity"],
  ["/admin/rates/makkah", "Makkah hotels"],
  ["/admin/rates/madina", "Madina hotels"],
  ["/admin/rates/visa", "Visa"],
  ["/admin/rates/seasons", "Seasons"],
  ["/admin/rates/settings", "Settings"],
  ["/admin/scan", "AI sync"],
];

/** Admin page chrome. `actions` adds buttons next to "View website"; `nav={false}` hides the section tabs (/admin1998). */
export function AdminShell({ email, actions, nav = true, children }: { email: string | undefined; actions?: ReactNode; nav?: boolean; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">Bin Aziz · Admin panel</p>
          <p className="mt-2 text-sm text-ivory-100/55">Signed in as {email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {actions}
          <a href="/" target="_blank" rel="noopener noreferrer" className="rounded-full border border-ivory-100/20 px-5 py-2.5 text-sm transition hover:border-gold-400">
            View website ↗
          </a>
          <AdminSignOut />
        </div>
      </header>
      {nav && (
        <nav aria-label="Admin" className="mt-6 flex flex-wrap gap-2">
          {SECTIONS.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full border border-ivory-100/15 px-4 py-1.5 text-xs transition hover:border-gold-400 hover:text-gold-300">
              {label}
            </Link>
          ))}
        </nav>
      )}
      {children}
    </div>
  );
}

export function NoAdminAccess({ email }: { email: string | undefined }) {
  return (
    <div className="mx-auto max-w-md py-32 text-center">
      <h1 className="font-display text-4xl">No admin access</h1>
      <p className="mt-3 text-ivory-100/60">{email} is not an admin account.</p>
      <div className="mt-8">
        <AdminSignOut />
      </div>
    </div>
  );
}
