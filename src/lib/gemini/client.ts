import { GEMINI_MAX_TOKENS, GEMINI_MODELS } from "@/lib/calc/constants";
import { normalizeScan, type NormalizedScan } from "./normalize";
import { scanPrompt, type ScanTarget } from "./prompt";

export function geminiModels() {
  return process.env.GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean) ?? GEMINI_MODELS;
}

/**
 * `kind`: "daily" = the model's quota for today is used up (free tier: 20 requests a day per model),
 * "limit" = per-minute rate limit or the model is overloaded (wait `retryAfter` s), "plan" = the model
 * isn't available to this key, "retry" = no usable answer this time, "fatal" = the picture itself is refused.
 */
class ScanError extends Error {
  constructor(
    message: string,
    readonly kind: "daily" | "limit" | "plan" | "retry" | "fatal",
    readonly retryAfter = 0,
  ) {
    super(message);
  }
}

// the route may run 300 s on Vercel; stop starting new models well before that so an answer always arrives
const BUDGET_MS = 270_000;
const CALL_MS = 150_000;

/*
 * Models known to be out for a while (daily quota gone, or rate limited), so later scans don't spend
 * requests finding that out again. Lives as long as the server instance stays warm.
 */
const resting = new Map<string, number>();
const isResting = (model: string) => (resting.get(model) ?? 0) > Date.now();
const rest = (model: string, seconds: number) => resting.set(model, Date.now() + seconds * 1000);

/** Reads Gemini's 429 answer: per-day quota first (its text also says "billing"), then "not in plan", then per-minute. */
function readLimit(body: string, model: string): ScanError {
  const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body);
  const delay = m ? Math.ceil(Number(m[1])) : 0;
  if (/PerDay|per day/i.test(body)) return new ScanError(`${model}: aaj ki free limit khatam.`, "daily", delay || 6 * 3600);
  if (/limit:\s*0\b/.test(body)) return new ScanError(`${model} aapke plan me shamil nahi hai.`, "plan");
  return new ScanError(`${model} par bohat requests.`, "limit", delay || 30);
}

async function callModel(model: string, mime: string, base64: string, target: ScanTarget, timeoutMs: number): Promise<NormalizedScan> {
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: scanPrompt(target) }, { inline_data: { mime_type: mime, data: base64 } }] }],
        generationConfig: {
          maxOutputTokens: GEMINI_MAX_TOKENS,
          responseMimeType: "application/json",
          // reading a table needs little "thinking": low keeps a sheet to seconds instead of a minute
          ...(model.startsWith("gemini-2") ? { temperature: 0, topP: 0.1 } : { thinkingConfig: { thinkingLevel: "low" } }),
        },
      }),
    });
  } catch {
    throw new ScanError(`${model} ne waqt par jawab nahi diya.`, "retry");
  }
  const body = await res.text();

  if (res.status === 429) throw readLimit(body, model);
  if (res.status === 503 || res.status === 502) throw new ScanError(`${model} par is waqt rush hai.`, "limit", 20);
  if (res.status >= 500) throw new ScanError(`${model} busy (HTTP ${res.status}).`, "retry");

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new ScanError(`${model}: jawab samajh nahi aaya (HTTP ${res.status}).`, res.ok ? "retry" : "plan");
  }
  // 404 = the model was retired / isn't open to this key; 400 about thinking = an older model: try the next one
  if (!res.ok) throw new ScanError(json?.error?.message ?? `${model} (HTTP ${res.status})`, res.status === 404 || res.status === 400 || res.status === 403 ? "plan" : "retry");

  const candidate = json.candidates?.[0];
  if (!candidate) {
    const reason = json.promptFeedback?.blockReason;
    throw new ScanError(reason ? `Image block hui: ${reason}` : "Model se koi jawab nahi aaya.", reason ? "fatal" : "retry");
  }
  if (candidate.finishReason === "MAX_TOKENS") throw new ScanError("Jawab lamba ho gaya. Image chhote hisson me tor kar scan karo.", "retry");

  const text = (candidate.content?.parts ?? [])
    .filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .replace(/```json|```/g, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new ScanError("JSON nahi mila. Image shayad dhundhli hai.", "retry");
  try {
    return normalizeScan(JSON.parse(text.slice(start, end + 1)), target);
  } catch {
    throw new ScanError("JSON nahi mila. Image shayad dhundhli hai.", "retry");
  }
}

export type ScanResult =
  | { status: "success"; data: NormalizedScan; model: string }
  /** only rate limited / overloaded or out of time: nothing is wrong with the file — the page waits `retryAfter` s and tries again */
  | { status: "busy"; retryAfter: number; message: string }
  | { status: "error"; message: string };

/**
 * One request per model, best model first, never the same model twice for one file (every request
 * counts against the free tier's 20 a day per model). A model out of quota or rate limited is skipped
 * at once and remembered, so the next files go straight to a model that still has requests left.
 * Only rate limited / overloaded everywhere → "busy" (the page waits and retries); every model's daily
 * quota gone → a plain error saying so.
 */
export async function scanImage(mime: string, base64: string, target: ScanTarget): Promise<ScanResult> {
  const started = Date.now();
  const left = () => BUDGET_MS - (Date.now() - started);
  const models = geminiModels();
  const ready = models.filter((m) => !isResting(m));
  let last = "";
  let wait = 0;
  let busy = false;
  let daily = 0;
  for (const model of ready) {
    if (left() < 15_000) {
      busy = true;
      wait = Math.max(wait, 5);
      break;
    }
    try {
      return { status: "success", data: await callModel(model, mime, base64, target, Math.min(left(), CALL_MS)), model };
    } catch (e) {
      const err = e instanceof ScanError ? e : new ScanError(e instanceof Error ? e.message : String(e), "retry");
      last = err.message;
      if (err.kind === "fatal") return { status: "error", message: err.message };
      if (err.kind === "daily") {
        daily++;
        rest(model, err.retryAfter);
      } else if (err.kind === "limit") {
        busy = true;
        wait = Math.max(wait, err.retryAfter);
        rest(model, Math.min(err.retryAfter, 60));
      } else if (err.kind === "plan") rest(model, 24 * 3600);
    }
  }
  if (busy) return { status: "busy", retryAfter: Math.min(Math.max(wait, 10), 90), message: last || "Gemini busy." };
  // every model was skipped as resting: wait if one frees up within two minutes (a per-minute limit)
  if (!ready.length) {
    const soonest = Math.min(...models.map((m) => resting.get(m) ?? Infinity)) - Date.now();
    if (soonest < 120_000) return { status: "busy", retryAfter: Math.min(Math.max(Math.ceil(soonest / 1000), 10), 90), message: "Gemini busy." };
  }
  if (!ready.length || daily >= ready.length)
    return {
      status: "error",
      message: "Aaj ki free Gemini limit khatam ho gayi (har model din me 20 scans). Kal dobara try karein, ya Google AI Studio me billing on kar dein — phir limit ka masla nahi rahega.",
    };
  return { status: "error", message: last || "Scan nahi ho saka." };
}
