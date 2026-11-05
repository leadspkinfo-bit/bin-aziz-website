"use client";

import { useId, useState, type ActionDispatch, type ReactNode } from "react";
import { AIRLINES, ROOM_TYPES, type RoomType } from "@/lib/calc/constants";
import { rateSeason, type RateHotel } from "@/lib/calc/engine";
import type { PublicResult } from "@/lib/calc/quotations";
import { periodLabel, SEASONS, seasonOf } from "@/lib/calc/seasons";
import type { CalcSections } from "@/lib/settings";
import { dayMs, newStay, periodsOf, resolvePeriod, rowNights, stayDates, stayNights, type Action, type City, type PackageState, type Stay, type StayRow } from "./calcState";
import { HotelPicker } from "./HotelPicker";
import { StayCalendar } from "./StayCalendar";

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 outline-none transition focus:border-[#8e1b34] focus:ring-3 focus:ring-[#8e1b34]/10";
const addClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-400 px-3 py-2 text-xs font-bold tracking-wide text-slate-600 uppercase transition hover:border-solid hover:border-[#044064] hover:text-[#044064] max-[600px]:w-full max-[600px]:justify-center";

export function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="min-w-0 flex-1 max-[600px]:min-w-full">
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      {children(id)}
    </div>
  );
}

function Delete({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 transition hover:bg-red-600 hover:text-white max-[600px]:w-full"
    >
      ✕
    </button>
  );
}

const SectionTitle = ({ children }: { children: ReactNode }) => <h4 className="mt-5 mb-2 border-l-[3px] border-[#8e1b34] pl-2 text-sm font-bold text-[#044064]">{children}</h4>;
const Row = ({ children }: { children: ReactNode }) => <div className="mt-3 flex flex-wrap gap-3">{children}</div>;
const num = (v: string) => (v === "" ? 0 : Number(v));

const barClass = (on: boolean) =>
  `rounded-lg border px-2 py-2 text-center text-xs font-semibold transition ${
    on ? "border-[#8e1b34] bg-[#8e1b34] text-white shadow" : "border-[#bae6fd] bg-white text-[#044064] hover:border-[#044064]"
  }`;

/** A period's name for a bar: its printed dates, or "General rate" for an undated one. */
const barLabel = (period: string) => periodLabel(period) || "General rate";

/** The short name of a stay's rate period on a chip: "1st Ashra", or "Before Ramadan · 10 DEC TILL 31 JAN". */
const chipName = (period: string) => {
  const season = (seasonOf(period) ?? period).replace(" Ramadan", "");
  const label = periodLabel(period);
  return label ? `${season} · ${label}` : season;
};

/**
 * Only a warning when something is wrong (no rates, room N/A, other dates used) — never a rate:
 * prices stay on the server and appear only as the package total and in the quotation.
 */
function rateWarning(hotel: RateHotel, room: RoomType, period: string): { text: string; red: boolean } | null {
  const used = rateSeason(hotel, period);
  const rate = used ? hotel.rates[used]?.[room] : undefined;
  if (!used) return { text: "this hotel is not available yet", red: true };
  if (seasonOf(used) !== seasonOf(period)) return { text: `no ${seasonOf(period) ?? period} rates for this hotel yet`, red: true };
  if (!rate) return { text: `${room.toUpperCase()} is not available — please choose another room`, red: true };
  if (used !== period) return { text: `not available for ${barLabel(period)} — ${barLabel(used)} is used`, red: false };
  return null;
}

type Open = { index: number; season: string; stay?: Stay };

/**
 * A city's hotels. Each hotel has its stays as removable chips: a season bar opens the calendar, the
 * chosen check-in/check-out becomes a chip ("1st Ashra · 18 Feb – 23 Feb 2027 · 5N ✕"), and several
 * seasons can be added to one hotel (e.g. 5 nights 1st Ashra + 5 nights Mid Ashra).
 */
