"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Crowd, Ground, Mountains, makeRng, mat, type Spot } from "./hajjShared";

/** The three walls in order along the bridge: Sughra nearest Mina's Masjid al-Khayf, Aqabah nearest Makkah. */
export const WALLS = [-62, 0, 62];
export const WALL_TOP = 38;
const LEVELS = [0, 9, 18, 27];
const LENGTH = 200;
const WIDTH = 40;
const HOLE = { a: 17, b: 8 };

function deckGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-LENGTH / 2, -WIDTH / 2);
  s.lineTo(LENGTH / 2, -WIDTH / 2);
  s.lineTo(LENGTH / 2, WIDTH / 2);
  s.lineTo(-LENGTH / 2, WIDTH / 2);
  s.closePath();
  for (const x of WALLS) {
    const hole = new THREE.Path();
    hole.absellipse(x, 0, HOLE.a, HOLE.b, 0, Math.PI * 2, true, 0);
    s.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: false, curveSegments: 40 });
  g.rotateX(Math.PI / 2);
  return g;
}

/** The low parapet round each basin, at one level. */
function basinGeometry() {
  const s = new THREE.Shape();
  s.absellipse(0, 0, HOLE.a + 0.5, HOLE.b + 0.5, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, HOLE.a, HOLE.b, 0, Math.PI * 2, true, 0);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.3, bevelEnabled: false, curveSegments: 40 });
  g.rotateX(-Math.PI / 2);
  return g;
}

function columnSpots() {
  const list: [number, number][] = [];
  for (let x = -LENGTH / 2 + 4; x < LENGTH / 2; x += 16) for (const z of [-WIDTH / 2 + 2, WIDTH / 2 - 2]) list.push([x, z]);
  return list;
}

/** Pilgrims on every deck, gathered round the basins. */
function pilgrims() {
  const rand = makeRng(101);
  const list: Spot[] = [];
  for (const y of LEVELS)
    for (const x of WALLS)
      for (let i = 0; i < 170; i++) {
        const a = rand() * Math.PI * 2;
        const k = 1.06 + rand() * 0.55;
        list.push([x + Math.cos(a) * HOLE.a * k, y + 0.1, Math.max(-WIDTH / 2 + 1, Math.min(WIDTH / 2 - 1, Math.sin(a) * HOLE.b * k * 1.3))]);
      }
  return list;
}

/** The Jamarat bridge: stacked decks, ramps at each end, and the three elliptical walls rising through them. */
export function JamaratScene() {
  const deck = useMemo(() => deckGeometry(), []);
  const basin = useMemo(() => basinGeometry(), []);
  const posts = useMemo(() => columnSpots(), []);
  const people = useMemo(() => pilgrims(), []);
  const concrete = useMemo(() => mat("#ece6d9", { roughness: 0.7 }), []);
  const stone = useMemo(() => mat("#a99d8b", { roughness: 0.9 }), []);
  const blue = useMemo(() => mat("#3f6f8f", { roughness: 0.5 }), []);
  const columns = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    posts.forEach(([x, z], i) => {
      o.position.set(x, 13.5, z);
      o.updateMatrix();
      columns.current?.setMatrixAt(i, o.matrix);
    });
    if (columns.current) columns.current.instanceMatrix.needsUpdate = true;
  }, [posts]);

  return (
    <group>
      <Ground base="#c6b190" dark="#a08b6a" light="#ddcaa9" />
      {LEVELS.map((y) => (
        <group key={y} position-y={y}>
          {y > 0 && <mesh geometry={deck} material={concrete} castShadow receiveShadow />}
          {WALLS.map((x) => (
            <mesh key={x} geometry={basin} material={y === 27 ? blue : stone} position-x={x} />
          ))}
        </group>
      ))}
      <instancedMesh ref={columns} args={[undefined, concrete, posts.length]} castShadow>
        <boxGeometry args={[1.8, 27, 1.8]} />
      </instancedMesh>
      {/* the elliptical walls */}
      {WALLS.map((x) => (
        <group key={x} position-x={x}>
          <mesh position-y={WALL_TOP / 2} scale={[13, 1, 1.6]} material={stone} castShadow>
            <cylinderGeometry args={[1, 1, WALL_TOP, 48]} />
          </mesh>
          <mesh position-y={WALL_TOP + 0.3} scale={[13.3, 1, 1.9]}>
            <cylinderGeometry args={[1, 1, 0.6, 48]} />
            <meshStandardMaterial color="#d4af5f" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* ramps up to the decks at both ends */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (LENGTH / 2 + 36), 13.5, 0]} rotation-z={s * -0.36} material={concrete} castShadow>
          <boxGeometry args={[80, 1.2, 16]} />
        </mesh>
      ))}
      <Crowd spots={people} size={1.4} />
      <Mountains radius={400} count={40} height={80} color="#8a6d50" seed={9} />
    </group>
  );
}
