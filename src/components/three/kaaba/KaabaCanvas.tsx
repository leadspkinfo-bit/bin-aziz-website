"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox, Stars } from "@react-three/drei";
import gsap from "gsap";
import type { MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from "react";
import * as THREE from "three";
import { haramHistoricalData, type Vec3 } from "@/lib/haramHistoricalData";
import { BAND_Y, BASE, CLOTH_TOP, D, DOOR, H, ROOM, TURN, W, cloth, gold, localToWorld, marbleWall, toWorld } from "./kaabaGeometry";
import { KaabaHouse, type DoorParts } from "./KaabaHouse";
import { brickTexture, marbleTexture } from "./kaabaTextures";

const HATEEM_Z = -D / 2 - 0.5;
const MAQAM = new THREE.Vector3(W / 2 + 4.2, 0, D / 2 - 1.4);
const ZAMZAM = new THREE.Vector3(6.6, 0, 5.4);

export type KaabaMode = "outside" | "entering" | "inside" | "leaving";

export type KaabaView = {
  distance: number;
  reset: number;
  /** Walk up to a point: the camera glides to `target + dir · distance`; bump `seq` for each new request */
  focus: { id: string; target: Vec3; dir: Vec3; distance: number; inside: boolean; seq: number } | null;
  /** Last focus request already acted on (shared by the outside and inside camera handlers) */
  handled: number;
  /** Bump to open the door and go in / to step back out */
  enter: number;
  exit: number;
};

// The walk in: a point in front of the door, one just inside it, and where the visitor stands.
const DOOR_FRONT = localToWorld(W / 2 + 5, DOOR.top - 0.9, DOOR.z);
const DOOR_CENTRE = localToWorld(W / 2, (DOOR.top + DOOR.bottom) / 2, DOOR.z);
const JUST_INSIDE = localToWorld(W / 2 - 0.9, (DOOR.top + DOOR.bottom) / 2, DOOR.z);
// standing on the door side of the room, facing the row of pillars and the lamps
export const EYE = localToWorld(0.6, ROOM.floor + 0.85, 1.85);
const FIRST_LOOK = localToWorld(-0.3, ROOM.floor + 1.9, -0.45);
const FOV = { outside: 40, inside: 58 };
const OVERVIEW = { camera: new THREE.Vector3(22, 11, -14), target: new THREE.Vector3(0, 3.4, 0) };

/** The white cloth wrapped around the lower walls, hanging in swags with points at the corners and mid-walls. */
function skirtGeometry() {
  const hx = W / 2 + 0.03;
  const hz = D / 2 + 0.03;
  const r = 0.2;
  type Piece = { len: number; at: (t: number) => [number, number, number, number] };
  const line = (x0: number, z0: number, x1: number, z1: number, nx: number, nz: number): Piece => ({
    len: Math.hypot(x1 - x0, z1 - z0),
    at: (t) => [x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, nx, nz],
  });
  const arc = (cx: number, cz: number, a0: number): Piece => ({
    len: (Math.PI / 2) * r,
    at: (t) => {
      const a = a0 + (t * Math.PI) / 2;
      return [cx + r * Math.cos(a), cz + r * Math.sin(a), Math.cos(a), Math.sin(a)];
    },
  });
  const pieces = [
    line(hx, -(hz - r), hx, hz - r, 1, 0),
    arc(hx - r, hz - r, 0), // east corner
    line(hx - r, hz, -(hx - r), hz, 0, 1),
    arc(-(hx - r), hz - r, Math.PI / 2),
    line(-hx, hz - r, -hx, -(hz - r), -1, 0),
    arc(-(hx - r), -(hz - r), Math.PI),
    line(-(hx - r), -hz, hx - r, -hz, 0, -1),
    arc(hx - r, -(hz - r), (3 * Math.PI) / 2),
  ];
  const starts: number[] = [];
  let total = 0;
  for (const p of pieces) {
    starts.push(total);
    total += p.len;
  }
  const junctions = pieces.map((p, i) => starts[i] + p.len / 2);
  const eastCorner = junctions[1];

  const U = 400;
  const V = 16;
  const pos: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i <= U; i++) {
    const L = (i / U) * total;
    let k = pieces.findIndex((_, j) => L < starts[j] + pieces[j].len);
    if (k < 0) k = pieces.length - 1;
    const piece = pieces[k];
    const [x, z, nx, nz] = piece.at(Math.min(1, (L - starts[k]) / piece.len));
    // where this point sits between two hanging points of the hem (0 … 1)
    let j = junctions.findIndex((jL) => jL > L) - 1;
    if (j < 0) j = junctions.length - 1;
    const from = junctions[j];
    const span = (j === junctions.length - 1 ? junctions[0] + total : junctions[j + 1]) - from;
    const s = (((L - from) % total) + total) % total / span;
    const swag = Math.sin(Math.PI * Math.min(1, s));
    let hem = BASE + 0.06 + 0.2 * H * swag;
    // the cloth is lifted at the east corner so the Black Stone stays uncovered
    const dEast = Math.min(Math.abs(L - eastCorner), total - Math.abs(L - eastCorner));
    hem = Math.max(hem, BASE + 0.17 * H * Math.exp(-(dEast * dEast) / 0.35));
    let top = CLOTH_TOP + 0.05 * Math.sin(L * 2.7);
    // on the door wall the cloth is tucked under the door sill instead of covering the doorway
    if (k === 0) {
      const dz = Math.abs(z - DOOR.z) - (DOOR.width / 2 + 0.12);
      const t = Math.min(1, Math.max(0, 1 - dz / 0.35));
      const blend = t * t * (3 - 2 * t);
      top = top + (DOOR.bottom - 0.05 - top) * blend;
      hem = Math.min(hem, top - 0.12);
    }
    for (let v = 0; v <= V; v++) {
      const f = v / V;
      const off = 0.04 + 0.2 * f * f * (0.45 + 0.55 * swag) + 0.04 * Math.sin(L * 13) * f;
      pos.push(x + nx * off, top + (hem - top) * f, z + nz * off);
      uv.push(i / U, f);
    }
  }
  const index: number[] = [];
  for (let i = 0; i < U; i++)
    for (let v = 0; v < V; v++) {
      const a = i * (V + 1) + v;
      const b = (i + 1) * (V + 1) + v;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Ropes from the roof corners down to the middle of each wall, tying the cloth. */
function ropeGeometries() {
  const top = BASE + H + 0.02;
  const faces: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(W / 2, top, -D / 2), new THREE.Vector3(W / 2, top, D / 2), new THREE.Vector3(W / 2, CLOTH_TOP, 0), new THREE.Vector3(1, 0, 0)],
    [new THREE.Vector3(-W / 2, top, -D / 2), new THREE.Vector3(-W / 2, top, D / 2), new THREE.Vector3(-W / 2, CLOTH_TOP, 0), new THREE.Vector3(-1, 0, 0)],
    [new THREE.Vector3(-W / 2, top, D / 2), new THREE.Vector3(W / 2, top, D / 2), new THREE.Vector3(0, CLOTH_TOP, D / 2), new THREE.Vector3(0, 0, 1)],
    [new THREE.Vector3(-W / 2, top, -D / 2), new THREE.Vector3(W / 2, top, -D / 2), new THREE.Vector3(0, CLOTH_TOP, -D / 2), new THREE.Vector3(0, 0, -1)],
  ];
  return faces.flatMap(([a, b, end, n]) =>
    [a, b].map((start) => {
      const out = (d: number) => n.clone().multiplyScalar(d);
      const mid = start.clone().lerp(end, 0.5).add(out(0.16));
      const curve = new THREE.CatmullRomCurve3([start.clone().add(out(0.05)), mid, end.clone().add(out(0.09))]);
      return new THREE.TubeGeometry(curve, 28, 0.03, 6, false);
    }),
  );
}