function HotelRows({
  pkg,
  city,
  hotels,
  periods,
  dispatch,
}: {
  pkg: PackageState;
  city: City;
  hotels: Record<string, RateHotel>;
  periods: string[];
  dispatch: ActionDispatch<[Action]>;
}) {
  const [open, setOpen] = useState<Open | null>(null);
  const rows = city === "makkah" ? pkg.makkahList : pkg.madinaList;
  const title = city === "makkah" ? "Makkah" : "Madina";
  const nights = rows.reduce((sum, r) => sum + (r.hotelId ? rowNights(r) : 0), 0);
  const edit = (index: number, patch: Partial<StayRow>) => dispatch({ type: "hotelPatch", id: pkg.id, city, index, patch });
  // the season's dated bars from the rate list, or the plain season when none are uploaded
  const seasonPeriods = (season: string) => {
    const own = periodsOf(season, periods);
    return own.length ? own : [season];
  };

  return (
    <>
      <SectionTitle>
        {title} Hotels{nights > 0 && <span className="ml-2 font-normal text-slate-500">— {nights} nights in all</span>}
      </SectionTitle>
      {rows.map((row, index) => {
        const hotel = hotels[row.hotelId];
        const used = new Set(row.stays.map((s) => seasonOf(s.season)));
        const warnings = hotel
          ? row.stays.flatMap((s) => {
              const w = rateWarning(hotel, row.room, resolvePeriod(s.season, periods));
              return w ? [{ ...w, text: `${chipName(s.season)}: ${w.text}` }] : [];
            })
          : [];
        const na = (r: RoomType) =>
          Boolean(
            hotel &&
              row.stays.some((s) => {
                const p = rateSeason(hotel, resolvePeriod(s.season, periods));
                return p && !((hotel.rates[p]?.[r] ?? 0) > 0);
              }),
          );
        return (
          <div key={index} className="mb-3 rounded-xl border border-[#bae6fd] bg-[#e0f2fe] p-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-48 flex-[3] max-[600px]:min-w-full">
                <HotelPicker label={`${title} hotel`} value={row.hotelId} hotels={hotels} onChange={(id) => edit(index, { hotelId: id })} />
              </div>
              <div className="min-w-28 flex-1 max-[600px]:min-w-full">
                <select aria-label="Room type" className={`${inputClass} capitalize`} value={row.room} onChange={(e) => edit(index, { room: e.target.value as RoomType })}>
                  {ROOM_TYPES.map((r) => (
                    <option key={r} value={r}>
                      {na(r) ? `${r} (N/A)` : r}
                    </option>
                  ))}
                </select>
              </div>
              <Delete label={`Remove ${title} hotel`} onClick={() => dispatch({ type: "hotelRemove", id: pkg.id, city, index })} />
            </div>

            <fieldset className="mt-3 min-w-0 rounded-lg border border-[#bae6fd] bg-white p-2.5">
              <legend className="px-1 text-xs font-bold text-[#044064]">
                📅 Stay {index + 1} &amp; dates{rowNights(row) > 0 && <span className="font-normal text-slate-500"> — {rowNights(row)} nights</span>}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {SEASONS.map((s) => {
                  // rates uploaded for this season: a golden line runs round the bar (CSS .rate-glow)
                  const hasRates = periodsOf(s, periods).length > 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={used.has(s)}
                      title={hasRates ? `${s}: rates uploaded` : `${s}: no rates uploaded yet`}
                      onClick={() => setOpen({ index, season: s })}
                      className={`${barClass(used.has(s))} flex-1 basis-28 ${hasRates ? "rate-glow" : ""}`}
                    >
                      + {s}
                    </button>
                  );
                })}
              </div>
              <ul aria-label={`Stay ${index + 1} dates`} className="mt-2 flex min-h-9 items-center gap-1.5 overflow-x-auto pb-1">
                {row.stays.length === 0 && <li className="text-[11px] text-slate-500">Tap a season to choose check-in and check-out dates.</li>}
                {[...row.stays]
                  .sort((a, b) => a.from.localeCompare(b.from))
                  .map((s) => (
                    <li key={s.id} className="flex shrink-0 items-center rounded-full border border-[#8e1b34]/30 bg-[#8e1b34]/5 text-xs text-[#044064]">
                      <button
                        type="button"
                        title="Change these dates"
                        onClick={() => setOpen({ index, season: seasonOf(s.season) ?? s.season, stay: s })}
                        className="py-1.5 pr-1 pl-3 text-left whitespace-nowrap"
                      >
                        <span className="font-bold text-[#8e1b34]">{chipName(s.season)}</span> · {stayDates(s)} · {stayNights(s)}N
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${chipName(s.season)} ${stayDates(s)}`}
                        onClick={() => edit(index, { stays: row.stays.filter((x) => x.id !== s.id) })}
                        className="mr-1 grid size-6 place-items-center rounded-full text-[#8e1b34] hover:bg-[#8e1b34] hover:text-white"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
              </ul>
            </fieldset>
            {warnings.map((w) => (
              <p key={w.text} className={`mt-2 w-full text-xs ${w.red ? "font-semibold text-red-600" : "text-amber-700"}`}>
                {w.text}
              </p>
            ))}
          </div>
        );
      })}
      <button type="button" className={addClass} onClick={() => dispatch({ type: "hotelAdd", id: pkg.id, city })}>
        + ADD {title.toUpperCase()} HOTEL
      </button>
      {open && rows[open.index] && (
        <StayCalendar
          season={open.season}
          periods={seasonPeriods(open.season)}
          editing={open.stay}
          taken={rows[open.index].stays.filter((s) => s.id !== open.stay?.id).map((s) => [dayMs(s.from), dayMs(s.to)] as [number, number])}
          onClose={() => setOpen(null)}
          onApply={(period, from, to) => {
            const row = rows[open.index];
            const stays = open.stay ? row.stays.map((s) => (s.id === open.stay!.id ? { ...s, season: period, from, to } : s)) : [...row.stays, newStay(period, from, to)];
            edit(open.index, { stays });
            setOpen(null);
          }}
        />
      )}
    </>
  );
}

function CustomAirlineModal({ onSave, onClose }: { onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    <div role="dialog" aria-modal="true" aria-label="Custom airline" className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-bold text-[#044064]">Enter airline name</h3>
        <input autoFocus aria-label="Airline name" className={`${inputClass} mt-3`} value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm text-slate-700">
            Cancel
          </button>
          <button type="button" disabled={!name.trim()} onClick={() => onSave(name.trim().toUpperCase())} className="flex-1 rounded-lg bg-[#8e1b34] py-2 text-sm font-bold text-white disabled:opacity-50">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

type Props = {
  pkg: PackageState;
  number: number;
  hotels: { makkah: Record<string, RateHotel>; madina: Record<string, RateHotel> };
  periods: { makkah: string[]; madina: string[] };
  result?: PublicResult["packages"][number];
  canRemove: boolean;
  sections: CalcSections;
  dispatch: ActionDispatch<[Action]>;
  onRemove: () => void;
  onChange: () => void;
};

export function PackageCard({ pkg, number, hotels, periods, result, canRemove, sections, dispatch, onRemove, onChange }: Props) {
  const [askAirline, setAskAirline] = useState(false);
  const send: ActionDispatch<[Action]> = (action) => {
    dispatch(action);
    onChange();
  };
  const patch = (p: Partial<PackageState>) => send({ type: "patch", id: pkg.id, patch: p });

  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-slate-200">
      <header className="flex items-center justify-between bg-[linear-gradient(135deg,#044064,#8e1b34)] px-4 py-3 text-white max-[600px]:flex-col max-[600px]:gap-2">
        <h3 className="font-bold tracking-wide">PACKAGE {number}</h3>
        {canRemove && (
          <button type="button" onClick={onRemove} className="rounded-md bg-white/20 px-3 py-1 text-xs font-bold transition hover:bg-red-600">
            REMOVE
          </button>
        )}
      </header>
      <div className="p-4">
        {sections.calc_ticket && (
          <>
            <Row>
              <Field label="Ticket Price (Per Adult)">{(id) => <input id={id} type="number" min={0} className={inputClass} value={pkg.ticketPrice || ""} onChange={(e) => patch({ ticketPrice: num(e.target.value) })} />}</Field>
              <Field label="Choose Airline">
                {(id) => (
                  <select
                    id={id}
                    className={inputClass}
                    value={pkg.airline}
                    onChange={(e) => {
                      patch({ airline: e.target.value, customAirline: "" });
                      if (e.target.value === "CUSTOM AIRLINE") setAskAirline(true);
                    }}
                  >
                    {AIRLINES.map((a) => (
                      <option key={a} value={a}>
                        {a === "CUSTOM AIRLINE" ? (pkg.customAirline ? `CUSTOM: ${pkg.customAirline}` : "CUSTOM") : a}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </Row>
            <Row>
              <Field label="Ticket Type 1">
                {(id) => (
                  <select id={id} className={inputClass} value={pkg.ticketType1} onChange={(e) => patch({ ticketType1: e.target.value as PackageState["ticketType1"] })}>
                    <option>Direct</option>
                    <option>Indirect</option>
                  </select>
                )}
              </Field>
              <Field label="Ticket Type 2">
                {(id) => (
                  <select id={id} className={inputClass} value={pkg.ticketType2} onChange={(e) => patch({ ticketType2: e.target.value as PackageState["ticketType2"] })}>
                    <option>Group Ticket</option>
                    <option>System Ticket</option>
                  </select>
                )}
              </Field>
            </Row>
            <Row>
              <Field label="Adults">{(id) => <input id={id} type="number" min={0} className={inputClass} value={pkg.adults} onChange={(e) => patch({ adults: num(e.target.value) })} />}</Field>
              <Field label="Transport Type">
                {(id) => (
                  <select id={id} className={inputClass} value={pkg.transportType} onChange={(e) => patch({ transportType: e.target.value as PackageState["transportType"] })}>
                    <option value="bus">BUS Sharing</option>
                    <option value="private">PRIVATE TRANSPORT</option>
                  </select>
                )}
              </Field>
            </Row>
            <Row>
              <Field label="Number of Infant">{(id) => <input id={id} type="number" min={0} className={inputClass} value={pkg.infants} onChange={(e) => patch({ infants: num(e.target.value) })} />}</Field>
              <div className="flex-1 max-[600px]:hidden" />
            </Row>
          </>
        )}

        {sections.calc_makkah && <HotelRows pkg={pkg} city="makkah" hotels={hotels.makkah} periods={periods.makkah} dispatch={send} />}
        {sections.calc_madina && <HotelRows pkg={pkg} city="madina" hotels={hotels.madina} periods={periods.madina} dispatch={send} />}

        {sections.calc_children && (
          <>
            <SectionTitle>Child Entries</SectionTitle>
            {pkg.childDetails.map((child, index) => (
              <div key={index} className="mb-2 flex flex-wrap items-end gap-2">
                <Field label="No. of Child">{(id) => <input id={id} type="number" min={0} className={inputClass} value={child.count || ""} onChange={(e) => send({ type: "childPatch", id: pkg.id, index, patch: { count: num(e.target.value) } })} />}</Field>
                <Field label="Child Ticket Price">{(id) => <input id={id} type="number" min={0} className={inputClass} value={child.price || ""} onChange={(e) => send({ type: "childPatch", id: pkg.id, index, patch: { price: num(e.target.value) } })} />}</Field>
                <Field label="Bed Type">
                  {(id) => (
                    <select id={id} className={inputClass} value={child.bedType} onChange={(e) => send({ type: "childPatch", id: pkg.id, index, patch: { bedType: e.target.value as typeof child.bedType } })}>
                      <option>With Bed</option>
                      <option>Without Bed</option>
                    </select>
                  )}
                </Field>
                <Delete label="Remove child entry" onClick={() => send({ type: "childRemove", id: pkg.id, index })} />
              </div>
            ))}
            <button type="button" className={addClass} onClick={() => send({ type: "childAdd", id: pkg.id })}>
              + ADD CHILD
            </button>
          </>
        )}


        {/* staff only: extra markup, shared into every traveller's price; never shown to the client as profit */}
        <div className="mt-5 max-w-xs">
          <Field label="Profit">
            {(id) => (
              <input
                id={id}
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="0"
                className={inputClass}
                value={pkg.extraProfit || ""}
                onChange={(e) => patch({ extraProfit: Math.max(0, num(e.target.value)) })}
              />
            )}
          </Field>
          <p className="mt-1 text-[11px] text-slate-500">Shared equally into every traveller&apos;s price — the client never sees it.</p>
        </div>

        {sections.calc_notes && (
          <div className="mt-5">
            <Field label="Additional Notes">{(id) => <textarea id={id} rows={2} className={inputClass} value={pkg.notes ?? ""} onChange={(e) => patch({ notes: e.target.value })} />}</Field>
          </div>
        )}
      </div>
      <footer className="flex items-center justify-between gap-3 bg-[#e8f4fd] px-4 py-3 text-sm text-[#044064] max-[600px]:flex-col">
        <span>{result ? `Package ${number} — ${result.adults} Adults, ${result.children} Children, ${result.infants} Infants` : `Package ${number} — Not calculated yet`}</span>
        <span className="text-base font-bold text-[#8e1b34]">PKR {(result?.finalPackageTotal ?? 0).toLocaleString("en-US")}</span>
      </footer>
      {askAirline && (
        <CustomAirlineModal
          onClose={() => {
            setAskAirline(false);
            patch({ airline: "NONE" });
          }}
          onSave={(name) => {
            setAskAirline(false);
            patch({ customAirline: name });
          }}
        />
      )}
    </section>
  );
}
