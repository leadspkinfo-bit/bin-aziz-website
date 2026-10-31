"use client";

import { useEffect, useMemo, useState, type Ref } from "react";
import * as THREE from "three";
import { createTicketTextures, STUB_RATIO } from "./ticketTextures";

export const TICKET_W = 3.4;
export const TICKET_H = 1.5;
const DEPTH = 0.035;
const BEVEL = 0.012;

function ticketShape() {
  const w = TICKET_W, h = TICKET_H, r = 0.14, n = 0.13;
  const sx = -w / 2 + w * STUB_RATIO;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(sx - n, -h / 2);
  s.absarc(sx, -h / 2, n, Math.PI, 0, true);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(sx + n, h / 2);
  s.absarc(sx, h / 2, n, 0, -Math.PI, true);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/** Flat face geometry with UVs normalised to 0–1 across the ticket. The back is mirrored in V because the ticket flips over its horizontal axis. */
function faceGeometry(shape: THREE.Shape, mirrorV: boolean) {
  const g = new THREE.ShapeGeometry(shape, 24);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const v = (pos.getY(i) + TICKET_H / 2) / TICKET_H;
    uv.setXY(i, (pos.getX(i) + TICKET_W / 2) / TICKET_W, mirrorV ? 1 - v : v);
  }
  uv.needsUpdate = true;
  return g;
}

/** Name of the mesh carrying the printed details; the rig fades its material's opacity. */
export const DETAILS_LAYER = "ticket-details";

/** `printed` shows the details from the start (the copy in the services stack). */
export function Ticket3D({ ref, printed = false, ...group }: { ref?: Ref<THREE.Group>; printed?: boolean; "position-y"?: number }) {
  const [tex, setTex] = useState<Awaited<ReturnType<typeof createTicketTextures>> | null>(null);

  const geo = useMemo(() => {
    const shape = ticketShape();
    const body = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 3,
      curveSegments: 24,
    });
    body.translate(0, 0, -DEPTH / 2);
    return { body, front: faceGeometry(shape, false), back: faceGeometry(shape, true) };
  }, []);

  // Textures are shared and cached for the page's lifetime, so they're not disposed here.
  useEffect(() => {
    let alive = true;
    createTicketTextures().then((t) => alive && setTex(t));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const faceZ = DEPTH / 2 + BEVEL + 0.002;

  return (
    <group ref={ref} {...group}>
      <mesh geometry={geo.body} castShadow>
        <meshStandardMaterial color="#c9a35b" metalness={0.75} roughness={0.3} />
      </mesh>
      {/* keyed so the materials recompile with a map once the canvases are drawn */}
      <mesh geometry={geo.front} position-z={faceZ}>
        <meshStandardMaterial key={tex ? "map" : "plain"} map={tex?.base ?? null} color={tex ? "#ffffff" : "#0a1128"} roughness={0.45} metalness={0.1} />
      </mesh>
      {tex && (
        <mesh name={printed ? undefined : DETAILS_LAYER} geometry={geo.front} position-z={faceZ + 0.002}>
          <meshBasicMaterial map={tex.details} transparent opacity={printed ? 1 : 0} toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      <mesh geometry={geo.back} position-z={-faceZ}>
        <meshStandardMaterial key={tex ? "map" : "plain"} map={tex?.back ?? null} color={tex ? "#ffffff" : "#f5efe3"} roughness={0.6} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
