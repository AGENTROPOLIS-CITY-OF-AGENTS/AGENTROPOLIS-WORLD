import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";

/**
 * Mock-only office visualizer. The 3D scene never decides whether work happened.
 * This module intentionally has NO runtime adapter, network calls or mutations.
 * All timeline steps are fictional, labeled DEMO, and have no real receipts.
 */
export type OfficeAgent = {
  id: string;
  name: string;
  role: string;
  activity: "idle" | "moving" | "working" | "reviewing" | "blocked" | "complete";
  station: number;
  receipt: "NONE" | "SIMULATED";
};

type OfficeStep = {
  caption: string;
  agents: OfficeAgent[];
};

const baseAgents: OfficeAgent[] = [
  { id: "hermes", name: "HERMES", role: "DISPATCH / PM", activity: "idle", station: 0, receipt: "NONE" },
  { id: "grokbot", name: "GROKBOT", role: "ENGINEERING", activity: "idle", station: 1, receipt: "NONE" },
  { id: "verity", name: "VERITY", role: "EVIDENCE REVIEW", activity: "idle", station: 2, receipt: "NONE" },
  { id: "aegis", name: "AEGIS", role: "POLICY GATE", activity: "idle", station: 3, receipt: "NONE" },
];

function change(id: string, activity: OfficeAgent["activity"], station?: number, receipt?: OfficeAgent["receipt"]) {
  return { id, activity, station, receipt };
}
type Change = ReturnType<typeof change>;
function at(caption: string, changes: Change[]): OfficeStep {
  return {
    caption,
    agents: baseAgents.map((a) => {
      const c = changes.find((x) => x.id === a.id);
      return c ? { ...a, activity: c.activity, station: c.station ?? a.station, receipt: c.receipt ?? a.receipt } : a;
    }),
  };
}

export const OFFICE_DEMO: readonly OfficeStep[] = [
  at("MISSION QUEUED · DEMO", [change("hermes", "working")]),
  at("MANDATE REVIEW · DEMO", [change("hermes", "working"), change("aegis", "reviewing")]),
  at("ENGINEERING DISPATCH · DEMO", [change("hermes", "moving", 1), change("grokbot", "working")]),
  at("EVIDENCE REVIEW · DEMO", [change("grokbot", "reviewing", 2), change("verity", "reviewing")]),
  at("POLICY HOLD · DEMO", [change("aegis", "blocked"), change("verity", "reviewing")]),
  at("SIMULATED RECEIPT · NOT VERIFIED", [change("hermes", "complete", 0, "SIMULATED"), change("grokbot", "complete", 1, "SIMULATED"), change("verity", "complete", 2, "SIMULATED")]),
];

const stations: [number, number][] = [[-6, -3], [-2, 3], [3, 3], [7, -3]];
const stateColors: Record<OfficeAgent["activity"], string> = {
  idle: "#526471", moving: "#19e6e6", working: "#19e6e6", reviewing: "#b6ff4a",
  blocked: "#ff2a2a", complete: "#b6ff4a",
};
const shellMat = new THREE.MeshPhysicalMaterial({
  color: "#0b131b", metalness: 0.82, roughness: 0.2, clearcoat: 0.85, clearcoatRoughness: 0.12,
});
const floorMat = new THREE.MeshStandardMaterial({ color: "#070c13", metalness: 0.72, roughness: 0.26 });

function AgentShell({ agent, selected, onSelect }: { agent: OfficeAgent; selected: boolean; onSelect: (a: OfficeAgent) => void }) {
  const [x, z] = stations[agent.station];
  const signal = stateColors[agent.activity];
  const pick = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect(agent); };
  return (
    <group position={[x, 0, z]} onClick={pick}>
      <mesh position={[0, 0.13, 0]} receiveShadow>
        <cylinderGeometry args={[0.95, 0.95, 0.25, 48]} />
        <meshStandardMaterial color="#101d2a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.35, 1.05, 8, 18]} />
        <meshPhysicalMaterial color="#101820" emissive={signal} emissiveIntensity={selected ? 0.55 : 0.18} metalness={0.78} roughness={0.24} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 2.04, 0]}>
        <sphereGeometry args={[0.32, 20, 16]} />
        <meshPhysicalMaterial color="#121b2a" emissive={signal} emissiveIntensity={selected ? 0.65 : 0.25} metalness={0.6} roughness={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.28, 0]}>
        <torusGeometry args={[0.8, 0.035, 8, 48]} />
        <meshBasicMaterial color={signal} transparent opacity={selected ? 1 : 0.62} />
      </mesh>
      <mesh position={[0, 2.58, 0]}>
        <boxGeometry args={[0.82, 0.045, 0.11]} />
        <meshBasicMaterial color={signal} />
      </mesh>
    </group>
  );
}

