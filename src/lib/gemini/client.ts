import { GEMINI_MAX_TOKENS, GEMINI_MODELS } from "@/lib/calc/constants";
import { normalizeScan, type NormalizedScan } from "./normalize";
import { scanPrompt, type ScanTarget } from "./prompt";

export function geminiModels() {
  return process.env.GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean) ?? GEMINI_MODELS;
}

/**
 * `kind`: "limit" = rate limit (wait `retryAfter` seconds), "daily" = the model's daily quota is used up,
 * "plan" = the model isn't in this API plan at all, "retry" = busy / unreadable answer (try again),
 * "fatal" = the request itself is wrong.
 */
class ScanError extends Error {
  constructor(
    message: string,
    readonly kind: "limit" | "daily" | "plan" | "retry" | "fatal",
    readonly retryAfter = 0,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// the route may run 60 s on Vercel; stop starting new work well before that so the answer always arrives
const BUDGET_MS = 50_000;

/** Reads Gemini's 429 answer: how long to wait, and whether it is the per-minute or the per-day quota. */
function readLimit(body: string, model: string): ScanError {
  let delay = 0;
  const m = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body);
  if (m) delay = Math.ceil(Number(m[1]));
  // a free-tier quota of 0 = this model is not in the plan (the word "FreeTier" alone is just the quota name)
  if (/limit:\s*0\b/.test(body) || /billing|not available in your plan/i.test(body)) return new ScanError(`${model} aapke plan me shamil nahi hai.`, "plan");
  if (/PerDay/i.test(body)) return new ScanError(`${model} ki aaj ki limit poori ho gayi.`, "daily", delay);
  return new ScanError(`${model} par bohat requests — thodi der me khud dobara try hoga.`, "limit", delay || 30);
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
          ...(model.startsWith("gemini-2") ? { temperature: 0, topP: 0.1 } : {}),
        },
      }),
    });
  } catch {
    throw new ScanError(`${model} ne waqt par jawab nahi diya.`, "retry");
  }
  const body = await res.text();

  if (res.status === 429) throw readLimit(body, model);
  if (res.status >= 500) throw new ScanError(`${model} busy (HTTP ${res.status}).`, "retry");

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new ScanError(`${model}: jawab samajh nahi aaya (HTTP ${res.status}).`, res.ok ? "retry" : "fatal");
  }
  if (!res.ok) throw new ScanError(json?.error?.message ?? `${model} (HTTP ${res.status})`, res.status === 404 ? "plan" : "fatal");

  const candidate = json.candidates?.[0];
  if (!candidate) {
    const reason = json.promptFeedback?.blockReason;
    throw new ScanError(reason ? `Image block hui: ${reason}` : "Model se koi jawab nahi aaya.", reason ? "fatal" : "retry");
  }
  if (candidate.finishReason === "MAX_TOKENS") throw new ScanError("Jawab lamba ho gaya. Image chhote hisson me tor kar scan karo.", "retry");

  const text = (candidate.content?.parts ?? [])
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
  /** rate limited or out of time: nothing is wrong with the file — the page waits `retryAfter` s and tries again */
  | { status: "busy"; retryAfter: number; message: string }
  | { status: "error"; message: string };

/**
 * Tries each model once (a rate-limited model is skipped at once — every model has its own quota — instead
 * of being hammered with retries that eat the quota); a busy/unreadable answer gets one more try on the
 * same model while time allows. When every model is only rate limited, or time runs out, the answer is
 * "busy" with the wait Gemini asked for, so the page retries the file later instead of failing it.
 */
export async function scanImage(mime: string, base64: string, target: ScanTarget): Promise<ScanResult> {
  const started = Date.now();
  const left = () => BUDGET_MS - (Date.now() - started);
  let last = "Scan nahi ho saka.";
  let wait = 0;
  let limited = false;
  let outOfTime = false;
  for (const model of geminiModels()) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (left() < 8_000) {
        outOfTime = true;
        break;
      }
      try {
        return { status: "success", data: await callModel(model, mime, base64, target, left()), model };
      } catch (e) {
        const err = e instanceof ScanError ? e : new ScanError(e instanceof Error ? e.message : String(e), "retry");
        last = err.message;
        if (err.kind === "limit") {
          limited = true;
          wait = Math.max(wait, err.retryAfter);
        }
        if (err.kind === "daily") wait = Math.max(wait, err.retryAfter);
        if (err.kind !== "retry") break;
        if (attempt === 1) await sleep(1500);
      }
    }
    if (outOfTime) break;
  }
  if (limited) return { status: "busy", retryAfter: Math.min(Math.max(wait, 10), 90), message: last };
  if (outOfTime) return { status: "busy", retryAfter: 5, message: "Server ka waqt khatam — dobara try ho raha hai." };
  return { status: "error", message: last };
}
