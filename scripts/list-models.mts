const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
  headers: { "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
});
if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
const { models } = (await res.json()) as { models: { name: string; supportedGenerationMethods: string[] }[] };
for (const m of models) if (m.supportedGenerationMethods.includes("generateContent")) console.log(m.name);

