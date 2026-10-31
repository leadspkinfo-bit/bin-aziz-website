import type { ReactNode } from "react";
import { AdminSignOut } from "./AdminSignOut";

/** Admin page chrome. `actions` adds buttons next to "View website". */
export function AdminShell({ email, actions, children }: { email: string | undefined; actions?: ReactNode; children: ReactNode }) {
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
