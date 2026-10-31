"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { MotionValue } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, type ComponentRef, type RefObject } from "react";
import * as THREE from "three";
import { saiData } from "@/lib/saiData";

// The Mas‘a, shortened and with the roof left off so it can be seen into: Safa at −x, Marwah at +x.
const END = 34; // where the walking stops at each hill
const HILL = 42;
const LENGTH = 104;
const WIDTH = 18;
const HEIGHT = 6;
const GREEN = 7; // half length of the green-light stretch
const PILGRIMS = 170;

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const marble = mat("#f4efe5", { roughness: 0.3 });
const gold = mat("#d4af5f", { metalness: 0.85, roughness: 0.3 });
const rail = mat("#c9bfa9", { metalness: 0.3, roughness: 0.4 });

/** Writes to refs that arrive as props, kept out of render for React's compiler. */
const set = <T extends object, K extends keyof T>(target: T, key: K, value: T[K]) => {
  target[key] = value;
};

/** 0 → 1 along the walkway for overall Sa’i progress v: seven legs, Safa → Marwah first. */
export function along(v: number) {
  const legs = Math.min(v, 0.9999) * 7;
  const leg = Math.floor(legs);
  const t = legs - leg;
  return leg % 2 === 0 ? t : 1 - t;
}

function floorTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#f5f1e8";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#cbc2b0";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.strokeStyle = "#a8926a";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 176, 176);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(26, 5);
  t.anisotropy = 8;
  return t;
}

/** A craggy rock: a sphere whose surface is pushed in and out, the same way on every load. */
function rockGeometry(seed: number) {
  const g = new THREE.IcosahedronGeometry(1, 4);
  const pos = g.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = 1 + 0.16 * Math.sin(v.x * 5 + seed) * Math.cos(v.y * 6 - seed) + 0.1 * Math.sin(v.z * 9 + seed * 2);
    v.multiplyScalar(n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** The surviving rock of a hill, in the brown-grey of the real stone, behind a low rail. */
function Hill({ side, seed }: { side: 1 | -1; seed: number }) {
  const geos = useMemo(() => [rockGeometry(seed), rockGeometry(seed + 2)], [seed]);
  const rock = useMemo(() => mat("#8a7458", { roughness: 0.95, flatShading: true }), []);
  const dark = useMemo(() => mat("#6e5b45", { roughness: 1, flatShading: true }), []);
  return (
    <group position={[side * HILL, 0, 0]}>
      <mesh geometry={geos[0]} material={rock} position={[side * 3, 1.2, 0]} scale={[8, 4.4, 8.4]} castShadow />
      <mesh geometry={geos[1]} material={dark} position={[side * -2, 0.4, 3.4]} scale={[4, 2.2, 3.4]} castShadow />
      <mesh geometry={geos[1]} material={rock} position={[side * -1, 0.5, -4]} scale={[3.6, 2.4, 3.2]} castShadow />
      {/* the step up from the gallery */}
      <mesh position={[side * -6, 0.12, 0]} material={marble}>
        <boxGeometry args={[3, 0.24, WIDTH - 1]} />
      </mesh>
      {/* the small dome over the hill */}
      <group position={[side * 2, HEIGHT + 0.6, 0]}>
        <mesh material={gold} position-y={-0.2}>
          <torusGeometry args={[4.6, 0.12, 8, 40]} />
        </mesh>
      </group>
    </group>
  );
}

/** Both side walls of the gallery: columns, arches between them, and a parapet along the top. */
function Gallery() {
  const spots = useMemo(() => {
    const list: [number, number][] = [];
    for (const z of [-WIDTH / 2, WIDTH / 2]) for (let x = -LENGTH / 2 + 2; x < LENGTH / 2; x += 6) list.push([x, z]);
    return list;
  }, []);
  const columns = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const arches = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    spots.forEach(([x, z], i) => {
      o.position.set(x, 2.1, z);
      o.updateMatrix();
      columns.current?.setMatrixAt(i, o.matrix);
      o.position.set(x, 4.3, z);
      o.updateMatrix();
      caps.current?.setMatrixAt(i, o.matrix);
      o.position.set(x + 3, 4.4, z);
      o.updateMatrix();
      arches.current?.setMatrixAt(i, o.matrix);
    });
    for (const m of [columns, caps, arches]) if (m.current) m.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <>
      <instancedMesh ref={columns} args={[undefined, undefined, spots.length]} material={marble} castShadow>
        <cylinderGeometry args={[0.32, 0.38, 4.2, 12]} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, spots.length]} material={gold}>
        <cylinderGeometry args={[0.5, 0.34, 0.3, 12]} />
      </instancedMesh>
      <instancedMesh ref={arches} args={[undefined, undefined, spots.length]}>
        <torusGeometry args={[3, 0.16, 6, 20, Math.PI]} />
        <meshStandardMaterial color="#d9c49a" roughness={0.5} />
      </instancedMesh>
      {[-1, 1].map((s) => (
        <group key={s} position-z={(s * WIDTH) / 2}>
          <mesh position-y={HEIGHT + 1.7} material={mat("#d9c49a")} castShadow>
            <boxGeometry args={[LENGTH, 0.8, 0.5]} />
          </mesh>
          {/* outer wall: painted on its inner face only, so the near side never blocks the view */}
          <mesh position={[0, 3.5, s * 1.4]} rotation-y={s > 0 ? Math.PI : 0}>
            <planeGeometry args={[LENGTH, 7]} />
            <meshStandardMaterial color="#e8dcc2" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** The green-light stretch: glowing bars across the gallery and a tint on the floor. */
function GreenLights() {
  const light = useMemo(() => new THREE.MeshBasicMaterial({ color: "#34e39a", toneMapped: false }), []);
  return (
    <group>
      {[-GREEN, 0, GREEN].map((x) => (
        <group key={x} position-x={x}>
          <mesh position-y={6.4} material={gold}>
            <boxGeometry args={[0.3, 0.3, WIDTH]} />
          </mesh>
          <mesh position-y={6.15} material={light}>
            <boxGeometry args={[x === 0 ? 0.12 : 0.5, 0.18, WIDTH - 0.4]} />
          </mesh>
        </group>
      ))}
      {[-WIDTH / 2 + 0.5, WIDTH / 2 - 0.5].map((z) => (
        <mesh key={z} position={[0, 6.15, z]} material={light}>
          <boxGeometry args={[GREEN * 2, 0.12, 0.2]} />
        </mesh>
      ))}
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <planeGeometry args={[GREEN * 2, WIDTH - 1]} />
        <meshBasicMaterial color="#34e39a" transparent opacity={0.1} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 5.4, 0]} intensity={40} distance={22} color="#5effb8" />
    </group>
  );
}

const crowdLayout = () => {
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: PILGRIMS }, () => {
    const east = rand() > 0.5;
    return { east, z: (east ? 1 : -1) * (1.6 + rand() * 5.8), phase: rand(), speed: 0.012 + rand() * 0.012, tone: rand() };
  });
};

