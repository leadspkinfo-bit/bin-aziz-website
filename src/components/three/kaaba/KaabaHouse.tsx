"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo, type RefObject } from "react";
import * as THREE from "three";
import { BASE, D, DOOR, H, ROOM, W, WALL, gold } from "./kaabaGeometry";
import { ceilingTexture, doorLeafTexture, kiswaTexture, plaqueTexture, roomFloorTexture, roomWallTexture, sitaraTexture } from "./kaabaTextures";

export type DoorParts = { left: THREE.Group | null; right: THREE.Group | null; curtain: THREE.Group | null };

const ROOM_H = ROOM.ceiling - ROOM.floor;
// callback refs fill in the shared door parts (a ref object that arrives as a prop)
const setPart = (parts: DoorParts, key: keyof DoorParts, g: THREE.Group | null) => {
  parts[key] = g;
};
const DOOR_H = DOOR.top - DOOR.bottom;
const LEAF = DOOR.width / 2;

/** Rectangle (or a rectangle with a door-shaped notch cut from its bottom edge) as a flat shape. */
function wallShape(u0: number, u1: number, height: number, notch?: [number, number, number]) {
  const s = new THREE.Shape();
  s.moveTo(u0, 0);
  if (notch) {
    const [n0, n1, nh] = notch;
    s.lineTo(n0, 0);
    s.lineTo(n0, nh);
    s.lineTo(n1, nh);
    s.lineTo(n1, 0);
  }
  s.lineTo(u1, 0);
  s.lineTo(u1, height);
  s.lineTo(u0, height);
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

/** The four walls and roof under the Kiswa. The north-east wall has a real opening for the door. */
function Walls() {
  const { box, extruded, doorWall } = useMemo(() => {
    const box = kiswaTexture();
    const extruded = kiswaTexture();
    extruded.repeat.set(0.5, 0.5); // extrude UVs are in units, box UVs are 0…1
    const shape = new THREE.Shape();
    shape.moveTo(-D / 2, 0);
    shape.lineTo(D / 2, 0);
    shape.lineTo(D / 2, H);
    shape.lineTo(-D / 2, H);
    shape.closePath();
    const hole = new THREE.Path();
    // shape u maps to −z once the mesh is turned 90°, so the hole is mirrored here
    const u0 = -(DOOR.z + DOOR.width / 2);
    const u1 = -(DOOR.z - DOOR.width / 2);
    hole.moveTo(u0, DOOR.bottom - BASE);
    hole.lineTo(u0, DOOR.top - BASE);
    hole.lineTo(u1, DOOR.top - BASE);
    hole.lineTo(u1, DOOR.bottom - BASE);
    hole.closePath();
    shape.holes.push(hole);
    const doorWall = new THREE.ExtrudeGeometry(shape, { depth: WALL, bevelEnabled: false });
    return { box, extruded, doorWall };
  }, []);
  const kiswa = (map: THREE.Texture) => <meshPhysicalMaterial map={map} color="#ffffff" roughness={0.55} sheen={0.6} sheenColor="#555555" />;

  return (
    <group>
      <mesh geometry={doorWall} position={[W / 2 - WALL, BASE, 0]} rotation-y={Math.PI / 2}>
        {kiswa(extruded)}
      </mesh>
      <mesh position={[-W / 2 + WALL / 2, BASE + H / 2, 0]}>
        <boxGeometry args={[WALL, H, D]} />
        {kiswa(box)}
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, BASE + H / 2, side * (D / 2 - WALL / 2)]}>
          <boxGeometry args={[W - 2 * WALL, H, WALL]} />
          {kiswa(box)}
        </mesh>
      ))}
      <mesh position={[0, BASE + H - WALL / 2, 0]}>
        <boxGeometry args={[W, WALL, D]} />
        {kiswa(box)}
      </mesh>
    </group>
  );
}

/**
 * The golden door: a gold frame, two leaves that each turn on their own hinge (a group placed on
 * the hinge line, so rotating the group swings the leaf), and the embroidered curtain in front,
 * pinned at the top so it can be drawn up.
 */
