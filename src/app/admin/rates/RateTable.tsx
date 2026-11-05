"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useDialogs } from "@/components/ui/Dialogs";
import { ROOM_TYPES, type RoomType } from "@/lib/calc/constants";
import type { ScanRate } from "@/lib/gemini/normalize";
import { deleteHotel, importHotels, saveHotel, type HotelForm } from "./actions";
import { adminButton, adminGhost, adminInput } from "./styles";

export type Season = { id: string; name: string };
type Rates = Record<RoomType, number>;
export type Hotel = { id?: string; name: string; location: string; rates: Record<string, Rates> };

const NO_RATES: Rates = { sharing: 0, quint: 0, quad: 0, triple: 0, double: 0 };

/** Minimal CSV reader: quoted cells, doubled quotes, commas and newlines inside quotes. */
function parseCsv(text: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === "," || c === "\n") {
      row.push(cell);
      cell = "";
      if (c === "\n") {
        rows.push(row);
        row = [];
      }
    } else if (c !== "\r") cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

function HotelEditor({ hotel, seasons, city, onDone }: { hotel: Hotel; seasons: Season[]; city: "makkah" | "madina"; onDone: () => void }) {
  const { notify } = useDialogs();
  const router = useRouter();
  const [form, setForm] = useState(hotel);
  const [pending, start] = useTransition();

  const setRate = (season: string, room: RoomType, value: number) =>
    setForm((f) => ({ ...f, rates: { ...f.rates, [season]: { ...(f.rates[season] ?? NO_RATES), [room]: value } } }));

  const save = () =>
    start(async () => {
      const rates: HotelForm["rates"] = {};
      for (const s of seasons) rates[s.id] = form.rates[s.id] ?? NO_RATES;
      const res = await saveHotel({ ...form, city, rates });
      if (!res.ok) return notify(res.message, "error");
      notify("Hotel saved.", "success");
      onDone();
      router.refresh();
    });

  return (
    <div className="mt-3 rounded-2xl border border-gold-500/30 bg-night-900/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <input aria-label="Hotel name" placeholder="Hotel name" className={adminInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input aria-label="Location" placeholder="Location" className={adminInput} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="text-left text-xs text-ivory-100/55 capitalize">
              <th className="py-1 pr-2 font-medium">Season</th>
              {ROOM_TYPES.map((r) => (
                <th key={r} className="px-1 py-1 font-medium">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {seasons.map((s) => (
              <tr key={s.id}>
                <td className="py-1 pr-2 text-xs">{s.name}</td>
                {ROOM_TYPES.map((r) => (
                  <td key={r} className="px-1 py-1">
                    <input
                      aria-label={`${s.name} ${r}`}
                      type="number"
                      min={0}
                      step="any"
                      className={adminInput}
                      value={form.rates[s.id]?.[r] ?? 0}
                      onChange={(e) => setRate(s.id, r, Number(e.target.value))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {seasons.length === 0 && <p className="mt-2 text-sm text-ivory-100/60">Add a season first to enter rates.</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={pending} onClick={save} className={adminButton}>
          Save
        </button>
        <button type="button" onClick={onDone} className={adminGhost}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function RateTable({ city, hotels, seasons }: { city: "makkah" | "madina"; hotels: Hotel[]; seasons: Season[] }) {
  const { confirm, notify } = useDialogs();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<{ key: string; hotel: Hotel } | null>(null);
  const [, start] = useTransition();

  const remove = async (h: Hotel) => {
    if (!(await confirm({ title: `Delete ${h.name}?`, message: "Its rates for every season are deleted too.", confirmLabel: "Delete", tone: "danger" }))) return;
    const res = await deleteHotel(h.id!);
    if (!res.ok) return notify(res.message, "error");
    notify("Hotel deleted.", "success");
    router.refresh();
  };

  const exportCsv = () => {
    const header = ["Hotel Name", "Location", ...seasons.flatMap((s) => ROOM_TYPES.map((r) => `${s.name}|${r}`))];
    const rows = hotels.map((h) => [h.name, h.location, ...seasons.flatMap((s) => ROOM_TYPES.map((r) => h.rates[s.id]?.[r] ?? 0))]);
    const blob = new Blob([[header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${city}-hotels.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importCsv = async (file: File) => {
    const [header, ...rows] = parseCsv(await file.text());
    const nameAt = header?.findIndex((h) => h.trim().toLowerCase() === "hotel name") ?? -1;
    if (nameAt < 0) return notify('The CSV needs a "Hotel Name" column. Use Export CSV for the layout.', "error");
    const locationAt = header.findIndex((h) => h.trim().toLowerCase() === "location");
    const list = rows
      .filter((r) => r[nameAt]?.trim())
      .map((r) => {
        const periods = new Map<string, ScanRate>();
        header.forEach((h, i) => {
          const [period, room] = h.split("|").map((p) => p.trim());
          const key = room?.toLowerCase() as RoomType;
          if (!period || !ROOM_TYPES.includes(key)) return;
          if (!periods.has(period)) periods.set(period, { period, ...NO_RATES });
          periods.get(period)![key] = Number(r[i]) || 0;
        });
        return { name: r[nameAt].trim(), location: r[locationAt]?.trim() || "-", rates: [...periods.values()] };
      });
    if (!list.length) return notify("No hotels found in this file.", "error");
    start(async () => {
      const res = await importHotels(city, list);
      if (!res.ok) return notify(res.message, "error");
      notify(`${list.length} hotels imported.`, "success");
      router.refresh();
    });
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={adminButton} onClick={() => setEditing({ key: "new", hotel: { name: "", location: "", rates: {} } })}>
          Add hotel
        </button>
        <button type="button" className={adminGhost} onClick={() => fileRef.current?.click()}>
          Import CSV
        </button>
        <button type="button" className={adminGhost} onClick={exportCsv}>
          Export CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          aria-label="CSV file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void importCsv(file);
          }}
        />
      </div>
      {editing?.key === "new" && <HotelEditor hotel={editing.hotel} seasons={seasons} city={city} onDone={() => setEditing(null)} />}

      <div className="mt-5 space-y-2">
        {hotels.length === 0 && <p className="text-sm text-ivory-100/55">No hotels yet.</p>}
        {hotels.map((h) => (
          <div key={h.id} className="rounded-2xl border border-ivory-100/10 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold">{h.name}</p>
                <p className="text-xs text-ivory-100/55">{h.location}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <button type="button" className={adminGhost} onClick={() => setEditing({ key: h.id!, hotel: h })}>
                  Edit
                </button>
                <button type="button" className={adminGhost} onClick={() => setEditing({ key: "new", hotel: { ...h, id: undefined, name: `${h.name} copy` } })}>
                  Duplicate
                </button>
                <button type="button" className={`${adminGhost} text-red-300`} onClick={() => remove(h)}>
                  Delete
                </button>
              </div>
            </div>
            {editing && editing.key === h.id && <HotelEditor hotel={editing.hotel} seasons={seasons} city={city} onDone={() => setEditing(null)} />}
          </div>
        ))}
      </div>
    </div>
  );
}
