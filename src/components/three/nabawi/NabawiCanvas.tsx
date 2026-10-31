"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import gsap from "gsap";
import { useLayoutEffect, useMemo, useRef, useState, type ComponentRef, type RefObject } from "react";
import * as THREE from "three";
import { GREEN_DOME, nabawiData } from "@/lib/nabawiData";
import { doorLeafTexture } from "../kaaba/kaabaTextures";
import { carpetTexture, ceilingTexture, domeTexture, facadeTexture, greenDomeTexture, grilleTexture, mihrabTexture, plazaTexture } from "./nabawiTextures";

// Stylised Masjid an-Nabawi. +z = south (Qibla), +x = east, 1 unit ≈ 4 m, roof at y 5.
const ROOF = 5;
const WALL = 0.6;
/** The southern hall is hollow and can be entered; everything else is solid. */
const HALL = { x0: -40, x1: 40, z0: 15, z1: 50 };
const BLOCKS: [number, number, number, number][] = [
  [-40, 40, -50, -5],
  [-40, -28, -5, 15],
  [-6, 6, -5, 15],
  [28, 40, -5, 15],
];
const CHAMBER = { x0: 22.6, x1: 29.4, z0: 40.6, z1: 49.4 };
const RAWDAH = { x0: 11.5, x1: 22.4, z0: 40, z1: 48.5 };
const EYE_Y = 0.45;
const DOOR = { width: 3.2, height: 3.8 };

type GateId = "west" | "east";
const GATES: Record<GateId, { id: string; x: number; z: number; out: 1 | -1 }> = {
  west: { id: "bab-as-salam", x: HALL.x0, z: 40, out: -1 },
  east: { id: "bab-jibril", x: HALL.x1, z: 36, out: 1 },
};
const GATE_OF_ITEM: Record<string, GateId> = { "bab-as-salam": "west", "bab-jibril": "east" };

/** Where a visitor can stand inside, and what they face. The chamber is never one of them. */
export type VantageId = "hall" | "rawdah" | "mihrab" | "grille";
export const VANTAGES: Record<VantageId, { label: string; eye: THREE.Vector3; look: THREE.Vector3 }> = {
  hall: { label: "The halls", eye: new THREE.Vector3(-12, EYE_Y, 30), look: new THREE.Vector3(10, 1.6, 42) },
  rawdah: { label: "Riyazul Jannah", eye: new THREE.Vector3(14, EYE_Y, 42.6), look: new THREE.Vector3(22, 1.3, 45) },
  mihrab: { label: "The Mihrab", eye: new THREE.Vector3(17, EYE_Y, 44), look: new THREE.Vector3(17, 1.5, 49.6) },
  grille: { label: "The golden grilles", eye: new THREE.Vector3(18.6, EYE_Y, 45.2), look: new THREE.Vector3(23, 1.7, 45.2) },
};
const VANTAGE_OF_ITEM: Record<string, VantageId> = {
  jali: "grille",
  "three-graves": "grille",
  "mihrab-nabawi": "mihrab",
  "riyad-al-jannah": "rawdah",
  minbar: "rawdah",
  ceilings: "hall",
};

const OVERVIEW = { camera: new THREE.Vector3(120, 105, 165), target: new THREE.Vector3(0, 0, 0) };
const TOP_DOWN = { camera: new THREE.Vector3(GREEN_DOME[0], 70, GREEN_DOME[2] + 0.01), target: new THREE.Vector3(...GREEN_DOME) };
export const NABAWI_DISTANCE = OVERVIEW.camera.distanceTo(OVERVIEW.target);

export type NabawiMode = "outside" | "moving" | "inside";
/** Requests from the UI around the canvas; bump a counter to ask again. */
export type NabawiControl = { enter: number; gate: GateId; exit: number; walk: { to: VantageId; seq: number } | null };

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
const stone = mat("#cfae78");
const roofTop = mat("#b7a07a", { roughness: 0.85 });
const cityStone = mat("#a89a86", { roughness: 0.9 });
const marble = mat("#f7f4ee", { roughness: 0.35 });
const gold = mat("#d4af5f", { metalness: 0.85, roughness: 0.3 });

/** Writes to objects that arrive as props / refs, kept out of render for React's compiler. */
const set = <T extends object, K extends keyof T>(target: T, key: K, value: T[K]) => {
  target[key] = value;
};