function Door({
  parts,
  onOver,
  onOut,
  onOpen,
}: {
  parts: RefObject<DoorParts>;
  onOver: () => void;
  onOut: () => void;
  onOpen: () => void;
}) {
  const tex = useMemo(() => ({ leaf: doorLeafTexture(), sitara: sitaraTexture() }), []);
  const leafMaterial = useMemo(() => new THREE.MeshStandardMaterial({ map: tex.leaf, metalness: 0.85, roughness: 0.3 }), [tex.leaf]);
  const events = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      onOver();
    },
    onPointerOut: () => onOut(),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onOpen();
    },
  };
  const outer = W / 2;

  return (
    <group {...events}>
      {/* frame */}
      <mesh position={[outer + 0.03, DOOR.top + 0.07, DOOR.z]} material={gold}>
        <boxGeometry args={[0.12, 0.14, DOOR.width + 0.28]} />
      </mesh>
      <mesh position={[outer + 0.03, DOOR.bottom - 0.05, DOOR.z]} material={gold}>
        <boxGeometry args={[0.16, 0.1, DOOR.width + 0.28]} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[outer + 0.03, DOOR.bottom + DOOR_H / 2, DOOR.z + side * (DOOR.width / 2 + 0.07)]} material={gold}>
          <boxGeometry args={[0.12, DOOR_H + 0.1, 0.14]} />
        </mesh>
      ))}
      {/* leaves: hinged on the outer edges, opening inwards */}
      <group
        ref={(g) => {
          setPart(parts.current, "left", g);
        }}
        position={[outer - 0.06, DOOR.bottom, DOOR.z + DOOR.width / 2]}
      >
        <mesh position={[0, DOOR_H / 2, -LEAF / 2]} material={leafMaterial}>
          <boxGeometry args={[0.06, DOOR_H - 0.02, LEAF - 0.01]} />
        </mesh>
      </group>
      <group
        ref={(g) => {
          setPart(parts.current, "right", g);
        }}
        position={[outer - 0.06, DOOR.bottom, DOOR.z - DOOR.width / 2]}
      >
        <mesh position={[0, DOOR_H / 2, LEAF / 2]} material={leafMaterial}>
          <boxGeometry args={[0.06, DOOR_H - 0.02, LEAF - 0.01]} />
        </mesh>
      </group>
      {/* curtain, pinned along its top edge */}
      <group
        ref={(g) => {
          setPart(parts.current, "curtain", g);
        }}
        position={[outer + 0.12, DOOR.top + 0.3, DOOR.z]}
      >
        <mesh position-y={-(DOOR_H + 0.55) / 2} rotation-y={Math.PI / 2}>
          <planeGeometry args={[DOOR.width + 0.4, DOOR_H + 0.55]} />
          <meshStandardMaterial map={tex.sitara} metalness={0.4} roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

const wood = new THREE.MeshStandardMaterial({ color: "#3b2617", roughness: 0.55 });
const iron = new THREE.MeshStandardMaterial({ color: "#5c5f66", metalness: 0.8, roughness: 0.4 });
const silver = new THREE.MeshStandardMaterial({ color: "#dfe3ea", metalness: 1, roughness: 0.25 });
const glow = new THREE.MeshStandardMaterial({ color: "#ffe9b8", emissive: "#ffcf7a", emissiveIntensity: 0.9, toneMapped: false });

export const PILLAR_Z = -0.45;
export const PILLARS = [-1.75, 0, 1.75];
const BEAM_Y = ROOM.ceiling - 0.55;
const LAMPS: { x: number; drop: number; kind: "lantern" | "globe" | "censer" }[] = [
  { x: -2.3, drop: 0.7, kind: "globe" },
  { x: -1.2, drop: 0.95, kind: "lantern" },
  { x: -0.55, drop: 0.6, kind: "censer" },
  { x: 0.55, drop: 0.85, kind: "lantern" },
  { x: 1.2, drop: 0.65, kind: "globe" },
  { x: 2.3, drop: 0.9, kind: "censer" },
];

