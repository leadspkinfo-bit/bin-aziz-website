"use client";

import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

// Stylised low-poly vehicles built from primitives: tiny to download and
// licence-free. Each can later be swapped for a GLB via useGLTF without
// touching the showcase logic. Length runs along X, ground is y = 0.

const GLASS = { color: "#0b1426", metalness: 0.9, roughness: 0.08 } as const;
const TYRE = { color: "#111318", roughness: 0.85 } as const;
const RIM = { color: "#c9ccd2", metalness: 1, roughness: 0.25 } as const;

function Paint({ color }: { color: string }) {
  return <meshPhysicalMaterial color={color} metalness={0.45} roughness={0.28} clearcoat={1} clearcoatRoughness={0.08} />;
}

function Wheel({ position, r = 0.38 }: { position: [number, number, number]; r?: number }) {
  return (
    <group position={position} rotation-x={Math.PI / 2}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, 0.28, 32]} />
        <meshStandardMaterial {...TYRE} />
      </mesh>
      <mesh position-y={position[2] > 0 ? 0.145 : -0.145}>
        <cylinderGeometry args={[r * 0.62, r * 0.62, 0.02, 24]} />
        <meshStandardMaterial {...RIM} />
      </mesh>
    </group>
  );
}

function Wheels({ front, rear, track, r }: { front: number; rear: number; track: number; r?: number }) {
  const y = r ?? 0.38;
  return (
    <>
      {[front, rear].flatMap((x) => [track, -track].map((z) => <Wheel key={`${x}${z}`} position={[x, y, z]} r={r} />))}
    </>
  );
}