/** A wall from a to b (along x or z) with an optional doorway at `gap` (centre along the wall). */
function Wall({ axis, at, from, to, gap, outward }: { axis: "x" | "z"; at: number; from: number; to: number; gap?: number; outward: 1 | -1 }) {
  const pieces: [number, number][] = gap === undefined ? [[from, to]] : [[from, gap - DOOR.width / 2], [gap + DOOR.width / 2, to]];
  const face = (len: number) => {
    const m = new THREE.MeshStandardMaterial({ map: facadeTexture(len), roughness: 0.75 });
    return m;
  };
  return (
    <group>
      {pieces.map(([a, b]) => {
        const len = b - a;
        const mid = (a + b) / 2;
        const pos: [number, number, number] = axis === "x" ? [mid, ROOF / 2, at] : [at, ROOF / 2, mid];
        const size: [number, number, number] = axis === "x" ? [len, ROOF, WALL] : [WALL, ROOF, len];
        return (
          <mesh key={a} position={pos} castShadow receiveShadow material={face(len)}>
            <boxGeometry args={size} />
          </mesh>
        );
      })}
      {gap !== undefined && (
        <mesh position={axis === "x" ? [gap, (ROOF + DOOR.height) / 2, at] : [at, (ROOF + DOOR.height) / 2, gap]} material={stone}>
          <boxGeometry args={axis === "x" ? [DOOR.width, ROOF - DOOR.height, WALL] : [WALL, ROOF - DOOR.height, DOOR.width]} />
        </mesh>
      )}
      {/* a gold-framed portal on the outside of the doorway */}
      {gap !== undefined && (
        <group position={axis === "z" ? [at + (outward * WALL) / 2, 0, gap] : [gap, 0, at + (outward * WALL) / 2]}>
          <mesh position-y={DOOR.height + 0.25} material={gold}>
            <boxGeometry args={axis === "z" ? [0.15, 0.4, DOOR.width + 0.8] : [DOOR.width + 0.8, 0.4, 0.15]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={axis === "z" ? [0, DOOR.height / 2, s * (DOOR.width / 2 + 0.25)] : [s * (DOOR.width / 2 + 0.25), DOOR.height / 2, 0]} material={gold}>
              <boxGeometry args={axis === "z" ? [0.15, DOOR.height, 0.3] : [0.3, DOOR.height, 0.15]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/** Two door leaves hinged on the doorway's edges; rotating the groups swings them inwards. */
function Gate({ gate, leaves, onOver, onOut, onOpen }: { gate: GateId; leaves: RefObject<Record<GateId, THREE.Group[]>>; onOver: () => void; onOut: () => void; onOpen: (g: GateId) => void }) {
  const g = GATES[gate];
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({ map: doorLeafTexture(), metalness: 0.7, roughness: 0.35 }), []);
  const half = DOOR.width / 2;
  const events = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onOver();
    },
    onPointerOut: onOut,
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onOpen(gate);
    },
  };
  return (
    <group position={[g.x, 0, g.z]} {...events}>
      {[-1, 1].map((side, i) => (
        <group
          key={side}
          ref={(el) => {
            if (el) leaves.current[gate][i] = el;
          }}
          position={[0, 0, side * half]}
        >
          <mesh position={[0, DOOR.height / 2, -side * (half / 2)]} material={leafMat} castShadow>
            <boxGeometry args={[0.12, DOOR.height - 0.05, half - 0.03]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Rows of pillars with arches, instanced: marble shafts, gold capitals, arches both ways. */
function Colonnade() {
  const spots = useMemo(() => {
    const list: [number, number][] = [];
    for (let x = HALL.x0 + 2; x < HALL.x1 - 1; x += 2.5)
      for (let z = HALL.z0 + 2; z < HALL.z1 - 1; z += 2.5) {
        const inChamber = x > CHAMBER.x0 - 0.6 && x < CHAMBER.x1 + 0.6 && z > CHAMBER.z0 - 0.6;
        // a clear aisle in from each gate, so no pillar stands in front of the door
        const nearGate = Object.values(GATES).some((g) => Math.abs(x - g.x) < 27 && Math.abs(z - g.z) < 1.8);
        // keep the view clear where visitors stand and along what they look at
        const blocksView = Object.values(VANTAGES).some(({ eye, look }) => {
          const dx = look.x - eye.x;
          const dz = look.z - eye.z;
          const t = Math.min(1, Math.max(0, ((x - eye.x) * dx + (z - eye.z) * dz) / (dx * dx + dz * dz)));
          return Math.hypot(x - (eye.x + dx * t), z - (eye.z + dz * t)) < 1.3 && t < 0.6;
        });
        if (!inChamber && !nearGate && !blocksView) list.push([x, z]);
      }
    return list;
  }, []);
  const shafts = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const archX = useRef<THREE.InstancedMesh>(null);
  const archZ = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    spots.forEach(([x, z], i) => {
      o.rotation.set(0, 0, 0);
      o.position.set(x, 1.8, z);
      o.updateMatrix();
      shafts.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, 3.65, z);
      o.updateMatrix();
      caps.current?.setMatrixAt(i, o.matrix);
      o.position.set(x + 1.25, 3.75, z);
      o.updateMatrix();
      archX.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, 3.75, z + 1.25);
      o.rotation.set(0, Math.PI / 2, 0);
      o.updateMatrix();
      archZ.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [shafts, caps, archX, archZ]) if (m.current) m.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  const archMat = useMemo(() => mat("#f3ead6", { roughness: 0.5 }), []);
  return (
    <>
      <instancedMesh ref={shafts} args={[undefined, undefined, spots.length]} material={marble} castShadow>
        <cylinderGeometry args={[0.2, 0.24, 3.6, 12]} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, spots.length]} material={gold}>
        <cylinderGeometry args={[0.32, 0.22, 0.3, 12]} />
      </instancedMesh>
      <instancedMesh ref={archX} args={[undefined, undefined, spots.length]} material={archMat}>
        <torusGeometry args={[1.25, 0.11, 6, 16, Math.PI]} />
      </instancedMesh>
      <instancedMesh ref={archZ} args={[undefined, undefined, spots.length]} material={archMat}>
        <torusGeometry args={[1.25, 0.11, 6, 16, Math.PI]} />
      </instancedMesh>
    </>
  );
}

/** Brass chandeliers hanging in the halls (instanced), with a few real lights among them. */
function Chandeliers() {
  const spots = useMemo(() => {
    const list: [number, number][] = [];
    for (let x = HALL.x0 + 5; x < HALL.x1 - 3; x += 7.5) for (let z = HALL.z0 + 4.5; z < HALL.z1 - 2; z += 7.5) if (!(x > CHAMBER.x0 - 1 && z > CHAMBER.z0 - 1)) list.push([x, z]);
    return list;
  }, []);
  const glows = useRef<THREE.InstancedMesh>(null);
  const rings = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    spots.forEach(([x, z], i) => {
      o.position.set(x, 3.1, z);
      o.updateMatrix();
      glows.current?.setMatrixAt(i, o.matrix);
      rings.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [glows, rings]) if (m.current) m.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <>
      <instancedMesh ref={glows} args={[undefined, undefined, spots.length]}>
        <sphereGeometry args={[0.32, 16, 12]} />
        <meshStandardMaterial color="#fff1c9" emissive="#ffcf7a" emissiveIntensity={1.6} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[undefined, undefined, spots.length]} material={gold}>
        <torusGeometry args={[0.6, 0.05, 8, 24]} />
      </instancedMesh>
      {[
        [-25, 32],
        [-5, 32],
        [12, 30],
        [16, 44],
        [-15, 44],
        [32, 25],
      ].map(([x, z]) => (
        <pointLight key={`${x}${z}`} position={[x, 3.4, z]} intensity={22} distance={22} color="#ffdca0" />
      ))}
    </>
  );
}

/** The hollow southern hall: walls with two gates, roof, painted ceiling, carpets, colonnade, Rawdah, mihrab, chamber. */
function Hall({ leaves, onDoorOver, onDoorOut, onOpen }: { leaves: RefObject<Record<GateId, THREE.Group[]>>; onDoorOver: () => void; onDoorOut: () => void; onOpen: (g: GateId) => void }) {
  const tex = useMemo(
    () => ({ carpet: carpetTexture(), rawdah: carpetTexture("#1f7a4f", "#e9d39a"), ceiling: ceilingTexture(), mihrab: mihrabTexture(), grille: grilleTexture() }),
    [],
  );
  const w = HALL.x1 - HALL.x0;
  const d = HALL.z1 - HALL.z0;
  const cx = (HALL.x0 + HALL.x1) / 2;
  const cz = (HALL.z0 + HALL.z1) / 2;
  const grille = useMemo(() => new THREE.MeshStandardMaterial({ map: tex.grille, metalness: 0.55, roughness: 0.4 }), [tex.grille]);
  return (
    <group>
      <Wall axis="x" at={HALL.z1} from={HALL.x0} to={HALL.x1} outward={1} />
      <Wall axis="x" at={HALL.z0} from={HALL.x0} to={HALL.x1} outward={-1} />
      <Wall axis="z" at={HALL.x0} from={HALL.z0} to={HALL.z1} gap={GATES.west.z} outward={-1} />
      <Wall axis="z" at={HALL.x1} from={HALL.z0} to={HALL.z1} gap={GATES.east.z} outward={1} />
      <Gate gate="west" leaves={leaves} onOver={onDoorOver} onOut={onDoorOut} onOpen={onOpen} />
      <Gate gate="east" leaves={leaves} onOver={onDoorOver} onOut={onDoorOut} onOpen={onOpen} />

      {/* roof outside, painted ceiling inside */}
      <mesh position={[cx, ROOF + 0.15, cz]} castShadow receiveShadow material={roofTop}>
        <boxGeometry args={[w + 0.4, 0.3, d + 0.4]} />
      </mesh>
      <mesh position={[cx, ROOF - 0.02, cz]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={tex.ceiling} roughness={0.6} />
      </mesh>

      {/* carpets */}
      <mesh position={[cx, 0.02, cz]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={tex.carpet} color="#8d8d8d" roughness={1} />
      </mesh>
      <mesh position={[(RAWDAH.x0 + RAWDAH.x1) / 2, 0.03, (RAWDAH.z0 + RAWDAH.z1) / 2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[RAWDAH.x1 - RAWDAH.x0, RAWDAH.z1 - RAWDAH.z0]} />
        <meshStandardMaterial map={tex.rawdah} color="#8d8d8d" roughness={1} />
      </mesh>

      <Colonnade />
      <Chandeliers />

      {/* the minbar */}
      <group position={[12.5, 0, 44]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, 0.25 + i * 0.35, -0.6 + i * 0.35]} material={marble}>
            <boxGeometry args={[0.9, 0.5 + i * 0.7, 0.45]} />
          </mesh>
        ))}
        <mesh position={[0, 3, 0.6]} material={gold}>
          <coneGeometry args={[0.45, 1.1, 4]} />
        </mesh>
      </group>

      {/* Mihrab an-Nabawi on the Qibla side */}
      <group position={[17, 0, HALL.z1 - WALL / 2 - 0.02]}>
        <mesh position={[0, 1.6, -0.05]} rotation-y={Math.PI}>
          <planeGeometry args={[2, 3.2]} />
          <meshStandardMaterial map={tex.mihrab} roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 3.3, -0.12]} material={gold}>
          <boxGeometry args={[2.3, 0.18, 0.2]} />
        </mesh>
      </group>

      {/* the sacred chamber's enclosure: brass grilles outside, nothing modelled within */}
      <mesh position={[(CHAMBER.x0 + CHAMBER.x1) / 2, 2.2, (CHAMBER.z0 + CHAMBER.z1) / 2]} material={grille} castShadow>
        <boxGeometry args={[CHAMBER.x1 - CHAMBER.x0, 4.4, CHAMBER.z1 - CHAMBER.z0]} />
      </mesh>
      <mesh position={[(CHAMBER.x0 + CHAMBER.x1) / 2, 4.5, (CHAMBER.z0 + CHAMBER.z1) / 2]} material={gold}>
        <boxGeometry args={[CHAMBER.x1 - CHAMBER.x0 + 0.1, 0.2, CHAMBER.z1 - CHAMBER.z0 + 0.1]} />
      </mesh>

      <ambientLight intensity={0.15} />
    </group>
  );
}

function Exterior() {
  const tex = useMemo(() => ({ plaza: plazaTexture(), dome: domeTexture(), green: greenDomeTexture() }), []);
  const domeMat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex.dome, roughness: 0.5, metalness: 0.15 }), [tex.dome]);
  const domes = useMemo(() => {
    const list: [number, number][] = [];
    for (let x = -34; x <= 6; x += 7.5) for (let z = 20; z <= 46; z += 8.5) list.push([x, z]);
    for (let x = -34; x <= 34; x += 8.5) for (let z = -44; z <= -12; z += 10) list.push([x, z]);
    return list;
  }, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow>
        <planeGeometry args={[260, 260]} />
        <meshStandardMaterial map={tex.plaza} roughness={0.45} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05}>
        <circleGeometry args={[400, 48]} />
        <meshStandardMaterial color="#cbbfa5" roughness={1} />
      </mesh>
      {BLOCKS.map(([x0, x1, z0, z1]) => (
        <mesh key={`${x0}${z0}`} position={[(x0 + x1) / 2, ROOF / 2, (z0 + z1) / 2]} castShadow receiveShadow material={stone}>
          <boxGeometry args={[x1 - x0, ROOF, z1 - z0]} />
        </mesh>
      ))}
      {BLOCKS.map(([x0, x1, z0, z1]) => (
        <mesh key={`r${x0}${z0}`} position={[(x0 + x1) / 2, ROOF + 0.06, (z0 + z1) / 2]} material={roofTop} receiveShadow>
          <boxGeometry args={[x1 - x0 + 0.2, 0.12, z1 - z0 + 0.2]} />
        </mesh>
      ))}
      {/* north facade with its arcade */}
      <mesh position={[0, ROOF / 2, -50.02]} rotation-y={Math.PI}>
        <planeGeometry args={[80, ROOF]} />
        <meshStandardMaterial map={facadeTexture(80)} roughness={0.75} />
      </mesh>
      {domes.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, ROOF + 0.3, z]} material={domeMat} castShadow>
          <sphereGeometry args={[1.7, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
      {/* the Green Dome on its drum */}
      <group position={[GREEN_DOME[0], ROOF + 0.3, GREEN_DOME[2]]} scale={1.5}>
        <mesh position-y={1} castShadow>
          <cylinderGeometry args={[2.7, 2.9, 2, 32]} />
          <meshStandardMaterial map={tex.green} roughness={0.4} />
        </mesh>
        <mesh position-y={2} castShadow>
          <sphereGeometry args={[2.75, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial map={tex.green} roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position-y={5.1} material={gold}>
          <sphereGeometry args={[0.28, 12, 12]} />
        </mesh>
        <mesh position-y={5.75} material={gold}>
          <torusGeometry args={[0.35, 0.06, 8, 24, Math.PI * 1.4]} />
        </mesh>
      </group>
      <Minarets />
      <Umbrellas />
      <Baqi />
    </group>
  );
}

const MINARETS: [number, number][] = [
  [-40, -50],
  [40, -50],
  [-40, 50],
  [40, 50],
  [-14, -50],
  [14, -50],
  [-40, 5],
  [40, 5],
  [-6, 50],
  [33, 33],
];

function Minarets() {
  const white = useMemo(() => mat("#efe2c4", { roughness: 0.45 }), []);
  return (
    <>
      {MINARETS.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position-y={6} material={stone} castShadow>
            <boxGeometry args={[2.4, 12, 2.4]} />
          </mesh>
          <mesh position-y={17} material={white} castShadow>
            <cylinderGeometry args={[0.85, 1.05, 12, 16]} />
          </mesh>
          {[12.2, 18.5, 23].map((y) => (
            <group key={y}>
              <mesh position-y={y} material={white}>
                <cylinderGeometry args={[1.5, 1.3, 0.5, 16]} />
              </mesh>
              <mesh position-y={y + 0.3} material={gold}>
                <torusGeometry args={[1.45, 0.06, 6, 24]} />
              </mesh>
            </group>
          ))}
          {[14.5, 20.5].map((y) => (
            <mesh key={y} position-y={y} material={gold}>
              <cylinderGeometry args={[0.97, 0.97, 0.25, 16]} />
            </mesh>
          ))}
          <mesh position-y={25.5} material={white}>
            <cylinderGeometry args={[0.6, 0.75, 4, 12]} />
          </mesh>
          <mesh position-y={28.6} material={gold}>
            <coneGeometry args={[0.8, 2.6, 16]} />
          </mesh>
          <mesh position-y={30.4} material={gold}>
            <torusGeometry args={[0.35, 0.07, 8, 20, Math.PI * 1.4]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Folding umbrellas: a few in the inner courtyards, rows across the plazas. */
function Umbrellas() {
  const spots = useMemo(() => {
    const list: [number, number, number][] = [];
    for (const x of [-23, -17, -11, 11, 17, 23]) for (const z of [0, 10]) list.push([x, z, 0.75]);
    for (let x = -45; x <= 45; x += 9) for (let z = -60; z >= -87; z -= 9) list.push([x, z, 1]);
    for (const side of [-1, 1]) for (let x = 50; x <= 77; x += 9) for (let z = -45; z <= 45; z += 9) list.push([side * x, z, 1]);
    for (let x = -35; x <= 35; x += 9) list.push([x, 60, 1]);
    return list;
  }, []);
  const stems = useRef<THREE.InstancedMesh>(null);
  const tops = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    spots.forEach(([x, z, s], i) => {
      o.position.set(x, 3.2 * s, z);
      o.rotation.set(0, 0, 0);
      o.scale.set(s, s, s);
      o.updateMatrix();
      stems.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, 6.6 * s, z);
      o.rotation.set(Math.PI, Math.PI / 4, 0);
      o.updateMatrix();
      tops.current?.setMatrixAt(i, o.matrix);
    });
    if (stems.current) stems.current.instanceMatrix.needsUpdate = true;
    if (tops.current) tops.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <>
      <instancedMesh ref={stems} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[0.2, 0.25, 6.4, 8]} />
        <meshStandardMaterial color="#d9d4c8" metalness={0.4} roughness={0.45} />
      </instancedMesh>
      <instancedMesh ref={tops} args={[undefined, undefined, spots.length]} castShadow>
        <coneGeometry args={[5.6, 1.2, 4, 1, true]} />
        <meshStandardMaterial color="#f1dfb8" roughness={0.6} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}

function Baqi() {
  const towers = useMemo(() => {
    const list: { x: number; z: number; h: number; w: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const r = 150 + ((i * 37) % 30);
      list.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, h: 14 + ((i * 53) % 26), w: 12 + ((i * 17) % 10) });
    }
    return list;
  }, []);
  return (
    <group>
      <group position={[110, 0, 10]}>
        <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
          <planeGeometry args={[30, 40]} />
          <meshStandardMaterial color="#cdb995" roughness={1} />
        </mesh>
        {[
          [0, 20, 30, 0.6],
          [0, -20, 30, 0.6],
          [15, 0, 0.6, 40],
          [-15, 0, 0.6, 40],
        ].map(([x, z, w, d]) => (
          <mesh key={`${x}${z}`} position={[x, 1.2, z]} material={stone} castShadow>
            <boxGeometry args={[w, 2.4, d]} />
          </mesh>
        ))}
      </group>
      {towers.map((t, i) => (
        <mesh key={i} position={[t.x, t.h / 2, t.z]} material={cityStone}>
          <boxGeometry args={[t.w, t.h, t.w]} />
        </mesh>
      ))}
    </group>
  );
}

const SPOTS = nabawiData.map((item) => ({ ...item, at: new THREE.Vector3(...item.position), facing: item.normal && new THREE.Vector3(...item.normal) }));

/** Moves the DOM markers each frame; outside markers show outside, inside ones inside, none while moving or in the plan. */
function MarkerProjector({ markers, mode, hidden }: { markers: RefObject<(HTMLButtonElement | null)[]>; mode: RefObject<NabawiMode>; hidden: RefObject<boolean> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  const toCam = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    SPOTS.forEach(({ at, facing, space }, i) => {
      const el = markers.current[i];
      if (!el) return;
      const here = mode.current === "inside" ? space === "inside" || space === "both" : mode.current === "outside" ? space !== "inside" : false;
      v.copy(at).project(camera);
      const inView = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05;
      toCam.copy(camera.position).sub(at);
      const dist = toCam.length();
      const visible = here && !hidden.current && inView && (!facing || toCam.normalize().dot(facing) > 0.05);
      if (visible) {
        const scale = mode.current === "inside" ? 1 : Math.min(1, Math.max(0.7, 150 / dist));
        el.style.transform = `translate(${Math.round(((v.x + 1) / 2) * size.width)}px, ${Math.round(((1 - v.y) / 2) * size.height)}px) translate(-50%, -50%) scale(${scale.toFixed(2)})`;
      }
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
      el.tabIndex = visible ? 0 : -1;
    });
  });
  return null;
}

/**
 * Every camera move that isn't a drag, one at a time: zoom outside, the rise to the top-down view of
 * the chamber, opening a gate and flying in, walking between the vantage points inside, and leaving.
 */
function Director({
  controls,
  control,
  chamber,
  focusId,
  zoom,
  leaves,
  mode,
  hidden,
  onMode,
  onTopDown,
}: {
  controls: RefObject<ComponentRef<typeof OrbitControls> | null>;
  control: RefObject<NabawiControl>;
  chamber: boolean;
  focusId: string | null;
  zoom: RefObject<number>;
  leaves: RefObject<Record<GateId, THREE.Group[]>>;
  mode: RefObject<NabawiMode>;
  hidden: RefObject<boolean>;
  onMode: (m: NabawiMode) => void;
  onTopDown: (v: boolean) => void;
}) {
  const { camera } = useThree();
  const lens = camera as THREE.PerspectiveCamera;
  const st = useRef({ busy: false, topDown: false, enter: 0, exit: 0, walk: 0, focus: null as string | null, gate: "west" as GateId, pendingWalk: null as VantageId | null });
  const dir = useMemo(() => new THREE.Vector3(), []);

  const setMode = (m: NabawiMode) => {
    set(mode, "current", m);
    onMode(m);
  };
  const run = (tl: gsap.core.Timeline) => {
    st.current.busy = true;
    tl.eventCallback("onUpdate", () => controls.current && camera.lookAt(controls.current.target));
  };
  const lookFrom = (eye: THREE.Vector3, look: THREE.Vector3) => {
    const c = controls.current;
    if (!c) return;
    camera.position.copy(eye);
    c.target.copy(eye).addScaledVector(dir.copy(look).sub(eye).normalize(), 0.08);
  };

  const topDown = (on: boolean) => {
    const c = controls.current;
    if (!c) return;
    set(c, "enabled", false);
    set(c, "autoRotate", false);
    const to = on ? TOP_DOWN : OVERVIEW;
    const tl = gsap.timeline({
      onComplete: () => {
        st.current.busy = false;
        st.current.topDown = on;
        set(hidden, "current", on);
        if (!on) {
          set(c, "enabled", true);
          set(c, "autoRotate", true);
          set(zoom, "current", camera.position.distanceTo(c.target));
        }
        onTopDown(on);
      },
    });
    tl.to(camera.position, { x: to.camera.x, y: to.camera.y, z: to.camera.z, duration: 2, ease: "power2.inOut" }, 0).to(c.target, { x: to.target.x, y: to.target.y, z: to.target.z, duration: 2, ease: "power2.inOut" }, 0);
    run(tl);
  };

  const enter = (gate: GateId) => {
    const c = controls.current;
    const pair = leaves.current[gate];
    if (!c || pair.length < 2) return;
    const g = GATES[gate];
    const front = new THREE.Vector3(g.x + g.out * 14, 3.4, g.z);
    const door = new THREE.Vector3(g.x, 1.9, g.z);
    const inside = new THREE.Vector3(g.x - g.out * 3, 0.7, g.z);
    const eye = new THREE.Vector3(g.x - g.out * 6, EYE_Y, g.z);
    const look = new THREE.Vector3(g.x - g.out * 20, 1.4, g.z);
    setMode("moving");
    set(c, "enabled", false);
    set(c, "autoRotate", false);
    // leaves turn inwards: the hinge sides face opposite ways, so they swing in opposite directions
    const swing = 1.6 * -g.out;
    const tl = gsap.timeline({
      onComplete: () => {
        st.current.busy = false;
        set(c, "minPolarAngle", 0.15);
        set(c, "maxPolarAngle", Math.PI - 0.15);
        set(c, "rotateSpeed", -0.35);
        lookFrom(eye, look);
        set(c, "enabled", true);
        c.update();
        setMode("inside");
      },
    });
    tl.to(camera.position, { x: front.x, y: front.y, z: front.z, duration: 2.2, ease: "power2.inOut" }, 0)
      .to(c.target, { x: door.x, y: door.y, z: door.z, duration: 2.2, ease: "power2.inOut" }, 0)
      .to(pair[0].rotation, { y: swing, duration: 1.6, ease: "power2.inOut" }, 1.4)
      .to(pair[1].rotation, { y: -swing, duration: 1.6, ease: "power2.inOut" }, 1.4)
      .to(lens, { fov: 62, duration: 2.6, ease: "power2.inOut", onUpdate: () => lens.updateProjectionMatrix() }, 2.4)
      .to(camera.position, { x: inside.x, y: inside.y, z: inside.z, duration: 1.6, ease: "power1.inOut" }, 2.6)
      .to(c.target, { x: look.x, y: look.y, z: look.z, duration: 1.6, ease: "power1.inOut" }, 2.6)
      .to(camera.position, { x: eye.x, y: eye.y, z: eye.z, duration: 1.2, ease: "power2.out" }, 4.2);
    st.current.gate = gate;
    run(tl);
  };

  const exit = () => {
    const c = controls.current;
    const g = GATES[st.current.gate];
    const pair = leaves.current[st.current.gate];
    if (!c) return;
    const door = new THREE.Vector3(g.x, 1.9, g.z);
    const inside = new THREE.Vector3(g.x - g.out * 3, 0.7, g.z);
    const front = new THREE.Vector3(g.x + g.out * 14, 3.4, g.z);
    setMode("moving");
    set(c, "enabled", false);
    const tl = gsap.timeline({
      onComplete: () => {
        st.current.busy = false;
        set(c, "minPolarAngle", 0.2);
        set(c, "maxPolarAngle", 1.35);
        set(c, "rotateSpeed", 0.6);
        set(c, "enabled", true);
        set(c, "autoRotate", true);
        set(zoom, "current", camera.position.distanceTo(c.target));
        c.update();
        setMode("outside");
      },
    });
    tl.to(c.target, { x: door.x, y: door.y, z: door.z, duration: 1.4, ease: "power2.inOut" }, 0)
      .to(camera.position, { x: inside.x, y: inside.y, z: inside.z, duration: 1.4, ease: "power2.inOut" }, 0)
      .to(camera.position, { x: front.x, y: front.y, z: front.z, duration: 1.6, ease: "power1.inOut" }, 1.4)
      .to(lens, { fov: 40, duration: 1.6, ease: "power2.inOut", onUpdate: () => lens.updateProjectionMatrix() }, 1.4)
      .to(pair.map((p) => p.rotation), { y: 0, duration: 1.4, ease: "power2.inOut" }, 2.6)
      .to(camera.position, { x: OVERVIEW.camera.x, y: OVERVIEW.camera.y, z: OVERVIEW.camera.z, duration: 2.2, ease: "power2.inOut" }, 3)
      .to(c.target, { x: OVERVIEW.target.x, y: OVERVIEW.target.y, z: OVERVIEW.target.z, duration: 2.2, ease: "power2.inOut" }, 3);
    run(tl);
  };

  const walk = (to: VantageId) => {
    const c = controls.current;
    if (!c) return;
    const v = VANTAGES[to];
    const from = c.target.clone().sub(camera.position).normalize();
    const toward = v.look.clone().sub(v.eye).normalize();
    const start = camera.position.clone();
    const state = { t: 0 };
    set(c, "enabled", false);
    const tl = gsap.timeline({
      onComplete: () => {
        st.current.busy = false;
        set(c, "enabled", true);
        c.update();
      },
    });
    tl.to(state, {
      t: 1,
      duration: Math.min(3.2, 1 + start.distanceTo(v.eye) / 12),
      ease: "power2.inOut",
      onUpdate: () => {
        camera.position.lerpVectors(start, v.eye, state.t);
        dir.copy(from).lerp(toward, state.t).normalize();
        c.target.copy(camera.position).addScaledVector(dir, 0.08);
        camera.lookAt(c.target);
      },
    });
    st.current.busy = true;
  };

  useFrame((_, dt) => {
    const s = st.current;
    const c = controls.current;
    if (!c || s.busy) return;
    const req = control.current;
    const m = mode.current;
    // the top-down plan of the chamber is only reached from outside
    if (chamber && m === "inside") return exit();
    if (chamber && m === "outside" && !s.topDown) return topDown(true);
    if (!chamber && s.topDown) return topDown(false);
    if (req.enter !== s.enter) {
      s.enter = req.enter;
      if (m === "outside" && !s.topDown) return enter(req.gate);
    }
    if (req.exit !== s.exit) {
      s.exit = req.exit;
      if (m === "inside") return exit();
    }
    if (req.walk && req.walk.seq !== s.walk) {
      s.walk = req.walk.seq;
      if (m === "inside") return walk(req.walk.to);
    }
    if (focusId !== s.focus) {
      const vantage = focusId ? VANTAGE_OF_ITEM[focusId] : undefined;
      const item = nabawiData.find((h) => h.id === focusId);
      if (vantage && item?.space === "inside" && m === "outside" && !s.topDown) {
        s.pendingWalk = vantage;
        s.focus = focusId;
        return enter("west");
      }
      s.focus = focusId;
      if (vantage && m === "inside") return walk(vantage);
    }
    if (s.pendingWalk && m === "inside") {
      const to = s.pendingWalk;
      s.pendingWalk = null;
      return walk(to);
    }
    // outside: ease the camera to the zoom distance chosen with the buttons
    if (m === "outside" && !s.topDown) {
      dir.copy(camera.position).sub(c.target);
      const d = THREE.MathUtils.damp(dir.length(), zoom.current, 4, dt);
      camera.position.copy(c.target).add(dir.setLength(d));
    }
  });
  return null;
}

const GATE_TIP = "Open the door and enter the Masjid-e-Nabawi interior";

/**
 * Masjid an-Nabawi in 3D. Outside: drag around the courtyards; labels mark the men's and women's
 * sections, Riyazul Jannah and the chamber; the two gates open and the camera flies in. Inside: look
 * around from fixed places (halls, Rawdah, mihrab, the grilles) — the camera can never go into the
 * sacred chamber, and its interior is not modelled at all.
 */
export default function NabawiCanvas({
  running,
  chamber,
  zoom,
  control,
  focusId,
  onHotspot,
  onTopDown,
  onModeChange,
}: {
  running: boolean;
  chamber: boolean;
  zoom: RefObject<number>;
  control: RefObject<NabawiControl>;
  focusId: string | null;
  onHotspot: (id: string) => void;
  onTopDown: (topDown: boolean) => void;
  onModeChange: (m: NabawiMode) => void;
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  const leaves = useRef<Record<GateId, THREE.Group[]>>({ west: [], east: [] });
  const mode = useRef<NabawiMode>("outside");
  const hidden = useRef(false);
  const [doorHover, setDoorHover] = useState(false);
  const [first, setFirst] = useState(true);

  const openGate = (g: GateId) => {
    set(control.current, "gate", g);
    set(control.current, "enter", control.current.enter + 1);
  };
  const doorOver = () => {
    setDoorHover(true);
    document.body.style.cursor = "pointer";
  };
  const doorOut = () => {
    setDoorHover(false);
    document.body.style.cursor = "";
  };

  return (
    <div className="absolute inset-0" onPointerDown={() => setFirst(false)}>
      <Canvas
        shadows
        frameloop={running ? "always" : "never"}
        dpr={[1, 1.6]}
        camera={{ position: OVERVIEW.camera.toArray(), fov: 40, near: 0.05, far: 900 }}
        gl={{ antialias: true, logarithmicDepthBuffer: true }}
        className="cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#9cc6e8"]} />
        <fog attach="fog" args={["#9cc6e8", 260, 520]} />
        <hemisphereLight args={["#fff8ec", "#a58d63", 0.5]} />
        <directionalLight
          position={[70, 120, 90]}
          intensity={2.6}
          color="#ffe9c4"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-130}
          shadow-camera-right={130}
          shadow-camera-top={130}
          shadow-camera-bottom={-130}
          shadow-camera-far={400}
          shadow-bias={-0.0004}
        />
        <Environment resolution={128} frames={1} environmentIntensity={0.3}>
          <Lightformer form="rect" intensity={3} position={[0, 40, 0]} rotation-x={Math.PI / 2} scale={[100, 100, 1]} />
          <Lightformer form="rect" intensity={1.5} color="#ffe2b0" position={[-60, 20, 0]} rotation-y={Math.PI / 2} scale={[80, 20, 1]} />
        </Environment>
        <Exterior />
        <Hall leaves={leaves} onDoorOver={doorOver} onDoorOut={doorOut} onOpen={openGate} />
        <MarkerProjector markers={markers} mode={mode} hidden={hidden} />
        <OrbitControls
          ref={controls}
          target={OVERVIEW.target.toArray()}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={0.2}
          maxPolarAngle={1.35}
          rotateSpeed={0.6}
          autoRotate
          autoRotateSpeed={0.35}
          enableDamping
        />
        <Director
          controls={controls}
          control={control}
          chamber={chamber}
          focusId={focusId}
          zoom={zoom}
          leaves={leaves}
          mode={mode}
          hidden={hidden}
          onMode={onModeChange}
          onTopDown={onTopDown}
        />
      </Canvas>

      {SPOTS.map((spot, i) => {
        const gate = GATE_OF_ITEM[spot.id];
        const showTip = gate !== undefined && doorHover;
        return (
          <button
            key={spot.id}
            ref={(el) => {
              markers.current[i] = el;
            }}
            type="button"
            onClick={() => (gate ? openGate(gate) : onHotspot(spot.id))}
            aria-label={gate ? `${spot.name}: ${GATE_TIP}` : spot.pinned ? spot.name : `About ${spot.name}`}
            style={{ opacity: 0 }}
            className="group absolute top-0 left-0 z-10 flex items-center gap-1.5 outline-none transition-opacity duration-300"
          >
            <span className="relative grid size-6 shrink-0 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/50" />
              <span className="relative grid size-6 place-items-center rounded-full border-2 border-ivory-50 bg-gold-500 text-[11px] font-bold text-night-950 shadow-lg transition group-hover:scale-110">
                {gate ? "⇥" : "+"}
              </span>
            </span>
            <span
              className={`pointer-events-none flex max-w-56 flex-col rounded-xl bg-night-950/85 px-2.5 py-1 text-left text-ivory-50 shadow-lg transition ${
                spot.pinned || showTip ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
            >
              <span className="text-[11px] font-semibold whitespace-nowrap">{spot.name}</span>
              {spot.tooltip && (
                <span className={`text-[10px] leading-snug text-gold-300 group-hover:block group-focus-visible:block ${showTip ? "block" : "hidden"}`}>{spot.tooltip}</span>
              )}
            </span>
          </button>
        );
      })}

      <div className={`pointer-events-none absolute inset-x-0 bottom-16 flex justify-center transition-opacity duration-700 ${first && !chamber ? "opacity-100" : "opacity-0"}`} aria-hidden>
        <span className="rounded-full bg-night-950/80 px-4 py-2 text-xs font-medium text-ivory-50 backdrop-blur">Drag to walk around · tap a gate to go inside</span>
      </div>
    </div>
  );
}
