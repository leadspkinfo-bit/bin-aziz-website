import * as THREE from "three";

// Kaaba proportions (1 unit ≈ 2 m). Local axes before the 45° turn: +X face = north-east wall (door),
// −Z face = north-west wall (Hateem); the (+X,+Z) corner is the east corner (Black Stone),
// (−X,+Z) the south corner (Rukn Yamani) and (+X,−Z) the north corner (Bab al-Tawbah inside).
// After rotating the group by 45° the corners point N/E/S/W.
export const W = 6.2;
export const D = 5.8;
export const H = 6.4;
export const BASE = 0.45;
export const TURN = Math.PI / 4;
export const CLOTH_TOP = BASE + 0.5 * H;
export const BAND_Y = BASE + 0.78 * H;
export const WALL = 0.35;

/** The doorway in the north-east wall, raised above the mataf as on the real Kaaba. */
export const DOOR = { z: D / 2 - 1.35, width: 1.5, bottom: 2.12, top: 4.42 };

/** The room inside: floor level with the door sill, lined walls, a lower ceiling under the roof. */
export const ROOM = {
  x0: -W / 2 + WALL + 0.02,
  x1: W / 2 - WALL - 0.02,
  z0: -D / 2 + WALL + 0.02,
  z1: D / 2 - WALL - 0.02,
  floor: DOOR.bottom,
  ceiling: BASE + H - WALL - 0.02,
};

const UP = new THREE.Vector3(0, 1, 0);
export const toWorld = (v: THREE.Vector3) => v.clone().applyAxisAngle(UP, TURN);
export const localToWorld = (x: number, y: number, z: number) => toWorld(new THREE.Vector3(x, y, z));

export const gold = new THREE.MeshStandardMaterial({ color: "#d4af5f", metalness: 0.9, roughness: 0.28 });
export const cloth = new THREE.MeshStandardMaterial({ color: "#f4f1ea", roughness: 0.88, side: THREE.DoubleSide });
export const marbleWall = new THREE.MeshStandardMaterial({ color: "#f1ece2", roughness: 0.45 });
