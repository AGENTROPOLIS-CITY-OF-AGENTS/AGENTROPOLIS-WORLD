import React from "react";
import ReactDOM from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Float, Grid } from "@react-three/drei";
import "./styles.css";

function Tower({ x, z, h, emissive = false }: { x: number; z: number; h: number; emissive?: boolean }) {
  return (
    <mesh position={[x, h / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[1.2, h, 1.2]} />
      <meshStandardMaterial color={emissive ? "#111827" : "#0b1220"} emissive={emissive ? "#ff3158" : "#00121a"} emissiveIntensity={emissive ? 1.4 : 0.3} metalness={0.7} roughness={0.25} />
    </mesh>
  );
}

function City() {
  const towers = Array.from({ length: 120 }, (_, i) => {
    const col = i % 12;
    const row = Math.floor(i / 12);
    const x = (col - 5.5) * 2.3;
    const z = (row - 4.5) * 2.3;
    const edge = Math.abs(col - 5.5) + Math.abs(row - 4.5);
    const h = Math.max(1.8, 10 - edge * 0.55 + ((i * 17) % 5));
    return { x, z, h };
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 18, 8]} intensity={2.2} castShadow />
      <pointLight position={[0, 12, 0]} intensity={40} color="#00e5ff" distance={30} />

      <group>
        {towers.map((tower, i) => (
          <Tower key={i} {...tower} emissive={i % 17 === 0} />
        ))}
      </group>

      <mesh position={[0, 0.03, 1]} receiveShadow>
        <boxGeometry args={[10, 0.06, 16]} />
        <meshStandardMaterial color="#06141d" roughness={0.95} />
      </mesh>

      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.4}>
        <mesh position={[0, 12, 0]}>
          <cylinderGeometry args={[1.1, 1.8, 22, 8]} />
          <meshStandardMaterial color="#090d16" emissive="#00e5ff" emissiveIntensity={0.55} metalness={0.85} roughness={0.2} />
        </mesh>
      </Float>

      <Grid args={[80, 80]} position={[0, -0.01, 0]} cellSize={1} cellThickness={0.4} cellColor="#12313a" sectionSize={10} sectionThickness={1} sectionColor="#00e5ff" fadeDistance={45} infiniteGrid />
      <Environment preset="night" />
      <OrbitControls makeDefault minDistance={12} maxDistance={65} maxPolarAngle={Math.PI / 2.05} target={[0, 5, 0]} />
    </>
  );
}

function App() {
  return (
    <main className="app-shell">
      <header className="hud">
        <div>
          <span className="eyebrow">AGENTROPOLIS CITY OF AGENTS</span>
          <h1>WORLD</h1>
          <p>Public 3D spatial plane · digital twin prototype</p>
        </div>
        <div className="status">WORLD FOUNDATION · ONLINE</div>
      </header>

      <section className="viewport">
        <Canvas shadows camera={{ position: [24, 22, 30], fov: 42 }}>
          <color attach="background" args={["#020306"]} />
          <fog attach="fog" args={["#020306", 24, 74]} />
          <City />
        </Canvas>
        <div className="legend">
          <b>FOUNDATION SCENE</b>
          <span>Procedural skyline</span>
          <span>Central cyan commons</span>
          <span>Axis landmark</span>
          <span>Orbit camera</span>
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
