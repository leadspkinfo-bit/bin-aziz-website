"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Ground, Mountains, makeRng, mat } from "./hajjShared";

const HALLS = [-56, 0, 56];
const HALL = { length: 48, width: 34, height: 9 };

function sheepSpots() {
  const rand = makeRng(29);
  const list: [number, number, number][] = [];
  for (const penX of [-30, 0, 30])
    for (let i = 0; i < 34; i++) list.push([penX + (rand() - 0.5) * 22, 44 + (rand() - 0.5) * 18, rand() * 6]);
  return list;
}

/** Saw-tooth roof light of one hall, white with green glazing. */
function Roof({ white, glass }: { white: THREE.Material; glass: THREE.Material }) {
  return (
    <>
      {[-18, -6, 6, 18].map((x) => (
        <group key={x} position={[x, HALL.height + 1.5, 0]}>
          <mesh material={white} rotation-z={0.42}>
            <boxGeometry args={[13, 0.4, HALL.width]} />
          </mesh>
          <mesh material={glass} position-x={5.6}>
            <boxGeometry args={[0.3, 4.2, HALL.width - 1]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Truck({ x, z, cab, box }: { x: number; z: number; cab: THREE.Material; box: THREE.Material }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={2.4} material={box} castShadow>
        <boxGeometry args={[3, 3.2, 8]} />
      </mesh>
      <mesh position={[0, 1.6, 5.2]} material={cab} castShadow>
        <boxGeometry args={[2.8, 2.4, 2.4]} />
      </mesh>
    </group>
  );
}

/** A clean, modern sacrifice facility: halls, pens, a voucher office and refrigerated trucks. No slaughter is shown. */
export function QurbaniScene() {
  const white = useMemo(() => mat("#f4f2ec", { roughness: 0.55 }), []);
  const wall = useMemo(() => mat("#e2dccd", { roughness: 0.7 }), []);
  const glass = useMemo(() => mat("#3c8a6a", { roughness: 0.25, metalness: 0.3 }), []);
  const green = useMemo(() => mat("#1f6b4e", { roughness: 0.5 }), []);
  const fence = useMemo(() => mat("#9aa3ad", { metalness: 0.6, roughness: 0.4 }), []);
  const sheep = useMemo(() => sheepSpots(), []);
  const bodies = useRef<THREE.InstancedMesh>(null);
  const heads = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    sheep.forEach(([x, z, turn], i) => {
      // the capsule lies along the animal's length
      o.rotation.set(Math.PI / 2, 0, -turn);
      o.position.set(x, 0.75, z);
      o.updateMatrix();
      bodies.current?.setMatrixAt(i, o.matrix);
      o.rotation.set(0, turn, 0);
      o.position.set(x + Math.sin(turn) * 0.85, 1.05, z + Math.cos(turn) * 0.85);
      o.updateMatrix();
      heads.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [bodies, heads]) if (m.current) m.current.instanceMatrix.needsUpdate = true;
  }, [sheep]);

  return (
    <group>
      <Ground base="#c9b48f" dark="#a79069" light="#e0ccaa" />
      {/* yard */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
        <planeGeometry args={[210, 120]} />
        <meshStandardMaterial color="#b9b4a9" roughness={0.95} />
      </mesh>
      {HALLS.map((x) => (
        <group key={x} position-x={x}>
          <mesh position-y={HALL.height / 2} material={wall} castShadow receiveShadow>
            <boxGeometry args={[HALL.length, HALL.height, HALL.width]} />
          </mesh>
          <mesh position={[0, 1.4, HALL.width / 2 + 0.05]} material={green}>
            <boxGeometry args={[HALL.length, 2.8, 0.1]} />
          </mesh>
          {[-16, 0, 16].map((dx) => (
            <mesh key={dx} position={[dx, 3.4, HALL.width / 2 + 0.1]} material={fence}>
              <boxGeometry args={[9, 6.8, 0.2]} />
            </mesh>
          ))}
          <Roof white={white} glass={glass} />
        </group>
      ))}
      {/* pens with low rails */}
      {[-30, 0, 30].map((x) => (
        <group key={x} position={[x, 0, 44]}>
          {[
            [0, -10, 25, 0.25],
            [0, 10, 25, 0.25],
            [-12.5, 0, 0.25, 20],
            [12.5, 0, 0.25, 20],
          ].map(([rx, rz, w, d]) => (
            <mesh key={`${rx}${rz}`} position={[rx, 0.9, rz]} material={fence}>
              <boxGeometry args={[w, 1.8, d]} />
            </mesh>
          ))}
        </group>
      ))}
      <instancedMesh ref={bodies} args={[undefined, undefined, sheep.length]} castShadow>
        <capsuleGeometry args={[0.42, 0.7, 3, 8]} />
        <meshStandardMaterial color="#f1ebdd" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, sheep.length]}>
        <sphereGeometry args={[0.24, 8, 6]} />
        <meshStandardMaterial color="#3d3429" roughness={1} />
      </instancedMesh>
      {/* the voucher office */}
      <group position={[-20, 0, 72]}>
        <mesh position-y={3} material={white} castShadow>
          <boxGeometry args={[22, 6, 12]} />
        </mesh>
        <mesh position={[0, 6.4, 0]} material={green}>
          <boxGeometry args={[23, 0.8, 13]} />
        </mesh>
        {[-6, 0, 6].map((x) => (
          <mesh key={x} position={[x, 2.4, 6.1]} material={glass}>
            <boxGeometry args={[4, 3, 0.1]} />
          </mesh>
        ))}
      </group>
      {/* refrigerated trucks that carry the meat to those in need */}
      {[58, 68, 78].map((x) => (
        <Truck key={x} x={x} z={36} cab={green} box={white} />
      ))}
      <Mountains radius={380} count={40} height={80} color="#8c6f50" seed={4} />
    </group>
  );
}
