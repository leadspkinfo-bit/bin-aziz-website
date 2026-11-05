"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDialogs } from "@/components/ui/Dialogs";
import { MAX_SYNC_IMAGES, SCAN_JPEG_QUALITY, SCAN_MAX_DIMENSION } from "@/lib/calc/constants";
import { periodLabel, seasonOf } from "@/lib/calc/seasons";
import type { Duplicate } from "@/lib/calc/hotelMemory";
import type { NameAnswer, NameQuestion, Rename } from "@/lib/calc/hotelNames";
import { combineScans, isEmptyScan, type NormalizedScan, type ScanHotel } from "@/lib/gemini/normalize";
import type { ScanTarget } from "@/lib/gemini/prompt";
import { adminButton, adminInput } from "../rates/styles";


function defaultTarget(name: string): ScanTarget {
  if (/madin|medina|mdn/i.test(name)) return "madina";
  if (/makk|mecca|mkh/i.test(name)) return "makkah";
  if (/visa|transport|bus/i.test(name)) return "transport";
  return "auto";
}

/** Resized on a white background so a phone photo fits the request and transparent PNGs stay readable. */
// Vercel refuses request bodies over 4.5 MB, and base64 makes a file a third bigger.
const MAX_PDF_BYTES = 3 * 1024 * 1024;

/** PDFs go to Gemini as they are (it reads every page); pictures are resized first. */
function prepareFile(file: File) {
  if (file.type !== "application/pdf") return prepareImage(file);
  if (file.size > MAX_PDF_BYTES) return Promise.reject(new Error(`${file.name} is larger than 3 MB. Split the PDF or upload its pages as pictures.`));
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`${file.name} could not be read.`));
    reader.readAsDataURL(file);
  });
}

function prepareImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} could not be read.`));
    };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, SCAN_MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", SCAN_JPEG_QUALITY));
    };
    img.src = url;
  });
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

type Status = "waiting" | "scanning" | "done" | "failed";
type Item = { id: number; file: File; target: ScanTarget; status: Status; scan?: NormalizedScan; error?: string };

// files are scanned two at a time: quicker than one by one, gentle enough for the Gemini rate limit
const PARALLEL = 2;
let nextId = 0;

const STATUS: Record<Status, { label: string; tone: string }> = {
  waiting: { label: "Waiting", tone: "text-ivory-100/50" },
  scanning: { label: "Scanning…", tone: "text-gold-300" },
  done: { label: "Scanned", tone: "text-emerald-300" },
  failed: { label: "Failed", tone: "text-red-300" },
};

/** One line per file after its scan: city, hotel count, and the seasons its rates were sorted into. */
function scanLine(scan: NormalizedScan) {
  const parts: string[] = [];
  if (scan.makkah.length) parts.push(`Makkah ${scan.makkah.length} hotels`);
  if (scan.madina.length) parts.push(`Madina ${scan.madina.length} hotels`);
  if (scan.visaBus.length || scan.visaPrivate.length) parts.push(`visa ${scan.visaBus.length + scan.visaPrivate.length} slabs`);
  if (scan.ziyarat.makkah || scan.ziyarat.madina) parts.push("ziyarat");
  const seasons = [...new Set(scan.periods.map((p) => seasonOf(p) ?? p))];
  return `${parts.join(" · ") || "nothing found"}${seasons.length ? ` → ${seasons.join(", ")}` : ""}`;
}

/**
 * Where the whole batch will go, season by season: each dated rate period with how many Makkah / Madina
 * hotels it prices. This is the auto-mapping, shown before anything is saved.
 */
function BatchPlan({ scan }: { scan: NormalizedScan }) {
  const count = (hotels: ScanHotel[], period: string) => hotels.filter((h) => h.rates.some((r) => r.period === period)).length;
  const bySeason = new Map<string, string[]>();
  for (const p of scan.periods) {
    const s = seasonOf(p) ?? p;
    bySeason.set(s, [...(bySeason.get(s) ?? []), p]);
  }
  return (
    <div className="mt-4 rounded-2xl border border-ivory-100/10 bg-night-900/60 p-4 text-sm">
      <p className="font-semibold text-gold-300">Auto-mapped — this is what will be saved</p>
      <ul className="mt-2 space-y-2">
        {[...bySeason].map(([season, periods]) => (
          <li key={season}>
            <p className="font-semibold text-ivory-50">{season}</p>
            <ul className="mt-0.5 space-y-0.5 pl-4 text-ivory-100/70">
              {periods.map((p) => (
                <li key={p}>
                  {periodLabel(p) || "General rate"} — Makkah {count(scan.makkah, p)} · Madina {count(scan.madina, p)} hotels
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

const slabs = (list: NormalizedScan["visaBus"]) => list.map((v) => `${v.pax} pax ${v.rate}`).join(", ");

/**
 * Visa, private transport and ziyarat are one list for the whole year, so a season's hotel sheet from a
 * supplier (e.g. "VISA 550 · ZIYARAT 10 SAR") would overwrite Bin Aziz's own. Shown here (admin only) with
 * a switch: off = the batch changes hotel rates only.
 */
function GlobalRates({ scan, on, onChange }: { scan: NormalizedScan; on: boolean; onChange: (on: boolean) => void }) {
  const lines = [
    scan.visaBus.length ? `Bus visa: ${slabs(scan.visaBus)} SAR` : "",
    scan.visaPrivate.length ? `Private transport: ${slabs(scan.visaPrivate)} SAR` : "",
    scan.ziyarat.makkah || scan.ziyarat.madina ? `Ziyarat: Makkah ${scan.ziyarat.makkah || "–"} · Madina ${scan.ziyarat.madina || "–"} SAR` : "",
  ].filter(Boolean);
  if (!lines.length) return null;
  return (
    <div className={`mt-3 rounded-2xl border p-4 text-sm ${on ? "border-amber-400/40 bg-amber-500/10" : "border-ivory-100/10 bg-night-900/60"}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-[#c9a35b]" />
        <span>
          <span className="font-semibold text-ivory-50">Also replace visa, private transport &amp; ziyarat with these</span>
          <span className="mt-0.5 block text-xs text-ivory-100/60">They apply to every season. Leave this off for a supplier&apos;s season sheet so your own rates stay.</span>
          <ul className={`mt-2 space-y-0.5 text-xs ${on ? "text-amber-100" : "text-ivory-100/50 line-through"}`}>
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </span>
      </label>
    </div>
  );
}

