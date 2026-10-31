"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

// The terminal runs along −Z: entrance at z 0, immigration −10, prayer room −22, lounge −33,
// gate −45, jet bridge to the aircraft door at −56. Units are metres.

type Key = { p: number; x: number; z: number; hidden?: boolean; seated?: boolean; face?: number };

const FACE_FORWARD = 0; // looking down the terminal (−z)
const FACE_NOSE = -Math.PI / 2; // in the cabin, looking towards the cockpit (+x)

/**
 * Where the avatar is at each point of the scroll, in real-world order: in through the doors,
 * immigration (the passport is checked and stamped here), Ihram in the prayer room when flying
 * straight to Makkah, a seat in the lounge, the gate, the jet bridge — and a seat on the plane.
 */
export function route(ihram: boolean): Key[] {
  return [
    { p: 0, x: 0, z: 8 },
    { p: 0.11, x: 0, z: 2 },
    { p: 0.18, x: 0, z: -8.6 },
    { p: 0.32, x: 0, z: -8.6 }, // at the immigration counter
    { p: 0.4, x: 0, z: -19 },
    ...(ihram
      ? [
          { p: 0.44, x: 3.3, z: -22 },
          { p: 0.45, x: 3.3, z: -22, seated: true, face: FACE_NOSE }, // facing the Ihram room's door
          { p: 0.55, x: 3.3, z: -22, seated: true, face: FACE_NOSE },
          { p: 0.56, x: 3.3, z: -22 },
        ]
      : [{ p: 0.48, x: 0.6, z: -23 }]),
    { p: 0.61, x: 0, z: -28 },
    { p: 0.66, x: -3, z: -32.9 },
    { p: 0.67, x: -3, z: -33.5, seated: true, face: FACE_FORWARD }, // waiting in the lounge
    { p: 0.77, x: -3, z: -33.5, seated: true, face: FACE_FORWARD },
    { p: 0.78, x: -3, z: -32.9 },
    { p: 0.84, x: 0, z: -45 },
    { p: 0.9, x: 0, z: -55.9 },
    { p: 0.92, x: 0, z: -58.5 }, // through the aircraft door into the aisle
    { p: 0.96, x: -4, z: -58.5 },
    { p: 0.975, x: -4, z: -57.75, seated: true, face: FACE_NOSE }, // in the seat
    { p: 1, x: -4, z: -57.75, seated: true, face: FACE_NOSE },
  ];
}

type Pose = { x: number; z: number; yaw: number; hidden: boolean; seated: boolean; cabin: boolean };

export function poseAt(keys: Key[], p: number): Pose {
  let yaw = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len > 0.05) yaw = Math.atan2(-(b.x - a.x), -(b.z - a.z));
    if (p <= b.p) {
      const t = b.p === a.p ? 1 : Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p)));
      const e = t * t * (3 - 2 * t); // glide: ease in and out of every stop
      const x = a.x + (b.x - a.x) * e;
      const z = a.z + (b.z - a.z) * e;
      const seated = !!(b.seated && (a.seated || t > 0.85));
      return { x, z, yaw: seated && b.face !== undefined ? b.face : yaw, hidden: !!(a.hidden && b.hidden), seated, cabin: z < -56.6 };
    }
  }
  const last = keys[keys.length - 1];
  return { x: last.x, z: last.z, yaw: last.face ?? 0, hidden: false, seated: !!last.seated, cabin: true };
}

