"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import gsap from "gsap";
import type { MotionValue } from "motion/react";
import { useMemo, useRef, type ComponentRef, type RefObject } from "react";
import * as THREE from "three";
import { hajjPoints, type HajjStage } from "@/lib/hajj/hajjPoints";
import { ArafatScene } from "./ArafatScene";
import { JamaratScene } from "./JamaratScene";
import { MinaScene } from "./MinaScene";
import { MuzdalifahScene } from "./MuzdalifahScene";
import { QurbaniScene } from "./QurbaniScene";

export type HajjBeat = { stage: HajjStage; start: number; end: number };

/** A marker's request to fly in; `busy` is true from take-off until the camera is back. */
type Flight = { id: string | null; seq: number; busy: boolean };
const FOV = { overview: 42, close: 32 };

type Light = { top: string; horizon: string; sun: string; sunPower: number; fill: number; sunY: number; stars: number };
const DAY: Light = { top: "#4f93cf", horizon: "#e9dcc4", sun: "#fff1d8", sunPower: 2.6, fill: 0.9, sunY: 120, stars: 0 };
const DUSK: Light = { top: "#39406f", horizon: "#e58b52", sun: "#ff9f5e", sunPower: 1.5, fill: 0.5, sunY: 22, stars: 0.3 };
const NIGHT: Light = { top: "#070c22", horizon: "#1b2547", sun: "#9fb4e8", sunPower: 0.5, fill: 0.28, sunY: 90, stars: 1 };
const DAWN: Light = { top: "#2c3f76", horizon: "#e9b48c", sun: "#ffc79a", sunPower: 1, fill: 0.45, sunY: 30, stars: 0.15 };

/** How the light runs through each place, from the start of its beat to the end. */
const SKY: Record<HajjStage, [Light, Light]> = { mina: [DAY, DAY], arafat: [DAY, DUSK], muzdalifah: [NIGHT, DAWN], jamarat: [DAY, DAY], qurbani: [DAY, DAY] };
const POSE: Record<HajjStage, { camera: [number, number, number]; target: [number, number, number]; fog: number; flyTo?: [number, number, number] }> = {
  mina: { camera: [92, 56, 118], target: [0, 2, 0], fog: 620 },
  arafat: { camera: [-74, 36, 112], target: [0, 15, 0], fog: 640 },
  muzdalifah: { camera: [11, 5, 19], target: [0, 1, 0], fog: 460 },
  jamarat: { camera: [104, 58, 118], target: [0, 16, 0], fog: 620 },
  // arriving here, the camera flies in towards the facility by itself
  qurbani: { camera: [120, 100, 230], target: [-12, 4, 26], fog: 620, flyTo: [20, 40, 134] },
};
const STAGES = Object.keys(POSE) as HajjStage[];
const SPOTS = hajjPoints.map((p) => ({ ...p, v: new THREE.Vector3(...p.at), eye: new THREE.Vector3(...p.eye), look: new THREE.Vector3(...p.look) }));
const SWAP = 0.3; // beats either side of a change of place over which the scene dissolves into haze
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Writes to objects that arrive as props, kept out of render for React's compiler. */
const set = <T extends object, K extends keyof T>(target: T, key: K, value: T[K]) => {
  target[key] = value;
};

const skyShader = {
  vertexShader: "varying vec3 vPos; void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader:
    "uniform vec3 top; uniform vec3 horizon; varying vec3 vPos; void main() { float h = clamp(normalize(vPos).y * 1.6, 0.0, 1.0); gl_FragColor = vec4(mix(horizon, top, pow(h, 0.7)), 1.0); }",
};

/**
 * Drives the one continuous environment from the scroll: which place is showing, the sky and sun
 * (Arafat's afternoon runs into dusk, Muzdalifah's night into dawn), and the haze that dissolves one
 * place into the next. The camera jumps only while the haze has hidden everything. It also runs the
 * fly-zoom: chosen marker → GSAP flies in → the details open → closing them flies back out.
 */