export function HermesOffice({ step, selectedId, onSelect }: {
  step: number;
  selectedId: string | null;
  onSelect: (a: OfficeAgent) => void;
}) {
  const stage = OFFICE_DEMO[Math.max(0, Math.min(OFFICE_DEMO.length - 1, step))];
  const rails = useMemo(() => [
    new THREE.Vector3(-6, 0.045, -3), new THREE.Vector3(-2, 0.045, 3),
    new THREE.Vector3(3, 0.045, 3), new THREE.Vector3(7, 0.045, -3),
  ], []);
  return (
    <group>
      <ambientLight intensity={0.22} />
      <spotLight position={[-10, 16, 6]} angle={0.7} penumbra={0.8} intensity={90} color="#c6ffff" castShadow />
      <pointLight position={[8, 6, -4]} intensity={40} color="#ff2a2a" distance={30} />
      <mesh receiveShadow position={[0, -0.3, 0]}>
        <boxGeometry args={[23, 0.55, 15]} />
        <primitive object={floorMat} attach="material" />
      </mesh>
      {[-10, 10].map((x) => (
        <group key={x}>
          <mesh position={[x, 4, -2]} castShadow>
            <boxGeometry args={[0.9, 8, 14]} />
            <primitive object={shellMat} attach="material" />
          </mesh>
          <mesh position={[x * 0.99, 7.2, -2]}>
            <boxGeometry args={[0.15, 0.15, 14]} />
            <meshBasicMaterial color="#19e6e6" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 7.75, -2]}>
        <boxGeometry args={[21, 0.65, 14]} />
        <primitive object={shellMat} attach="material" />
      </mesh>
      <mesh position={[0, 2.9, -6.8]}>
        <boxGeometry args={[17, 5.2, 0.16]} />
        <meshPhysicalMaterial color="#051625" emissive="#073442" emissiveIntensity={0.3} metalness={0.75} roughness={0.1} transmission={0.1} />
      </mesh>
      <mesh position={[0, 5.6, -6.55]}>
        <boxGeometry args={[16, 0.09, 0.11]} />
        <meshBasicMaterial color="#19e6e6" />
      </mesh>
      {rails.slice(0, -1).map((p, i) => {
        const end = rails[i + 1];
        const middle = p.clone().add(end).multiplyScalar(0.5);
        const length = p.distanceTo(end);
        return (
          <mesh key={i} position={[middle.x, middle.y, middle.z]} rotation={[0, -Math.atan2(end.z - p.z, end.x - p.x), 0]}>
            <boxGeometry args={[length, 0.035, 0.035]} />
            <meshBasicMaterial color="#19e6e6" transparent opacity={0.45} />
          </mesh>
        );
      })}
      {stations.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1.05, -1.4]} castShadow>
            <boxGeometry args={[2.7, 0.2, 1.25]} />
            <primitive object={shellMat} attach="material" />
          </mesh>
          <mesh position={[0, 2.03, -1.68]} rotation={[-0.24, 0, 0]}>
            <boxGeometry args={[1.7, 0.94, 0.09]} />
            <meshStandardMaterial color="#092331" emissive={i === 3 && step === 4 ? "#ff2a2a" : "#19e6e6"} emissiveIntensity={0.38} metalness={0.4} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {stage.agents.map((agent) => (
        <AgentShell key={agent.id} agent={agent} selected={selectedId === agent.id} onSelect={onSelect} />
      ))}
    </group>
  );
}
