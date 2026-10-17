import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType } from "react";
import ReactDOM from "react-dom/client";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Grid, OrbitControls } from "@react-three/drei";
import type { PerspectiveCamera } from "three";
import {
  ACTOR_PRESETS,
  readActorLaunch,
  type ActorLod,
  type ActorSceneProps,
  type ActorView,
} from "./components/actors/previewPresets";
import "./styles.css";

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

function FrameCityCamera({ target }: { target: [number, number, number] }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const initialTarget = useRef(target);
  useLayoutEffect(() => {
    camera.position.set(36, 30, 44);
    camera.fov = 42;
    camera.near = 0.1;
    camera.far = 2000;
    camera.updateProjectionMatrix();
    const [x, y, z] = initialTarget.current;
    camera.lookAt(x, y, z);
  }, [camera]);
  return null;
}

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

function WorldScene({ manifest, selectedId, mode }: { manifest: WorldManifest; selectedId: string | null; mode: ViewMode }) {
  const selected = manifest.districts.find((d) => d.id === selectedId) ?? null;
  const target: [number, number, number] = selected ? [selected.parcel.x, 4, selected.parcel.z] : [0, 5, 5];

  return (
    <>
      <FrameCityCamera target={target} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[18, 26, 12]} intensity={2.4} castShadow />
      <pointLight position={[0, 18, 0]} intensity={55} color="#00e5ff" distance={42} />

      <group>
        {manifest.districts.map((district) => {
          const focused = selected?.id === district.id;
          const hiddenByLens = mode === "diorama" && selected && !focused;
          return hiddenByLens ? null : <DistrictMesh key={district.id} district={district} focused={focused} />;
        })}
      </group>

      <Grid
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
      />
      <Environment preset="night" />
      <OrbitControls
        makeDefault
        minDistance={mode === "diorama" ? 6 : 12}
        maxDistance={mode === "diorama" ? 30 : 95}
        maxPolarAngle={Math.PI / 2.04}
        target={target}
      />
    </>
  );
}

function App() {
  const launch = useMemo(readActorLaunch, []);
  const [manifest, setManifest] = useState<WorldManifest | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>("repository");
  const [mode, setMode] = useState<ViewMode>("city");
  const [actorPreview, setActorPreview] = useState(launch.preview);
  const [actorView, setActorView] = useState<ActorView>(launch.view);
  const [actorExpr, setActorExpr] = useState(launch.expr);
  const [actorPose, setActorPose] = useState(launch.poseTest);
  const [actorLod, setActorLod] = useState<ActorLod>(launch.lod);
  const [morphCounts, setMorphCounts] = useState<Record<number, number>>({});
  const [expressionsOpen, setExpressionsOpen] = useState(false);
  const [ActorStage, setActorStage] = useState<ComponentType<ActorSceneProps> | null>(null);

  const onMorphDictionary = useCallback((lod: number, dict: Record<string, number>) => {
    const names = Object.keys(dict);
    setMorphCounts((previous) => (previous[lod] === names.length ? previous : { ...previous, [lod]: names.length }));
    window.__HF_REPORT = {
      ...(window.__HF_REPORT ?? {}),
      simulated: true,
      [`lod${lod}MorphCount`]: names.length,
      [`lod${lod}Morphs`]: names,
    };
  }, []);

  useEffect(() => {
    if (!actorPreview || ActorStage) return;
    let cancelled = false;
    import("./components/actors/ActorScene").then((mod) => {
      if (!cancelled) setActorStage(() => mod.ActorScene);
    });
    return () => {
      cancelled = true;
    };
  }, [actorPreview, ActorStage]);

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
        <div className="status">SPATIAL RUNTIME V1 · MANIFEST DRIVEN</div>
      </header>

      <section className="viewport">
        {manifest ? (
          <Canvas shadows camera={{ position: [36, 30, 44], fov: 42 }}>
            <color attach="background" args={[actorPreview ? "#05070A" : "#020306"]} />
            {actorPreview ? null : <fog attach="fog" args={["#020306", 34, 110]} />}
            {actorPreview && ActorStage ? (
              <ActorStage
                view={actorView}
                expression={ACTOR_PRESETS[actorExpr] ?? {}}
                poseTest={actorPose}
                blink={launch.blink}
                lod={actorLod}
                onMorphDictionary={onMorphDictionary}
              />
            ) : actorPreview ? null : (
              <WorldScene manifest={manifest} selectedId={selectedId} mode={mode} />
            )}
          </Canvas>
        ) : (
          <div className="loading">RESOLVING WORLD STATE…</div>
        )}

        {actorPreview ? (
          <div className="actor-banner">
            HUMAN FORGE · hf-actor-0001 · <strong>SIMULATED</strong>
            <span>Blink, expressions, and pose offsets are procedural. They do not represent real agent execution.</span>
          </div>
        ) : null}

        <aside className={`world-controls${actorPreview ? " actor-open" : ""}${expressionsOpen ? " expressions-open" : ""}`}>
          <div className="mode-row">
            {(["city", "district", "diorama", "mission"] as ViewMode[]).map((item) => (
              <button
                key={item}
                className={!actorPreview && mode === item ? "active" : ""}
                onClick={() => {
                  setActorPreview(false);
                  setMode(item);
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <button className={actorPreview ? "actor-toggle active" : "actor-toggle"} onClick={() => setActorPreview((open) => !open)}>
            {actorPreview ? "Return to city" : "Human actor prototype"}
          </button>
          {actorPreview ? (
            <button className="expressions-toggle" onClick={() => setExpressionsOpen((open) => !open)}>
              {expressionsOpen ? "Hide expressions" : "Expressions"}
            </button>
          ) : null}
          {actorPreview ? null : (
          <label>
            DISTRICT
            <select value={selectedId ?? ""} onChange={(e) => setSelectedId(e.target.value || null)}>
              {manifest?.districts.map((district) => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </label>
          )}
          {actorPreview ? (
            <div className="actor-controls">
              <div className="preset-row">
                {(["hero", "face", "lods"] as ActorView[]).map((item) => (
                  <button key={item} className={actorView === item ? "active" : ""} onClick={() => setActorView(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <div className="preset-row">
                {Object.keys(ACTOR_PRESETS).map((name) => (
                  <button key={name} className={actorExpr === name ? "active" : ""} onClick={() => setActorExpr(name)}>
                    {name}
                  </button>
                ))}
              </div>
              <div className="preset-row">
                <button className={actorPose ? "active" : ""} onClick={() => setActorPose((on) => !on)}>
                  pose test
                </button>
                {(["auto", 0, 1, 2] as ActorLod[]).map((tier) => (
                  <button key={String(tier)} className={actorLod === tier ? "active" : ""} onClick={() => setActorLod(tier)}>
                    {tier === "auto" ? "lod auto" : `lod ${tier}`}
                  </button>
                ))}
              </div>
              <p className="simulated-note">
                SIMULATED stage. Morph weights and joint offsets are authored preview data, not an agent receipt.
                {Object.keys(morphCounts).length
                  ? ` Morphs loaded: ${Object.entries(morphCounts).map(([lod, count]) => `LOD${lod}=${count}`).join(" ")}.`
                  : " Loading actor geometry…"}
              </p>
            </div>
          ) : null}
          {actorPreview ? null : (
          <div className="doctrine">
            <b>{selected?.name ?? "CITY"}</b>
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
          )}
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