function Director({
  t,
  beats,
  places,
  controls,
  skyMat,
  sun,
  fill,
  stars,
  flight,
  open,
  onArrived,
}: {
  t: MotionValue<number>;
  beats: HajjBeat[];
  places: RefObject<Partial<Record<HajjStage, THREE.Group | null>>>;
  controls: RefObject<ComponentRef<typeof OrbitControls> | null>;
  skyMat: THREE.ShaderMaterial;
  sun: RefObject<THREE.DirectionalLight | null>;
  fill: RefObject<THREE.HemisphereLight | null>;
  stars: RefObject<THREE.Group | null>;
  flight: RefObject<Flight>;
  open: boolean;
  onArrived: (id: string) => void;
}) {
  const { camera: cam } = useThree();
  const lens = cam as THREE.PerspectiveCamera;
  const fly = useRef({
    seq: 0,
    state: "idle" as "idle" | "moving" | "close",
    seen: false,
    home: { pos: new THREE.Vector3(), target: new THREE.Vector3() },
    tl: null as gsap.core.Timeline | null,
  });

  /** One smooth move of the camera, its aim and its lens; the orbit controls rest meanwhile. */
  const move = (pos: THREE.Vector3, target: THREE.Vector3, fov: number, duration: number, done: () => void) => {
    const c = controls.current;
    if (!c) return;
    fly.current.tl?.kill();
    fly.current.state = "moving";
    set(c, "enabled", false);
    set(flight.current, "busy", true);
    fly.current.tl = gsap
      .timeline({ onUpdate: () => cam.lookAt(c.target), onComplete: done })
      .to(cam.position, { x: pos.x, y: pos.y, z: pos.z, duration, ease: "power3.inOut" }, 0)
      .to(c.target, { x: target.x, y: target.y, z: target.z, duration, ease: "power3.inOut" }, 0)
      .to(lens, { fov, duration, ease: "power2.inOut", onUpdate: () => lens.updateProjectionMatrix() }, 0);
  };
  const land = () => {
    const c = controls.current;
    fly.current.state = "idle";
    set(flight.current, "busy", false);
    if (c) {
      set(c, "enabled", true);
      c.update();
    }
  };

  const shown = useRef<HajjStage | null>(null);
  const last = useRef(0);
  const live = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color(), up: new THREE.Vector3(0, 1, 0), v: new THREE.Vector3() }), []);
  const fog = useMemo(() => new THREE.Fog("#e9dcc4", 100, 600), []);
  const changes = useMemo(() => beats.flatMap((b, i) => (i > 0 && beats[i - 1].stage !== b.stage ? [b.start] : [])), [beats]);

  useFrame(({ scene, camera }, dt) => {
    set(scene, "fog", fog);
    const now = t.get();
    const beat = beats.find((b) => now < b.end) ?? beats[beats.length - 1];
    const local = Math.min(1, Math.max(0, (now - beat.start) / (beat.end - beat.start)));
    const c = controls.current;

    const f = fly.current;
    const req = flight.current;
    if (req.seq !== f.seq) {
      f.seq = req.seq;
      const spot = SPOTS.find((s) => s.id === req.id);
      if (spot && f.state === "idle" && c) {
        f.home.pos.copy(camera.position);
        f.home.target.copy(c.target);
        f.seen = false;
        move(spot.eye, spot.look, FOV.close, 2.2, () => {
          f.state = "close";
          onArrived(spot.id);
        });
      }
    }
    // closing the details is what sends the camera back out
    if (f.state === "close") {
      if (open) f.seen = true;
      else if (f.seen) move(f.home.pos, f.home.target, FOV.overview, 1.8, land);
    }

    const dist = Math.min(...changes.map((x) => Math.abs(now - x)), 9);
    const veil = 1 - smooth(0.02, SWAP, dist);
    // the place changes exactly at a beat boundary, which is the thickest of the haze — and a jump
    // in the scroll (a chapter link, a dragged scrollbar) must land on the right place too
    if (shown.current !== beat.stage && c) {
      shown.current = beat.stage;
      if (f.state !== "idle") {
        f.tl?.kill();
        set(lens, "fov", FOV.overview);
        lens.updateProjectionMatrix();
        land();
      }
      for (const s of STAGES) {
        const g = places.current[s];
        if (g) set(g, "visible", s === beat.stage);
      }
      const pose = POSE[beat.stage];
      camera.position.set(...pose.camera);
      c.target.set(...pose.target);
      c.update();
      if (pose.flyTo) move(new THREE.Vector3(...pose.flyTo), c.target.clone(), FOV.overview, 3.2, land);
    }
    // the scroll also carries the view slowly round; dragging adds to it
    if (c && f.state === "idle") {
      const turn = (now - last.current) * 0.28;
      live.v.copy(camera.position).sub(c.target).applyAxisAngle(live.up, turn);
      camera.position.copy(c.target).add(live.v);
    }
    last.current = now;

    const [from, to] = SKY[beat.stage];
    const k = 1 - Math.exp(-dt * 3);
    const mix = (x: string, y: string, into: THREE.Color) => into.lerp(live.a.set(x).lerp(live.b.set(y), local), k);
    mix(from.top, to.top, skyMat.uniforms.top.value);
    mix(from.horizon, to.horizon, skyMat.uniforms.horizon.value);
    fog.color.copy(skyMat.uniforms.horizon.value);
    const far = POSE[beat.stage].fog;
    set(fog, "far", THREE.MathUtils.lerp(far, 3, veil));
    set(fog, "near", THREE.MathUtils.lerp(far * 0.3, 0.5, veil));

    const lerp = THREE.MathUtils.lerp;
    if (sun.current) {
      mix(from.sun, to.sun, sun.current.color);
      set(sun.current, "intensity", THREE.MathUtils.damp(sun.current.intensity, lerp(from.sunPower, to.sunPower, local), 3, dt));
      sun.current.position.set(130, THREE.MathUtils.damp(sun.current.position.y, lerp(from.sunY, to.sunY, local), 3, dt), 90);
    }
    if (fill.current) set(fill.current, "intensity", THREE.MathUtils.damp(fill.current.intensity, lerp(from.fill, to.fill, local), 3, dt));
    if (stars.current) set(stars.current, "visible", lerp(from.stars, to.stars, local) > 0.1);
  });
  return null;
}


