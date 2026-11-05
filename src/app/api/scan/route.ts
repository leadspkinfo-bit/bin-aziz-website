import { adminClient } from "@/lib/admin";
import { scanImage } from "@/lib/gemini/client";
import type { ScanTarget } from "@/lib/gemini/prompt";

export const maxDuration = 60;

const TARGETS: ScanTarget[] = ["makkah", "madina", "transport", "auto"];

export async function POST(request: Request) {
  if (!(await adminClient())) return Response.json({ status: "error", message: "Admin login required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const match = /^data:(image\/[\w+.-]+|application\/pdf);base64,([\s\S]+)$/.exec(typeof body?.image === "string" ? body.image : "");
  if (!match || !TARGETS.includes(body.target)) return Response.json({ status: "error", message: "Image nahi mili." }, { status: 400 });
  return Response.json(await scanImage(match[1], match[2], body.target));
}
