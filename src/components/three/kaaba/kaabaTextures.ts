import * as THREE from "three";

function canvas(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, repeat?: [number, number]) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...repeat);
  }
  return tex;
}

/** Black silk of the Kiswa with its faint woven pattern. */
export function kiswaTexture() {
  return canvas(
    512,
    (ctx, s) => {
      ctx.fillStyle = "#121214";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 3;
      const step = s / 4;
      for (let y = 0; y < 4; y++)
        for (let x = 0; x < 4; x++) {
          const cx = x * step + step / 2 + (y % 2 ? step / 2 : 0);
          const cy = y * step + step / 2;
          ctx.beginPath();
          ctx.ellipse(cx % s, cy, step * 0.32, step * 0.18, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo((cx % s) - step * 0.42, cy);
          ctx.lineTo((cx % s) + step * 0.42, cy);
          ctx.stroke();
        }
    },
    [3, 3],
  );
}

/** Terracotta bricks of the base (shadharwan), as in the reference. */
export function brickTexture() {
  return canvas(
    512,
    (ctx, s) => {
      ctx.fillStyle = "#b8562c";
      ctx.fillRect(0, 0, s, s);
      const rows = 8;
      const h = s / rows;
      for (let r = 0; r < rows; r++) {
        const w = s / 4;
        for (let c = -1; c < 5; c++) {
          const x = c * w + (r % 2 ? w / 2 : 0);
          const shade = 170 + ((r * 7 + c * 13) % 5) * 9;
          ctx.fillStyle = `rgb(${shade + 28},${shade - 78},${shade - 120})`;
          ctx.fillRect(x + 3, r * h + 3, w - 6, h - 6);
        }
      }
    },
    [4, 1],
  );
}

/** White marble of the mataf: soft veins and concentric rings. */
export function marbleTexture() {
  return canvas(1024, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, s * 0.05, s / 2, s / 2, s / 2);
    g.addColorStop(0, "#fbfaf6");
    g.addColorStop(1, "#d9d4c8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(150,140,120,0.18)";
    ctx.lineWidth = 2;
    for (let r = 0.14; r < 0.5; r += 0.045) {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, r * s, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(120,115,105,0.12)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 60; i++) {
      const a = (i * 137.5 * Math.PI) / 180;
      const r = ((i * 53) % 100) / 220 + 0.05;
      ctx.beginPath();
      ctx.moveTo(s / 2 + Math.cos(a) * r * s, s / 2 + Math.sin(a) * r * s);
      ctx.quadraticCurveTo(
        s / 2 + Math.cos(a + 0.2) * (r + 0.05) * s,
        s / 2 + Math.sin(a + 0.2) * (r + 0.05) * s,
        s / 2 + Math.cos(a + 0.35) * (r + 0.02) * s,
        s / 2 + Math.sin(a + 0.35) * (r + 0.02) * s,
      );
      ctx.stroke();
    }
  });
}

