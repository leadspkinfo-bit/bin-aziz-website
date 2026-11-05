"use client";

import { useState, useTransition } from "react";
import { useDialogs } from "@/components/ui/Dialogs";
import { saveRateSettings } from "../actions";
import { adminButton, adminInput } from "../styles";

const FIELDS = [
  ["profit_pkr", "Profit (PKR)"],
  ["ziyarat_makkah_sar", "Makkah ziyarat (SAR)"],
  ["ziyarat_madina_sar", "Madina ziyarat (SAR)"],
  ["sar_to_pkr", "SAR to PKR"],
  ["infant_price_pkr", "Infant price (PKR)"],
];

export function RateSettingsForm({ initial }: { initial: Record<string, number> }) {
  const { notify } = useDialogs();
  const [values, setValues] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-6 max-w-md space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveRateSettings(values);
          notify(res.ok ? "Settings saved." : res.message, res.ok ? "success" : "error");
        });
      }}
    >
      {FIELDS.map(([key, label]) => (
        <label key={key} className="block text-sm">
          {label}
          <input type="number" min={0} step="any" className={`${adminInput} mt-1`} value={values[key] ?? 0} onChange={(e) => setValues({ ...values, [key]: Number(e.target.value) })} />
        </label>
      ))}
      <button type="submit" disabled={pending} className={adminButton}>
        Save
      </button>
    </form>
  );
}