/** Pilgrims in both directions, each in their own lane; the gold figure is "you", following the scroll. */
function Walkers({ progress, you }: { progress: MotionValue<number>; you: RefObject<number> }) {
  const crowd = useRef<THREE.InstancedMesh>(null);
  const me = useRef<THREE.Group>(null);
  const people = useMemo(() => crowdLayout(), []);
  const o = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    const mesh = crowd.current;
    if (!mesh) return;
    const c = new THREE.Color();
    people.forEach((p, i) => mesh.setColorAt(i, c.set(p.tone < 0.65 ? "#f7f4ee" : p.tone < 0.9 ? "#1d1d22" : "#cdbfa3")));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [people]);
  useFrame(({ clock }) => {
    const mesh = crowd.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    people.forEach((p, i) => {
      const f = (p.phase + t * p.speed) % 1;
      const x = (p.east ? f * 2 - 1 : 1 - f * 2) * END;
      o.position.set(x, 0.45, p.z);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    const x = (along(progress.get()) * 2 - 1) * END;
    if (me.current) me.current.position.x = x;
    set(you, "current", x);
  });
  return (
    <>
      <instancedMesh ref={crowd} args={[undefined, undefined, PILGRIMS]} castShadow>
        <capsuleGeometry args={[0.2, 0.5, 4, 8]} />
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <group ref={me} position-z={0.8}>
        <mesh position-y={0.55}>
          <capsuleGeometry args={[0.26, 0.6, 4, 10]} />
          <meshStandardMaterial color="#e2bd6b" emissive="#c9a35b" emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.05}>
          <ringGeometry args={[0.6, 0.8, 32]} />
          <meshBasicMaterial color="#ecd9a8" toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}

/** The camera's focus drifts along with the gold figure, so dragging always orbits around "you". */
function Follow({ controls, you }: { controls: RefObject<ComponentRef<typeof OrbitControls> | null>; you: RefObject<number> }) {
  useFrame(({ camera }, dt) => {
    const c = controls.current;
    if (!c) return;
    const dx = (you.current - c.target.x) * (1 - Math.exp(-dt * 3));
    c.target.setX(c.target.x + dx);
    camera.position.x += dx;
  });
  return null;
}

const SPOTS = saiData.map((item) => ({ ...item, at: new THREE.Vector3(...item.position) }));

function MarkerProjector({ markers }: { markers: RefObject<(HTMLButtonElement | null)[]> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    SPOTS.forEach(({ at }, i) => {
      const el = markers.current[i];
      if (!el) return;
      v.copy(at).project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1;
      if (visible) el.style.transform = `translate(${Math.round(((v.x + 1) / 2) * size.width)}px, ${Math.round(((1 - v.y) / 2) * size.height)}px) translate(-50%, -50%)`;
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
      el.tabIndex = visible ? 0 : -1;
    });
  });
  return null;
}