/** The embroidered curtain (sitara) of the door. */
export function sitaraTexture() {
  return canvas(512, (ctx, s) => {
    ctx.fillStyle = "#121214";
    ctx.fillRect(0, 0, s, s);
    const gold = ctx.createLinearGradient(0, 0, s, s);
    gold.addColorStop(0, "#f3e4bd");
    gold.addColorStop(0.5, "#c9a35b");
    gold.addColorStop(1, "#a9843f");
    ctx.strokeStyle = gold;
    ctx.fillStyle = gold;
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, s - 36, s - 36);
    ctx.lineWidth = 5;
    ctx.strokeRect(48, 48, s - 96, s - 96);
    for (let i = 0; i < 4; i++) ctx.fillRect(80, 90 + i * 70, s - 160, 26);
    ctx.beginPath();
    ctx.arc(s / 2, s - 120, 46, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Inner wall lining, 2 units wide × the room's height: white marble up to about 2 m, a thin gold
 * strip, then green cloth with an embroidered band of the Shahada near the top.
 */
export function roomWallTexture(roomHeight: number) {
  const tex = canvas(1024, (ctx, s) => {
    const marbleTop = s * (1 - 1 / roomHeight); // 1 unit ≈ 2 m of marble
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, "#0d3b27");
    g.addColorStop(0.6, "#145236");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, marbleTop);
    // damask dots on the cloth
    ctx.fillStyle = "rgba(220,192,138,0.10)";
    for (let y = 30; y < marbleTop - 20; y += 46)
      for (let x = (y / 46) % 2 ? 23 : 0; x < s; x += 46) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    // embroidered band
    const bandY = s * 0.1;
    ctx.fillStyle = "#0a2e1e";
    ctx.fillRect(0, bandY - 40, s, 80);
    ctx.strokeStyle = "#dcc08a";
    ctx.lineWidth = 3;
    ctx.strokeRect(-4, bandY - 40, s + 8, 80);
    ctx.fillStyle = "#ecd9a8";
    ctx.font = "bold 46px 'Amiri', 'Traditional Arabic', 'Arial', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    // the canvas is square but covers 2 units × roomHeight, so squash the lettering back to true proportions
    ctx.save();
    ctx.translate(s / 2, bandY + 4);
    ctx.scale(1, 2 / roomHeight);
    ctx.font = "bold 92px 'Amiri', 'Traditional Arabic', 'Arial', serif";
    ctx.fillText("لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَسُولُ اللّٰهِ", 0, 0);
    ctx.restore();
    // gold strip and marble
    ctx.fillStyle = "#c9a35b";
    ctx.fillRect(0, marbleTop - 6, s, 6);
    const m = ctx.createLinearGradient(0, marbleTop, 0, s);
    m.addColorStop(0, "#f7f4ec");
    m.addColorStop(1, "#e6e0d2");
    ctx.fillStyle = m;
    ctx.fillRect(0, marbleTop, s, s - marbleTop);
    ctx.strokeStyle = "rgba(140,130,110,0.25)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= s; x += s / 4) {
      ctx.beginPath();
      ctx.moveTo(x, marbleTop);
      ctx.lineTo(x, s);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(120,115,105,0.12)";
    for (let i = 0; i < 18; i++) {
      ctx.beginPath();
      const y = marbleTop + ((i * 37) % (s - marbleTop));
      ctx.moveTo((i * 97) % s, y);
      ctx.quadraticCurveTo(((i * 97) % s) + 60, y + 20, ((i * 97) % s) + 140, y - 10);
      ctx.stroke();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(0.5, 1 / roomHeight);
  return tex;
}

/** Marble floor of the room: white slabs with grey borders and small inlaid diamonds. */
export function roomFloorTexture() {
  return canvas(
    512,
    (ctx, s) => {
      ctx.fillStyle = "#f3efe6";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "#9c968a";
      ctx.lineWidth = 6;
      ctx.strokeRect(0, 0, s, s);
      ctx.strokeStyle = "#c9c2b2";
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, s - 80, s - 80);
      ctx.fillStyle = "#8a8478";
      ctx.save();
      ctx.translate(s / 2, s / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-46, -46, 92, 92);
      ctx.fillStyle = "#f3efe6";
      ctx.fillRect(-30, -30, 60, 60);
      ctx.restore();
      for (const [x, y] of [[0, 0], [s, 0], [0, s], [s, s]]) {
        ctx.fillStyle = "#b5ae9f";
        ctx.beginPath();
        ctx.arc(x, y, 26, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [3, 3],
  );
}

/** Gold door leaf: raised panels, a rim of studs and a medallion. */
export function doorLeafTexture() {
  return canvas(512, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, "#f3e4bd");
    g.addColorStop(0.45, "#c9a35b");
    g.addColorStop(1, "#8f6c2c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "#6e5220";
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, s - 48, s - 48);
    for (const y of [70, 210, 350]) ctx.strokeRect(70, y, s - 140, 110);
    ctx.fillStyle = "#7a5b22";
    for (let i = 0; i < 12; i++) {
      for (const x of [44, s - 44]) {
        ctx.beginPath();
        ctx.arc(x, 50 + i * 38, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(s / 2, s / 2 + 20, 26, 0, Math.PI * 2);
    ctx.stroke();
  });
}

/** Dark wooden ceiling boards. */
export function ceilingTexture() {
  return canvas(
    256,
    (ctx, s) => {
      ctx.fillStyle = "#3a2516";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "#24170d";
      ctx.lineWidth = 4;
      for (let x = 0; x <= s; x += s / 4) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, s);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,220,170,0.06)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 24; i++) {
        ctx.beginPath();
        ctx.moveTo((i * 41) % s, 0);
        ctx.lineTo(((i * 41) % s) + 6, s);
        ctx.stroke();
      }
    },
    [4, 4],
  );
}

/** Inscribed marble plaque: a carved border and lines of lettering. */
export function plaqueTexture() {
  return canvas(256, (ctx, s) => {
    ctx.fillStyle = "#f4f1ea";
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "#8d8676";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, s - 20, s - 20);
    ctx.fillStyle = "#6b6558";
    for (let i = 0; i < 7; i++) {
      const w = s - 70 - ((i * 23) % 40);
      ctx.fillRect((s - w) / 2, 40 + i * 28, w, 7);
    }
  });
}
