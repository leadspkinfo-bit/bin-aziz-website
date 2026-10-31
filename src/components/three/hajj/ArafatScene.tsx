"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Crowd, Ground, Mountains, makeRng, mat, type Spot } from "./hajjShared";

export const MOUNT = { radius: 58, height: 34 };

/** Height of the mount at a point, used for the rock surface, the steps and the crowd on it. */
function mountHeight(x: number, z: number) {
  const r = Math.hypot(x, z) / MOUNT.radius;
  if (r >= 1) return 0;
  const a = Math.atan2(z, x);
  const bump = 1 + 0.16 * Math.sin(a * 5 + r * 7) + 0.1 * Math.cos(a * 11 - r * 9);
  return MOUNT.height * Math.pow(1 - r, 0.82) * Math.min(1.12, bump * (1 - r * 0.2) + r * 0.2);
}

function mountGeometry() {

  const rings = new THREE.PlaneGeometry(MOUNT.radius * 2, MOUNT.radius * 2, 150, 150);

  const pos = rings.getAttribute("position");
  const rock = new THREE.Color();
  const colors: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getY(i);
    const h = mountHeight(x, z);
    pos.setZ(i, h);
    const grain = 0.5 + 0.5 * Math.sin(x * 2.3) * Math.cos(z * 2.9);
    rock.set(h > 0 ? "#8b7a64" : "#c7ab7f").lerp(new THREE.Color("#5e4f3f"), h > 0 ? grain * 0.55 : 0);
    colors.push(rock.r, rock.g, rock.b);
  }
  rings.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  rings.rotateX(-Math.PI / 2);
  rings.computeVertexNormals();
  return rings;
}

/** Scattered granite boulders, the mount's distinct broken surface. */
function boulderSpots() {
  const rand = makeRng(13);
  return Array.from({ length: 420 }, () => {
    const a = rand() * Math.PI * 2;
    const r = 4 + rand() * (MOUNT.radius - 8);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    return { x, z, y: mountHeight(x, z), s: 0.4 + rand() * 1.3, turn: rand() * 6 };
  });
}

/** The stairway: straight up the north side, from the plain to the summit. */
const STEPS = 64;
const stepAt = (i: number) => {
  const f = i / STEPS;
  const x = Math.sin(f * 7) * 3;
  const z = MOUNT.radius * 0.97 * (1 - f);
  return { x, z, y: Math.max(mountHeight(x, z), mountHeight(x + 0.5, z + 0.5)) };
};

function pilgrims() {
  const rand = makeRng(47);
  const list: Spot[] = [];
  for (let i = 0; i < 1500; i++) {
    const a = rand() * Math.PI * 2;
    const r = MOUNT.radius * (0.98 + rand() * 2.5);
    list.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
  }
  for (let i = 0; i < STEPS; i += 2) {
    const s = stepAt(i);
    list.push([s.x + 1, s.y + 0.2, s.z], [s.x - 1, s.y + 0.2, s.z]);
  }
  return list;
}

function treeSpots() {
  const rand = makeRng(71);
  return Array.from({ length: 260 }, (): [number, number, number] => {
    const a = rand() * Math.PI * 2;
    const r = 90 + rand() * 260;
    return [Math.cos(a) * r, Math.sin(a) * r, 0.8 + rand() * 0.7];
  });
}

/** The neem trees that shade the plain of Arafat. */
function Trees() {
  const spots = useMemo(() => treeSpots(), []);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    spots.forEach(([x, z, s], i) => {
      o.scale.setScalar(s);
      o.position.set(x, 1.6 * s, z);
      o.updateMatrix();
      trunks.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, 4.4 * s, z);
      o.updateMatrix();
      crowns.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [trunks, crowns]) if (m.current) m.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]}>
        <cylinderGeometry args={[0.25, 0.35, 3.2, 6]} />
        <meshStandardMaterial color="#5c4632" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, spots.length]} castShadow>
        <icosahedronGeometry args={[2.8, 1]} />
        <meshStandardMaterial color="#5f7a43" roughness={1} flatShading />
      </instancedMesh>
    </>
  );
}

/** Masjid Namirah, far across the plain. */
function Namirah() {
  const stone = useMemo(() => mat("#e8dcc4"), []);
  return (
    <group position={[-170, 0, -150]}>
      <mesh position-y={5} material={stone}>
        <boxGeometry args={[70, 10, 40]} />
      </mesh>
      {[-14, 0, 14].map((x) => (
        <mesh key={x} position={[x, 10, 0]} material={stone}>
          <sphereGeometry args={[6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
      {[-34, 34].map((x) => (
        <mesh key={x} position={[x, 20, -19]} material={stone}>
          <cylinderGeometry args={[1.4, 1.8, 40, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/** The plain of Arafat with Jabal al-Rahmah: rock, stairway and the white pillar on the summit. */
export function ArafatScene() {
  const geo = useMemo(() => mountGeometry(), []);
  const boulders = useMemo(() => boulderSpots(), []);
  const people = useMemo(() => pilgrims(), []);
  const stones = useRef<THREE.InstancedMesh>(null);
  const steps = useRef<THREE.InstancedMesh>(null);
  const white = useMemo(() => mat("#f7f4ec", { roughness: 0.5 }), []);
  const top = mountHeight(0, 0);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    boulders.forEach((b, i) => {
      o.position.set(b.x, b.y, b.z);
      o.rotation.set(b.turn, b.turn * 2, 0);
      o.scale.setScalar(b.s);
      o.updateMatrix();
      stones.current?.setMatrixAt(i, o.matrix);
    });
    o.rotation.set(0, 0, 0);
    o.scale.setScalar(1);
    for (let i = 0; i < STEPS; i++) {
      const s = stepAt(i);
      o.position.set(s.x, s.y + 0.1, s.z);
      o.updateMatrix();
      steps.current?.setMatrixAt(i, o.matrix);
    }
    for (const m of [stones, steps]) if (m.current) m.current.instanceMatrix.needsUpdate = true;
  }, [boulders]);

  return (
    <group>
      <Ground base="#c9ad80" dark="#a68a60" light="#e0caa2" />
      <mesh geometry={geo} position-y={0.05} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} flatShading />
      </mesh>
      <instancedMesh ref={stones} args={[undefined, undefined, boulders.length]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#84745f" roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={steps} args={[undefined, undefined, STEPS]}>
        <boxGeometry args={[4.4, 0.5, 1.8]} />
        <meshStandardMaterial color="#d8d0c0" roughness={0.9} />
      </instancedMesh>
      {/* the summit: a low walled platform and the white pillar */}
      <group position-y={top}>
        <mesh position-y={0.6} material={white}>
          <cylinderGeometry args={[6, 6.6, 1.2, 8]} />
        </mesh>
        <mesh position-y={2.4} material={white}>
          <boxGeometry args={[2.4, 2.4, 2.4]} />
        </mesh>
        <mesh position-y={7} material={white} castShadow>
          <boxGeometry args={[1.5, 9, 1.5]} />
        </mesh>
        <mesh position-y={12} rotation-y={Math.PI / 4} material={white}>
          <coneGeometry args={[1.2, 1.4, 4]} />
        </mesh>
      </group>
      <Crowd spots={people} size={1.25} />
      <Trees />
      <Namirah />
      <Mountains radius={470} count={44} height={95} color="#8f7355" seed={3} />
    </group>
  );
}
