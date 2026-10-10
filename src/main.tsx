import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { Environment, Grid, OrbitControls } from "@react-three/drei";
import "./styles.css";
import { HermesOffice, OFFICE_DEMO, type OfficeAgent } from "./hermes-office";

type Parcel = { x: number; z: number; width: number; depth: number };
type Massing = { buildingCount: number; minHeight: number; maxHeight: number; landmark: boolean };
type District = {
  id: string;
  name: string;
  purpose?: string;
  buildingRepresents?: string;
  interior?: string[];
  operatorAgent?: string;
  maintenanceLoop?: string;
  density: number;
  greenSpace: number;
  activity: number;
  parcel: Parcel;
  massing: Massing;
};
type WorldManifest = {
  world: string;
  version: number;
  worldStateAuthority: string;
  fabricationAuthority: string;
  rendererRole: string;
  districts: District[];
};
type ViewMode = "city" | "district" | "diorama" | "mission";

function seededUnit(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function DistrictMesh({ district, focused }: { district: District; focused: boolean }) {
  const buildings = useMemo(() => {
    const { parcel, massing } = district;
    const cols = Math.max(2, Math.ceil(Math.sqrt(massing.buildingCount)));
    const rows = Math.ceil(massing.buildingCount / cols);
    const cellW = parcel.width / cols;
    const cellD = parcel.depth / rows;
    return Array.from({ length: massing.buildingCount }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const rx = seededUnit(i + district.id.length * 17);
      const rz = seededUnit(i + district.id.length * 29);
      const rh = seededUnit(i + district.id.length * 43);
      const x = parcel.x - parcel.width / 2 + cellW * (col + 0.5) + (rx - 0.5) * cellW * 0.35;
      const z = parcel.z - parcel.depth / 2 + cellD * (row + 0.5) + (rz - 0.5) * cellD * 0.35;
      const h = massing.minHeight + (massing.maxHeight - massing.minHeight) * rh;
      const width = Math.max(0.7, cellW * 0.55);
      const depth = Math.max(0.7, cellD * 0.55);
      return { x, z, h, width, depth };
    });
  }, [district]);

  return (
    <group>
      <mesh position={[district.parcel.x, 0.02, district.parcel.z]} receiveShadow>
        <boxGeometry args={[district.parcel.width, 0.04, district.parcel.depth]} />
        <meshStandardMaterial
          color={district.greenSpace > 0.7 ? "#07140d" : "#071018"}
          emissive={focused ? "#00e5ff" : "#001018"}
          emissiveIntensity={focused ? 0.18 : 0.04}
          roughness={0.9}
        />
      </mesh>

      {buildings.map((b, i) => (
        <mesh key={`${district.id}-${i}`} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.width, b.h, b.depth]} />
          <meshStandardMaterial
            color={focused ? "#142033" : "#0b1220"}
            emissive={focused || (district.massing.landmark && i === 0) ? "#00e5ff" : "#00121a"}
            emissiveIntensity={focused ? 0.55 : district.massing.landmark && i === 0 ? 0.35 : 0.08}
            metalness={0.72}
            roughness={0.28}
          />
        </mesh>
      ))}
    </group>
  );
}

function WorldScene({ manifest, selectedId, mode, officeOpen, officeStep, selectedAgentId, onAgentSelect }: { manifest: WorldManifest; selectedId: string | null; mode: ViewMode; officeOpen: boolean; officeStep: number; selectedAgentId: string | null; onAgentSelect: (agent: OfficeAgent) => void }) {
  const selected = manifest.districts.find((d) => d.id === selectedId) ?? null;
  const target: [number, number, number] = officeOpen ? [0, 1, 0] : selected ? [selected.parcel.x, 4, selected.parcel.z] : [0, 5, 5];

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[18, 26, 12]} intensity={2.4} castShadow />
      <pointLight position={[0, 18, 0]} intensity={55} color="#00e5ff" distance={42} />

      {officeOpen ? (
        <HermesOffice step={officeStep} selectedId={selectedAgentId} onSelect={onAgentSelect} />
      ) : (
        <group>
          {manifest.districts.map((district) => {
            const focused = selected?.id === district.id;
            const hiddenByLens = mode === "diorama" && selected && !focused;
            return hiddenByLens ? null : <DistrictMesh key={district.id} district={district} focused={focused} />;
          })}
        </group>
      )}

      {!officeOpen ? <Grid
        args={[120, 120]}
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.28}
        cellColor="#102a32"
        sectionSize={10}
        sectionThickness={0.8}
        sectionColor="#00e5ff"
        fadeDistance={75}
        infiniteGrid
      /> : null}
      <Environment preset="night" />
      <OrbitControls
        makeDefault
        minDistance={officeOpen ? 9 : mode === "diorama" ? 6 : 12}
        maxDistance={officeOpen ? 32 : mode === "diorama" ? 30 : 95}
        maxPolarAngle={Math.PI / 2.04}
        target={target}
      />
    </>
  );
}

