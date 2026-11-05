"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useDialogs } from "@/components/ui/Dialogs";
import { saveVisa } from "../actions";
import { adminButton, adminGhost, adminInput } from "../styles";

type Row = { pax: number; rate: number };

export function VisaEditor({ bus, privateRows }: { bus: Row[]; privateRows: Row[] }) {
  const { notify } = useDialogs();
  const router = useRouter();
  const [tab, setTab] = useState<"bus" | "private">("bus");
  const [lists, setLists] = useState({ bus, private: privateRows });
  const [pending, start] = useTransition();
  const rows = lists[tab];
  const setRows = (next: Row[]) => setLists((l) => ({ ...l, [tab]: next }));

  const save = () =>
    start(async () => {
      const sorted = [...rows].sort((a, b) => a.pax - b.pax);
      const res = await saveVisa(tab, sorted);
      if (!res.ok) return notify(res.message, "error");
      setRows(sorted);
      notify("Rates saved.", "success");
      router.refresh();
    });

  return (
    <div className="mt-6 max-w-md">
      <div className="flex gap-2" role="tablist">
        {(["bus", "private"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={tab === t ? adminButton : adminGhost}>
            {t === "bus" ? "Bus" : "Private"}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-ivory-100/55">
          <span>Pax</span>
          <span>Rate SAR</span>
          <span className="w-8" />
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input aria-label="Pax" type="number" min={1} className={adminInput} value={r.pax || ""} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, pax: Number(e.target.value) } : x)))} />
            <input aria-label="Rate SAR" type="number" min={0} className={adminInput} value={r.rate || ""} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) } : x)))} />
            <button type="button" aria-label="Remove row" className="w-8 text-red-300" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" className={adminGhost} onClick={() => setRows([...rows, { pax: 0, rate: 0 }])}>
          Add row
        </button>
        <button type="button" disabled={pending} className={adminButton} onClick={save}>
          Save
        </button>
      </div>
    </div>
  );
}
