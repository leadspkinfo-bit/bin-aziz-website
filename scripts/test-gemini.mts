import { GEMINI_MODELS } from "../src/lib/calc/constants";

const models = process.env.GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean) ?? GEMINI_MODELS;

for (const model of models) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with the single word: OK" }] }] }),
  });
  console.log(res.ok ? `OK   ${model}` : `FAIL ${model} HTTP ${res.status} ${(await res.text()).slice(0, 160)}`);
}