function Lights({ x, y, z, w = 0.12, h = 0.12, color = "#fff6dc", intensity = 2.5 }: { x: number; y: number; z: number; w?: number; h?: number; color?: string; intensity?: number }) {
  return (
    <>
      {[z, -z].map((zz) => (
        <mesh key={zz} position={[x, y, zz]}>
          <boxGeometry args={[0.04, h, w]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

export function Hiace() {
  return (
    <group position-y={0.02}>
      <RoundedBox args={[4.4, 1.95, 1.9]} radius={0.2} smoothness={4} position={[-0.4, 1.38, 0]} castShadow>
        <Paint color="#f3f1ec" />
      </RoundedBox>
      {/* short nose */}
      <RoundedBox args={[1.0, 0.95, 1.86]} radius={0.22} smoothness={4} position={[2.25, 0.88, 0]} castShadow>
        <Paint color="#f3f1ec" />
      </RoundedBox>
      {/* raked windscreen from the nose up to the roof */}
      <mesh position={[2.2, 1.83, 0]} rotation-z={0.705}>
        <boxGeometry args={[0.05, 1.23, 1.72]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      {/* side window band */}
      <RoundedBox args={[3.8, 0.62, 1.93]} radius={0.08} position={[-0.35, 1.78, 0]}>
        <meshStandardMaterial {...GLASS} />
      </RoundedBox>
      {/* brand stripe */}
      <mesh position={[-0.35, 1.2, 0]}>
        <boxGeometry args={[4.2, 0.06, 1.915]} />
        <meshStandardMaterial color="#c9a35b" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.1, 0.55, 0]}>
        <boxGeometry args={[5.5, 0.28, 1.8]} />
        <meshStandardMaterial color="#2a2e36" roughness={0.7} />
      </mesh>
      <Lights x={2.76} y={1.0} z={0.68} w={0.32} />
      <Lights x={-2.61} y={1.2} z={0.8} h={0.4} w={0.1} color="#ff3b30" intensity={1.5} />
      <Wheels front={1.85} rear={-1.7} track={0.82} />
    </group>
  );
}

export function Staria() {
  return (
    <group position-y={0.02}>
      <RoundedBox args={[5.0, 0.95, 1.95]} radius={0.3} smoothness={6} position={[0, 0.95, 0]} castShadow>
        <Paint color="#8e95a1" />
      </RoundedBox>
      {/* cabin */}
      <RoundedBox args={[3.9, 0.78, 1.85]} radius={0.3} smoothness={6} position={[-0.45, 1.74, 0]} castShadow>
        <Paint color="#8e95a1" />
      </RoundedBox>
      {/* long sloping windscreen */}
      <mesh position={[1.95, 1.77, 0]} rotation-z={0.91}>
        <boxGeometry args={[0.05, 1.14, 1.7]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      {/* panoramic low-belt windows */}
      <RoundedBox args={[3.6, 0.5, 1.87]} radius={0.1} position={[-0.45, 1.76, 0]}>
        <meshStandardMaterial {...GLASS} />
      </RoundedBox>
      {/* signature full-width light bar */}
      <mesh position={[2.5, 1.12, 0]}>
        <boxGeometry args={[0.04, 0.035, 1.7]} />
        <meshStandardMaterial color="#e8f1ff" emissive="#e8f1ff" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[-2.5, 1.32, 0]}>
        <boxGeometry args={[0.04, 0.04, 1.6]} />
        <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[4.7, 0.22, 1.85]} />
        <meshStandardMaterial color="#1f232a" roughness={0.6} />
      </mesh>
      <Wheels front={1.65} rear={-1.6} track={0.84} r={0.42} />
    </group>
  );
}

export function Sedan() {
  return (
    <group position-y={0.02}>
      <RoundedBox args={[4.7, 0.72, 1.82]} radius={0.28} smoothness={6} position={[0, 0.78, 0]} castShadow>
        <Paint color="#22305e" />
      </RoundedBox>
      {/* cabin */}
      <RoundedBox args={[2.5, 0.68, 1.62]} radius={0.3} smoothness={6} position={[-0.25, 1.38, 0]} castShadow>
        <meshStandardMaterial {...GLASS} />
      </RoundedBox>
      <RoundedBox args={[1.9, 0.08, 1.5]} radius={0.04} position={[-0.3, 1.73, 0]}>
        <Paint color="#22305e" />
      </RoundedBox>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[4.5, 0.03, 1.84]} />
        <meshStandardMaterial color="#d9dce2" metalness={1} roughness={0.2} />
      </mesh>
      <Lights x={2.36} y={0.9} z={0.62} w={0.36} h={0.08} />
      <Lights x={-2.36} y={0.92} z={0.62} w={0.36} h={0.08} color="#ff3b30" intensity={1.5} />
      <Wheels front={1.45} rear={-1.45} track={0.8} r={0.36} />
    </group>
  );
}

function wingShape(rootFront: number, rootBack: number, tipFront: number, tipBack: number, span: number) {
  const s = new THREE.Shape();
  s.moveTo(rootFront, 0);
  s.lineTo(tipFront, span);
  s.lineTo(tipBack, span);
  s.lineTo(rootBack, 0);
  s.closePath();
  return s;
}

export function Airplane() {
  const geo = useMemo(() => {
    const extrude = (shape: THREE.Shape, depth: number) => {
      const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
      g.translate(0, 0, -depth / 2);
      return g;
    };
    return {
      wing: extrude(wingShape(0.7, -0.6, -1.0, -1.45, 3.1), 0.06),
      stab: extrude(wingShape(0.2, -0.45, -0.45, -0.75, 1.15), 0.04),
      fin: extrude(wingShape(0.0, -0.9, -0.95, -1.35, 1.5), 0.05),
    };
  }, []);

  return (
    <group position-y={1.6} rotation-z={0.04}>
      {/* fuselage */}
      <mesh rotation-z={Math.PI / 2} castShadow>
        <capsuleGeometry args={[0.42, 5.2, 12, 32]} />
        <Paint color="#f6f4ef" />
      </mesh>
      {/* gold cheatline */}
      {[0.425, -0.425].map((z) => (
        <mesh key={z} position={[0.1, 0.02, z]}>
          <boxGeometry args={[4.8, 0.04, 0.01]} />
          <meshStandardMaterial color="#c9a35b" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* windows */}
      {[0.43, -0.43].map((z) =>
        Array.from({ length: 16 }, (_, i) => (
          <mesh key={`${z}${i}`} position={[1.9 - i * 0.26, 0.16, z]}>
            <boxGeometry args={[0.1, 0.12, 0.01]} />
            <meshStandardMaterial {...GLASS} />
          </mesh>
        )),
      )}
      {/* cockpit */}
      <mesh position={[2.86, 0.18, 0]} rotation-z={-0.5}>
        <boxGeometry args={[0.25, 0.14, 0.5]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      {/* wings */}
      {[1, -1].map((side) => (
        <group key={side} position={[0.3, -0.2, 0.3 * side]} rotation-x={(side * Math.PI) / 2}>
          <mesh geometry={geo.wing}>
            <Paint color="#e9e7e2" />
          </mesh>
          {/* engine */}
          <mesh position={[0.35, 1.25, side * 0.32]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.2, 0.24, 0.9, 24]} />
            <Paint color="#14204a" />
          </mesh>
          <mesh position={[0.81, 1.25, side * 0.32]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.19, 0.19, 0.02, 24]} />
            <meshStandardMaterial color="#c9a35b" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ))}
      {/* tail */}
      {[1, -1].map((side) => (
        <mesh key={side} geometry={geo.stab} position={[-2.6, 0.12, 0.15 * side]} rotation-x={(side * Math.PI) / 2}>
          <Paint color="#e9e7e2" />
        </mesh>
      ))}
      <mesh geometry={geo.fin} position={[-2.45, 0.3, 0]}>
        <Paint color="#14204a" />
      </mesh>
      <mesh position={[-3.15, 1.25, 0]}>
        <boxGeometry args={[0.35, 0.06, 0.07]} />
        <meshStandardMaterial color="#c9a35b" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}