/** Row of gold diamonds and bars above the band, on one wall (group frame: wall at z = half, running along x). */
function Ornaments({ length, half, rotation }: { length: number; half: number; rotation: number }) {
  const items = [];
  const n = Math.floor((length - 0.8) / 0.55);
  for (let i = 0; i <= n; i++) {
    const x = -((n * 0.55) / 2) + i * 0.55;
    items.push(
      i % 2 === 0 ? (
        <mesh key={i} position={[x, BAND_Y + 0.36, half + 0.012]} rotation-z={Math.PI / 4} material={gold}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
        </mesh>
      ) : (
        <mesh key={i} position={[x, BAND_Y + 0.36, half + 0.012]} material={gold}>
          <boxGeometry args={[0.26, 0.09, 0.02]} />
        </mesh>
      ),
    );
  }
  return <group rotation-y={rotation}>{items}</group>;
}

function Kaaba({ door }: { door: { parts: RefObject<DoorParts>; onOver: () => void; onOut: () => void; onOpen: () => void } }) {
  const tex = useMemo(() => ({ brick: brickTexture() }), []);
  const skirt = useMemo(() => skirtGeometry(), []);
  const ropes = useMemo(() => ropeGeometries(), []);
  const hateem = useMemo(() => {
    const s = new THREE.Shape();
    s.absellipse(0, 0, 2.85, 3.4, 0, Math.PI, false, 0);
    s.absellipse(0, 0, 2.5, 3.05, Math.PI, 0, true, 0);
    return new THREE.ExtrudeGeometry(s, { depth: 0.7, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, curveSegments: 48 });
  }, []);

  return (
    <group rotation-y={TURN}>
      {/* base */}
      <RoundedBox args={[W + 1, BASE, D + 1]} radius={0.08} position-y={BASE / 2}>
        <meshStandardMaterial map={tex.brick} roughness={0.8} />
      </RoundedBox>
      {/* the House: walls with a real doorway, the door itself and the room inside */}
      <KaabaHouse {...door} />
      {/* gold band (four strips, so nothing crosses the room inside) and ornaments */}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[0, BAND_Y, side * (D / 2 + 0.015)]} material={gold}>
            <boxGeometry args={[W + 0.06, 0.13, 0.03]} />
          </mesh>
          <mesh position={[side * (W / 2 + 0.015), BAND_Y, 0]} material={gold}>
            <boxGeometry args={[0.03, 0.13, D + 0.06]} />
          </mesh>
        </group>
      ))}
      <Ornaments length={W} half={D / 2} rotation={0} />
      <Ornaments length={W} half={D / 2} rotation={Math.PI} />
      <Ornaments length={D} half={W / 2} rotation={Math.PI / 2} />
      <Ornaments length={D} half={W / 2} rotation={-Math.PI / 2} />
      {/* white cloth and ropes */}
      <mesh geometry={skirt} material={cloth} />
      {ropes.map((g, i) => (
        <mesh key={i} geometry={g} material={cloth} />
      ))}
      {/* Black Stone in its silver frame, on the east corner */}
      <group position={[W / 2 + 0.06, BASE + 0.95, D / 2 + 0.06]} rotation-y={Math.PI / 4}>
        <mesh scale={[1, 1.3, 1]}>
          <torusGeometry args={[0.2, 0.07, 12, 32]} />
          <meshStandardMaterial color="#d8dce4" metalness={1} roughness={0.25} />
        </mesh>
        <mesh scale={[0.18, 0.24, 0.06]}>
          <sphereGeometry args={[1, 20, 20]} />
          <meshStandardMaterial color="#2a2018" roughness={0.35} />
        </mesh>
      </group>
      {/* Mizab ar-Rahmah */}
      <mesh position={[0, BASE + H - 0.12, -D / 2 - 0.36]} rotation-x={0.12} material={gold}>
        <boxGeometry args={[0.24, 0.16, 0.8]} />
      </mesh>
      {/* Hateem */}
      <mesh geometry={hateem} material={marbleWall} position={[0, 0, HATEEM_Z]} rotation-x={-Math.PI / 2} />
      {/* Maqam-e-Ibrahim */}
      <group position={MAQAM}>
        <mesh position-y={0.18} material={marbleWall}>
          <cylinderGeometry args={[0.6, 0.66, 0.36, 8]} />
        </mesh>
        <mesh position-y={0.9}>
          <cylinderGeometry args={[0.44, 0.44, 1.08, 8, 1, true]} />
          <meshPhysicalMaterial color="#f6efd9" transparent opacity={0.35} roughness={0.05} side={THREE.DoubleSide} />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <mesh key={i} position={[Math.cos((i * Math.PI) / 4) * 0.44, 0.9, Math.sin((i * Math.PI) / 4) * 0.44]} material={gold}>
            <boxGeometry args={[0.05, 1.08, 0.05]} />
          </mesh>
        ))}
        <mesh position-y={1.44} material={gold}>
          <sphereGeometry args={[0.47, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position-y={2.05} material={gold}>
          <torusGeometry args={[0.1, 0.025, 8, 24, Math.PI * 1.4]} />
        </mesh>
      </group>
      {/* Zamzam — the well lies beneath the floor; a gold ring marks it */}
      <mesh position={[ZAMZAM.x, 0.02, ZAMZAM.z]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.45, 0.62, 48]} />
        <meshStandardMaterial color="#c9a35b" emissive="#c9a35b" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Writes to refs and three.js objects that arrive as props. They are mutable by design; routing the
 * writes through here keeps React's compiler from treating them as prop mutations.
 */
const set = <T extends object, K extends keyof T>(target: T, key: K, value: T[K]) => {
  target[key] = value;
};

const PILGRIM_COUNT = 900;
const YOU_R = 7.7;

/** Same crowd on every load: radius, starting angle and clothing for each pilgrim. */
function crowdLayout() {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: PILGRIM_COUNT }, () => {
    const r = 7.3 + Math.pow(rand(), 0.8) * 13;
    return { r, a: rand() * Math.PI * 2, tone: rand() };
  });
}