function App() {
  // Explicit URL opt-in enables a LOCAL/STATIC DEMO only, never any privileged runtime.
  const demoOptIn = new URLSearchParams(window.location.search).get("office") === "demo";
  const [manifest, setManifest] = useState<WorldManifest | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(demoOptIn ? "hermes-city" : "repository");
  const [mode, setMode] = useState<ViewMode>("city");
  const [officeOpen, setOfficeOpen] = useState(demoOptIn);
  const [officeStep, setOfficeStep] = useState(0);
  const [inspectedAgent, setInspectedAgent] = useState<OfficeAgent | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}world.manifest.json`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`world manifest ${r.status}`);
        return r.json();
      })
      .then(setManifest)
      .catch((error) => console.error("AGENTROPOLIS world manifest unavailable", error));
  }, []);

  const selected = manifest?.districts.find((d) => d.id === selectedId) ?? null;

  return (
    <main className="app-shell">
      <header className="hud">
        <div>
          <span className="eyebrow">AGENTROPOLIS CITY OF AGENTS</span>
          <h1>WORLD</h1>
          <p>Manifest-driven spatial plane · CREATOR / Construction compiled · renderer surface only</p>
        </div>
        <div className="status">{officeOpen ? "HERMES OFFICE · DEMO · NOT LIVE" : "SPATIAL RUNTIME V1 · MANIFEST DRIVEN"}</div>
      </header>

      <section className="viewport">
        {manifest ? (
          <Canvas key={officeOpen ? "hermes-office" : "world-city"} shadows camera={{ position: officeOpen ? [18, 14, 20] : [36, 30, 44], fov: 42 }}>
            <color attach="background" args={["#020306"]} />
            <fog attach="fog" args={["#020306", officeOpen ? 20 : 34, officeOpen ? 75 : 110]} />
            <WorldScene manifest={manifest} selectedId={selectedId} mode={mode} officeOpen={officeOpen} officeStep={officeStep} selectedAgentId={inspectedAgent?.id ?? null} onAgentSelect={setInspectedAgent} />
          </Canvas>
        ) : (
          <div className="loading">RESOLVING WORLD STATE…</div>
        )}

        <aside className="world-controls">
          <div className="mode-row">
            {(["city", "district", "diorama", "mission"] as ViewMode[]).map((item) => (
              <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>
                {item}
              </button>
            ))}
          </div>
          <label>
            DISTRICT
            <select value={selectedId ?? ""} onChange={(e) => { setSelectedId(e.target.value || null); setOfficeOpen(false); setInspectedAgent(null); }}>
              {manifest?.districts.map((district) => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </label>
          {selectedId === "hermes-city" ? (
            <div className="office-entry">
              {officeOpen ? (
                <>
                  <button type="button" onClick={() => { setOfficeOpen(false); setInspectedAgent(null); }}>BACK TO CITY</button>
                  <label htmlFor="office-seek">DEMO REPLAY · STEP {officeStep + 1}/{OFFICE_DEMO.length}</label>
                  <input id="office-seek" aria-label="Scrub fictional office activity" type="range" min={0} max={OFFICE_DEMO.length - 1} value={officeStep} onChange={(e) => { setOfficeStep(Number(e.target.value)); setInspectedAgent(null); }} />
                  <strong>{OFFICE_DEMO[officeStep].caption}</strong>
                  <small>Fictional sequence. No real agents, approvals, runs, or verified receipts.</small>
                  {inspectedAgent ? (
                    <div className="office-inspector">
                      <b>{inspectedAgent.name} · {inspectedAgent.role}</b>
                      <span>Activity: {OFFICE_DEMO[officeStep].agents.find((a) => a.id === inspectedAgent.id)?.activity ?? "UNKNOWN"}</span>
                      <span>Receipt: SIMULATED / NOT VERIFIED</span>
                    </div>
                  ) : <span>Select an agent in the 3D office to inspect its DEMO state.</span>}
                </>
              ) : demoOptIn ? (
                <button type="button" onClick={() => setOfficeOpen(true)}>ENTER HERMES OFFICE · DEMO</button>
              ) : (
                <small>Office feature is OFF. Preview explicitly using <code>?office=demo</code>.</small>
              )}
            </div>
          ) : null}
          <div className="doctrine">
<b>{officeOpen ? "HERMES OFFICE / NKTYO 2090 VISUAL DESIGN" : selected?.name ?? "CITY"}</b>
            {selected?.purpose ? <span className="purpose">{selected.purpose}</span> : null}
            {selected?.operatorAgent ? (
              <div className="agent-status">
                <span className="status-dot" />
                <span>{selected.operatorAgent}</span>
                <small>CONTRACT REGISTERED · LIVE STATUS UNVERIFIED</small>
              </div>
            ) : null}
            {selected?.maintenanceLoop ? <span>Maintenance loop: {selected.maintenanceLoop}</span> : null}
            {selected?.buildingRepresents ? <span>Buildings represent {selected.buildingRepresents}.</span> : null}
            {selected?.interior?.length ? (
              <ul className="interior-list">
                {selected.interior.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
            <span>Ontology defines what exists.</span>
            <span>CREATOR / Construction compiles spatial form.</span>
            <span>Renderer displays; it does not own truth.</span>
            <span>Diorama is a lens over canonical world state.</span>
          </div>
        </aside>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