function Lamp({ kind }: { kind: (typeof LAMPS)[number]["kind"] }) {
  if (kind === "globe")
    return (
      <group>
        <mesh material={silver} position-y={0.12}>
          <coneGeometry args={[0.08, 0.1, 12]} />
        </mesh>
        <mesh material={glow}>
          <sphereGeometry args={[0.11, 20, 16]} />
        </mesh>
        <mesh material={silver} position-y={-0.1}>
          <sphereGeometry args={[0.13, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>
      </group>
    );
  if (kind === "censer")
    return (
      <group>
        {[0, 1, 2].map((i) => {
          const a = (i * Math.PI * 2) / 3;
          return (
            <mesh key={i} material={gold} position={[Math.cos(a) * 0.06, 0.12, Math.sin(a) * 0.06]} rotation={[Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]}>
              <cylinderGeometry args={[0.006, 0.006, 0.3, 4]} />
            </mesh>
          );
        })}
        <mesh material={gold}>
          <sphereGeometry args={[0.14, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        </mesh>
        <mesh material={gold} position-y={0.02}>
          <torusGeometry args={[0.14, 0.012, 6, 24]} />
        </mesh>
      </group>
    );
  return (
    <group>
      <mesh material={gold} position-y={0.16}>
        <coneGeometry args={[0.12, 0.12, 6]} />
      </mesh>
      <mesh material={glow}>
        <cylinderGeometry args={[0.1, 0.085, 0.22, 6]} />
      </mesh>
      <mesh material={gold} position-y={-0.15} rotation-x={Math.PI}>
        <coneGeometry args={[0.09, 0.09, 6]} />
      </mesh>
    </group>
  );
}

/** Small gold door in the north corner, Bab al-Tawbah, leading up to the roof. */
function BabAlTawbah({ leaf }: { leaf: THREE.Material }) {
  return (
    <group position={[ROOM.x1 - 0.7, ROOM.floor, ROOM.z0 + 0.012]}>
      <mesh position={[0, 0.95, 0.02]} material={gold}>
        <boxGeometry args={[0.82, 1.9, 0.04]} />
      </mesh>
      <mesh position={[0, 0.92, 0.045]} material={leaf}>
        <boxGeometry args={[0.66, 1.72, 0.02]} />
      </mesh>
    </group>
  );
}

/** The room inside the Kaaba. Lit softly; only seen through the open door or from inside. */
function Room() {
  const tex = useMemo(() => ({ wall: roomWallTexture(ROOM_H), floor: roomFloorTexture(), ceiling: ceilingTexture(), plaque: plaqueTexture(), leaf: doorLeafTexture() }), []);
  const mats = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({ map: tex.wall, roughness: 0.7 }),
      leaf: new THREE.MeshStandardMaterial({ map: tex.leaf, metalness: 0.85, roughness: 0.3 }),
      plaque: new THREE.MeshStandardMaterial({ map: tex.plaque, roughness: 0.4 }),
    }),
    [tex],
  );
  const walls = useMemo(
    () => ({
      door: wallShape(ROOM.z0, ROOM.z1, ROOM_H, [DOOR.z - DOOR.width / 2, DOOR.z + DOOR.width / 2, DOOR_H]),
      back: wallShape(-ROOM.z1, -ROOM.z0, ROOM_H),
      south: wallShape(-ROOM.x1, -ROOM.x0, ROOM_H),
      north: wallShape(ROOM.x0, ROOM.x1, ROOM_H),
    }),
    [],
  );
  const pillarTop = ROOM.ceiling - 0.25;
  const plaques: { at: [number, number, number]; ry: number }[] = [
    { at: [-1.6, ROOM.floor + 0.55, ROOM.z1 - 0.01], ry: Math.PI },
    { at: [0, ROOM.floor + 0.55, ROOM.z1 - 0.01], ry: Math.PI },
    { at: [1.6, ROOM.floor + 0.55, ROOM.z1 - 0.01], ry: Math.PI },
    { at: [ROOM.x0 + 0.01, ROOM.floor + 0.55, -1.3], ry: Math.PI / 2 },
    { at: [ROOM.x0 + 0.01, ROOM.floor + 0.55, 1.3], ry: Math.PI / 2 },
    { at: [-1.2, ROOM.floor + 0.55, ROOM.z0 + 0.01], ry: 0 },
  ];

  return (
    <group>
      {/* lined walls: the door wall faces −X, the others face into the room */}
      <mesh geometry={walls.door} material={mats.wall} position={[ROOM.x1, ROOM.floor, 0]} rotation-y={-Math.PI / 2} />
      <mesh geometry={walls.back} material={mats.wall} position={[ROOM.x0, ROOM.floor, 0]} rotation-y={Math.PI / 2} />
      <mesh geometry={walls.south} material={mats.wall} position={[0, ROOM.floor, ROOM.z1]} rotation-y={Math.PI} />
      <mesh geometry={walls.north} material={mats.wall} position={[0, ROOM.floor, ROOM.z0]} />
      {/* floor and ceiling */}
      <mesh position={[0, ROOM.floor + 0.004, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[ROOM.x1 - ROOM.x0, ROOM.z1 - ROOM.z0]} />
        <meshStandardMaterial map={tex.floor} roughness={0.2} />
      </mesh>
      <mesh position={[0, ROOM.ceiling, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[ROOM.x1 - ROOM.x0, ROOM.z1 - ROOM.z0]} />
        <meshStandardMaterial map={tex.ceiling} roughness={0.8} />
      </mesh>
      {[-1.6, 0, 1.6].map((z) => (
        <mesh key={z} position={[0, ROOM.ceiling - 0.08, z]} material={wood}>
          <boxGeometry args={[ROOM.x1 - ROOM.x0, 0.16, 0.18]} />
        </mesh>
      ))}

      {/* three wooden pillars on carved square bases */}
      {PILLARS.map((x) => (
        <group key={x} position={[x, ROOM.floor, PILLAR_Z]}>
          <mesh position-y={0.17} material={wood}>
            <boxGeometry args={[0.42, 0.34, 0.42]} />
          </mesh>
          <mesh position-y={0.35} material={gold}>
            <boxGeometry args={[0.44, 0.03, 0.44]} />
          </mesh>
          <mesh position-y={(0.36 + (pillarTop - ROOM.floor)) / 2} material={wood}>
            <cylinderGeometry args={[0.12, 0.13, pillarTop - ROOM.floor - 0.36, 20]} />
          </mesh>
          {[1.1, 2.4].map((y) => (
            <mesh key={y} position-y={y} material={gold}>
              <torusGeometry args={[0.125, 0.012, 6, 24]} />
            </mesh>
          ))}
          <mesh position-y={pillarTop - ROOM.floor + 0.12} material={wood}>
            <boxGeometry args={[0.36, 0.24, 0.36]} />
          </mesh>
        </group>
      ))}
      {/* the metal beam between the pillars, and the lamps hung from it */}
      <mesh position={[0, BEAM_Y, PILLAR_Z]} material={iron}>
        <boxGeometry args={[ROOM.x1 - ROOM.x0 - 0.2, 0.05, 0.05]} />
      </mesh>
      {LAMPS.map((l) => (
        <group key={l.x} position={[l.x, BEAM_Y, PILLAR_Z]}>
          <mesh position-y={-l.drop / 2} material={iron}>
            <cylinderGeometry args={[0.006, 0.006, l.drop, 4]} />
          </mesh>
          <group position-y={-l.drop - 0.12}>
            <Lamp kind={l.kind} />
          </group>
        </group>
      ))}

      <BabAlTawbah leaf={mats.leaf} />
      {plaques.map((p, i) => (
        <mesh key={i} position={p.at} rotation-y={p.ry} material={mats.plaque}>
          <planeGeometry args={[0.5, 0.36]} />
        </mesh>
      ))}

      <pointLight position={[0, ROOM.ceiling - 1.1, 0]} intensity={9} distance={7} color="#ffe2b0" />
      <pointLight position={[1.6, ROOM.floor + 1.4, 1.2]} intensity={3} distance={5} color="#fff1d6" />
    </group>
  );
}

/** The Kaaba's walls, its working door and the room behind it. Rendered inside the turned Kaaba group. */
export function KaabaHouse(props: { parts: RefObject<DoorParts>; onOver: () => void; onOut: () => void; onOpen: () => void }) {
  return (
    <group>
      <Walls />
      <Door {...props} />
      <Room />
    </group>
  );
}
