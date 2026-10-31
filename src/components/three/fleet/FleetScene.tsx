"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { VehicleId } from "@/lib/fleet";
import { Airplane, Hiace, Sedan, Staria } from "./Vehicles";

const HIACE_GLB = "/images/hiace_van.glb";

/** Detailed Hiace from the client's GLB (front = +X, ground = y 0, same as the procedural one). */
function HiaceModel() {
  const { scene } = useGLTF(HIACE_GLB);
  const model = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    return copy;
  }, [scene]);
  return <primitive object={model} />;
}
useGLTF.preload(HIACE_GLB);

const models: Record<VehicleId, { node: ReactNode; scale: number }> = {
  airplane: { node: <Airplane />, scale: 0.78 },
  // The simple model shows for the moment the GLB is still downloading.
  hiace: {
    node: (
      <Suspense fallback={<Hiace />}>
        <HiaceModel />
      </Suspense>
    ),
    scale: 1,
  },
  staria: { node: <Staria />, scale: 0.95 },
  sedan: { node: <Sedan />, scale: 1.05 },
};

/** Keeps every model mounted and eases between them: the active one grows and spins in, the rest shrink away. */
function Slot({ id, active }: { id: VehicleId; active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const { node, scale } = models[id];

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = active ? scale : 0.0001;
    const s = THREE.MathUtils.damp(g.scale.x, target, active ? 5 : 9, dt);
    g.scale.setScalar(s);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, active ? -0.6 : -2.2, 4, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, active ? 0 : -0.6, 5, dt);
    g.visible = s > 0.01;
  });

  return (
    <group ref={ref} scale={0.0001} rotation-y={-2.2}>
      {node}
    </group>
  );
}

function Stage() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.001} receiveShadow>
        <circleGeometry args={[4.2, 96]} />
        <meshStandardMaterial color="#101a3a" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[4.15, 4.22, 128]} />
        <meshStandardMaterial color="#c9a35b" emissive="#c9a35b" emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <ContactShadows position-y={0.005} opacity={0.6} scale={10} blur={2.4} far={3} resolution={512} color="#000" />
    </group>
  );
}

export default function FleetScene({ selected, active }: { selected: VehicleId; active: boolean }) {
  return (
    <Canvas frameloop={active ? "always" : "never"} dpr={[1, 1.75]} camera={{ position: [8, 3.8, 9], fov: 34 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={2} />
      <spotLight position={[-6, 6, -4]} intensity={40} angle={0.5} penumbra={1} color="#ecd9a8" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={2} color="#ecd9a8" position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#7fb3e0" position={[8, 2, 0]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
      </Environment>

      {(Object.keys(models) as VehicleId[]).map((id) => (
        <Slot key={id} id={id} active={id === selected} />
      ))}
      <Stage />

      <OrbitControls
        target={[0, 1.1, 0]}
        enablePan={false}
        enableZoom
        minDistance={8}
        maxDistance={15}
        minPolarAngle={0.9}
        maxPolarAngle={1.45}
        autoRotate
        autoRotateSpeed={0.6}
        enableDamping
      />
    </Canvas>
  );
}
