import type * as THREE from "three";
import { canvas, fonts, GOLD, GOLD_LIGHT, IVORY, loadImage, NIGHT, NIGHT_2, spaced, toTexture } from "./ticketTextures";

// Faces for the key-card sized travel documents: the hotel voucher the ticket
// turns into, plus the transport voucher and visa that join it in the
// services stack. Everything is drawn in 2048-wide coordinates; the stack-only
// cards render smaller and print their details straight onto the front.

export const CARD_W = 3.4;
export const CARD_H = 2.14; // key-card ratio
const W = 2048;
const H = Math.round((W * CARD_H) / CARD_W);
const STACK_RES = 0.75;

export type CardTextures = { base: THREE.Texture; details?: THREE.Texture; back: THREE.Texture };
type Ctx = CanvasRenderingContext2D;

function surface(res = 1) {
  const [c, ctx] = canvas(Math.round(W * res), Math.round(H * res));
  ctx.scale(res, res);
  return [c, ctx] as const;
}

function star(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
}

/** Makkah skyline line art: the clock tower flanked by towers and minarets. */
function skyline(ctx: Ctx, x: number, base: number, s: number) {
  const rect = (dx: number, w: number, h: number) => ctx.fillRect(x + dx * s, base - h * s, w * s, h * s);
  rect(-260, 70, 150);
  rect(-180, 60, 210);
  rect(-110, 46, 120);
  rect(150, 60, 190);
  rect(220, 76, 140);
  rect(-48, 96, 300); // tower body
  rect(-36, 72, 70); // clock housing
  rect(-14, 28, 70); // spire base
  ctx.beginPath();
  ctx.moveTo(x - 6 * s, base - 440 * s);
  ctx.lineTo(x + 6 * s, base - 440 * s);
  ctx.lineTo(x, base - 520 * s);
  ctx.fill();
  for (const dx of [-330, 90, 320]) {
    rect(dx, 14, 230);
    ctx.beginPath();
    ctx.moveTo(x + (dx - 4) * s, base - 230 * s);
    ctx.lineTo(x + (dx + 18) * s, base - 230 * s);
    ctx.lineTo(x + (dx + 7) * s, base - 275 * s);
    ctx.fill();
  }
}

/** Fine guilloché waves, like a banknote. */
function waves(ctx: Ctx, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let k = 0; k < 26; k++) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 16) {
      const y = 140 + k * 44 + Math.sin(x / 140 + k * 0.5) * 26;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

/** Navy card with glow, guilloché, double gold frame, logo and a title top right. */
async function navyFace(ctx: Ctx, title: string) {
  const f = fonts();
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, NIGHT);
  bg.addColorStop(0.6, NIGHT_2);
  bg.addColorStop(1, "#0d1534");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.78, H * 0.3, 40, W * 0.78, H * 0.3, 900);
  glow.addColorStop(0, "rgba(201,163,91,0.22)");
  glow.addColorStop(1, "rgba(201,163,91,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  waves(ctx, "rgba(201,163,91,0.07)");

  ctx.strokeStyle = "rgba(220,192,138,0.7)";
  ctx.lineWidth = 4;
  ctx.strokeRect(46, 46, W - 92, H - 92);
  ctx.strokeStyle = "rgba(220,192,138,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(66, 66, W - 132, H - 132);

  try {
    const logo = await loadImage("/brand/logo-ivory.png");
    const h = 150;
    ctx.drawImage(logo, 120, 110, (logo.width / logo.height) * h, h);
  } catch {
    ctx.fillStyle = IVORY;
    ctx.font = `600 90px ${f.display}`;
    ctx.fillText("BIN AZIZ", 120, 220);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = GOLD;
  ctx.font = `700 34px ${f.sans}`;
  spaced(ctx, title, W - 120, 160, 12);
  ctx.textAlign = "left";
}

function writer(ctx: Ctx, light = true, labelColor = light ? "rgba(220,192,138,0.85)" : "rgba(169,132,63,0.95)") {
  const f = fonts();
  return {
    label(text: string, x: number, y: number, align: CanvasTextAlign = "left") {
      ctx.textAlign = align;
      ctx.fillStyle = labelColor;
      ctx.font = `700 24px ${f.sans}`;
      spaced(ctx, text, x, y, 8);
    },
    value(text: string, x: number, y: number, size = 64, color = light ? IVORY : NIGHT, align: CanvasTextAlign = "left") {
      ctx.textAlign = align;
      ctx.fillStyle = color;
      ctx.font = `600 ${size}px ${f.display}`;
      ctx.fillText(text, x, y);
    },
    caption(text: string, x: number, y: number, color: string) {
      ctx.textAlign = "left";
      ctx.fillStyle = color;
      ctx.font = `500 28px ${f.sans}`;
      spaced(ctx, text, x, y, 6);
    },
  };
}

function seal(ctx: Ctx, x: number, y: number, top: string, color: string) {
  const f = fonts();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.18);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 130, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 112, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.font = `800 34px ${f.sans}`;
  spaced(ctx, top, 6, 12, 6);
  ctx.font = `600 22px ${f.sans}`;
  spaced(ctx, "BIN AZIZ", 4, 56, 8);
  for (let i = 0; i < 5; i++) star(ctx, -56 + i * 28, -46, 10);
  ctx.restore();
}