const WHY: Record<Rename["why"], string> = { split: "two hotels in one row", spelling: "same hotel, other spelling", remembered: "remembered", answer: "your answer" };

/**
 * How the scanned names were put under the stored hotels, and the names the scan is not sure about:
 * each answer is remembered on save, so the same spelling is never asked again.
 */
function NameCheck({
  names,
  answers,
  onAnswer,
}: {
  names: { renames: Rename[]; questions: NameQuestion[] };
  answers: NameAnswer[];
  onAnswer: (q: NameQuestion, target: string | null) => void;
}) {
  if (!names.renames.length && !names.questions.length) return null;
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs transition ${on ? "border-gold-400 bg-gold-500 text-night-950" : "border-ivory-100/20 hover:border-gold-400"}`;
  return (
    <div className="mt-3 rounded-2xl border border-ivory-100/10 bg-night-900/60 p-4 text-sm">
      {names.questions.length > 0 && (
        <div className="mb-3">
          <p className="font-semibold text-amber-200">Is this the same hotel? (asked once — your answer is remembered)</p>
          <ul className="mt-2 space-y-2">
            {names.questions.map((q) => {
              const a = answers.find((x) => x.city === q.city && x.name === q.name);
              return (
                <li key={q.city + q.name}>
                  <p className="text-ivory-50">
                    <span className="text-ivory-100/50 capitalize">{q.city}:</span> “{q.name}”
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {q.candidates.map((c) => (
                      <button key={c} type="button" onClick={() => onAnswer(q, c)} className={chip(a?.target === c)}>
                        Same as {c}
                      </button>
                    ))}
                    <button type="button" onClick={() => onAnswer(q, null)} className={chip(Boolean(a) && a!.target === null)}>
                      A different hotel
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {names.renames.length > 0 && (
        <>
          <p className="font-semibold text-gold-300">Names matched to your stored hotels</p>
          <ul className="mt-1 space-y-0.5 text-xs text-ivory-100/70">
            {names.renames.map((r) => (
              <li key={r.city + r.from + r.to}>
                {r.from} → <span className="text-ivory-50">{r.to}</span> <span className="text-ivory-100/40">({WHY[r.why]})</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * Hotels stored twice (two spellings, or an "A/B" row next to A and B), with a Merge button: the rates
 * move onto the kept hotel and the spelling is remembered for the next scan.
 */
export function DuplicateHotels({ onMerged }: { onMerged?: () => void }) {
  const { notify } = useDialogs();
  const [list, setList] = useState<Duplicate[] | null>(null);
  const [busy, setBusy] = useState("");
  const load = async () => {
    const res = await fetch("/api/hotel-duplicates").then((r) => r.json()).catch(() => null);
    setList(res?.status === "success" ? res.duplicates : []);
  };
  const merge = async (d: Duplicate) => {
    setBusy(d.drop.id);
    const res = await postJson("/api/hotel-duplicates", { dropId: d.drop.id, keepIds: d.keep.map((k) => k.id) }).catch(() => null);
    setBusy("");
    if (res?.status !== "success") return notify(res?.message ?? "Merge failed.", "error");
    onMerged?.();
    await load();
  };
  const mergeAll = async () => {
    for (const d of list ?? []) {
      setBusy(d.drop.id);
      const res = await postJson("/api/hotel-duplicates", { dropId: d.drop.id, keepIds: d.keep.map((k) => k.id) }).catch(() => null);
      if (res?.status !== "success") {
        setBusy("");
        await load();
        return notify(res?.message ?? "Merge failed.", "error");
      }
    }
    setBusy("");
    notify("All duplicate hotels merged.", "success");
    onMerged?.();
    await load();
  };
  if (list === null)
    return (
      <button type="button" onClick={load} className="mt-4 text-sm text-gold-300 underline-offset-2 hover:underline">
        Check for hotels stored twice (other spellings)
      </button>
    );
  if (!list.length) return <p className="mt-4 text-sm text-emerald-300">No hotel is stored twice.</p>;
  return (
    <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/5 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-amber-200">Hotels stored twice ({list.length})</p>
        <button type="button" disabled={Boolean(busy)} onClick={mergeAll} className={adminButton}>
          MERGE ALL
        </button>
      </div>
      <ul className="mt-2 space-y-1.5">
        {list.map((d) => (
          <li key={d.drop.id} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ivory-100/50 capitalize">{d.city}</span>
            <span className="min-w-0 flex-1">
              “{d.drop.name}” → {d.keep.map((k) => `“${k.name}”`).join(" + ")}
              <span className="text-ivory-100/40"> ({d.kind === "split" ? "rates go to both" : "same hotel, other spelling"})</span>
            </span>
            <button type="button" disabled={Boolean(busy)} onClick={() => merge(d)} className="rounded-full border border-ivory-100/20 px-3 py-1 hover:border-gold-400 disabled:opacity-40">
              {busy === d.drop.id ? "Merging…" : "Merge"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The scans without visa, transport and ziyarat (hotel rates only). */
const hotelsOnly = (s: NormalizedScan): NormalizedScan => ({ ...s, visaBus: [], visaPrivate: [], ziyarat: { makkah: 0, madina: 0 } });

/**
 * Bulk rate sync: drop or pick any mix of pictures and PDFs (more can be added later), scan them all in a
 * queue, check what each one gave and where its rates were sorted, then save the whole batch at once.
 * A failed file never stops the others; it can be retried or left out.
 * `onSynced` runs after the rates are saved, e.g. to reload the calculator's rates.
 */
export function ScanUploader({ onSynced }: { onSynced?: () => void } = {}) {
  const { notify, confirm } = useDialogs();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<"replace" | "merge">("replace");
  const [busy, setBusy] = useState<"" | "scan" | "save">("");
  const [dragging, setDragging] = useState(false);
  // off by default: a hotel sheet must not silently change the year-round visa / transport / ziyarat
  const [withGlobal, setWithGlobal] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);
  // how the batch's hotel names map onto stored hotels, and the admin's answers to the unsure ones
  const [names, setNames] = useState<{ renames: Rename[]; questions: NameQuestion[] } | null>(null);
  const [answers, setAnswers] = useState<NameAnswer[]>([]);
  const answer = (q: NameQuestion, target: string | null) =>
    setAnswers((list) => [...list.filter((a) => !(a.city === q.city && a.name === q.name)), { city: q.city, name: q.name, target }]);

  const update = (id: number, patch: Partial<Item>) => setItems((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const add = (files: FileList | File[] | null) => {
    const picked = [...(files ?? [])].filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
    setSummary([]);
    setItems((list) => {
      const fresh = picked.filter((f) => !list.some((x) => x.file.name === f.name && x.file.size === f.size));
      const room = MAX_SYNC_IMAGES - list.length;
      if (fresh.length > room) notify(`Up to ${MAX_SYNC_IMAGES} files per batch — ${fresh.length - Math.max(room, 0)} left out.`, "info");
      return [...list, ...fresh.slice(0, Math.max(room, 0)).map((file) => ({ id: ++nextId, file, target: defaultTarget(file.name), status: "waiting" as Status }))];
    });
  };

  async function scanOne(item: Item): Promise<NormalizedScan | null> {
    update(item.id, { status: "scanning", error: undefined });
    try {
      const res = await postJson("/api/scan", { image: await prepareFile(item.file), target: item.target });
      if (res.status !== "success") throw new Error(res.message);
      update(item.id, { status: "done", scan: res.data });
      return res.data;
    } catch (e) {
      update(item.id, { status: "failed", error: e instanceof Error ? e.message : "Scan failed." });
      return null;
    }
  }

  /** Asks the server how the batch's hotel names map onto the stored hotels (nothing is saved). */
  async function checkNames(scans: NormalizedScan[]) {
    if (!scans.length) return setNames(null);
    const res = await postJson("/api/apply-scan", { scans: scans.map(hotelsOnly), mode, dryRun: true }).catch(() => null);
    if (res?.status === "plan") setNames({ renames: res.renames, questions: res.questions });
  }

  /** Scans every file that isn't scanned yet (or failed), PARALLEL at a time, then checks the names. */
  async function scanAll(only?: Item[]) {
    const queue = (only ?? items).filter((x) => x.status === "waiting" || x.status === "failed");
    if (!queue.length) return;
    setBusy("scan");
    setSummary([]);
    const fresh: NormalizedScan[] = [];
    const workers = Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const s = await scanOne(next);
        if (s) fresh.push(s);
      }
    });
    await Promise.all(workers);
    await checkNames([...items.filter((x) => x.status === "done" && x.scan).map((x) => x.scan!), ...fresh]);
    setBusy("");
  }

  const done = items.filter((x) => x.status === "done" && x.scan);
  const failed = items.filter((x) => x.status === "failed");
  const waiting = items.filter((x) => x.status === "waiting");
  const batch = done.length ? combineScans(done.map((x) => x.scan!)) : null;

  async function save() {
    const scans = done.map((x) => (withGlobal ? x.scan! : hotelsOnly(x.scan!)));
    if (!batch || isEmptyScan(combineScans(scans))) return notify("Nothing to save: no hotel rates found (visa/ziyarat are switched off).", "error");
    if (failed.length || waiting.length) {
      const ok = await confirm({
        title: "Save without some files?",
        message: `${failed.length + waiting.length} file(s) are not scanned. Only the ${done.length} scanned file(s) will be saved.`,
        confirmLabel: "Save scanned files",
      });
      if (!ok) return;
    }
    // every name the server is not sure about must be answered first
    const open = names?.questions.filter((q) => !answers.some((a) => a.city === q.city && a.name === q.name)) ?? [];
    if (open.length) return notify(`Please answer ${open.length} hotel name question${open.length === 1 ? "" : "s"} above first.`, "info");
    setBusy("save");
    try {
      const res = await postJson("/api/apply-scan", { scans, mode, answers });
      if (res.status === "plan") {
        setNames({ renames: res.renames, questions: res.questions });
        return notify("Some hotel names need your answer before saving.", "info");
      }
      if (res.status !== "success") throw new Error(res.message);
      setNames(null);
      setAnswers([]);
      setSummary([
        ...(res.renames?.length ? [`Names matched: ${res.renames.length} (${res.renames.map((r: Rename) => `${r.from} → ${r.to}`).join(", ")})`] : []),
        `Makkah: ${res.makkahWritten} hotels`,
        `Madina: ${res.madinaWritten} hotels`,
        `Bus: ${res.visaBus} slabs`,
        `Private: ${res.visaPrivate} slabs`,
        `Periods: ${res.periods.join(", ")}`,
        ...(res.replacedSeasons?.length ? [`Replaced: ${res.replacedSeasons.join(", ")} (other seasons kept)`] : []),
        ...res.warnings,
      ]);
      setItems((list) => list.filter((x) => x.status !== "done"));
      notify("Rates updated.", "success");
      onSynced?.();
      router.refresh();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Sync failed.", "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-6 max-w-2xl">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`block cursor-pointer rounded-2xl border border-dashed p-8 text-center text-sm transition ${
          dragging ? "border-gold-400 bg-gold-500/10 text-ivory-50" : "border-ivory-100/30 text-ivory-100/70 hover:border-gold-400"
        }`}
      >
        <span className="block font-semibold">Drop rate-list pictures and PDFs here, or tap to choose</span>
        <span className="mt-1 block text-xs text-ivory-100/50">
          Several at once, pictures and PDFs mixed (up to {MAX_SYNC_IMAGES}; PDFs up to 3 MB). Each file&apos;s rates are sorted into their seasons by themselves.
        </span>
        <input
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-ivory-100/10 bg-night-900/40 p-2.5 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded bg-ivory-100/10 px-1.5 py-0.5 text-[10px] font-bold uppercase">{item.file.type === "application/pdf" ? "PDF" : "IMG"}</span>
                <span title={item.file.name} className="min-w-0 flex-1 truncate">
                  {item.file.name}
                </span>
                <span className={`shrink-0 text-xs ${STATUS[item.status].tone}`}>{STATUS[item.status].label}</span>
                <select
                  aria-label={`Target for ${item.file.name}`}
                  className="w-28 shrink-0 rounded-lg border border-ivory-100/15 bg-night-900 px-2 py-1.5 text-sm text-ivory-50 outline-none focus:border-gold-400"
                  value={item.target}
                  disabled={item.status === "scanning"}
                  onChange={(e) => update(item.id, { target: e.target.value as ScanTarget, status: "waiting", scan: undefined })}
                >
                  <option value="auto">Auto</option>
                  <option value="makkah">Makkah</option>
                  <option value="madina">Madina</option>
                  <option value="transport">Transport</option>
                </select>
                <button
                  type="button"
                  aria-label={`Remove ${item.file.name}`}
                  disabled={item.status === "scanning"}
                  onClick={() => {
                    setItems((list) => list.filter((x) => x.id !== item.id));
                    setNames(null);
                  }}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-ivory-100/60 hover:bg-red-500/20 hover:text-red-200 disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
              {item.scan && item.status === "done" && <p className="mt-1 pl-9 text-xs text-emerald-200/80">{scanLine(item.scan)}</p>}
              {item.status === "failed" && (
                <p className="mt-1 pl-9 text-xs text-red-200">
                  {item.error}{" "}
                  <button type="button" disabled={Boolean(busy)} onClick={() => scanAll([item])} className="font-semibold underline">
                    Retry
                  </button>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {batch && !busy && <BatchPlan scan={batch} />}
      {batch && !busy && names && <NameCheck names={names} answers={answers} onAnswer={answer} />}
      {batch && !busy && <GlobalRates scan={batch} on={withGlobal} onChange={setWithGlobal} />}

      <label className="mt-4 block text-sm">
        Sync mode
        <select className={`${adminInput} mt-1`} value={mode} onChange={(e) => setMode(e.target.value as "replace" | "merge")}>
          <option value="replace">Replace (rebuild only the seasons in these sheets, keep the rest)</option>
          <option value="merge">Merge (keep other hotels, update matches)</option>
        </select>
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled={Boolean(busy) || !(waiting.length || failed.length)} className={adminButton} onClick={() => scanAll()}>
          {busy === "scan"
            ? `SCANNING ${items.filter((x) => x.status === "done" || x.status === "failed").length}/${items.length}…`
            : `SCAN ${waiting.length + failed.length} FILE${waiting.length + failed.length === 1 ? "" : "S"}`}
        </button>
        <button type="button" disabled={Boolean(busy) || !done.length} className={adminButton} onClick={save}>
          {busy === "save" ? "SAVING…" : `SAVE RATES${done.length ? ` (${done.length})` : ""}`}
        </button>
        {items.length > 0 && !busy && (
          <button type="button" className="px-3 text-sm text-ivory-100/60 underline-offset-2 hover:underline" onClick={() => {
            setItems([]);
            setNames(null);
            setAnswers([]);
          }}>
            Clear all
          </button>
        )}
      </div>
      <DuplicateHotels
        onMerged={() => {
          onSynced?.();
          router.refresh();
        }}
      />
      {summary.length > 0 && (
        <ul aria-live="polite" className="mt-4 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
