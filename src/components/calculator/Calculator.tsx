"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useDialogs } from "@/components/ui/Dialogs";
import { BRAND, BRANCHES, STANDARD_RATES } from "@/lib/calc/constants";
import type { PublicResult } from "@/lib/calc/quotations";
import type { RateCatalog } from "@/lib/calc/rates";
import { sortPeriods } from "@/lib/calc/seasons";
import type { CalcSections } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";
import { AdminRatesPanel } from "./AdminRatesPanel";
import { cityPeriods, newPackage, packagePeriods, reducer, toPayload } from "./calcState";
import { PdfPreview, whatsappMessage, whatsappNumber, WhatsappPreview } from "./ShareTools";
import { Field, inputClass, PackageCard } from "./PackageCard";
import { SpoPicker } from "./SpoPicker";
import type { Spo } from "@/lib/spos";

const actionClass =
  "flex-1 rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide text-white uppercase shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60 max-[600px]:min-w-full";
const shareClass =
  "rounded-xl px-3 py-3 text-xs font-bold tracking-wide text-white uppercase shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60";
const emptyHotels = { makkah: {}, madina: {} };

function Spinner() {
  return <span aria-hidden className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]" />;
}

/** `sections`: which parts of the page the admin has switched on (/admin1998). */
/** `adminUnlocked`: the ADMIN code was entered (server cookie); only then do the scan panel and Save show. */
/** `spos`: the names for "Prepared By" (admin list); every WhatsApp send / PDF download is logged against one. */
export function Calculator({ sections, adminUnlocked: unlockedAtLoad, spos }: { sections: CalcSections; adminUnlocked: boolean; spos: Spo[] }) {
  const { notify } = useDialogs();
  const [rates, setRates] = useState<RateCatalog | null>(null);
  const [client, setClient] = useState({ familyHead: "", contactNo: "", branch: BRANCHES[0], preparedBy: "", spoId: "", notes: "" });
  const [packages, dispatch] = useReducer(reducer, null, () => [newPackage()]);
  const [results, setResults] = useState<PublicResult | null>(null);
  const [busy, setBusy] = useState<"calc" | "pdf" | "preview" | "save" | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [waPreview, setWaPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(unlockedAtLoad);

  const loadRates = useCallback(
    () =>
      fetch("/api/rates", { cache: "no-store" })
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((data: RateCatalog) => {
          setRates(data);
          setResults(null);
        })
        .catch(() => notify("Could not load the rates. Please refresh.", "error")),
    [notify],
  );

  useEffect(() => {
    void loadRates();
    createClient()
      .rpc("is_admin")
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [loadRates]);

  const periods = useMemo(() => ({ makkah: cityPeriods(rates?.hotels.makkah ?? {}), madina: cityPeriods(rates?.hotels.madina ?? {}) }), [rates]);

  const clearResults = () => {
    setResults(null);
  };
  // the quote's "Package Season" line: every rate period the packages use (shown parts only), in calendar order
  const seasonLine = () =>
    sortPeriods(
      packages.flatMap((p) => {
        const used = packagePeriods(p, periods);
        return [...(sections.calc_makkah ? used.makkah : []), ...(sections.calc_madina ? used.madina : [])];
      }),
    ).join(" / ");
  // a switched-off part is left out of the quotation, not just hidden
  const payload = () =>
    packages.map((p) => {
      const out = toPayload(p, periods);
      return {
        ...out,
        makkahList: sections.calc_makkah ? out.makkahList : [],
        madinaList: sections.calc_madina ? out.madinaList : [],
        childDetails: sections.calc_children ? out.childDetails : [],
        notes: sections.calc_notes ? out.notes : "",
      };
    });
  const body = () => ({ ...client, season: seasonLine() || STANDARD_RATES, packages: payload() });

  async function calculate() {
    if (!rates) return setErrors(["Rates are still loading."]);
    // a hotel picked without dates would be left out of the price: ask for its dates instead
    const noDates = packages.flatMap((p, i) =>
      (["makkah", "madina"] as const)
        .filter((c) => (c === "makkah" ? sections.calc_makkah : sections.calc_madina))
        .flatMap((c) => (c === "makkah" ? p.makkahList : p.madinaList).filter((h) => h.hotelId && !h.stays.length).map((h) => `Package ${i + 1}: choose the dates for ${rates.hotels[c][h.hotelId]?.name ?? "the hotel"}.`)),
    );
    if (noDates.length) return setErrors(noDates);
    const missing = payload().flatMap((p, i) => (p.makkahList.length || p.madinaList.length ? [] : [`Package ${i + 1}: please add at least one hotel.`]));
    if (missing.length) return setErrors(missing);
    setBusy("calc");
    try {
      const res = await fetch("/api/calculate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body()) });
      const data = await res.json();
      // a room that is N/A on the rate list: list every one so they can all be fixed at once
      if (res.status === 400 && typeof data.message === "string") return setErrors(data.message.split("\n"));
      if (!res.ok) throw new Error(data.message);
      setResults(data);
    } catch (e) {
      notify(e instanceof Error && e.message ? e.message : "Could not calculate. Please try again.", "error");
    } finally {
      setBusy(null);
    }
  }

  // the packages block needs its own switch on, and at least one part of a package to show
  const showPackages = sections.calc_packages && (sections.calc_ticket || sections.calc_makkah || sections.calc_madina || sections.calc_children || sections.calc_notes);

  const fileName = () => `${client.familyHead || "Client"}_Umrah_Quotation.pdf`;

  async function fetchPdf() {
    const res = await fetch("/api/quotations/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body()) });
    if (!res.ok) throw new Error();
    return res.blob();
  }

  function saveBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName();
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Runs one of the PDF buttons: needs a calculation first, shows a spinner, reports failures. */
  async function withPdf(kind: "pdf" | "preview", handle: (blob: Blob) => void) {
    if (!results) return notify("Please calculate all packages first.", "info");
    setBusy(kind);
    try {
      handle(await fetchPdf());
    } catch {
      notify("Could not create the PDF. Please try again.", "error");
    } finally {
      setBusy(null);
    }
  }

  /**
   * Who is sending: the "Prepared By" pick. Required while the client details are on the page, so every
   * sent quotation counts for one SPO in the admin's activity log.
   */
  const needSpo = () => {
    // no list yet (016_spo_activity.sql not run): never block sending
    if (!sections.calc_client || client.spoId || !spos.length) return false;
    notify("Choose your name in “Prepared By” first.", "error");
    return true;
  };

  /** Records a sent quotation for the SPO (admin activity log). Never blocks sending. */
  const logSent = (action: "whatsapp" | "pdf") => {
    if (!client.spoId) return;
    void fetch("/api/quotations/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body(), spoId: client.spoId, action }),
      keepalive: true,
    })
      .then((r) => (r.ok ? null : r.json()))
      .then((d) => d?.message && console.warn("activity log:", d.message))
      .catch(() => {});
  };

  const downloadPdf = () => {
    if (needSpo()) return;
    return withPdf("pdf", (blob) => {
      saveBlob(blob);
      logSent("pdf");
    });
  };

  const previewPdf = () =>
    withPdf("preview", (blob) => {
      const url = URL.createObjectURL(blob);
      // phone browsers can't show a PDF inside the page
      if (window.matchMedia("(max-width: 767px)").matches) window.open(url, "_blank");
      else setPreviewUrl(url);
    });

  const closePreview = () => {
    URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  /** Opens the client's WhatsApp chat with every detail of the quotation written out; the user presses send. */
  function sendWhatsapp() {
    const number = whatsappNumber(client.contactNo);
    if (!number) return notify("Enter the client's contact number first (e.g. 0300 1234567).", "error");
    if (!results) return notify("Please calculate all packages first.", "info");
    if (needSpo()) return;
    const chat = window.open(`https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage(client, results))}`, "_blank");
    if (!chat) return notify("Allow pop-ups for this site to open WhatsApp.", "error");
    logSent("whatsapp");
  }

  async function save() {
    setBusy("save");
    try {
      const res = await fetch("/api/quotations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body()) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      notify("Quotation saved.", "success");
    } catch (e) {
      notify(e instanceof Error && e.message ? e.message : "Could not save.", "error");
    } finally {
      setBusy(null);
    }
  }

  const patchClient = (patch: Partial<typeof client>) => setClient((c) => ({ ...c, ...patch }));

  return (
    <div className="relative mx-auto max-w-[900px] rounded-2xl border border-t-8 border-slate-200 border-t-[#8e1b34] bg-white p-[30px] font-[Segoe_UI,Roboto,Helvetica,Arial,sans-serif] text-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.1)] max-[600px]:p-4">
      <button
        type="button"
        onClick={() => setAdminOpen(true)}
        className="absolute top-4 right-4 rounded-lg bg-[#044064] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#8e1b34]"
      >
        ADMIN
      </button>
      <header className="text-center max-[600px]:pt-8">
        <p className="text-[22px] font-extrabold tracking-[1.5px] text-[#044064]">𝐁𝐈𝐍 𝐀𝐙𝐈𝐙 𝐆𝐑𝐎𝐔𝐏</p>
        <h1 className="text-[26px] font-bold text-[#8e1b34]">UMRAH CALCULATOR</h1>
        <p className="mt-1 border-b-[3px] border-double border-[#8e1b34] pb-2.5 text-[13px] font-bold tracking-[2px] text-[#044064]">MULTI-PACKAGE QUOTATION</p>
      </header>

      {sections.calc_client && (
        <>
          <div className="mt-5 flex flex-wrap gap-3">
            <Field label="Family Head Name">{(id) => <input id={id} className={inputClass} value={client.familyHead} onChange={(e) => patchClient({ familyHead: e.target.value })} />}</Field>
            <Field label="Contact Number">{(id) => <input id={id} className={inputClass} value={client.contactNo} onChange={(e) => patchClient({ contactNo: e.target.value })} />}</Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Field label="Select Branch">
              {(id) => (
                <select id={id} className={inputClass} value={client.branch} onChange={(e) => patchClient({ branch: e.target.value })}>
                  {BRANCHES.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Prepared By">{(id) => <SpoPicker id={id} spos={spos} value={client.spoId} onChange={(s) => patchClient({ spoId: s.id, preparedBy: s.name })} />}</Field>
          </div>
        </>
      )}

      {showPackages && (
        <>
          {packages.map((pkg, i) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              number={i + 1}
              hotels={rates?.hotels ?? emptyHotels}
              periods={periods}
              result={results?.packages[i]}
              canRemove={packages.length > 1}
              sections={sections}
              dispatch={dispatch}
              onChange={clearResults}
              onRemove={() => {
                dispatch({ type: "remove", id: pkg.id });
                clearResults();
              }}
            />
          ))}

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "add" });
                clearResults();
              }}
              className="rounded-xl bg-[#044064] px-6 py-2.5 text-sm font-bold tracking-wide text-white uppercase transition-all hover:-translate-y-0.5 hover:bg-[#8e1b34] max-[600px]:w-full"
            >
              + ADD PACKAGE
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={calculate} disabled={busy !== null} className={`${actionClass} bg-[#8e1b34]`}>
              {busy === "calc" && <Spinner />}CALCULATE ALL
            </button>
            {isAdmin && adminUnlocked && results && (
              <button type="button" onClick={save} disabled={busy !== null} className={`${actionClass} bg-slate-600`}>
                {busy === "save" && <Spinner />}SAVE QUOTATION
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3 max-[600px]:grid-cols-2">
            <button type="button" onClick={downloadPdf} disabled={busy !== null} className={`${shareClass} bg-[#044064]`}>
              {busy === "pdf" && <Spinner />}DOWNLOAD
            </button>
            <button type="button" onClick={previewPdf} disabled={busy !== null} className={`${shareClass} bg-[#0b5c8a]`}>
              {busy === "preview" && <Spinner />}PREVIEW
            </button>
            <button type="button" onClick={sendWhatsapp} disabled={busy !== null} className={`${shareClass} bg-[#25d366]`}>
              WHATSAPP
            </button>
            <button
              type="button"
              onClick={() => (results ? setWaPreview(true) : notify("Please calculate all packages first.", "info"))}
              disabled={busy !== null}
              className={`${shareClass} bg-[#128c7e]`}
            >
              WHATSAPP PREVIEW
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border-2 border-[#8e1b34] shadow-lg">
            <p aria-live="polite" className="bg-[#8e1b34] p-4 text-center text-[22px] font-extrabold tracking-[1px] text-white">
              GRAND TOTAL: {(results?.grandTotal ?? 0).toLocaleString("en-US")} PKR
            </p>
            <p className="bg-white p-2.5 text-center text-[11px] text-slate-500">
              Helpline: {BRAND.helpline}
              <br />
              {BRAND.address}
            </p>
          </div>
        </>
      )}

      {previewUrl && <PdfPreview url={previewUrl} onDownload={() => void downloadPdf()} onClose={closePreview} />}
      {waPreview && results && (
        <WhatsappPreview
          number={whatsappNumber(client.contactNo)}
          message={whatsappMessage(client, results)}
          onClose={() => setWaPreview(false)}
          onSend={() => {
            setWaPreview(false);
            sendWhatsapp();
          }}
        />
      )}

      {adminOpen && (
        <AdminRatesPanel
          unlocked={adminUnlocked}
          onUnlocked={setAdminUnlocked}
          isAdmin={isAdmin}
          onAdmin={setIsAdmin}
          onSynced={loadRates}
          onClose={() => setAdminOpen(false)}
        />
      )}

      {errors.length > 0 && (
        <div role="alertdialog" aria-modal="true" aria-label="Please check" className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-[#8e1b34]">Please check</h3>
            <ul className="mt-3 space-y-1 text-sm">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <button type="button" autoFocus onClick={() => setErrors([])} className="mt-5 w-full rounded-lg bg-[#044064] py-2 text-sm font-bold text-white">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
