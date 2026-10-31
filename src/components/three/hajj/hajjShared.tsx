"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export type Spot = [number, number, number];

export const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });

/** Same numbers on every load, so scenes never shift between visits. */
export function makeRng(start: number) {
  let seed = start;
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

/** Speckled ground: `base` with darker and lighter grains. */
export function groundTexture(base: string, dark: string, light: string, repeat: number) {
  const rand = makeRng(5);
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rand() > 0.5 ? dark : light;
    ctx.globalAlpha = 0.12 + rand() * 0.25;
    ctx.fillRect(rand() * 512, rand() * 512, 1 + rand() * 4, 1 + rand() * 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
}

export function Ground({ base, dark, light, size = 900, repeat = 40 }: { base: string; dark: string; light: string; size?: number; repeat?: number }) {
  const tex = useMemo(() => groundTexture(base, dark, light, repeat), [base, dark, light, repeat]);
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <circleGeometry args={[size, 64]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  );
}

/** A craggy lump of rock; the surface is pushed in and out from the seed. */
export function rockGeometry(seed: number, detail = 4) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const pos = g.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = 1 + 0.2 * Math.sin(v.x * 4 + seed) * Math.cos(v.z * 5 - seed) + 0.09 * Math.sin(v.y * 11 + seed * 2) + 0.05 * Math.cos(v.x * 17 - seed);
    v.multiplyScalar(n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** A ring of bare desert mountains around the scene. */
export function Mountains({ radius, count, height, color, seed = 2 }: { radius: number; count: number; height: number; color: string; seed?: number }) {
  const geo = useMemo(() => rockGeometry(seed, 3), [seed]);
  const material = useMemo(() => mat(color, { roughness: 1, flatShading: true }), [color]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const rand = makeRng(seed * 977 + 3);
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.1;
      const r = radius * (0.92 + rand() * 0.2);
      o.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      o.rotation.y = rand() * 6;
      o.scale.set(height * (1.3 + rand()), height * (0.6 + rand() * 0.6), height * (1.1 + rand()));
      o.updateMatrix();
      ref.current?.setMatrixAt(i, o.matrix);
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
  }, [count, height, radius, seed]);
  return <instancedMesh ref={ref} args={[geo, material, count]} />;
}

/** Pilgrims as small figures: mostly white Ihram, some dark abayas. */
export function Crowd({ spots, size = 1 }: { spots: Spot[]; size?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rand = makeRng(19);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    spots.forEach(([x, y, z], i) => {
      o.position.set(x, y + 0.45 * size, z);
      o.scale.setScalar(size);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      const tone = rand();
      mesh.setColorAt(i, c.set(tone < 0.72 ? "#f6f3ec" : tone < 0.92 ? "#1d1d22" : "#cdbfa3"));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [spots, size]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, spots.length]}>
      <capsuleGeometry args={[0.2, 0.5, 3, 6]} />
      <meshStandardMaterial roughness={0.85} />
    </instancedMesh>
  );
}
