/// <reference types="vite/client" />

interface Window {
  /** Headless actor-stage probe. Morph playback is simulated, not agent execution. */
  __HF_REPORT?: Record<string, unknown>;
}