/** Ivory back with the lattice pattern, an optional magnetic stripe and the colour logo. */
async function ivoryBack(footer: string, stripe: boolean, res = 1) {
  const [c, ctx] = surface(res);
  const f = fonts();
  ctx.fillStyle = IVORY;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(169,132,63,0.2)";
  ctx.lineWidth = 2;
  const s = 90;
  for (let y = 0; y < H + s; y += s) {
    for (let x = 0; x < W + s; x += s) {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeRect(-24, -24, 48, 48);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-24, -24, 48, 48);
      ctx.restore();
    }
  }
  if (stripe) {
    ctx.fillStyle = NIGHT;
    ctx.fillRect(0, 150, W, 200);
  }
  try {
    const logo = await loadImage("/brand/logo-color.png");
    const h = 260;
    const w = (logo.width / logo.height) * h;
    ctx.fillStyle = IVORY;
    ctx.fillRect(W / 2 - w / 2 - 60, 520, w + 120, h + 80);
    ctx.drawImage(logo, W / 2 - w / 2, 560, w, h);
  } catch {
    /* pattern alone is fine */
  }
  ctx.fillStyle = "rgba(10,17,40,0.6)";
  ctx.textAlign = "center";
  ctx.font = `600 28px ${f.sans}`;
  spaced(ctx, footer, W / 2, H - 110, 6);
  return toTexture(c);
}

// ── Hotel voucher ────────────────────────────────────────────────────────────

async function voucherBase() {
  const [c, ctx] = surface();
  const f = fonts();
  await navyFace(ctx, "HOTEL VOUCHER");
  ctx.fillStyle = "rgba(236,217,168,0.1)";
  skyline(ctx, W * 0.83, H - 60, 0.9);
  ctx.fillStyle = GOLD_LIGHT;
  for (let i = 0; i < 5; i++) star(ctx, W - 140 - i * 62, 222, 24);

  // key-card chip
  const cx = 120, cy = 380, cw = 190, ch = 150;
  const chip = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
  chip.addColorStop(0, "#e9d29b");
  chip.addColorStop(0.5, "#c9a35b");
  chip.addColorStop(1, "#f1e2b8");
  ctx.fillStyle = chip;
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(10,17,40,0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy + ch / 3);
  ctx.lineTo(cx + cw, cy + ch / 3);
  ctx.moveTo(cx, cy + (2 * ch) / 3);
  ctx.lineTo(cx + cw, cy + (2 * ch) / 3);
  ctx.moveTo(cx + cw / 2, cy);
  ctx.lineTo(cx + cw / 2, cy + ch);
  ctx.stroke();

  // contactless waves
  ctx.strokeStyle = "rgba(236,217,168,0.8)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(cx + cw + 50, cy + ch / 2, 26 + i * 22, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
  }
  ctx.lineCap = "butt";

  ctx.fillStyle = IVORY;
  ctx.font = `600 96px ${f.display}`;
  ctx.fillText("Makkah · Haram View", 120, 690);
  writer(ctx).caption("FIVE STAR · STEPS FROM AL-HARAM", 124, 750, "rgba(245,239,227,0.55)");
  return toTexture(c);
}

async function voucherDetails() {
  const [c, ctx] = surface();
  const { label, value } = writer(ctx);
  ctx.fillStyle = "rgba(201,163,91,0.45)";
  ctx.fillRect(120, 820, W - 240, 2);

  const cols = [120, 620, 920, 1160];
  label("GUEST", cols[0], 900);
  value("Guest of Allah", cols[0], 975);
  label("CHECK-IN", cols[1], 900);
  value("Day 1", cols[1], 975);
  label("NIGHTS", cols[2], 900);
  value("07", cols[2], 975);
  label("ROOM", cols[3], 900);
  value("1407", cols[3], 975, 64, GOLD_LIGHT);

  label("BOARD", cols[0], 1080);
  value("Breakfast & Dinner", cols[0], 1150, 52);
  label("TRANSFER", cols[2], 1080);
  value("Jeddah → Makkah", cols[2], 1150, 52);

  seal(ctx, W - 330, 520, "CONFIRMED", GOLD_LIGHT);
  return toTexture(c);
}