/** Pilgrims circling anticlockwise; the gold one is "you", doing exactly seven rounds over the Tawaf phase. */
function Pilgrims({ progress }: { progress: MotionValue<number> }) {
  const crowd = useRef<THREE.InstancedMesh>(null);
  const you = useRef<THREE.Group>(null);
  const maqam = useMemo(() => toWorld(MAQAM), []);
  const people = useMemo(() => crowdLayout(), []);
  const start = useMemo(() => {
    const bs = toWorld(new THREE.Vector3(W / 2, 0, D / 2));
    return Math.atan2(-bs.z, bs.x);
  }, []);
  const temp = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    // colours once: mostly white Ihram, some dark abayas
    const mesh = crowd.current;
    if (!mesh) return;
    const c = new THREE.Color();
    people.forEach((p, i) => mesh.setColorAt(i, c.set(p.tone < 0.68 ? "#f4f1ea" : p.tone < 0.9 ? "#1d1d22" : "#cdbfa3")));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [people]);

  useFrame(({ clock }) => {
    const mesh = crowd.current;
    if (!mesh) return;
    const turns = progress.get() * 7 * Math.PI * 2;
    const drift = clock.elapsedTime * 0.12;
    people.forEach((p, i) => {
      const a = p.a + (turns + drift) * (YOU_R / p.r);
      const x = p.r * Math.cos(a);
      const z = -p.r * Math.sin(a);
      const nearMaqam = Math.hypot(x - maqam.x, z - maqam.z) < 1.1;
      temp.position.set(x, 0.32, z);
      temp.rotation.y = a;
      temp.scale.setScalar(nearMaqam ? 0.0001 : 1);
      temp.updateMatrix();
      mesh.setMatrixAt(i, temp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (you.current) {
      const a = start + turns + drift;
      you.current.position.set(YOU_R * Math.cos(a), 0, -YOU_R * Math.sin(a));
    }
  });

  return (
    <>
      <instancedMesh ref={crowd} args={[undefined, undefined, PILGRIM_COUNT]}>
        <capsuleGeometry args={[0.13, 0.36, 4, 8]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <group ref={you}>
        <mesh position-y={0.36}>
          <capsuleGeometry args={[0.15, 0.4, 4, 10]} />
          <meshStandardMaterial color="#e2bd6b" emissive="#c9a35b" emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
          <ringGeometry args={[0.3, 0.42, 32]} />
          <meshBasicMaterial color="#ecd9a8" toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}

/** Mataf floor, the Ottoman arcades, the newer Haram buildings, minarets and the clock tower. */
function Haram() {
  const marble = useMemo(() => marbleTexture(), []);
  const arches = 56;
  const archRing = useMemo(
    () =>
      Array.from({ length: arches }, (_, i) => {
        const a = (i / arches) * Math.PI * 2;
        return { a, x: Math.cos(a) * 27, z: Math.sin(a) * 27 };
      }),
    [],
  );
  const windows = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#cdbf9f";
    ctx.fillRect(0, 0, 512, 128);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 16; col++) {
        ctx.fillStyle = (row + col) % 5 === 0 ? "#6b5a3a" : "#ffd98a";
        ctx.beginPath();
        ctx.roundRect(col * 32 + 9, row * 40 + 10, 14, 26, [7, 7, 0, 0]);
        ctx.fill();
      }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(10, 1);
    return t;
  }, []);
  const minarets = [0.35, 1.4, 2.4, 3.4, 4.45, 5.5];

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[31, 96]} />
        <meshStandardMaterial map={marble} roughness={0.32} metalness={0.05} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
        <circleGeometry args={[160, 48]} />
        <meshStandardMaterial color="#1a2045" roughness={1} />
      </mesh>

      {/* Ottoman arcade: pillars, arches, a parapet and a row of small domes */}
      {archRing.map(({ a, x, z }) => (
        <group key={a} position={[x, 0, z]} rotation-y={-a - Math.PI / 2}>
          <mesh position-y={1.6}>
            <cylinderGeometry args={[0.22, 0.26, 3.2, 10]} />
            <meshStandardMaterial color="#e3d8bf" roughness={0.6} />
          </mesh>
          <mesh position={[1.5, 3.2, 0]}>
            <torusGeometry args={[1.42, 0.16, 8, 20, Math.PI]} />
            <meshStandardMaterial color="#e3d8bf" roughness={0.6} />
          </mesh>
          <mesh position={[1.5, 2.6, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#ffd98a" toneMapped={false} />
          </mesh>
          {Math.round(a * 100) % 2 === 0 && (
            <mesh position={[1.5, 4.7, 1.3]}>
              <sphereGeometry args={[0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#bfb6a3" roughness={0.7} />
            </mesh>
          )}
        </group>
      ))}
      <mesh position-y={4.15}>
        <cylinderGeometry args={[27.3, 27.3, 1.1, 96, 1, true]} />
        <meshStandardMaterial color="#d9cdb2" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* newer Haram buildings behind, with lit windows */}
      <mesh position-y={6}>
        <cylinderGeometry args={[35, 35, 12, 96, 1, true]} />
        <meshStandardMaterial map={windows} emissiveMap={windows} emissive="#ffffff" emissiveIntensity={0.35} side={THREE.BackSide} roughness={0.8} />
      </mesh>

      {minarets.map((a) => (
        <group key={a} position={[Math.cos(a) * 37, 0, Math.sin(a) * 37]}>
          <mesh position-y={13}>
            <cylinderGeometry args={[0.55, 0.85, 26, 12]} />
            <meshStandardMaterial color="#e7dcc3" roughness={0.6} />
          </mesh>
          {[14, 20, 24.5].map((y) => (
            <mesh key={y} position-y={y}>
              <cylinderGeometry args={[1.2, 1.0, 0.45, 16]} />
              <meshStandardMaterial color="#f2e6c8" emissive="#ffd98a" emissiveIntensity={0.5} />
            </mesh>
          ))}
          <mesh position-y={28} material={gold}>
            <coneGeometry args={[0.6, 3, 12]} />
          </mesh>
          <mesh position-y={30} material={gold}>
            <torusGeometry args={[0.35, 0.07, 8, 20, Math.PI * 1.4]} />
          </mesh>
        </group>
      ))}

      {/* the clock tower, far to the south */}
      <group position={[0, 0, 82]}>
        <mesh position-y={28}>
          <boxGeometry args={[11, 56, 11]} />
          <meshStandardMaterial color="#cfc4ac" roughness={0.7} />
        </mesh>
        <mesh position-y={62}>
          <boxGeometry args={[8, 12, 8]} />
          <meshStandardMaterial color="#d9ceb5" roughness={0.6} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r) => (
          <mesh key={r} rotation-y={r} position={[Math.sin(r) * 4.05, 62, Math.cos(r) * 4.05]}>
            <circleGeometry args={[3.2, 40]} />
            <meshBasicMaterial color="#f6efd9" toneMapped={false} />
          </mesh>
        ))}
        <mesh position-y={76} material={gold}>
          <coneGeometry args={[1.6, 16, 12]} />
        </mesh>
        <mesh position-y={86} material={gold}>
          <torusGeometry args={[1.2, 0.2, 8, 24, Math.PI * 1.4]} />
        </mesh>
      </group>
    </group>
  );
}

