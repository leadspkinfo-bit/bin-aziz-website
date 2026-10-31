"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Card3D } from "./Card3D";
import {
  CARD_H,
  CARD_W,
  religiousTextures,
  transportTextures,
  umrahTextures,
  visaTextures,
  voucherTextures,
  worldwideTextures,
} from "./cardTextures";
import { DETAILS_LAYER, Ticket3D, TICKET_H, TICKET_W } from "./Ticket3D";

/**
 * Values written by the GSAP ScrollTrigger timeline (see TicketJourney).
 * - travel:  0 → 1 while the hero scrolls away (drives the sine-wave path)
 * - turn:    0 → 1 vertical → horizontal rotation
 * - details: 0 → 1 opacity of the text printed on the ticket
 * - flip:    0 → 1 two bottom-to-top turns; the ticket becomes the hotel voucher halfway through
 * - voucher: 0 → 1 opacity of the stay details printed on the voucher
 * - lift:    0 → 1 the voucher turns vertical again as the intro leaves
 * - fall:    0 → 1 sine-wave path down to the services section
 * - land:    0 → 1 vertical → horizontal beside the services
 * - stack:   0 → 1 the service cards fan out behind the voucher
 */
export type TicketTimeline = {
  travel: number;
  turn: number;
  details: number;
  flip: number;
  voucher: number;
  lift: number;
  fall: number;
  land: number;
  stack: number;
};

const FLIP_TURNS = 2;
// Swap while the card is edge-on to the camera, so the change itself is never seen.
const SWAP_ANGLE = Math.PI * 2.5;
const VOUCHER_DETAILS_LAYER = "voucher-details";

// Services stack: card 0 is the voucher that made the journey, then one card per service
// (and its parts): transport, Umrah package, air ticket, worldwide ticketing, visa, religious travel.
const STACK = 7;
const DEPTH = 3; // layers visible behind the front card; the rest wait hidden
const CYCLE_EVERY = 3.2; // seconds each card stays in front
const SLOT = { x: 0.34, y: 0.4, z: -0.5, s: 0.06 }; // offset per layer, in card units

const damp = THREE.MathUtils.damp;
const lerp = THREE.MathUtils.lerp;
const smooth = THREE.MathUtils.smoothstep;

/** Signed wave used for both journeys: swings left first, smaller lobe to the right. */
function sway(p: number) {
  const s = Math.sin(p * Math.PI * 2);
  return s > 0 ? s : s * 0.35;
}

type Pose = { x: number; y: number; z: number; s: number };
const layer = (k: number): Pose => ({ x: k * SLOT.x, y: k * SLOT.y, z: k * SLOT.z, s: 1 - k * SLOT.s });
// Waiting cards hide smaller and deeper, right behind layer 2, so nothing peeks out.
const HIDDEN: Pose = { ...layer(DEPTH - 1), z: DEPTH * SLOT.z - 0.3, s: 1 - DEPTH * SLOT.s - 0.1 };
const mix = (a: Pose, b: Pose, u: number): Pose => ({
  x: lerp(a.x, b.x, u),
  y: lerp(a.y, b.y, u),
  z: lerp(a.z, b.z, u),
  s: lerp(a.s, b.s, u),
});

/**
 * Places one stack card. `rel` is its place counted from the front (0 – STACK, wrapping):
 * 0 – DEPTH are the visible layers, DEPTH – DEPTH+1 rises from hiding into the last layer,
 * after that it waits hidden, and the final step is the front card sliding out to the left
 * and tucking in behind.
 */
function placeCard(g: THREE.Object3D, rel: number, spread: number) {
  let p: Pose, ry = 0, rz = 0, swing = 0;
  if (rel <= DEPTH) p = layer(rel);
  else if (rel <= DEPTH + 1) p = mix(HIDDEN, layer(DEPTH), DEPTH + 1 - rel);
  else if (rel <= STACK - 1) p = HIDDEN;
  else {
    const u = STACK - rel; // 0 → 1 as it goes from the front to hiding
    swing = Math.sin(u * Math.PI);
    p = mix(layer(0), HIDDEN, u);
    ry = swing * 0.7;
    rz = swing * 0.1;
  }
  const x = p.x - swing * 1.6, y = p.y - swing * 0.25, z = p.z - swing * 0.9;
  // Folded (spread 0): the others tuck just behind the front card, which stays as it is.
  const tuck = Math.min(rel, STACK - rel, 1);
  g.position.set(x * spread, y * spread, lerp(-0.08 * tuck, z, spread));
  g.rotation.set(0, ry * spread, rz * spread);
  g.scale.setScalar(lerp(1 - 0.08 * tuck, p.s, spread));
}

