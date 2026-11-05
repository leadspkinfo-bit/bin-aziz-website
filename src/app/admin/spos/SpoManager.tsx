"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useDialogs } from "@/components/ui/Dialogs";
import { adminButton, adminInput } from "../rates/styles";
import { addSpo, setSpoActive, type SpoResult } from "./actions";

type Row = { id: string; name: string; active: boolean };

/** Add an SPO, or remove one from the calculator's "Prepared By" list (their history stays in the log). */
export function SpoManager({ spos }: { spos: Row[] }) {
  const { notify, confirm } = useDialogs();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const run = (job: () => Promise<SpoResult>, done?: string) =>
    start(async () => {
      const res = await job();
      if (!res.ok) return notify(res.message, "error");
      if (done) notify(done, "success");
      router.refresh();
    });

  const active = spos.filter((s) => s.active);
  const removed = spos.filter((s) => !s.active);

  return (
    <div>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = name.trim();
          if (!n) return;
          run(async () => {
            const res = await addSpo(n);
            if (res.ok) setName("");
            return res;
          }, `${n} added.`);
        }}
      >
        <input aria-label="New SPO name" placeholder="New SPO name" value={name} onChange={(e) => setName(e.target.value)} className={`${adminInput} min-w-0 flex-1`} maxLength={80} />
        <button type="submit" disabled={pending || !name.trim()} className={adminButton}>
          ADD SPO
        </button>
      </form>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {active.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-ivory-100/10 px-3 py-2 text-sm">
            <a href={`/admin/spos/${s.id}`} className="min-w-0 truncate hover:text-gold-300 hover:underline">
              {s.name}
            </a>
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                const ok = await confirm({ title: `Remove ${s.name}?`, message: "They disappear from “Prepared By”. Their quotations stay in the activity log.", confirmLabel: "Remove", tone: "danger" });
                if (ok) run(() => setSpoActive(s.id, false), `${s.name} removed.`);
              }}
              className="shrink-0 rounded-full border border-red-400/30 px-3 py-1 text-xs text-red-200 hover:bg-red-500/20 disabled:opacity-40"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {removed.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-ivory-100/60">Removed ({removed.length})</summary>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {removed.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-ivory-100/10 px-3 py-2 text-ivory-100/60">
                <a href={`/admin/spos/${s.id}`} className="min-w-0 truncate line-through hover:text-gold-300">
                  {s.name}
                </a>
                <button type="button" disabled={pending} onClick={() => run(() => setSpoActive(s.id, true), `${s.name} is back on the list.`)} className="shrink-0 rounded-full border border-ivory-100/20 px-3 py-1 text-xs hover:border-gold-400">
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
