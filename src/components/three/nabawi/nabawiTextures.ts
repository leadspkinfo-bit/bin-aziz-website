import * as THREE from "three";

function canvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

/** Marble plaza: cream slabs with darker diamond inlays. */
export function plazaTexture() {
  return canvas(
    256,
    256,
    (ctx) => {
      ctx.fillStyle = "#f3eee4";
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "#bfb39b";
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.fillStyle = "#6e5f4b";
      ctx.fillRect(0, 0, 256, 10);
      ctx.fillRect(0, 0, 10, 256);
      ctx.save();
      ctx.translate(128, 128);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = "#6e5f4b";
      ctx.fillRect(-34, -34, 68, 68);
      ctx.fillStyle = "#d9c9a8";
      ctx.fillRect(-20, -20, 40, 40);
      ctx.restore();
    },
    [44, 44],
  );
}

/** Red prayer carpet with the row lines and a small repeating motif. */
export function carpetTexture(base = "#7a1622", line = "#c9a35b") {
  return canvas(
    256,
    256,
    (ctx) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = line;
      ctx.fillRect(0, 0, 256, 6); // the row line
      ctx.globalAlpha = 0.35;
      for (let x = 16; x < 256; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x + 16, 40);
        ctx.lineTo(x + 32, 70);
        ctx.lineTo(x + 16, 100);
        ctx.lineTo(x, 70);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(x + 8, 150, 16, 60);
      }
      ctx.globalAlpha = 1;
    },
    [30, 12],
  );
}

/** Coffered ceiling: cream panels with gold and teal geometric stars. */
export function ceilingTexture() {
  return canvas(
    256,
    256,
    (ctx) => {
      ctx.fillStyle = "#f2ead8";
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "#b8924a";
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 240, 240);
      ctx.fillStyle = "#2f6f73";
      ctx.save();
      ctx.translate(128, 128);
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-10, -70, 20, 60);
      }
      ctx.restore();
      ctx.fillStyle = "#d4af5f";
      ctx.beginPath();
      ctx.arc(128, 128, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d4af5f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(128, 128, 92, 0, Math.PI * 2);
      ctx.stroke();
    },
    [32, 14],
  );
}

/** Pattern for the sliding roof domes: radiating gold and teal ribs on cream. */
export function domeTexture() {
  return canvas(256, 256, (ctx) => {
    ctx.fillStyle = "#e7d8b6";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 ? "#c9a35b" : "#3a7d7a";
      ctx.fillRect(i * 16 + 6, 0, 4, 256);
    }
    ctx.fillStyle = "#c9a35b";
    for (const y of [40, 120, 200]) ctx.fillRect(0, y, 256, 5);
  });
}

/** The Green Dome: deep green with vertical ribs and a lighter sheen. */
export function greenDomeTexture() {
  return canvas(512, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#2aa36d");
    g.addColorStop(1, "#16704a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = "rgba(10,60,38,0.55)";
    ctx.lineWidth = 3;
    for (let x = 0; x < 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
  });
}

/** Brass grille (jali) of the sacred chamber: a gold lattice of eight-pointed stars on deep green. */
export function grilleTexture() {
  return canvas(
    256,
    256,
    (ctx) => {
      ctx.fillStyle = "#123a2b";
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "#d9b660";
      ctx.lineWidth = 7;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.lineWidth = 5;
      for (const [cx, cy] of [
        [64, 64],
        [192, 64],
        [64, 192],
        [192, 192],
      ]) {
        ctx.save();
        ctx.translate(cx, cy);
        for (let k = 0; k < 2; k++) {
          ctx.rotate(Math.PI / 4);
          ctx.strokeRect(-36, -36, 72, 72);
        }
        ctx.restore();
      }
    },
    [9, 5],
  );
}

/** A mihrab niche: arched gold frame, blue-and-gold tiles, a band of lettering. */
export function mihrabTexture() {
  return canvas(256, 384, (ctx) => {
    ctx.fillStyle = "#e9dcc0";
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = "#c9a35b";
    ctx.beginPath();
    ctx.moveTo(28, 384);
    ctx.lineTo(28, 150);
    ctx.quadraticCurveTo(128, 20, 228, 150);
    ctx.lineTo(228, 384);
    ctx.fill();
    ctx.fillStyle = "#1e4f7a";
    ctx.beginPath();
    ctx.moveTo(52, 384);
    ctx.lineTo(52, 160);
    ctx.quadraticCurveTo(128, 60, 204, 160);
    ctx.lineTo(204, 384);
    ctx.fill();
    ctx.strokeStyle = "#e6c77a";
    ctx.lineWidth = 1.5;
    // eight-pointed star tiles
    for (let y = 186; y < 384; y += 30)
      for (let x = 66; x < 192; x += 30)
        for (const turn of [0, Math.PI / 4]) {
          ctx.save();
          ctx.translate(x + 13, y);
          ctx.rotate(turn);
          ctx.strokeRect(-8, -8, 16, 16);
          ctx.restore();
        }
    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(28, 6, 200, 30);
  });
}

const facades = new Map<number, THREE.Texture>();
/** Outer wall with a row of arched windows, repeated along `length` units. */
export function facadeTexture(length: number) {
  const n = Math.max(1, Math.round(length / 4));
  const key = n;
  const hit = facades.get(key);
  if (hit) return hit;
  const t = canvas(256, 256, (ctx) => {
    ctx.fillStyle = "#d4b583";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#8f6f43";
    ctx.fillRect(0, 26, 256, 8);
    ctx.fillRect(0, 230, 256, 10);
    ctx.fillStyle = "#4a3a28";
    ctx.beginPath();
    ctx.moveTo(78, 210);
    ctx.lineTo(78, 110);
    ctx.quadraticCurveTo(128, 50, 178, 110);
    ctx.lineTo(178, 210);
    ctx.fill();
    ctx.strokeStyle = "#c9a35b";
    ctx.lineWidth = 6;
    ctx.stroke();
  });
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(n, 1);
  facades.set(key, t);
  return t;
}