function TicketRig({ timeline }: { timeline: RefObject<TicketTimeline> }) {
  const group = useRef<THREE.Group>(null);
  const flipper = useRef<THREE.Group>(null);
  const ticket = useRef<THREE.Group>(null);
  const voucherCard = useRef<THREE.Group>(null);
  const stackGroup = useRef<THREE.Group>(null);
  const cycle = useRef({ target: 0, phase: 0, timer: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const reduced = useRef(false);
  const { viewport, size } = useThree();

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    const f = flipper.current;
    if (!g || !f) return;
    const dt = Math.min(delta, 0.1);
    const { travel, turn: scrollTurn, details, flip, voucher, lift, fall, land, stack } = timeline.current;
    const vw = viewport.width, vh = viewport.height;
    const mobile = size.width < 768;
    const t = state.clock.elapsedTime;
    // Mobile: the ticket turns flat and moves to the top band while it is tucked away,
    // so it reappears in the intro already in place instead of crossing the copy.
    const turn = mobile ? smooth(travel, 0.05, 0.3) : scrollTurn;

    // How vertical the card is: starts vertical, turns flat in the intro, rises again, lands flat by the services.
    // Mobile skips the second vertical leg: the card is tucked away while it would happen (see `presence`).
    const upright = THREE.MathUtils.clamp(1 - turn + (mobile ? 0 : lift - land), 0, 1);

    // Mobile has no free column, so the card would cut through the copy while sections scroll.
    // Instead it spins away as a section starts moving and spins back into the empty top band
    // once the next section is pinned: hero → (away) → intro → (away) → services.
    const presence = mobile
      ? THREE.MathUtils.clamp(
          1 - smooth(travel, 0.05, 0.3) + smooth(scrollTurn, 0.35, 0.9) - smooth(lift, 0, 0.6) + smooth(land, 0.45, 1),
          0,
          1,
        )
      : 1;
    // Weight of each wavy journey (the second one fades out as the card lands).
    const firstLeg = 1 - turn;
    const secondLeg = lift * (1 - land);

    // Desktop: right half. Mobile: bottom while travelling, top once flat.
    const baseX = mobile ? 0 : vw * 0.24;
    const startY = mobile ? -vh * 0.3 : 0;
    const endY = mobile ? vh * 0.27 : 0;

    const amp = mobile ? vw * 0.18 : vw * 0.2;
    const flipWave = Math.sin(flip * Math.PI * 2);
    const x = baseX - amp * sway(travel) - amp * sway(fall) * (1 - land) - flipWave * vw * (mobile ? 0.02 : 0.04);
    const y =
      lerp(startY, endY, turn) +
      Math.sin(t * 1.1) * 0.06 +
      Math.sin(travel * Math.PI * 4) * vh * 0.03 +
      Math.sin(fall * Math.PI * 4) * vh * 0.03 * (1 - land) +
      Math.sin(flip * Math.PI) * vh * (mobile ? 0 : 0.05);

    // Sizes for each pose.
    const verticalScale = (vh * (mobile ? 0.3 : 0.62)) / TICKET_W;
    const ticketScale = Math.min((vw * (mobile ? 0.86 : 0.44)) / TICKET_W, (vh * 0.5) / TICKET_H);
    const voucherScale = Math.min((vw * (mobile ? 0.8 : 0.42)) / CARD_W, (vh * (mobile ? 0.36 : 0.56)) / CARD_H);
    const stackScale = Math.min((vw * (mobile ? 0.6 : 0.3)) / CARD_W, (vh * (mobile ? 0.24 : 0.42)) / CARD_H);
    let scale = lerp(verticalScale, ticketScale, turn);
    scale = lerp(scale, voucherScale, smooth(flip, 0.4, 0.8));
    scale = lerp(scale, verticalScale, mobile ? 0 : lift);
    scale = lerp(scale, stackScale, land);

    // Centre the fanned-out stack (layers step right and up).
    const spread = smooth(stack, 0, 1);
    const stackX = -SLOT.x * (DEPTH / 2) * scale * spread + (mobile ? 0 : vw * 0.02 * land);
    const stackY = -SLOT.y * (DEPTH / 2) * scale * spread;

    // Bank into the curves (derivative of the wave) and follow the pointer a little.
    const bank = -Math.cos(travel * Math.PI * 2) * 0.55 * firstLeg - Math.cos(fall * Math.PI * 2) * 0.55 * secondLeg;
    const rotZ = (Math.PI / 2) * upright + Math.sin(t * 0.8) * 0.02 * upright + flipWave * 0.12;
    const rotY = bank + pointer.current.x * 0.18 * (1 - spread * 0.5) + upright * Math.sin(t * 0.6) * 0.1 + (1 - presence) * 2.4;
    const rotX =
      -pointer.current.y * 0.12 + Math.sin(travel * Math.PI * 2) * 0.12 * firstLeg + Math.sin(fall * Math.PI * 2) * 0.12 * secondLeg;

    g.position.x = damp(g.position.x, x + stackX, 6, dt);
    g.position.y = damp(g.position.y, y + stackY, 6, dt);
    g.rotation.x = damp(g.rotation.x, rotX, 5, dt);
    g.rotation.y = damp(g.rotation.y, rotY, 5, dt);
    g.rotation.z = damp(g.rotation.z, rotZ, 6, dt);
    g.scale.setScalar(damp(g.scale.x, scale * presence, 6, dt));
    g.visible = g.scale.x > 0.002;

    // Bottom-to-top spin over the card's own horizontal axis.
    f.rotation.x = damp(f.rotation.x, -flip * FLIP_TURNS * Math.PI * 2, 5, dt);
    const swapped = -f.rotation.x > SWAP_ANGLE;
    if (ticket.current) ticket.current.visible = !swapped;
    if (voucherCard.current) voucherCard.current.visible = swapped;

    // Services stack: once fully open, the front card moves to the back every few seconds.
    // When it closes again the cycle runs on to the next full round so the voucher ends up in front.
    const c = cycle.current;
    if (stack > 0.98 && !reduced.current) {
      c.timer += dt;
      if (c.timer > CYCLE_EVERY) {
        c.timer = 0;
        c.target += 1;
      }
    } else {
      c.timer = 0;
      c.target = Math.ceil(c.target / STACK) * STACK;
    }
    c.phase = damp(c.phase, c.target, 2.4, dt);
    stackGroup.current?.children.forEach((slot, i) => {
      const rel = (((i - c.phase) % STACK) + STACK) % STACK;
      placeCard(slot, rel, spread);
      if (i > 0) slot.visible = stack > 0.001;
    });

    type Layer = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial> | undefined;
    const layer = g.getObjectByName(DETAILS_LAYER) as Layer;
    if (layer) layer.material.opacity = damp(layer.material.opacity, details, 8, dt);
    const stay = g.getObjectByName(VOUCHER_DETAILS_LAYER) as Layer;
    if (stay) stay.material.opacity = damp(stay.material.opacity, voucher, 8, dt);
  });

  return (
    <group ref={group}>
      <group ref={stackGroup}>
        <group>
          <group ref={flipper}>
            <Ticket3D ref={ticket} />
            <Card3D ref={voucherCard} textures={voucherTextures} detailsName={VOUCHER_DETAILS_LAYER} visible={false} />
          </group>
        </group>
        <group visible={false}>
          <Card3D textures={transportTextures} />
        </group>
        <group visible={false}>
          <Card3D textures={umrahTextures} />
        </group>
        <group visible={false}>
          {/* top-aligned with the taller cards so its edge shows in the layers */}
          <Ticket3D printed position-y={(CARD_H - TICKET_H) / 2} />
        </group>
        <group visible={false}>
          <Card3D textures={worldwideTextures} edge="#b08a45" />
        </group>
        <group visible={false}>
          <Card3D textures={visaTextures} edge="#d8bd84" />
        </group>
        <group visible={false}>
          <Card3D textures={religiousTextures} />
        </group>
      </group>
    </group>
  );
}

export default function TicketScene({ timeline, active }: { timeline: RefObject<TicketTimeline>; active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 10], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 6]} intensity={1.6} />
      <directionalLight position={[-6, -2, 4]} intensity={0.5} color="#7fb3e0" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 6]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#ecd9a8" position={[-6, 0, 3]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="ring" intensity={2} position={[6, -2, 4]} scale={3} />
      </Environment>
      <TicketRig timeline={timeline} />
    </Canvas>
  );
}
