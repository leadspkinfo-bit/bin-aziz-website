import * as THREE from "three";

// Ticket faces are drawn on 2D canvases and used as textures. The base face
// is always visible; the details face fades in once the ticket turns
// horizontal; the back face is seen while the ticket banks along its path.

export const TEX_W = 2048;
export const TEX_H = 904; // same ratio as the 3.4 × 1.5 ticket
export const STUB_RATIO = 0.72; // where the perforation sits

export const NIGHT = "#0a1128";
export const NIGHT_2 = "#18244d";
export const GOLD = "#c9a35b";
export const GOLD_LIGHT = "#ecd9a8";
export const IVORY = "#f5efe3";

export function fonts() {
  const css = getComputedStyle(document.documentElement);
  return {
    display: css.getPropertyValue("--font-cormorant").trim() || "serif",
    sans: css.getPropertyValue("--font-manrope").trim() || "sans-serif",
  };
}

export function canvas(w = TEX_W, h = TEX_H) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

export function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(text, x, y);
  ctx.letterSpacing = "0px";
}

export function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  return img.decode().then(() => img);
}

function plane(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size / 24, size / 24);
  ctx.translate(-12, -12);
  ctx.fill(new Path2D("M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"));
  ctx.restore();
}

async function drawBase() {
  const [c, ctx] = canvas();
  const f = fonts();
  const stubX = TEX_W * STUB_RATIO;

  const bg = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  bg.addColorStop(0, NIGHT);
  bg.addColorStop(1, NIGHT_2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // soft glow behind the route
  const glow = ctx.createRadialGradient(stubX * 0.5, TEX_H * 0.62, 40, stubX * 0.5, TEX_H * 0.62, 700);
  glow.addColorStop(0, "rgba(201,163,91,0.18)");
  glow.addColorStop(1, "rgba(201,163,91,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, stubX, TEX_H);

  // faint lattice
  ctx.strokeStyle = "rgba(201,163,91,0.06)";
  ctx.lineWidth = 2;
  for (let x = -TEX_H; x < TEX_W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + TEX_H, TEX_H);
    ctx.stroke();
  }

  // stub panel
  const stub = ctx.createLinearGradient(stubX, 0, TEX_W, TEX_H);
  stub.addColorStop(0, "#d8b878");
  stub.addColorStop(0.5, GOLD_LIGHT);
  stub.addColorStop(1, GOLD);
  ctx.fillStyle = stub;
  ctx.fillRect(stubX, 0, TEX_W - stubX, TEX_H);

  // gold inner frame on the main panel
  ctx.strokeStyle = "rgba(220,192,138,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, stubX - 80, TEX_H - 80);

  // perforation
  ctx.strokeStyle = "rgba(10,17,40,0.55)";
  ctx.lineWidth = 6;
  ctx.setLineDash([18, 18]);
  ctx.beginPath();
  ctx.moveTo(stubX, 40);
  ctx.lineTo(stubX, TEX_H - 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // header
  try {
    const logo = await loadImage("/brand/logo-ivory.png");
    const h = 150;
    ctx.drawImage(logo, 90, 80, (logo.width / logo.height) * h, h);
  } catch {
    ctx.fillStyle = IVORY;
    ctx.font = `600 90px ${f.display}`;
    ctx.fillText("BIN AZIZ", 90, 190);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = GOLD;
  ctx.font = `700 34px ${f.sans}`;
  spaced(ctx, "BOARDING PASS", stubX - 90, 140, 12);
  ctx.fillStyle = "rgba(245,239,227,0.55)";
  ctx.font = `500 28px ${f.sans}`;
  spaced(ctx, "UMRAH · TICKETING · VISAS", stubX - 90, 190, 6);
  ctx.textAlign = "left";

  // route arc
  const ax = 230, bx = stubX - 230, ay = 560;
  ctx.strokeStyle = "rgba(236,217,168,0.7)";
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 16]);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo((ax + bx) / 2, ay - 230, bx, ay);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const x of [ax, bx]) {
    ctx.fillStyle = GOLD_LIGHT;
    ctx.beginPath();
    ctx.arc(x, ay, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = GOLD_LIGHT;
  plane(ctx, (ax + bx) / 2, ay - 115, 84, Math.PI / 2);

  // stub: barcode + labels
  const sx = stubX + 70;
  ctx.fillStyle = NIGHT;
  ctx.font = `800 30px ${f.sans}`;
  spaced(ctx, "ADMIT ONE", sx, 130, 10);
  let seed = 7;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  let bxp = sx;
  while (bxp < TEX_W - 80) {
    const w = 4 + Math.floor(rand() * 4) * 4;
    ctx.fillRect(bxp, TEX_H - 250, w, 170);
    bxp += w + 6 + Math.floor(rand() * 3) * 5;
  }
  return toTexture(c);
}

async function drawDetails() {
  const [c, ctx] = canvas();
  const f = fonts();
  const stubX = TEX_W * STUB_RATIO;
  const ax = 230, bx = stubX - 230, ay = 560;

  const label = (text: string, x: number, y: number, align: CanvasTextAlign = "left", color = "rgba(220,192,138,0.85)", spacing = 8) => {
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.font = `700 24px ${f.sans}`;
    spaced(ctx, text, x, y, spacing);
  };
  const value = (text: string, x: number, y: number, size: number, align: CanvasTextAlign = "left", color = IVORY) => {
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px ${f.display}`;
    ctx.fillText(text, x, y);
  };

  label("PASSENGER", 90, 300);
  value("Guest of Allah", 90, 372, 72);

  label("FROM", ax, ay + 70, "center");
  value("LHE", ax, ay + 170, 110, "center");
  label("LAHORE", ax, ay + 240, "center", "rgba(245,239,227,0.6)", 6);
  label("TO", bx, ay + 70, "center");
  value("JED", bx, ay + 170, 110, "center");
  label("JEDDAH · MAKKAH", bx, ay + 240, "center", "rgba(245,239,227,0.6)", 5);

  label("CLASS", stubX - 90, 300, "right");
  value("Amanah", stubX - 90, 372, 64, "right", GOLD_LIGHT);

  const sx = stubX + 70;
  label("SEAT", sx, 240, "left", "rgba(10,17,40,0.7)");
  value("1A", sx, 330, 96, "left", NIGHT);
  label("FLIGHT", sx + 230, 240, "left", "rgba(10,17,40,0.7)");
  value("BA 786", sx + 230, 330, 72, "left", NIGHT);
  label("SERVICE", sx, 430, "left", "rgba(10,17,40,0.7)");
  value("Khidmat · Ikhlaas", sx, 505, 58, "left", NIGHT);
  return toTexture(c);
}

async function drawBack() {
  const [c, ctx] = canvas();
  ctx.fillStyle = IVORY;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.strokeStyle = "rgba(169,132,63,0.22)";
  ctx.lineWidth = 2;
  const s = 90;
  for (let y = 0; y < TEX_H + s; y += s) {
    for (let x = 0; x < TEX_W + s; x += s) {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeRect(-24, -24, 48, 48);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-24, -24, 48, 48);
      ctx.restore();
    }
  }
  try {
    const logo = await loadImage("/brand/logo-color.png");
    const h = 300;
    const w = (logo.width / logo.height) * h;
    ctx.fillStyle = IVORY;
    ctx.fillRect(TEX_W / 2 - w / 2 - 60, TEX_H / 2 - h / 2 - 50, w + 120, h + 100);
    ctx.drawImage(logo, TEX_W / 2 - w / 2, TEX_H / 2 - h / 2, w, h);
  } catch {
    /* pattern alone is fine */
  }
  return toTexture(c);
}

let ticketTextures: Promise<{ base: THREE.Texture; details: THREE.Texture; back: THREE.Texture }> | null = null;

/** Drawn once and shared: the journey ticket and its copy in the services stack use the same faces. */
export function createTicketTextures() {
  return (ticketTextures ??= (async () => {
    const f = fonts();
    await Promise.all([document.fonts.load(`600 72px ${f.display}`), document.fonts.load(`700 24px ${f.sans}`)]).catch(() => undefined);
    const [base, details, back] = await Promise.all([drawBase(), drawDetails(), drawBack()]);
    return { base, details, back };
  })());
}