const SPOTS = haramHistoricalData.map((item) => ({
  ...item,
  at: new THREE.Vector3(...item.position),
  facing: item.normal && new THREE.Vector3(...item.normal),
  inside: item.space === "inside",
}));
const PORTAL_ID = "door";

const wood = new THREE.MeshStandardMaterial({ color: "#6b4426", roughness: 0.6 });
const steel = new THREE.MeshStandardMaterial({ color: "#d9dde5", metalness: 0.7, roughness: 0.3 });
const polishedMarble = new THREE.MeshStandardMaterial({ color: "#efe9dc", roughness: 0.25 });

/** Turns a small object to face the Kaaba. */
const faceCentre = ([x, , z]: Vec3) => Math.atan2(-x, -z);

/** Zamzam cooler: a steel barrel on a stand, two taps, a stack of cups and a gold label band. */
function Dispenser() {
  return (
    <group>
      <mesh position-y={0.25} material={steel}>
        <boxGeometry args={[0.7, 0.5, 0.7]} />
      </mesh>
      <mesh position-y={0.95} material={steel}>
        <cylinderGeometry args={[0.36, 0.36, 0.9, 24]} />
      </mesh>
      <mesh position-y={1.4} material={steel}>
        <sphereGeometry args={[0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position-y={1.05} material={gold}>
        <cylinderGeometry args={[0.365, 0.365, 0.14, 24, 1, true]} />
      </mesh>
      {[-0.13, 0.13].map((x) => (
        <group key={x} position={[x, 0.7, 0.36]}>
          <mesh material={steel}>
            <boxGeometry args={[0.06, 0.06, 0.14]} />
          </mesh>
          <mesh position={[0, -0.06, 0.05]}>
            <boxGeometry args={[0.05, 0.08, 0.05]} />
            <meshStandardMaterial color={x < 0 ? "#3b82f6" : "#9ca3af"} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.48, 0.62, 0.1]}>
        <cylinderGeometry args={[0.06, 0.05, 0.25, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Folding rehal holding an open mushaf, in front of a small Qur'an cabinet. */
function Rehal() {
  return (
    <group>
      <mesh position={[0, 0.75, -0.55]} material={wood}>
        <boxGeometry args={[1.4, 1.5, 0.4]} />
      </mesh>
      {[0.55, 1.05].map((y) => (
        <group key={y}>
          {Array.from({ length: 10 }, (_, i) => (
            <mesh key={i} position={[-0.56 + i * 0.125, y, -0.34]}>
              <boxGeometry args={[0.1, 0.32, 0.05]} />
              <meshStandardMaterial color={i % 3 === 0 ? "#1f5f3f" : "#2c3e75"} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      {/* the rehal: two crossed boards */}
      {[0.55, -0.55].map((r) => (
        <mesh key={r} position={[0, 0.28, 0.2]} rotation-x={r} material={wood}>
          <boxGeometry args={[0.42, 0.66, 0.025]} />
        </mesh>
      ))}
      {/* open mushaf resting on it */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.11, 0.52, 0.32]} rotation={[-0.55, 0, side * 0.12]}>
          <mesh position-z={-0.004}>
            <boxGeometry args={[0.22, 0.3, 0.012]} />
            <meshStandardMaterial color="#1f5f3f" />
          </mesh>
          <mesh>
            <planeGeometry args={[0.2, 0.28]} />
            <meshStandardMaterial color="#fbf6e6" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Hexagonal brass lantern hanging from the arcade on a chain. */
function Lantern() {
  return (
    <group>
      <mesh position-y={3.75} material={gold}>
        <cylinderGeometry args={[0.012, 0.012, 0.9, 6]} />
      </mesh>
      <mesh position-y={3.25} material={gold}>
        <coneGeometry args={[0.22, 0.2, 6]} />
      </mesh>
      <mesh position-y={2.95}>
        <cylinderGeometry args={[0.2, 0.16, 0.42, 6]} />
        <meshStandardMaterial color="#ffe3a3" emissive="#ffc96b" emissiveIntensity={1.4} transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <mesh position-y={2.7} rotation-x={Math.PI} material={gold}>
        <coneGeometry args={[0.17, 0.16, 6]} />
      </mesh>
      <pointLight position-y={2.95} intensity={4} distance={5} color="#ffcf7a" />
    </group>
  );
}

/** The green light that faces the Black Stone, mounted on the arcade parapet. */
function GreenLight() {
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.2]} />
        <meshStandardMaterial color="#d8d0bf" />
      </mesh>
      <mesh position-z={0.11}>
        <boxGeometry args={[0.36, 0.36, 0.04]} />
        <meshBasicMaterial color="#34d399" toneMapped={false} />
      </mesh>
      <pointLight position-z={0.6} intensity={6} distance={6} color="#34d399" />
    </group>
  );
}

/** A Saudi-era column: square, marble-clad, with a stepped base, gold bands and a flared capital. */
function SaudiPillar() {
  return (
    <group>
      <mesh position-y={0.02} rotation-x={-Math.PI / 2} material={polishedMarble}>
        <circleGeometry args={[2.2, 32]} />
      </mesh>
      <mesh position-y={0.25} material={polishedMarble}>
        <boxGeometry args={[1.5, 0.5, 1.5]} />
      </mesh>
      <mesh position-y={2.6} material={polishedMarble}>
        <boxGeometry args={[1.05, 4.4, 1.05]} />
      </mesh>
      {[1.2, 2.6, 4].map((y) => (
        <mesh key={y} position-y={y} material={gold}>
          <boxGeometry args={[1.08, 0.05, 1.08]} />
        </mesh>
      ))}
      <mesh position-y={5.1} rotation-y={Math.PI / 4} material={polishedMarble}>
        <cylinderGeometry args={[1.05, 0.74, 0.6, 4, 1]} />
      </mesh>
    </group>
  );
}

/** A single Thassos marble slab, outlined in gold so it can be picked out on the mataf. */
function Tile() {
  return (
    <group>
      <mesh position-y={0.012} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.6, 1.6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.15} />
      </mesh>
      <mesh position-y={0.015} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.08, 1.16, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial color="#c9a35b" toneMapped={false} />
      </mesh>
    </group>
  );
}

const MICRO = { dispenser: Dispenser, rehal: Rehal, lantern: Lantern, greenLight: GreenLight, saudiPillar: SaudiPillar, tile: Tile };

/** Draws every small object listed in haramHistoricalData that has a model. */
function MicroObjects() {
  return (
    <>
      {haramHistoricalData.map((item) => {
        if (!item.model) return null;
        const Model = MICRO[item.model.type];
        return (
          <group key={item.id} position={item.model.at} rotation-y={faceCentre(item.model.at)}>
            <Model />
          </group>
        );
      })}
    </>
  );
}

/**
 * Moves the DOM markers to where their 3D points land on screen every frame. Markers on a wall
 * hide while that wall faces away, and far-away markers shrink so the close ones stay readable.
 */
function MarkerProjector({ markers, mode }: { markers: RefObject<(HTMLButtonElement | null)[]>; mode: RefObject<KaabaMode> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  const toCam = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    SPOTS.forEach(({ at, facing, inside }, i) => {
      const el = markers.current[i];
      if (!el) return;
      // outside markers show outside, inside markers inside, and none while walking through the door
      const here = mode.current === "inside" ? inside : mode.current === "outside" ? !inside : false;
      v.copy(at).project(camera);
      const inView = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      toCam.copy(camera.position).sub(at);
      const dist = toCam.length();
      const visible = here && inView && (!facing || toCam.normalize().dot(facing) > 0.08);
      if (visible) {
        const scale = Math.min(1, Math.max(0.55, 16 / dist)).toFixed(2);
        el.style.transform = `translate(${Math.round(((v.x + 1) / 2) * size.width)}px, ${Math.round(((1 - v.y) / 2) * size.height)}px) translate(-50%, -50%) scale(${scale})`;
      }
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
      el.tabIndex = visible ? 0 : -1;
    });
  });
  return null;
}

/**
 * Camera moves that don't come from dragging: walking up to a point of interest (target and camera
 * glide together), the zoom buttons, and "back to overview".
 */
function CameraRig({
  view,
  controls,
  mode,
}: {
  view: RefObject<KaabaView>;
  controls: RefObject<ComponentRef<typeof OrbitControls> | null>;
  mode: RefObject<KaabaMode>;
}) {
  const { camera } = useThree();
  const lastReset = useRef(0);
  const flight = useRef<{ target: THREE.Vector3; camera: THREE.Vector3 } | null>(null);
  const dir = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || mode.current !== "outside") return;
    const v = view.current;
    if (v.reset !== lastReset.current) {
      lastReset.current = v.reset;
      flight.current = null;
      c.reset();
    }
    if (v.focus && v.focus.seq !== v.handled) {
      if (v.focus.inside) {
        // something inside the Kaaba: open the door first; the portal looks at it once inside
        set(v, "enter", v.enter + 1);
        return;
      }
      set(v, "handled", v.focus.seq);
      const target = new THREE.Vector3(...v.focus.target);
      flight.current = { target, camera: target.clone().add(new THREE.Vector3(...v.focus.dir).setLength(v.focus.distance)) };
    }
    const f = flight.current;
    if (f) {
      const k = 1 - Math.exp(-dt * 2.6);
      c.target.lerp(f.target, k);
      camera.position.lerp(f.camera, k);
      if (camera.position.distanceTo(f.camera) < 0.03 && c.target.distanceTo(f.target) < 0.03) flight.current = null;
      return;
    }
    dir.copy(camera.position).sub(c.target);
    const d = THREE.MathUtils.damp(dir.length(), v.distance, 4, dt);
    camera.position.copy(c.target).add(dir.setLength(d));
  });
  return null;
}

const PORTAL_LABEL = "Open the door and explore the Kaaba";

/**
 * Opening the door and walking in (and back out), choreographed with GSAP: the curtain is drawn up,
 * both leaves swing in on their hinges, and the camera rises to the doorway, glides through it and
 * settles where a visitor would stand. Inside, the orbit controls turn into a 360° look-around.
 */
function Portal({
  view,
  controls,
  parts,
  mode,
  setMode,
}: {
  view: RefObject<KaabaView>;
  controls: RefObject<ComponentRef<typeof OrbitControls> | null>;
  parts: RefObject<DoorParts>;
  mode: RefObject<KaabaMode>;
  setMode: (m: KaabaMode) => void;
}) {
  const { camera } = useThree();
  const lens = camera as THREE.PerspectiveCamera;
  const seen = useRef({ enter: 0, exit: 0 });
  const look = useMemo(() => new THREE.Vector3(), []);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => () => void timeline.current?.kill(), []);

  /** Inside, the camera stays put at EYE; the orbit target sits a hair in front of it in the view direction. */
  const lookToward = (dir: THREE.Vector3) => {
    const c = controls.current;
    if (!c) return;
    c.target.copy(EYE).addScaledVector(dir.normalize(), 0.08);
    camera.position.copy(EYE);
  };

  const enter = () => {
    const c = controls.current;
    const { left, right, curtain } = parts.current;
    if (!c || !left || !right || !curtain) return;
    setMode("entering");
    set(c, "enabled", false);
    set(c, "autoRotate", false);
    timeline.current?.kill();
    const target = c.target;
    timeline.current = gsap
      .timeline({
        onUpdate: () => camera.lookAt(target),
        onComplete: () => {
          set(c, "minPolarAngle", 0.15);
          set(c, "maxPolarAngle", Math.PI - 0.15);
          set(c, "rotateSpeed", -0.35); // dragging pulls the room round, like turning your head
          lookToward(FIRST_LOOK.clone().sub(EYE));
          set(c, "enabled", true);
          c.update();
          setMode("inside");
        },
      })
      .to(curtain.scale, { y: 0.08, duration: 1, ease: "power2.inOut" }, 0)
      .to(left.rotation, { y: 1.75, duration: 1.7, ease: "power2.inOut" }, 0.7)
      .to(right.rotation, { y: -1.75, duration: 1.7, ease: "power2.inOut" }, 0.7)
      .to(camera.position, { x: DOOR_FRONT.x, y: DOOR_FRONT.y, z: DOOR_FRONT.z, duration: 2.4, ease: "power2.inOut" }, 0.2)
      .to(target, { x: DOOR_CENTRE.x, y: DOOR_CENTRE.y, z: DOOR_CENTRE.z, duration: 2.4, ease: "power2.inOut" }, 0.2)
      .to(camera.position, { x: JUST_INSIDE.x, y: JUST_INSIDE.y, z: JUST_INSIDE.z, duration: 1.7, ease: "power1.inOut" }, 2.6)
      .to(target, { x: FIRST_LOOK.x, y: FIRST_LOOK.y, z: FIRST_LOOK.z, duration: 1.7, ease: "power1.inOut" }, 2.6)
      .to(camera.position, { x: EYE.x, y: EYE.y, z: EYE.z, duration: 1.3, ease: "power2.out" }, 4.3)
      // the view opens up once you are standing in the room
      .to(lens, { fov: FOV.inside, duration: 1.3, ease: "power2.out", onUpdate: () => lens.updateProjectionMatrix() }, 4.3);
  };

  const exit = () => {
    const c = controls.current;
    const { left, right, curtain } = parts.current;
    if (!c || !left || !right || !curtain) return;
    setMode("leaving");
    set(c, "enabled", false);
    timeline.current?.kill();
    const target = c.target;
    timeline.current = gsap
      .timeline({
        onUpdate: () => camera.lookAt(target),
        onComplete: () => {
          set(c, "minPolarAngle", 0.3);
          set(c, "maxPolarAngle", 1.5);
          set(c, "rotateSpeed", 0.7);
          set(c, "enabled", true);
          c.update();
          set(view.current, "distance", camera.position.distanceTo(c.target));
          setMode("outside");
        },
      })
      .to(lens, { fov: FOV.outside, duration: 1.1, ease: "power2.inOut", onUpdate: () => lens.updateProjectionMatrix() }, 0)
      .to(target, { x: DOOR_CENTRE.x, y: DOOR_CENTRE.y, z: DOOR_CENTRE.z, duration: 1.1, ease: "power2.inOut" }, 0)
      .to(camera.position, { x: JUST_INSIDE.x, y: JUST_INSIDE.y, z: JUST_INSIDE.z, duration: 1.1, ease: "power2.inOut" }, 0)
      .to(camera.position, { x: DOOR_FRONT.x, y: DOOR_FRONT.y, z: DOOR_FRONT.z, duration: 1.6, ease: "power1.inOut" }, 1.1)
      .to(left.rotation, { y: 0, duration: 1.5, ease: "power2.inOut" }, 2.2)
      .to(right.rotation, { y: 0, duration: 1.5, ease: "power2.inOut" }, 2.2)
      .to(curtain.scale, { y: 1, duration: 1, ease: "power2.inOut" }, 3.3)
      .to(camera.position, { x: OVERVIEW.camera.x, y: OVERVIEW.camera.y, z: OVERVIEW.camera.z, duration: 2.2, ease: "power2.inOut" }, 2.7)
      .to(target, { x: OVERVIEW.target.x, y: OVERVIEW.target.y, z: OVERVIEW.target.z, duration: 2.2, ease: "power2.inOut" }, 2.7);
  };

  useFrame(() => {
    const v = view.current;
    if (v.enter !== seen.current.enter) {
      seen.current.enter = v.enter;
      if (mode.current === "outside") enter();
    }
    if (v.exit !== seen.current.exit) {
      seen.current.exit = v.exit;
      if (mode.current === "inside") exit();
    }
    // inside: turn to face whatever was chosen; anything outside sends the visitor back out first
    if (mode.current === "inside" && v.focus && v.focus.seq !== v.handled) {
      if (!v.focus.inside) {
        set(v, "exit", v.exit + 1);
        return;
      }
      set(v, "handled", v.focus.seq);
      const c = controls.current;
      if (!c) return;
      const from = c.target.clone().sub(EYE).normalize();
      const to = new THREE.Vector3(...v.focus.target).sub(EYE).normalize();
      const state = { t: 0 };
      gsap.to(state, {
        t: 1,
        duration: 1.2,
        ease: "power2.inOut",
        onUpdate: () => {
          look.copy(from).lerp(to, state.t);
          lookToward(look);
        },
      });
    }
  });
  return null;
}

export default function KaabaCanvas({
  progress,
  running,
  view,
  onHotspot,
  onModeChange,
}: {
  progress: MotionValue<number>;
  running: boolean;
  view: RefObject<KaabaView>;
  onHotspot: (id: string) => void;
  onModeChange: (mode: KaabaMode) => void;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const idle = useRef<number | undefined>(undefined);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  const parts = useRef<DoorParts>({ left: null, right: null, curtain: null });
  const mode = useRef<KaabaMode>("outside");
  const [doorHover, setDoorHover] = useState(false);
  const setMode = (m: KaabaMode) => {
    mode.current = m;
    onModeChange(m);
  };
  const openDoor = () => {
    set(view.current, "enter", view.current.enter + 1);
  };
  // the slow turn stops while someone drags or points at a marker, and picks up again 4 s later
  const pause = () => {
    window.clearTimeout(idle.current);
    if (controls.current) controls.current.autoRotate = false;
  };
  const resume = () => {
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(() => {
      if (controls.current) controls.current.autoRotate = true;
    }, 4000);
  };

  return (
    <div className="absolute inset-0">
      <Canvas
        frameloop={running ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [22, 11, -14], fov: 40, near: 0.1, far: 400 }}
        gl={{ antialias: true }}
        className="cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#0b1230"]} />
        <fog attach="fog" args={["#0b1230", 40, 150]} />
        <Stars radius={180} depth={40} count={1400} factor={4} fade speed={0.4} />
        <ambientLight intensity={0.45} />
        <hemisphereLight args={["#5a6aa8", "#d8c9a0", 0.7]} />
        <directionalLight position={[20, 30, 14]} intensity={1.7} color="#fff1d6" />
        <directionalLight position={[-18, 14, -10]} intensity={0.6} color="#9fb4ff" />
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={4} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 8, 1]} />
          <Lightformer form="rect" intensity={2.5} color="#ecd9a8" position={[-12, 4, 0]} rotation-y={Math.PI / 2} scale={[14, 4, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#7fb3e0" position={[12, 4, 0]} rotation-y={-Math.PI / 2} scale={[14, 4, 1]} />
        </Environment>

        <Haram />
        <Kaaba
          door={{
            parts,
            onOver: () => {
              setDoorHover(true);
              document.body.style.cursor = "pointer";
            },
            onOut: () => {
              setDoorHover(false);
              document.body.style.cursor = "";
            },
            onOpen: openDoor,
          }}
        />
        <MicroObjects />
        <Pilgrims progress={progress} />
        <ContactShadows position-y={0.01} opacity={0.5} scale={22} blur={2.6} far={6} resolution={512} color="#000" frames={1} />
        <MarkerProjector markers={markers} mode={mode} />

        <OrbitControls
          ref={controls}
          target={[0, 3.4, 0]}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={0.3}
          maxPolarAngle={1.5}
          rotateSpeed={0.7}
          autoRotate
          autoRotateSpeed={0.5}
          enableDamping
          onStart={pause}
          onEnd={resume}
        />
        <CameraRig view={view} controls={controls} mode={mode} />
        <Portal view={view} controls={controls} parts={parts} mode={mode} setMode={setMode} />
      </Canvas>
      {SPOTS.map((spot, i) => (
        <button
          key={spot.id}
          ref={(el) => {
            markers.current[i] = el;
          }}
          type="button"
          onClick={() => (spot.id === PORTAL_ID ? openDoor() : onHotspot(spot.id))}
          onPointerEnter={pause}
          onPointerLeave={resume}
          onFocus={pause}
          onBlur={resume}
          aria-label={spot.id === PORTAL_ID ? PORTAL_LABEL : `About ${spot.name}`}
          style={{ opacity: 0 }}
          className="group absolute top-0 left-0 z-10 grid size-7 place-items-center rounded-full outline-none transition-opacity duration-300"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/50" />
          <span className="relative grid size-6 place-items-center rounded-full border-2 border-ivory-50 bg-gold-500 text-[11px] font-bold text-night-950 shadow-lg transition group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-ivory-50">
            +
          </span>
          {spot.id === PORTAL_ID ? (
            <span
              className={`pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full border border-gold-400/60 bg-night-950/90 px-4 py-2 text-sm font-semibold whitespace-nowrap text-gold-300 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100 ${
                doorHover ? "opacity-100" : "opacity-0"
              }`}
            >
              {PORTAL_LABEL}
            </span>
          ) : (
            <span className="pointer-events-none absolute top-1/2 left-full ml-2 -translate-y-1/2 rounded-full bg-night-950/85 px-2.5 py-1 text-[11px] whitespace-nowrap text-ivory-50 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {spot.name}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
