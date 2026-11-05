"use client";

import { useState, useTransition } from "react";
import { useDialogs } from "@/components/ui/Dialogs";
import type { SettingKey, SettingRow } from "@/lib/settings";
import { toggleSetting } from "./actions";

const groups: { grp: SettingRow["grp"]; title: string; hint: string }[] = [
  { grp: "pages", title: "Pages", hint: "A switched-off page disappears from the menu and shows “page not found”." },
  { grp: "home", title: "Home page sections", hint: "Show or hide each section of the home page." },
  { grp: "calculator", title: "Calculator page", hint: "Show or hide each part of the Umrah calculator. A hidden part is left out of the quotation too." },
  { grp: "security", title: "Security", hint: "Blocks right-click, F12 and Ctrl+Shift+I / Ctrl+U. It deters casual copying — browsers can still open Inspect from their menu." },
];

function Switch({ on, busy, onChange, label, big = false }: { on: boolean; busy: boolean; onChange: () => void; label: string; big?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onChange}
      className={`relative shrink-0 rounded-full transition-colors duration-300 disabled:opacity-60 ${
        big ? "h-12 w-24" : "h-7 w-12"
      } ${on ? "bg-emerald-500" : "bg-ivory-100/20"}`}
    >
      <span
        className={`absolute top-1 left-1 rounded-full bg-white shadow transition-transform duration-300 ${
          big ? "size-10" : "size-5"
        } ${on ? (big ? "translate-x-12" : "translate-x-5") : ""}`}
      />
    </button>
  );
}

export function SettingsPanel({ rows }: { rows: SettingRow[] }) {
  const [values, setValues] = useState(() => Object.fromEntries(rows.map((r) => [r.key, r.enabled])) as Record<SettingKey, boolean>);
  const [busyKey, setBusyKey] = useState<SettingKey | null>(null);
  const [, startTransition] = useTransition();
  const { confirm, notify } = useDialogs();

  async function flip(key: SettingKey) {
    const next = !values[key];
    const label = rows.find((r) => r.key === key)?.label ?? key;
    if (key === "site_enabled" && !next) {
      const ok = await confirm({
        title: "Turn the entire website off?",
        message: "Every visitor will see a blank 404 page until you switch it back on. The admin panel keeps working.",
        confirmLabel: "Turn website off",
        tone: "danger",
      });
      if (!ok) return;
    }

    setBusyKey(key);
    setValues((v) => ({ ...v, [key]: next })); // optimistic
    startTransition(async () => {
      const result = await toggleSetting(key, next);
      if (result.ok) {
        notify(key === "site_enabled" ? (next ? "Website is live again" : "Website is now off") : `${label} turned ${next ? "on" : "off"}`);
      } else {
        setValues((v) => ({ ...v, [key]: !next }));
        notify(result.message, "error");
      }
      setBusyKey(null);
    });
  }

  const mega = rows.find((r) => r.key === "site_enabled");
  const siteOn = values.site_enabled;

  return (
    <div className="mt-10 space-y-8">
      {mega && (
        <section
          className={`flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border p-8 transition-colors md:p-10 ${
            siteOn ? "border-emerald-400/30 bg-emerald-500/10" : "border-red-400/40 bg-red-500/15"
          }`}
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-gold-400 uppercase">Mega switch</p>
            <h2 className="mt-2 font-display text-4xl">{mega.label}</h2>
            <p className={`mt-2 font-semibold ${siteOn ? "text-emerald-300" : "text-red-300"}`}>
              {siteOn ? "● Website is LIVE" : "● Website is OFF — visitors see a blank 404 page"}
            </p>
          </div>
          <Switch big on={siteOn} busy={busyKey === "site_enabled"} onChange={() => flip("site_enabled")} label={mega.label} />
        </section>
      )}

      <div className={`grid gap-6 transition-opacity lg:grid-cols-2 ${siteOn ? "" : "opacity-50"}`}>
        {groups.map(({ grp, title, hint }) => {
          const items = rows.filter((r) => r.grp === grp);
          if (!items.length) return null;
          return (
            <section key={grp} className={`rounded-[2rem] border border-ivory-100/10 bg-night-900/60 p-6 md:p-8 ${grp === "security" ? "lg:col-span-2" : ""}`}>
              <h2 className="font-display text-2xl">{title}</h2>
              <p className="mt-1 text-sm text-ivory-100/50">{hint}</p>
              <ul className="mt-6 divide-y divide-ivory-100/10">
                {items.map((r) => (
                  <li key={r.key} className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <p className="font-medium">{r.label}</p>
                      <p className={`text-xs ${values[r.key] ? "text-emerald-300" : "text-ivory-100/40"}`}>{values[r.key] ? "On" : "Off"}</p>
                    </div>
                    <Switch on={values[r.key]} busy={busyKey === r.key} onChange={() => flip(r.key)} label={r.label} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {!siteOn && <p className="text-center text-sm text-ivory-100/50">Individual switches are saved, but the whole site is off right now.</p>}
    </div>
  );
}
