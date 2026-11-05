"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useDialogs } from "@/components/ui/Dialogs";
import { addSeason, deleteSeason, orderSeasons } from "../actions";
import { adminButton, adminGhost, adminInput } from "../styles";

type Season = { id: string; name: string };

export function SeasonsEditor({ seasons, usedIds }: { seasons: Season[]; usedIds: string[] }) {
  const { confirm, notify } = useDialogs();
  const router = useRouter();
  const [list, setList] = useState(seasons);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  const move = (index: number, by: number) => {
    const next = [...list];
    next.splice(index + by, 0, next.splice(index, 1)[0]);
    setList(next);
    start(async () => {
      const res = await orderSeasons(next.map((s) => s.id));
      if (!res.ok) notify(res.message, "error");
    });
  };

  const add = () =>
    start(async () => {
      const res = await addSeason(name);
      if (!res.ok) return notify(res.message, "error");
      setName("");
      router.refresh();
    });

  const remove = async (s: Season) => {
    const used = usedIds.includes(s.id);
    const ok = await confirm({
      title: `Delete ${s.name}?`,
      message: used ? "Hotels have rates in this season. Those rates are deleted too." : undefined,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    const res = await deleteSeason(s.id);
    if (!res.ok) return notify(res.message, "error");
    router.refresh();
  };

  return (
    <div className="mt-6 max-w-xl">
      <div className="flex gap-2">
        <input aria-label="New season name" placeholder="New season name" className={adminInput} value={name} onChange={(e) => setName(e.target.value)} />
        <button type="button" disabled={pending} className={adminButton} onClick={add}>
          Add
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {list.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2 rounded-2xl border border-ivory-100/10 px-4 py-2.5">
            <span className="min-w-0 flex-1 text-sm">{s.name}</span>
            <button type="button" aria-label="Move up" disabled={i === 0} className="px-2 disabled:opacity-30" onClick={() => move(i, -1)}>
              ↑
            </button>
            <button type="button" aria-label="Move down" disabled={i === list.length - 1} className="px-2 disabled:opacity-30" onClick={() => move(i, 1)}>
              ↓
            </button>
            <button type="button" className={`${adminGhost} text-xs text-red-300`} onClick={() => remove(s)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
