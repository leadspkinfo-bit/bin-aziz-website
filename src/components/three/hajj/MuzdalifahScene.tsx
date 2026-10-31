"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Crowd, Ground, Mountains, makeRng, mat, type Spot } from "./hajjShared";

function resting() {
  const rand = makeRng(23);
  const list: { x: number; z: number; turn: number; tone: number }[] = [];
  for (let i = 0; i < 1100; i++) {
    const a = rand() * Math.PI * 2;
    const r = 10 + Math.pow(rand(), 0.7) * 190;
    list.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, turn: rand() * 6, tone: rand() });
  }
  return list;
}

function pebbleSpots() {
  const rand = makeRng(59);
  return Array.from({ length: 130 }, () => ({ x: (rand() - 0.5) * 9, z: 4 + (rand() - 0.5) * 9, s: 0.05 + rand() * 0.07, turn: rand() * 6 }));
}

function sitting() {
  const rand = makeRng(83);
  return Array.from({ length: 200 }, (): Spot => {
    const a = rand() * Math.PI * 2;
    const r = 14 + rand() * 90;
    return [Math.cos(a) * r, 0, Math.sin(a) * r];
  });
}

/** Tall light masts: the plain is open to the sky, lit only here and there. */
const MASTS: [number, number][] = [
  [-46, -40],
  [52, -30],
  [-70, 44],
  [36, 62],
  [120, 30],
  [-130, -60],
];

/** The open plain of Muzdalifah at night: pilgrims resting on mats, pebbles underfoot, Masjid al-Mash‘ar al-Haram beyond. */
export function MuzdalifahScene() {
  const people = useMemo(() => resting(), []);
  const pebbles = useMemo(() => pebbleSpots(), []);
  const seated = useMemo(() => sitting(), []);
  const lying = useRef<THREE.InstancedMesh>(null);
  const mats = useRef<THREE.InstancedMesh>(null);
  const stones = useRef<THREE.InstancedMesh>(null);
  const wall = useMemo(() => mat("#d9cfbb"), []);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    people.forEach((p, i) => {
      o.position.set(p.x, 0.22, p.z);
      o.rotation.set(Math.PI / 2, 0, p.turn);
      o.updateMatrix();
      lying.current?.setMatrixAt(i, o.matrix);
      lying.current?.setColorAt(i, c.set(p.tone < 0.75 ? "#f6f3ec" : "#26262c"));
      o.position.set(p.x, 0.04, p.z);
      o.rotation.set(0, -p.turn, 0);
      o.updateMatrix();
      mats.current?.setMatrixAt(i, o.matrix);
      mats.current?.setColorAt(i, c.set(p.tone < 0.4 ? "#7a2f35" : p.tone < 0.7 ? "#2f4a6b" : "#5f6a4a"));
    });
    pebbles.forEach((p, i) => {
      o.position.set(p.x, p.s, p.z);
      o.rotation.set(p.turn, p.turn, 0);
      o.scale.setScalar(p.s);
      o.updateMatrix();
      stones.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [lying, mats, stones]) if (m.current) m.current.instanceMatrix.needsUpdate = true;
    if (lying.current?.instanceColor) lying.current.instanceColor.needsUpdate = true;
    if (mats.current?.instanceColor) mats.current.instanceColor.needsUpdate = true;
  }, [people, pebbles]);

  return (
    <group>
      <Ground base="#8f8069" dark="#6b5e4c" light="#a99a80" />
      <instancedMesh ref={mats} args={[undefined, undefined, people.length]}>
        <boxGeometry args={[0.9, 0.04, 2.1]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={lying} args={[undefined, undefined, people.length]}>
        <capsuleGeometry args={[0.2, 1.1, 3, 6]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <Crowd spots={seated} size={1} />
      <instancedMesh ref={stones} args={[undefined, undefined, pebbles.length]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#b3a68f" roughness={1} flatShading />
      </instancedMesh>

      {MASTS.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position-y={11}>
            <cylinderGeometry args={[0.2, 0.3, 22, 6]} />
            <meshStandardMaterial color="#454a55" />
          </mesh>
          <mesh position-y={22.4}>
            <boxGeometry args={[2.4, 0.5, 0.5]} />
            <meshBasicMaterial color="#fff0cf" toneMapped={false} />
          </mesh>
          <pointLight position-y={21} intensity={700} distance={70} color="#ffe3b0" />
        </group>
      ))}

      {/* Masjid al-Mash‘ar al-Haram */}
      <group position={[-30, 0, -150]}>
        <mesh position-y={5} material={wall}>
          <boxGeometry args={[60, 10, 28]} />
        </mesh>
        {[-29, 29].map((x) => (
          <mesh key={x} position={[x, 19, -13]} material={wall}>
            <cylinderGeometry args={[1.2, 1.6, 38, 10]} />
          </mesh>
        ))}
      </group>
      <Mountains radius={420} count={40} height={70} color="#4a4038" seed={7} />
    </group>
  );
}
