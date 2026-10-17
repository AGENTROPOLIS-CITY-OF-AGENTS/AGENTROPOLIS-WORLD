/**
 * HumanActor — AGENTROPOLIS HUMAN FORGE (GROK-02) prototype actor for R3F.
 * Loads the identity-stable skinned GLB (MakeHuman CC0-derived, 163-joint rig, 59 face shapes)
 * with three distance LODs and drives facial morph targets.
 * Visual only: this actor's motion is SIMULATED and is never proof of agent execution.
 */
import { useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { Detailed, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { arkitToHF } from "./arkitMap";

// BASE_URL keeps paths valid under GitHub Pages sub-path deploys (AGENTROPOLIS-WORLD uses Pages).
const BASE = (import.meta.env?.BASE_URL ?? "/").replace(/\/?$/, "/");
export const HF_ACTOR_URLS = [
  `${BASE}models/hf-actor-lod0.glb`,
  `${BASE}models/hf-actor-lod1.glb`,
  `${BASE}models/hf-actor-lod2.glb`,
] as const;
export const HF_LOD_DISTANCES = [0, 7, 20];

export type HumanActorProps = ThreeElements["group"] & {
  /** "auto" = drei <Detailed> distance LOD; or force one tier */
  lod?: "auto" | 0 | 1 | 2;
  /** Direct HF morph weights, e.g. { JawDrop: 0.6 } */
  expression?: Record<string, number>;
  /** ARKit-52 weights, mapped via arkitMap (merged over `expression`) */
  arkit?: Record<string, number>;
  /** Procedural idle blink (disabled when prefers-reduced-motion) */
  blink?: boolean;
  /** Additive local Euler offsets (radians) per joint name, e.g. { "upperarm01.R": [0, 0, -1] } */
  bonePose?: Record<string, [number, number, number]>;
  /** Called once per LOD mesh with its morph dictionary (for tests/tools) */
  onMorphDictionary?: (lod: number, dict: Record<string, number>) => void;
};

function useActorScene(url: string) {
  const { scene } = useGLTF(url);
  // SkeletonUtils.clone keeps each instance's skeleton independent (crowds reuse the same GLB).
  return useMemo(() => {
    const cloned = skeletonClone(scene) as THREE.Group;
    cloned.traverse((object) => {
      const mesh = object as THREE.SkinnedMesh;
      if (mesh.isSkinnedMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
      }
    });
    return cloned;
  }, [scene]);
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function ActorLOD({
  url,
  tier,
  weights,
  blink,
  bonePose,
  onMorphDictionary,
}: {
  url: string;
  tier: number;
  weights: Record<string, number>;
  blink: boolean;
  bonePose?: HumanActorProps["bonePose"];
  onMorphDictionary?: HumanActorProps["onMorphDictionary"];
}) {
  const obj = useActorScene(url);
  // remember rest quaternions so additive pose offsets never accumulate
  const rest = useMemo(() => {
    const map = new Map<string, THREE.Quaternion>();
    obj.traverse((object) => {
      if ((object as THREE.Bone).isBone) map.set(object.name, object.quaternion.clone());
    });
    return map;
  }, [obj]);
  const bones = useMemo(() => {
    const map = new Map<string, THREE.Object3D>();
    obj.traverse((object) => {
      if ((object as THREE.Bone).isBone) map.set(object.name, object);
    });
    return map;
  }, [obj]);
  const meshes = useMemo(() => {
    const list: THREE.SkinnedMesh[] = [];
    obj.traverse((object) => {
      const mesh = object as THREE.SkinnedMesh;
      if (mesh.isSkinnedMesh && mesh.morphTargetDictionary) list.push(mesh);
    });
    if (list[0] && onMorphDictionary) onMorphDictionary(tier, list[0].morphTargetDictionary!);
    return list;
  }, [obj, tier, onMorphDictionary]);
  const t0 = useRef(Math.random() * 3);
  const noMotion = useMemo(reducedMotion, []);

  useFrame(({ clock }) => {
    if (bonePose) {
      for (const [name, [x, y, z]] of Object.entries(bonePose)) {
        // GLTFLoader sanitises node names ("upperarm01.R" -> "upperarm01R"), so accept either form.
        const key = THREE.PropertyBinding.sanitizeNodeName(name);
        const bone = bones.get(name) ?? bones.get(key);
        const restQuat = rest.get(name) ?? rest.get(key);
        if (!bone || !restQuat) continue;
        bone.quaternion.copy(restQuat).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)));
      }
    }
    let lid = 0;
    if (blink && !noMotion) {
      const phase = (clock.elapsedTime + t0.current) % 4.2;
      lid = phase < 0.15 ? Math.sin((phase / 0.15) * Math.PI) : 0;
    }
    for (const mesh of meshes) {
      const dict = mesh.morphTargetDictionary!;
      const influences = mesh.morphTargetInfluences!;
      influences.fill(0);
      for (const [key, weight] of Object.entries(weights)) {
        const index = dict[key];
        if (index !== undefined) influences[index] = weight;
      }
      if (lid > 0) {
        for (const key of ["LeftUpperLidClosed", "RightUpperLidClosed"]) {
          const index = dict[key];
          if (index !== undefined) influences[index] = Math.max(influences[index], lid);
        }
      }
    }
  });

  return <primitive object={obj} />;
}

export function HumanActor({
  lod = "auto",
  expression,
  arkit,
  blink = true,
  bonePose,
  onMorphDictionary,
  ...group
}: HumanActorProps) {
  const weights = useMemo(
    () => ({ ...(expression ?? {}), ...(arkit ? arkitToHF(arkit) : {}) }),
    [expression, arkit],
  );
  return (
    <group {...group} userData={{ actorId: "hf-actor-0001", label: "SIMULATED-ACTOR" }}>
      {lod === "auto" ? (
        <Detailed distances={HF_LOD_DISTANCES}>
          {HF_ACTOR_URLS.map((url, index) => (
            <ActorLOD
              key={url}
              url={url}
              tier={index}
              weights={weights}
              blink={blink}
              bonePose={bonePose}
              onMorphDictionary={onMorphDictionary}
            />
          ))}
        </Detailed>
      ) : (
        <ActorLOD
          url={HF_ACTOR_URLS[lod]}
          tier={lod}
          weights={weights}
          blink={blink}
          bonePose={bonePose}
          onMorphDictionary={onMorphDictionary}
        />
      )}
    </group>
  );
}

HF_ACTOR_URLS.forEach((url) => useGLTF.preload(url));
export default HumanActor;
