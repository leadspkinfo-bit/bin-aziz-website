"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Crowd, Ground, Mountains, makeRng, mat, type Spot } from "./hajjShared";

const CAMP = 9; // tents per camp, each way
const CAMPS = 6; // camps per side of the avenue
const TENT = 8;
const STREET = 6;

function tentSpots() {
  const list: [number, number][] = [];
  const block = CAMP * TENT + STREET;
  for (let cx = -CAMPS; cx < CAMPS; cx++)
    for (let cz = -CAMPS; cz < CAMPS; cz++)
      for (let i = 0; i < CAMP; i++)
        for (let j = 0; j < CAMP; j++) {
          const x = cx * block + i * TENT + STREET / 2 + (cx >= 0 ? 8 : -8);
          const z = cz * block + j * TENT + STREET / 2;
          list.push([x, z]);
        }
  return list;
}

function walkers() {
  const rand = makeRng(31);
  return Array.from({ length: 700 }, (): Spot => [(rand() - 0.5) * 13, 0, (rand() - 0.5) * 520]);
}

/** The tent city: white fireproof tents in walled camps along a central avenue, under bare mountains. */
export function MinaScene() {
  const spots = useMemo(() => tentSpots(), []);
  const people = useMemo(() => walkers(), []);
  const walls = useRef<THREE.InstancedMesh>(null);
  const roofs = useRef<THREE.InstancedMesh>(null);
  const white = useMemo(() => mat("#fbfaf5", { roughness: 0.55 }), []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    spots.forEach(([x, z], i) => {
      o.rotation.y = 0;
      o.position.set(x, 1.5, z);
      o.updateMatrix();
      walls.current?.setMatrixAt(i, o.matrix);
      o.rotation.y = Math.PI / 4;
      o.position.set(x, 4.2, z);
      o.updateMatrix();
      roofs.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [walls, roofs]) if (m.current) m.current.instanceMatrix.needsUpdate = true;
  }, [spots]);

  return (
    <group>
      <Ground base="#cdb48c" dark="#a88f68" light="#e6d4b2" />
      {/* the central avenue */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
        <planeGeometry args={[14, 560]} />
        <meshStandardMaterial color="#76736c" roughness={0.95} />
      </mesh>
      <instancedMesh ref={walls} args={[undefined, white, spots.length]} castShadow>
        <boxGeometry args={[7.4, 3, 7.4]} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, white, spots.length]} castShadow>
        <coneGeometry args={[5.3, 2.6, 4]} />
      </instancedMesh>
      <Crowd spots={people} size={1.3} />
      <Mountains radius={400} count={46} height={85} color="#8c6f50" seed={2} />
      <Mountains radius={520} count={40} height={130} color="#7a6048" seed={5} />
    </group>
  );
}