// ── Transport voucher ────────────────────────────────────────────────────────

/** Side profile of a high-roof van, outlined in gold. */
function van(ctx: Ctx, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 6 / s;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, 200);
  ctx.lineTo(0, 40);
  ctx.quadraticCurveTo(0, 0, 40, 0);
  ctx.lineTo(470, 0);
  ctx.quadraticCurveTo(500, 0, 520, 30);
  ctx.lineTo(600, 120);
  ctx.quadraticCurveTo(620, 140, 620, 170);
  ctx.lineTo(620, 200);
  ctx.lineTo(540, 200);
  ctx.arc(490, 200, 50, 0, Math.PI, true);
  ctx.lineTo(180, 200);
  ctx.arc(130, 200, 50, 0, Math.PI, true);
  ctx.closePath();
  ctx.stroke();
  // windows
  ctx.fillStyle = "rgba(236,217,168,0.18)";
  for (const [wx, ww] of [[40, 110], [170, 110], [300, 110]] as const) {
    ctx.beginPath();
    ctx.roundRect(wx, 30, ww, 70, 10);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(430, 30);
  ctx.lineTo(500, 30);
  ctx.lineTo(570, 110);
  ctx.lineTo(430, 110);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  for (const wx of [130, 490]) {
    ctx.beginPath();
    ctx.arc(wx, 200, 36, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

async function transportFront() {
  const [c, ctx] = surface(STACK_RES);
  const f = fonts();
  const { label, value, caption } = writer(ctx);
  await navyFace(ctx, "TRANSPORT VOUCHER");
  van(ctx, 120, 330, 0.62);

  // route: dotted arc with two pins
  const ax = W - 760, bx = W - 200, ay = 470;
  ctx.strokeStyle = "rgba(236,217,168,0.7)";
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 16]);
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo((ax + bx) / 2, ay - 200, bx, ay);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = GOLD_LIGHT;
  for (const x of [ax, bx]) {
    ctx.beginPath();
    ctx.arc(x, ay, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  label("JED", ax, ay + 60, "center");
  label("MAKKAH", bx, ay + 60, "center");

  ctx.fillStyle = IVORY;
  ctx.font = `600 96px ${f.display}`;
  ctx.textAlign = "left";
  ctx.fillText("Private Transfer", 120, 690);
  caption("AIRPORT · HOTEL · ZIYARAT", 124, 750, "rgba(245,239,227,0.55)");

  ctx.fillStyle = "rgba(201,163,91,0.45)";
  ctx.fillRect(120, 820, W - 240, 2);
  label("VEHICLE", 120, 900);
  value("Toyota Hiace", 120, 975);
  label("PICK-UP", 720, 900);
  value("On arrival", 720, 975);
  label("SEATS", 1180, 900);
  value("Family", 1180, 975, 64, GOLD_LIGHT);
  label("ZIYARAT", 120, 1080);
  value("Makkah & Madinah", 120, 1150, 52);
  label("SUPPORT", 1180, 1080);
  value("24/7 WhatsApp", 1180, 1150, 52);
  return toTexture(c);
}

// ── Visa ─────────────────────────────────────────────────────────────────────

async function visaFront() {
  const [c, ctx] = surface(STACK_RES);
  const f = fonts();
  const { label, value } = writer(ctx, false);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#fbf6ea");
  bg.addColorStop(1, "#eadcbc");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  waves(ctx, "rgba(169,132,63,0.12)");

  // rosette, like a security print
  ctx.strokeStyle = "rgba(169,132,63,0.22)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI) / 18;
    ctx.beginPath();
    ctx.ellipse(W - 380 + Math.cos(a) * 90, 560 + Math.sin(a) * 90, 200, 70, a, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(169,132,63,0.6)";
  ctx.lineWidth = 4;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  ctx.fillStyle = NIGHT;
  ctx.font = `600 150px ${f.display}`;
  ctx.fillText("VISA", 120, 240);
  ctx.fillStyle = "rgba(169,132,63,0.95)";
  ctx.font = `700 30px ${f.sans}`;
  spaced(ctx, "VISIT · UMRAH", 124, 300, 12);
  try {
    const logo = await loadImage("/brand/logo-color.png");
    const h = 150;
    const w = (logo.width / logo.height) * h;
    ctx.drawImage(logo, W - 120 - w, 110, w, h);
  } catch {
    /* title alone is fine */
  }

  // photo box with a soft silhouette
  const px = 120, py = 370, pw = 330, ph = 400;
  ctx.fillStyle = "rgba(169,132,63,0.14)";
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, 24);
  ctx.fill();
  ctx.fillStyle = "rgba(169,132,63,0.35)";
  ctx.beginPath();
  ctx.arc(px + pw / 2, py + 150, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px + pw / 2, py + ph, 140, 150, 0, Math.PI, 0);
  ctx.fill();

  const fx = 530;
  label("NAME", fx, 420);
  value("Guest of Allah", fx, 490);
  label("TYPE", fx, 580);
  value("Umrah", fx, 645, 56);
  label("ENTRIES", fx + 380, 580);
  value("Single", fx + 380, 645, 56);
  label("VALIDITY", fx, 730);
  value("90 Days", fx, 795, 56);
  label("PROCESSED BY", fx + 380, 730);
  value("Bin Aziz", fx + 380, 795, 56, "#a9843f");

  seal(ctx, W - 330, 640, "APPROVED", "rgba(169,132,63,0.9)");

  // machine-readable zone
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(66, H - 300, W - 132, 220);
  ctx.fillStyle = NIGHT;
  ctx.font = `600 58px "Courier New", monospace`;
  ctx.textAlign = "left";
  spaced(ctx, "V<UMRAH<<GUEST<OF<ALLAH<<<<<<<<<<<<<<<<", 110, H - 200, 8);
  spaced(ctx, "BINAZIZ786<<LHE<<JED<<<<<<<<<<<<<<<<<<<", 110, H - 115, 8);
  return toTexture(c);
}

// ── Shared pieces for the service cards ──────────────────────────────────────

/** Big title + caption + rule: the common middle band of the service cards. */
function titleBand(ctx: Ctx, title: string, caption: string, light = true) {
  const f = fonts();
  ctx.fillStyle = light ? IVORY : NIGHT;
  ctx.font = `600 96px ${f.display}`;
  ctx.textAlign = "left";
  ctx.fillText(title, 120, 690);
  writer(ctx).caption(caption, 124, 750, light ? "rgba(245,239,227,0.55)" : "rgba(10,17,40,0.6)");
  ctx.fillStyle = light ? "rgba(201,163,91,0.45)" : "rgba(10,17,40,0.3)";
  ctx.fillRect(120, 820, W - 240, 2);
}

// ── Umrah package ────────────────────────────────────────────────────────────

/** The Kaaba in perspective: black faces, gold belt (hizam) and door. */
function kaaba(ctx: Ctx, cx: number, base: number, s: number) {
  const fw = 300 * s, sw = 170 * s, h = 300 * s, rise = 60 * s;
  const left = cx - fw / 2 - sw / 2;
  const front = [left, base, left + fw, base, left + fw, base - h, left, base - h];
  const side = [left + fw, base, left + fw + sw, base - rise, left + fw + sw, base - h - rise, left + fw, base - h];
  const top = [left, base - h, left + fw, base - h, left + fw + sw, base - h - rise, left + sw, base - h - rise];
  const poly = (pts: number[], fill: string) => {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "rgba(236,217,168,0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  poly(top, "#1b2348");
  poly(front, "#05081a");
  poly(side, "#0b1129");
  // belt
  const by = h * 0.24, bh = 26 * s;
  ctx.fillStyle = GOLD;
  ctx.fillRect(left, base - h + by, fw, bh);
  ctx.beginPath();
  ctx.moveTo(left + fw, base - h + by);
  ctx.lineTo(left + fw + sw, base - h - rise + by);
  ctx.lineTo(left + fw + sw, base - h - rise + by + bh);
  ctx.lineTo(left + fw, base - h + by + bh);
  ctx.fill();
  // door
  ctx.fillStyle = GOLD_LIGHT;
  ctx.fillRect(left + fw * 0.62, base - h * 0.62, fw * 0.2, h * 0.42);
}

async function umrahFront() {
  const [c, ctx] = surface(STACK_RES);
  const { label, value } = writer(ctx);
  await navyFace(ctx, "UMRAH PACKAGE");
  const halo = ctx.createRadialGradient(W - 440, 470, 20, W - 440, 470, 380);
  halo.addColorStop(0, "rgba(236,217,168,0.28)");
  halo.addColorStop(1, "rgba(236,217,168,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(W - 900, 150, 900, 640);
  kaaba(ctx, W - 440, 650, 1);
  ctx.fillStyle = GOLD_LIGHT;
  for (let i = 0; i < 5; i++) star(ctx, 140 + i * 62, 330, 24);

  titleBand(ctx, "Complete Umrah", "VISA · FLIGHTS · HOTELS · ZIYARAT");
  label("DURATION", 120, 900);
  value("15 Days", 120, 975);
  label("MAKKAH", 620, 900);
  value("Near Haram", 620, 975);
  label("MADINAH", 1160, 900);
  value("Near Nabawi", 1160, 975);
  label("GROUPS", 120, 1080);
  value("Family & Corporate", 120, 1150, 52);
  label("SUPPORT", 1160, 1080);
  value("24/7 WhatsApp", 1160, 1150, 52, GOLD_LIGHT);
  return toTexture(c);
}

// ── Worldwide ticketing ──────────────────────────────────────────────────────

/** Wireframe globe with dashed flight arcs. */
function globe(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.strokeStyle = "rgba(10,17,40,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * Math.abs(Math.cos((i * Math.PI) / 6)), r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) {
    const y = cy + k * r;
    const half = Math.sqrt(r * r - (k * r) ** 2);
    ctx.beginPath();
    ctx.moveTo(cx - half, y);
    ctx.lineTo(cx + half, y);
    ctx.stroke();
  }
  const arcs: [number, number, number, number, number][] = [
    [-0.55, 0.25, 0.6, -0.35, -0.75],
    [-0.4, 0.45, 0.75, 0.2, -0.45],
    [-0.7, -0.2, 0.3, -0.7, -0.95],
  ];
  ctx.strokeStyle = NIGHT;
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 12]);
  for (const [x1, y1, x2, y2, lift] of arcs) {
    ctx.beginPath();
    ctx.moveTo(cx + x1 * r, cy + y1 * r);
    ctx.quadraticCurveTo(cx + ((x1 + x2) / 2) * r, cy + lift * r, cx + x2 * r, cy + y2 * r);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.fillStyle = NIGHT;
  for (const [x1, y1, x2, y2] of arcs) {
    for (const [x, y] of [[x1, y1], [x2, y2]]) {
      ctx.beginPath();
      ctx.arc(cx + x * r, cy + y * r, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

async function worldwideFront() {
  const [c, ctx] = surface(STACK_RES);
  const f = fonts();
  const { label, value } = writer(ctx, false, "rgba(10,17,40,0.6)");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#d8b878");
  bg.addColorStop(0.5, GOLD_LIGHT);
  bg.addColorStop(1, GOLD);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  waves(ctx, "rgba(10,17,40,0.06)");
  ctx.strokeStyle = "rgba(10,17,40,0.45)";
  ctx.lineWidth = 4;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  try {
    const logo = await loadImage("/brand/logo-color.png");
    const h = 150;
    ctx.drawImage(logo, 120, 110, (logo.width / logo.height) * h, h);
  } catch {
    ctx.fillStyle = NIGHT;
    ctx.font = `600 90px ${f.display}`;
    ctx.fillText("BIN AZIZ", 120, 220);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = NIGHT;
  ctx.font = `800 34px ${f.sans}`;
  spaced(ctx, "WORLDWIDE TICKETING", W - 120, 160, 12);
  ctx.font = `700 26px ${f.sans}`;
  ctx.fillStyle = "rgba(10,17,40,0.6)";
  spaced(ctx, "IATA LICENSED", W - 120, 210, 10);
  ctx.textAlign = "left";

  globe(ctx, W - 430, 500, 230);
  titleBand(ctx, "Fly Anywhere", "ALL MAJOR AIRLINES · HONEST FARES", false);

  label("FROM", 120, 900);
  value("Lahore & all cities", 120, 975, 60);
  label("TO", 920, 900);
  value("DXB · IST · LHR · KUL", 920, 975, 60);
  label("TRIPS", 120, 1080);
  value("One-way · Return · Multi-city", 120, 1150, 52);
  label("CHANGES", 1260, 1080);
  value("Handled for you", 1260, 1150, 52);
  return toTexture(c);
}

// ── Religious travel ─────────────────────────────────────────────────────────

/** Mosque line art: central dome with crescent, two minarets, arched doors. */
function mosque(ctx: Ctx, cx: number, base: number, s: number) {
  ctx.save();
  ctx.translate(cx, base);
  ctx.scale(s, s);
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 5 / s;
  const shape = (draw: () => void) => {
    ctx.fillStyle = "rgba(236,217,168,0.16)";
    ctx.beginPath();
    draw();
    ctx.fill();
    ctx.stroke();
  };
  shape(() => ctx.rect(-260, -170, 520, 170));
  shape(() => {
    ctx.moveTo(-170, -170);
    ctx.bezierCurveTo(-190, -330, -40, -390, 0, -440);
    ctx.bezierCurveTo(40, -390, 190, -330, 170, -170);
    ctx.closePath();
  });
  // crescent
  ctx.fillStyle = GOLD_LIGHT;
  ctx.beginPath();
  ctx.arc(0, -478, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#101a3f";
  ctx.beginPath();
  ctx.arc(10, -484, 22, 0, Math.PI * 2);
  ctx.fill();
  for (const x of [-330, 300]) {
    shape(() => ctx.rect(x, -470, 30, 470));
    shape(() => {
      ctx.moveTo(x - 8, -470);
      ctx.lineTo(x + 38, -470);
      ctx.lineTo(x + 15, -540);
      ctx.closePath();
    });
    shape(() => ctx.rect(x - 10, -330, 50, 18));
  }
  for (const x of [-170, -40, 90]) {
    shape(() => {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, -80);
      ctx.arc(x + 40, -80, 40, Math.PI, 0);
      ctx.lineTo(x + 80, 0);
    });
  }
  ctx.restore();
}

async function religiousFront() {
  const [c, ctx] = surface(STACK_RES);
  const { label, value } = writer(ctx);
  await navyFace(ctx, "RELIGIOUS TRAVEL");
  mosque(ctx, W - 470, 690, 0.92);

  titleBand(ctx, "Ziyarat Tours", "HALAL-FRIENDLY · PRAYER-FRIENDLY");
  label("MAKKAH", 120, 900);
  value("Jabal al-Nour · Mina", 120, 975, 60);
  label("MADINAH", 920, 900);
  value("Quba · Uhud", 920, 975, 60);
  label("SCHEDULE", 1420, 900);
  value("Around Salah", 1420, 975, 60, GOLD_LIGHT);
  label("STAYS", 120, 1080);
  value("Halal-friendly hotels", 120, 1150, 52);
  label("GUIDES", 920, 1080);
  value("Trained in Islamic adab", 920, 1150, 52);
  return toTexture(c);
}

// ── Public factories (cached: every instance shares one set of textures) ──────

async function ready() {
  const f = fonts();
  await Promise.all([document.fonts.load(`600 72px ${f.display}`), document.fonts.load(`700 24px ${f.sans}`)]).catch(() => undefined);
}

function cached(make: () => Promise<CardTextures>) {
  let p: Promise<CardTextures> | null = null;
  return () => (p ??= ready().then(make));
}

export const voucherTextures = cached(async () => {
  const [base, details, back] = await Promise.all([voucherBase(), voucherDetails(), ivoryBack("PLEASE RETURN THIS KEY CARD AT CHECK-OUT", true)]);
  return { base, details, back };
});

export const transportTextures = cached(async () => {
  const [base, back] = await Promise.all([transportFront(), ivoryBack("PRIVATE TRANSPORT · AIRPORT · HOTEL · ZIYARAT", true, STACK_RES)]);
  return { base, back };
});

export const visaTextures = cached(async () => {
  const [base, back] = await Promise.all([visaFront(), ivoryBack("VISA PROCESSING · BIN AZIZ TOURISM", false, STACK_RES)]);
  return { base, back };
});

// The newer service cards share one back: they're rarely seen from behind in the stack.
let serviceBack: Promise<THREE.Texture> | null = null;
const sharedBack = () => (serviceBack ??= ivoryBack("BIN AZIZ TOURISM & CONSULTANTS · LAHORE", false, STACK_RES));

export const umrahTextures = cached(async () => {
  const [base, back] = await Promise.all([umrahFront(), sharedBack()]);
  return { base, back };
});

export const worldwideTextures = cached(async () => {
  const [base, back] = await Promise.all([worldwideFront(), sharedBack()]);
  return { base, back };
});

export const religiousTextures = cached(async () => {
  const [base, back] = await Promise.all([religiousFront(), sharedBack()]);
  return { base, back };
});