/** Keeps the DOM + markers on their 3D points; only the place on show has markers. */
function MarkerProjector({ markers, places, flight }: { markers: RefObject<(HTMLButtonElement | null)[]>; places: RefObject<Partial<Record<HajjStage, THREE.Group | null>>>; flight: RefObject<Flight> }) {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size, scene }) => {
    const hazy = scene.fog instanceof THREE.Fog && scene.fog.far < 100;
    SPOTS.forEach((spot, i) => {
      const el = markers.current[i];
      if (!el) return;
      v.copy(spot.v).project(camera);
      const visible = !hazy && !flight.current.busy && !!places.current[spot.stage]?.visible && v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1;
      if (visible) el.style.transform = `translate(${Math.round(((v.x + 1) / 2) * size.width)}px, ${Math.round(((1 - v.y) / 2) * size.height)}px) translate(-50%, -50%)`;
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
      el.tabIndex = visible ? 0 : -1;
    });
  });
  return null;
}

/** All four Hajj environments in one canvas, joined by the scroll position `t` (in beats). */
export default function HajjCanvas({
  t,
  beats,
  running,
  open,
  onPoint,
}: {
  t: MotionValue<number>;
  beats: HajjBeat[];
  running: boolean;
  /** Whether the details are open: closing them flies the camera back out */
  open: boolean;
  onPoint: (id: string) => void;
}) {
  const flight = useRef<Flight>({ id: null, seq: 0, busy: false });
  const places = useRef<Partial<Record<HajjStage, THREE.Group | null>>>({});
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.HemisphereLight>(null);
  const stars = useRef<THREE.Group>(null);
  const markers = useRef<(HTMLButtonElement | null)[]>([]);
  const skyMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...skyShader,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color(DAY.top) }, horizon: { value: new THREE.Color(DAY.horizon) } },
      }),
    [],
  );

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        frameloop={running ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: POSE.mina.camera, fov: 42, near: 0.3, far: 1600 }}
        gl={{ antialias: true }}
        className="cursor-grab active:cursor-grabbing"
      >
        <mesh material={skyMat}>
          <sphereGeometry args={[1200, 32, 16]} />
        </mesh>
        <group ref={stars} visible={false}>
          <Stars radius={700} depth={120} count={4500} factor={9} fade speed={0.3} />
        </group>
        <hemisphereLight ref={fill} args={["#fff6e6", "#a58d63", 0.9]} />
        <directionalLight ref={sun} position={[130, 120, 90]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-220} shadow-camera-right={220} shadow-camera-top={220} shadow-camera-bottom={-220} shadow-camera-far={600} />

        <group
          ref={(g) => {
            places.current.mina = g;
          }}
        >
          <MinaScene />
        </group>
        <group
          ref={(g) => {
            places.current.arafat = g;
          }} visible={false}
        >
          <ArafatScene />
        </group>
        <group
          ref={(g) => {
            places.current.muzdalifah = g;
          }} visible={false}
        >
          <MuzdalifahScene />
        </group>
        <group
          ref={(g) => {
            places.current.jamarat = g;
          }} visible={false}
        >
          <JamaratScene />
        </group>

        <group
          ref={(g) => {
            places.current.qurbani = g;
          }}
          visible={false}
        >
          <QurbaniScene />
        </group>

        <OrbitControls ref={controls} target={POSE.mina.target} enablePan={false} enableZoom={false} minPolarAngle={0.5} maxPolarAngle={1.5} rotateSpeed={0.6} enableDamping />
        <Director t={t} beats={beats} places={places} controls={controls} skyMat={skyMat} sun={sun} fill={fill} stars={stars} flight={flight} open={open} onArrived={onPoint} />
        <MarkerProjector markers={markers} places={places} flight={flight} />
      </Canvas>

      {SPOTS.map((spot, i) => (
        <button
          key={spot.id}
          ref={(el) => {
            markers.current[i] = el;
          }}
          type="button"
          onClick={() => {
            flight.current.id = spot.id;
            flight.current.seq += 1;
          }}
          aria-label={`About ${spot.label}`}
          style={{ opacity: 0 }}
          className="group absolute top-0 left-0 z-10 flex items-center gap-1.5 outline-none transition-opacity duration-300"
        >
          <span className="relative grid size-6 shrink-0 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-gold-400/50" />
            <span className="relative grid size-6 place-items-center rounded-full border-2 border-ivory-50 bg-gold-500 text-[11px] font-bold text-night-950 shadow-lg transition group-hover:scale-110">+</span>
          </span>
          <span className="pointer-events-none rounded-full bg-night-950/85 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-ivory-50 shadow-lg">{spot.label}</span>
        </button>
      ))}
    </div>
  );
}
