"use client";

import { useEffect, useMemo, useState, type Ref } from "react";
import * as THREE from "three";
import { CARD_H, CARD_W, type CardTextures } from "./cardTextures";

const DEPTH = 0.03;
const BEVEL = 0.012;

function cardShape() {
  const w = CARD_W, h = CARD_H, r = 0.16;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
}

/** UVs 0–1 across the card. The back is mirrored in V because the card flips over its horizontal axis. */
function faceGeometry(shape: THREE.Shape, mirrorV: boolean) {
  const g = new THREE.ShapeGeometry(shape, 24);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const v = (pos.getY(i) + CARD_H / 2) / CARD_H;
    uv.setXY(i, (pos.getX(i) + CARD_W / 2) / CARD_W, mirrorV ? 1 - v : v);
  }
  uv.needsUpdate = true;
  return g;
}

type Props = {
  ref?: Ref<THREE.Group>;
  /** Cached texture factory from cardTextures.ts. */
  textures: () => Promise<CardTextures>;
  /** Name for the fading details layer (only cards with a separate details face). */
  detailsName?: string;
  edge?: string;
  visible?: boolean;
};

/** A key-card sized travel document: gold-edged body, printed front, ivory back. */
export function Card3D({ ref, textures, detailsName, edge = "#c9a35b", visible = true }: Props) {
  const [tex, setTex] = useState<CardTextures | null>(null);

  const geo = useMemo(() => {
    const shape = cardShape();
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
    textures().then((t) => alive && setTex(t));
    return () => {
      alive = false;
    };
  }, [textures]);

  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const faceZ = DEPTH / 2 + BEVEL + 0.002;

  return (
    <group ref={ref} visible={visible}>
      <mesh geometry={geo.body}>
        <meshStandardMaterial color={edge} metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh geometry={geo.front} position-z={faceZ}>
        <meshStandardMaterial key={tex ? "map" : "plain"} map={tex?.base ?? null} color={tex ? "#ffffff" : "#0a1128"} roughness={0.35} metalness={0.15} />
      </mesh>
      {tex?.details && (
        <mesh name={detailsName} geometry={geo.front} position-z={faceZ + 0.002}>
          <meshBasicMaterial map={tex.details} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      <mesh geometry={geo.back} position-z={-faceZ}>
        <meshStandardMaterial key={tex ? "map" : "plain"} map={tex?.back ?? null} color={tex ? "#ffffff" : "#f5efe3"} roughness={0.6} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
