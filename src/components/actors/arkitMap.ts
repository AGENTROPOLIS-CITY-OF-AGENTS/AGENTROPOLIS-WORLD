// Mapping from ARKit-52 blendshape names to the CC0 MakeHuman face pose units baked into the
// HUMAN FORGE GLB. Values are [morphName, weight] lists. Coverage is partial and honest:
// shapes with no CC0 source pose are listed in ARKIT_UNMAPPED (they need authoring later).
export const ARKIT_TO_HF: Record<string, Array<[string, number]>> = {
  browDownLeft: [["LeftBrowDown", 1]],
  browDownRight: [["RightBrowDown", 1]],
  browInnerUp: [["LeftInnerBrowUp", 1], ["RightInnerBrowUp", 1]],
  browOuterUpLeft: [["LeftOuterBrowUp", 1]],
  browOuterUpRight: [["RightOuterBrowUp", 1]],
  eyeBlinkLeft: [["LeftUpperLidClosed", 1]],
  eyeBlinkRight: [["RightUpperLidClosed", 1]],
  eyeWideLeft: [["LeftUpperLidOpen", 1]],
  eyeWideRight: [["RightUpperLidOpen", 1]],
  eyeSquintLeft: [["LeftLowerLidUp", 1]],
  eyeSquintRight: [["RightLowerLidUp", 1]],
  eyeLookDownLeft: [["LeftEyeDown", 1]],
  eyeLookDownRight: [["RightEyeDown", 1]],
  eyeLookUpLeft: [["LeftEyeUp", 1]],
  eyeLookUpRight: [["RightEyeUp", 1]],
  // character-left eye looking toward character's left = outward
  eyeLookOutLeft: [["LeftEyeturnLeft", 1]],
  eyeLookInLeft: [["LeftEyeturnRight", 1]],
  eyeLookOutRight: [["RightEyeturnRight", 1]],
  eyeLookInRight: [["RightEyeturnLeft", 1]],
  cheekSquintLeft: [["LeftCheekUp", 1]],
  cheekSquintRight: [["RightCheekUp", 1]],
  cheekPuff: [["CheeksPump", 1]],
  noseSneerLeft: [["NoseWrinkler", 0.6]],
  noseSneerRight: [["NoseWrinkler", 0.6]],
  jawOpen: [["JawDrop", 1]],
  jawForward: [["ChinForward", 1]],
  jawLeft: [["ChinLeft", 1]],
  jawRight: [["ChinRight", 1]],
  mouthPucker: [["LipsKiss", 1]],
  mouthFunnel: [["LipsKiss", 0.6], ["JawDrop", 0.25]],
  mouthLeft: [["MouthMoveLeft", 1]],
  mouthRight: [["MouthMoveRight", 1]],
  mouthSmileLeft: [["MouthLeftPullUp", 1]],
  mouthSmileRight: [["MouthRightPullUp", 1]],
  mouthStretchLeft: [["MouthLeftPullSide", 1]],
  mouthStretchRight: [["MouthRightPullSide", 1]],
  mouthFrownLeft: [["MouthLeftPullDown", 1]],
  mouthFrownRight: [["MouthRightPullDown", 1]],
  mouthDimpleLeft: [["MouthLeftPlatysma", 0.5]],
  mouthDimpleRight: [["MouthRightPlatysma", 0.5]],
  mouthRollLower: [["lowerLipBackward", 1]],
  mouthRollUpper: [["UpperLipBackward", 1]],
  mouthShrugLower: [["lowerLipUp", 1]],
  mouthShrugUpper: [["UpperLipUp", 1]],
  mouthLowerDownLeft: [["lowerLipDown", 1]],
  mouthLowerDownRight: [["lowerLipDown", 1]],
  mouthUpperUpLeft: [["UpperLipUp", 1]],
  mouthUpperUpRight: [["UpperLipUp", 1]],
  tongueOut: [["TongueOut", 1]],
};

// ARKit shapes without a dedicated CC0 source pose (approximated or missing):
export const ARKIT_UNMAPPED = ["mouthClose", "mouthPressLeft", "mouthPressRight", "cheekSquint (approx via CheekUp)"];

/** Expand ARKit weights into HF morph weights (summed, clamped to [0,1]). */
export function arkitToHF(weights: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, weight] of Object.entries(weights)) {
    for (const [morph, scale] of ARKIT_TO_HF[key] ?? []) {
      out[morph] = Math.min(1, (out[morph] ?? 0) + weight * scale);
    }
  }
  return out;
}
