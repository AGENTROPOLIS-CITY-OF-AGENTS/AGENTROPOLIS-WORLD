export type ActorView = "hero" | "face" | "lods";
export type ActorLod = "auto" | 0 | 1 | 2;

export type ActorSceneProps = {
  view: ActorView;
  expression: Record<string, number>;
  poseTest: boolean;
  blink: boolean;
  lod: ActorLod;
  onMorphDictionary?: (lod: number, dict: Record<string, number>) => void;
};

/** Facial rig presets. Weights are HF morph names baked from CC0 MakeHuman face pose units. */
export const ACTOR_PRESETS: Record<string, Record<string, number>> = {
  neutral: {},
  jawOpen: { JawDrop: 0.9 },
  smile: { MouthLeftPullUp: 0.9, MouthRightPullUp: 0.9, LeftCheekUp: 0.5, RightCheekUp: 0.5 },
  blink: { LeftUpperLidClosed: 1, RightUpperLidClosed: 1 },
  browsUp: {
    LeftInnerBrowUp: 1,
    RightInnerBrowUp: 1,
    LeftOuterBrowUp: 1,
    RightOuterBrowUp: 1,
    LeftUpperLidOpen: 0.5,
    RightUpperLidOpen: 0.5,
  },
  frown: { LeftBrowDown: 1, RightBrowDown: 1, MouthLeftPullDown: 0.8, MouthRightPullDown: 0.8 },
  kiss: { LipsKiss: 1 },
};

/** Skinning test pose: raise right arm, bend elbow, tilt head. MakeHuman 163-bone joint names. */
export const POSE_TEST: Record<string, [number, number, number]> = {
  "upperarm01.R": [0, 0, -0.9],
  "lowerarm01.R": [0.9, 0, 0],
  neck02: [0, 0, 0.35],
  "upperleg01.L": [-0.5, 0, 0],
  "lowerleg01.L": [0.8, 0, 0],
};

export function readActorLaunch() {
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view");
  const view: ActorView = viewParam === "face" || viewParam === "lods" || viewParam === "hero" ? viewParam : "hero";
  const exprParam = params.get("expr") ?? "neutral";
  const expr = exprParam in ACTOR_PRESETS ? exprParam : "neutral";
  const lodParam = params.get("lod");
  const lod: ActorLod = lodParam === "0" || lodParam === "1" || lodParam === "2" ? (Number(lodParam) as 0 | 1 | 2) : "auto";
  return {
    preview: params.get("actor") === "1" || viewParam === "face" || viewParam === "lods" || viewParam === "hero",
    view,
    expr,
    poseTest: params.get("pose") === "test",
    blink: !params.has("test"),
    lod,
  };
}
