/**
 * Opt-in staging scene for the HUMAN FORGE actor.
 * Blink, expression presets, and bone offsets here are SIMULATED.
 * They do not represent real agent execution.
 */
import { Suspense, useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import type { PerspectiveCamera } from "three";
import { HumanActor } from "./HumanActor";
import { POSE_TEST, type ActorSceneProps, type ActorView } from "./previewPresets";

const SHOTS: Record<ActorView, { position: [number, number, number]; fov: number; target: [number, number, number] }> = {
  hero: { position: [0.9, 1.35, 3.0], fov: 35, target: [0, 0.95, 0] },
  face: { position: [0, 1.56, 0.62], fov: 30, target: [0, 1.55, 0] },
  lods: { position: [0, 1.1, 5.2], fov: 35, target: [0, 0.95, 0] },
};

function FrameActorCamera({ view }: { view: ActorView }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const shot = SHOTS[view];
  const target = useRef(shot.target);
  target.current = shot.target;
  useLayoutEffect(() => {
    camera.position.set(...shot.position);
    camera.fov = shot.fov;
    camera.near = 0.05;
    camera.far = 100;
    camera.updateProjectionMatrix();
    camera.lookAt(...target.current);
  }, [camera, shot.position, shot.fov, shot.target]);
  return null;
}

function StageLights() {
  return (
    <>
      <hemisphereLight args={["#c9d3de", "#0B0F14", 0.35]} />
      <directionalLight position={[2.5, 4, 3]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
      <directionalLight position={[-3, 2.5, -2]} intensity={0.6} color="#aab6c4" />
    </>
  );
}

export function ActorScene({ view, expression, poseTest, blink, lod, onMorphDictionary }: ActorSceneProps) {
  const shot = SHOTS[view];
  const bonePose = poseTest ? POSE_TEST : undefined;
  const actorLod = view === "face" ? 0 : lod;
  return (
    <>
      <FrameActorCamera view={view} />
      <StageLights />
      <Suspense fallback={null}>
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2} color="#dfe6ee" position={[3, 3, 4]} scale={[4, 3, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#8f9cab" position={[-4, 2, -3]} scale={[4, 4, 1]} />
          <Lightformer form="ring" intensity={0.4} color="#ffffff" position={[0, 6, 0]} scale={3} />
        </Environment>
        {view === "lods" ? (
          <>
            <HumanActor lod={0} position={[-1.1, 0, 0]} expression={expression} blink={blink} bonePose={bonePose} onMorphDictionary={onMorphDictionary} />
            <HumanActor lod={1} position={[0, 0, 0]} expression={expression} blink={blink} bonePose={bonePose} onMorphDictionary={onMorphDictionary} />
            <HumanActor lod={2} position={[1.1, 0, 0]} expression={expression} blink={blink} bonePose={bonePose} onMorphDictionary={onMorphDictionary} />
          </>
        ) : (
          <HumanActor
            lod={actorLod}
            expression={expression}
            blink={blink}
            bonePose={bonePose}
            onMorphDictionary={onMorphDictionary}
          />
        )}
        <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={8} blur={2.4} far={2} />
      </Suspense>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color="#0B0F14" roughness={0.9} />
      </mesh>
      <OrbitControls key={view} makeDefault target={shot.target} enableDamping minDistance={0.35} maxDistance={8} maxPolarAngle={Math.PI / 2.02} />
    </>
  );
}