function sign(text: string, bg: string, fg: string, w = 1024, h = 192) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.font = `600 ${Math.round(h * 0.42)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function floorTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#e9ecef";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#c9cfd6";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 36);
  return t;
}

const SKIN = "#c99a72";
const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });

/** A faceless figure: used for the avatar and, in uniform, for the officers and other travellers. */
function Figure({ top, bottom, shoes = "#222", cap }: { top: THREE.Material; bottom: THREE.Material; shoes?: string; cap?: string }) {
  const skin = useMemo(() => mat(SKIN), []);
  const hair = useMemo(() => mat("#1d1712"), []);
  const shoe = useMemo(() => mat(shoes), [shoes]);
  return (
    <group>
      {[-0.1, 0.1].map((x) => (
        <group key={x} position={[x, 0.95, 0]}>
          <mesh position-y={-0.24} material={bottom}>
            <capsuleGeometry args={[0.075, 0.38, 4, 8]} />
          </mesh>
          <mesh position-y={-0.68} material={bottom}>
            <capsuleGeometry args={[0.065, 0.36, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.92, -0.04]} material={shoe}>
            <boxGeometry args={[0.1, 0.07, 0.24]} />
          </mesh>
        </group>
      ))}
      <mesh position-y={1.28} material={top}>
        <capsuleGeometry args={[0.19, 0.42, 6, 12]} />
      </mesh>
      {[-0.26, 0.26].map((x) => (
        <group key={x} position={[x, 1.52, 0]}>
          <mesh position-y={-0.16} material={top}>
            <capsuleGeometry args={[0.06, 0.24, 4, 8]} />
          </mesh>
          <mesh position-y={-0.45} material={skin}>
            <capsuleGeometry args={[0.05, 0.24, 4, 8]} />
          </mesh>
        </group>
      ))}
      <mesh position-y={1.66} material={skin}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 10]} />
      </mesh>
      <mesh position-y={1.8} material={skin}>
        <sphereGeometry args={[0.12, 20, 16]} />
      </mesh>
      {cap ? (
        <mesh position-y={1.88} material={mat(cap)}>
          <cylinderGeometry args={[0.125, 0.13, 0.08, 16]} />
        </mesh>
      ) : (
        <mesh position-y={1.82} rotation-x={-0.35} material={hair}>
          <sphereGeometry args={[0.125, 20, 12, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
        </mesh>
      )}
    </group>
  );
}

/**
 * First-person-ish walk through the terminal: nobody is drawn; the camera glides along the route
 * (scrolling back retraces it) and turns to face each stop. The + markers show what to do there.
 */
function Walkthrough({ progress, keys }: { progress: MotionValue<number>; keys: Key[] }) {
  const at = useRef({ x: 0, z: 8, yaw: 0 });
  const tmp = useMemo(() => ({ behind: new THREE.Vector3(), look: new THREE.Vector3() }), []);

  useFrame(({ camera }, dt) => {
    const pose = poseAt(keys, progress.get());
    const a = at.current;
    const k = 1 - Math.exp(-dt * 9);
    a.x += (pose.x - a.x) * k;
    a.z += (pose.z - a.z) * k;
    // turn the short way round
    const turn = ((pose.yaw - a.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    a.yaw += turn * (1 - Math.exp(-dt * 7));
    const fx = -Math.sin(a.yaw);
    const fz = -Math.cos(a.yaw);
    const dist = pose.cabin ? 2.6 : 4.4;
    const height = pose.cabin ? 1.6 : 1.9;
    tmp.behind.set(a.x - fx * dist, height, a.z - fz * dist);
    camera.position.lerp(tmp.behind, 1 - Math.exp(-dt * 4));
    tmp.look.set(a.x + fx * 4, pose.cabin ? 1.2 : 1.5, a.z + fz * 4);
    camera.lookAt(tmp.look);
  });
  return null;
}

type Point = { id: string; label: string; position: [number, number, number] };

/** Keeps the DOM + markers on their 3D points; a marker behind the camera or too far off is hidden. */
function MarkerProjector({ points, markers }: { points: Point[]; markers: RefObject<(HTMLButtonElement | null)[]> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    points.forEach((pt, i) => {
      const el = markers.current[i];
      if (!el) return;
      v.set(...pt.position);
      const dist = v.distanceTo(camera.position);
      v.project(camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && dist < 26;
      if (visible) el.style.transform = `translate(${Math.round(((v.x + 1) / 2) * size.width)}px, ${Math.round(((1 - v.y) / 2) * size.height)}px) translate(-50%, -50%)`;
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
      el.tabIndex = visible ? 0 : -1;
    });
  });
  return null;
}

/** The inside of the aircraft: floor, rows of seats facing the nose (+x), overhead bins, windows. */
function Cabin({ white }: { white: THREE.Material }) {
  const seat = useMemo(() => mat("#24305f"), []);
  const head = useMemo(() => mat("#e9e2d3"), []);
  const bins = useMemo(() => mat("#eef0f3"), []);
  const rows = Array.from({ length: 16 }, (_, i) => -12 + i * 1.2);
  return (
    <group position={[0, 0, -58.5]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
        <planeGeometry args={[28, 3.6]} />
        <meshStandardMaterial color="#4b5470" />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.015}>
        <planeGeometry args={[28, 0.7]} />
        <meshStandardMaterial color="#8a2f3a" />
      </mesh>
      {rows.map((x) =>
        [-1.35, -0.75, 0.75, 1.35].map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position-y={0.45} material={seat}>
              <boxGeometry args={[0.5, 0.12, 0.5]} />
            </mesh>
            <mesh position={[-0.24, 0.85, 0]} material={seat}>
              <boxGeometry args={[0.1, 0.8, 0.5]} />
            </mesh>
            <mesh position={[-0.24, 1.15, 0]} material={head}>
              <boxGeometry args={[0.11, 0.18, 0.4]} />
            </mesh>
          </group>
        )),
      )}
      {[-1.45, 1.45].map((z) => (
        <mesh key={z} position={[0, 2.75, z]} material={bins}>
          <boxGeometry args={[28, 0.5, 0.7]} />
        </mesh>
      ))}
      {rows.map((x) =>
        [-2.14, 2.14].map((z) => (
          <mesh key={`w${x}${z}`} position={[x + 0.2, 1.55, z]} rotation-y={z < 0 ? 0 : Math.PI}>
            <planeGeometry args={[0.3, 0.42]} />
            <meshBasicMaterial color="#9cc2e6" />
          </mesh>
        )),
      )}
      <mesh rotation-z={Math.PI / 2} position-y={1.8} material={white}>
        <cylinderGeometry args={[2.2, 2.2, 30, 32, 1, true]} />
      </mesh>
    </group>
  );
}

function Terminal() {
  const tex = useMemo(
    () => ({
      floor: floorTexture(),
      departures: sign("DEPARTURES  ·  المغادرة", "#0a1128", "#ecd9a8"),
      immigration: sign("IMMIGRATION", "#1f5f3f", "#ffffff", 768),
      prayer: sign("PRAYER ROOM · IHRAM", "#0a1128", "#ecd9a8", 768),
      lounge: sign("LOUNGE", "#243263", "#ffffff", 512),
      gate: sign("GATE 12  ·  JEDDAH", "#c9a35b", "#0a1128", 768),
    }),
    [],
  );
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#bcd3e6", transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.2 }), []);
  const wall = useMemo(() => mat("#f3f1ec"), []);
  const uniform = useMemo(() => mat("#3f4d3a"), []);
  const trousers = useMemo(() => mat("#2b2f2a"), []);
  const seat = useMemo(() => mat("#2c3e75"), []);
  const metal = useMemo(() => mat("#9aa5b9", { metalness: 0.6, roughness: 0.4 }), []);
  const white = useMemo(() => mat("#f4f6f8", { roughness: 0.4 }), []);
  const cabinWall = useMemo(() => mat("#f2f0eb", { side: THREE.BackSide }), []);
  const traveller = useMemo(() => [mat("#7a3b3b"), mat("#3b6b5a"), mat("#5a4a7a"), mat("#1d1d22")], []);

  return (
    <group>
      {/* floor, ceiling and the outside forecourt */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -26]}>
        <planeGeometry args={[12, 72]} />
        <meshStandardMaterial map={tex.floor} roughness={0.25} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 14]}>
        <planeGeometry args={[40, 16]} />
        <meshStandardMaterial color="#b9b3a6" />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 5, -28]}>
        <planeGeometry args={[12, 56]} />
        <meshStandardMaterial color="#f7f6f2" />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} position={[0, 4.98, -2 - i * 5]} rotation-x={Math.PI / 2}>
          <planeGeometry args={[6, 0.3]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* side walls; the left one is glass looking out onto the apron */}
      <mesh position={[6, 2.5, -28]} rotation-y={-Math.PI / 2} material={wall}>
        <planeGeometry args={[56, 5]} />
      </mesh>
      <mesh position={[-6, 2.5, -28]} rotation-y={Math.PI / 2} material={glass}>
        <planeGeometry args={[56, 5]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-5.95, 2.5, -2 - i * 5]} material={metal}>
          <boxGeometry args={[0.1, 5, 0.12]} />
        </mesh>
      ))}

      {/* entrance: glass front with sliding doors and the departures sign */}
      {[-4, 4].map((x) => (
        <mesh key={x} position={[x, 2.5, 0]} material={glass}>
          <boxGeometry args={[4, 5, 0.1]} />
        </mesh>
      ))}
      <mesh position={[0, 4.4, 0]} material={metal}>
        <boxGeometry args={[4, 1.2, 0.12]} />
      </mesh>
      {/* departures sign on the band above the doors, low enough to stay in frame */}
      <mesh position={[0, 4.4, 0.08]}>
        <planeGeometry args={[3.8, 0.75]} />
        <meshBasicMaterial map={tex.departures} />
      </mesh>
      <mesh position={[0, 3, 0.02]} material={wall}>
        <boxGeometry args={[12, 0.01, 0.01]} />
      </mesh>

      {/* immigration: two desks either side of the lane, officers behind glass */}
      <mesh position={[0, 3.9, -8]}>
        <planeGeometry args={[4, 0.75]} />
        <meshBasicMaterial map={tex.immigration} />
      </mesh>
      {[-1.5, 1.5, -4, 4].map((x) => (
        <group key={x} position={[x, 0, -10]}>
          <mesh position-y={0.55} material={wall}>
            <boxGeometry args={[1.4, 1.1, 1.2]} />
          </mesh>
          <mesh position={[0, 1.6, 0.4]} material={glass}>
            <boxGeometry args={[1.4, 1, 0.04]} />
          </mesh>
          <group position={[x > 0 ? 0.2 : -0.2, 0, -0.2]} rotation-y={x > 0 ? Math.PI / 2 : -Math.PI / 2}>
            <Figure top={uniform} bottom={trousers} cap="#2b3a28" />
          </group>
        </group>
      ))}

      {/* prayer room on the right, where Ihram is put on */}
      <mesh position={[3.9, 2, -22]} material={wall}>
        <boxGeometry args={[0.2, 4, 6]} />
      </mesh>
      <mesh position={[3.79, 1.1, -22]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[1.2, 2.2]} />
        <meshStandardMaterial color="#3a2516" />
      </mesh>
      <mesh position={[3.78, 2.6, -22]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[2.6, 0.5]} />
        <meshBasicMaterial map={tex.prayer} />
      </mesh>

      {/* lounge: rows of seats, a few travellers, the aircraft waiting outside */}
      <mesh position={[0, 3.9, -30]}>
        <planeGeometry args={[2.4, 0.6]} />
        <meshBasicMaterial map={tex.lounge} />
      </mesh>
      {[-31, -33.5, -36].map((z) =>
        [-4.6, -3.8, -3, 3, 3.8, 4.6].map((x) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position-y={0.45} material={seat}>
              <boxGeometry args={[0.7, 0.12, 0.6]} />
            </mesh>
            <mesh position={[0, 0.8, 0.27]} material={seat}>
              <boxGeometry args={[0.7, 0.6, 0.08]} />
            </mesh>
            <mesh position-y={0.2} material={metal}>
              <boxGeometry args={[0.06, 0.4, 0.06]} />
            </mesh>
          </group>
        )),
      )}
      {[
        [-3.8, -33.5],
        [3, -31],
        [4.6, -36],
        [-4.6, -36],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.15, z]} rotation-y={Math.PI} scale={0.95}>
          <Figure top={traveller[i % traveller.length]} bottom={trousers} />
        </group>
      ))}
      <group position={[-16, 0, -40]} rotation-y={0.3}>
        <mesh rotation-z={Math.PI / 2} material={white}>
          <capsuleGeometry args={[1.6, 16, 8, 24]} />
        </mesh>
        <mesh position={[0, -0.6, 0]} material={white}>
          <boxGeometry args={[4, 0.2, 16]} />
        </mesh>
        <mesh position={[-8.5, 2, 0]} material={mat("#c9a35b")}>
          <boxGeometry args={[2, 3.5, 0.3]} />
        </mesh>
      </group>

      {/* gate and jet bridge to the aircraft door */}
      <mesh position={[0, 3.9, -43]}>
        <planeGeometry args={[3.4, 0.7]} />
        <meshBasicMaterial map={tex.gate} />
      </mesh>
      <mesh position={[2.6, 0.55, -44]} material={wall}>
        <boxGeometry args={[1.6, 1.1, 0.7]} />
      </mesh>
      {[-1.3, 1.3].map((x) => (
        <mesh key={x} position={[x, 1.4, -51]} material={mat("#d6d9de")}>
          <boxGeometry args={[0.1, 2.8, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 2.8, -51]} material={mat("#c4c8ce")}>
        <boxGeometry args={[2.7, 0.1, 10]} />
      </mesh>
      <Cabin white={cabinWall} />
      <group position={[0, 1.8, -58.5]}>
        <mesh rotation-z={Math.PI / 2} material={white}>
          <cylinderGeometry args={[2.2, 2.2, 30, 32]} />
        </mesh>
        <mesh position={[0, -0.4, 2.21]}>
          <planeGeometry args={[1, 1.9]} />
          <meshBasicMaterial color="#1b2550" />
        </mesh>
        <mesh position={[0, 0.9, 2.18]} material={mat("#c9a35b")}>
          <boxGeometry args={[30, 0.12, 0.05]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Opening scene of the journey: the camera glides through the home airport — in, immigration, the
 * Ihram area (when flying straight to Makkah), the lounge, the gate, down the jet bridge and into a
 * seat on the plane. Each stop has a + marker that opens its details.
 */
export default function AirportScene({
  progress,
  ihram,
  running,
  points,
  onHotspot,
}: {
  progress: MotionValue<number>;
  ihram: boolean;
  running: boolean;
  points: Point[];
  onHotspot: (id: string) => void;
}) {
  const keys = useMemo(() => route(ihram), [ihram]);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className="absolute inset-0">
      <Canvas frameloop={running ? "always" : "never"} dpr={[1, 1.6]} camera={{ position: [0, 1.9, 12.4], fov: 52, near: 0.1, far: 200 }} gl={{ antialias: true }}>
        <color attach="background" args={["#dfe7ef"]} />
        <fog attach="fog" args={["#dfe7ef", 18, 60]} />
        <hemisphereLight args={["#ffffff", "#c9c2b2", 1.1]} />
        <directionalLight position={[6, 12, 8]} intensity={1.4} />
        <ambientLight intensity={0.35} />
        <Terminal />
        <Walkthrough progress={progress} keys={keys} />
        <MarkerProjector points={points} markers={markers} />
      </Canvas>
      {points.map((pt, i) => (
        <button
          key={pt.id}
          ref={(el) => {
            markers.current[i] = el;
          }}
          type="button"
          onClick={() => onHotspot(pt.id)}
          aria-label={`About ${pt.label}`}
          style={{ opacity: 0 }}
          className="group absolute top-0 left-0 z-10 flex items-center gap-1.5 outline-none transition-opacity duration-300"
        >
          <span className="relative grid size-7 shrink-0 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/50" />
            <span className="relative grid size-7 place-items-center rounded-full border-2 border-ivory-50 bg-gold-500 text-sm font-bold text-night-950 shadow-lg transition group-hover:scale-110">+</span>
          </span>
          <span className="pointer-events-none rounded-full bg-night-950/85 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-ivory-50 shadow-lg">{pt.label}</span>
        </button>
      ))}
    </div>
  );
}