/**
 * The Mas‘a in 3D: Safa and Marwah with their rock, the marble gallery, the green lights and the
 * crowd. Scrolling walks the gold figure through the seven rounds; dragging orbits around it.
 */
export default function SaiCanvas({ progress, running, onHotspot }: { progress: MotionValue<number>; running: boolean; onHotspot: (id: string) => void }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  const you = useRef(-END);
  const floor = useMemo(() => floorTexture(), []);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        frameloop={running ? "always" : "never"}
        dpr={[1, 1.6]}
        camera={{ position: [-END + 12, 21, 31], fov: 40, near: 0.5, far: 400 }}
        gl={{ antialias: true }}
        className="cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={["#0d1532"]} />
        <fog attach="fog" args={["#0d1532", 70, 170]} />
        <hemisphereLight args={["#fff4e0", "#8a7458", 0.9]} />
        <directionalLight position={[20, 50, 30]} intensity={2.2} color="#fff0d6" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={40} shadow-camera-bottom={-40} />
        <Environment resolution={128} frames={1} environmentIntensity={0.4}>
          <Lightformer form="rect" intensity={3} position={[0, 30, 0]} rotation-x={Math.PI / 2} scale={[80, 30, 1]} />
        </Environment>

        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[LENGTH, WIDTH + 3]} />
          <meshStandardMaterial map={floor} roughness={0.25} />
        </mesh>
        {/* the rail between the two directions, with the wheelchair lanes inside it */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.5, s * 0.9]} material={rail}>
            <boxGeometry args={[END * 2, 0.08, 0.08]} />
          </mesh>
        ))}
        <Gallery />
        <GreenLights />
        <Hill side={-1} seed={1.3} />
        <Hill side={1} seed={4.1} />
        <Walkers progress={progress} you={you} />
        <MarkerProjector markers={markers} />
        <OrbitControls ref={controls} target={[-END, 1, 0]} enablePan={false} enableZoom={false} minPolarAngle={0.5} maxPolarAngle={1.42} rotateSpeed={0.6} enableDamping />
        <Follow controls={controls} you={you} />
      </Canvas>
      {SPOTS.map((spot, i) => (
        <button
          key={spot.id}
          ref={(el) => {
            markers.current[i] = el;
          }}
          type="button"
          onClick={() => onHotspot(spot.id)}
          aria-label={`About ${spot.name}`}
          style={{ opacity: 0 }}
          className="group absolute top-0 left-0 z-10 flex items-center gap-1.5 outline-none transition-opacity duration-300"
        >
          <span className="relative grid size-6 shrink-0 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/50" />
            <span className="relative grid size-6 place-items-center rounded-full border-2 border-ivory-50 bg-gold-500 text-[11px] font-bold text-night-950 shadow-lg transition group-hover:scale-110">+</span>
          </span>
          <span className="pointer-events-none rounded-full bg-night-950/85 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-ivory-50 shadow-lg">{spot.name}</span>
        </button>
      ))}
    </div>
  );
}
