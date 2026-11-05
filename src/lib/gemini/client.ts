import { GEMINI_MAX_TOKENS, GEMINI_MODELS, GEMINI_RETRIES } from "@/lib/calc/constants";
import { normalizeScan, type NormalizedScan } from "./normalize";
import { scanPrompt, type ScanTarget } from "./prompt";

export function geminiModels() {
  return process.env.GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean) ?? GEMINI_MODELS;
}

class ScanError extends Error {
  constructor(message: string, readonly retry: boolean) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callModel(model: string, mime: string, base64: string, target: ScanTarget): Promise<NormalizedScan> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: scanPrompt(target) }, { inline_data: { mime_type: mime, data: base64 } }] }],
      generationConfig: {
        maxOutputTokens: GEMINI_MAX_TOKENS,
        responseMimeType: "application/json",
        ...(model.startsWith("gemini-2") ? { temperature: 0, topP: 0.1 } : {}),
      },
    }),
  });
  const body = await res.text();

  if (res.status === 429) {
    if (/billing|plan|free.?tier/i.test(body)) throw new ScanError(`${model} aapke plan me shamil nahi hai.`, false);
    throw new ScanError(`${model} par bohat requests — thodi der baad try karo.`, true);
  }
  if (res.status >= 500) throw new ScanError(`${model} busy (HTTP ${res.status}).`, true);

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new ScanError(`${model}: jawab samajh nahi aaya (HTTP ${res.status}).`, res.ok);
  }
  if (!res.ok) throw new ScanError(json?.error?.message ?? `${model} (HTTP ${res.status})`, false);

  const candidate = json.candidates?.[0];
  if (!candidate) {
    const reason = json.promptFeedback?.blockReason;
    throw new ScanError(reason ? `Image block hui: ${reason}` : "Model se koi jawab nahi aaya.", !reason);
  }
  if (candidate.finishReason === "MAX_TOKENS") throw new ScanError("Jawab lamba ho gaya. Image chhote hisson me tor kar scan karo.", true);

  const text = (candidate.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .replace(/```json|```/g, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new ScanError("JSON nahi mila. Image shayad dhundhli hai.", true);
  try {
    return normalizeScan(JSON.parse(text.slice(start, end + 1)), target);
  } catch {
    throw new ScanError("JSON nahi mila. Image shayad dhundhli hai.", true);
  }
}

/** Every model in order, each with retries; a non-retryable error moves on to the next model. */
export async function scanImage(mime: string, base64: string, target: ScanTarget) {
  let last = "Scan nahi ho saka.";
  for (const model of geminiModels()) {
    for (let attempt = 1; attempt <= GEMINI_RETRIES; attempt++) {
      try {
        return { status: "success" as const, data: await callModel(model, mime, base64, target), model };
      } catch (e) {
        last = e instanceof Error ? e.message : String(e);
        if (e instanceof ScanError && !e.retry) break;
        if (attempt < GEMINI_RETRIES) await sleep(1200 * attempt);
      }
    }
  }
  return { status: "error" as const, message: last };
}
