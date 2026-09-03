import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import type { GestureType, VFXEffectType, LandmarkPoint } from "../types";
import { GESTURE_VFX_MAP } from "../types";

let recognizerInstance: GestureRecognizer | null = null;
let isInitializing = false;

export async function initGestureRecognizer(): Promise<GestureRecognizer | null> {
  if (recognizerInstance) return recognizerInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return recognizerInstance;
  }

  isInitializing = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
    );

    recognizerInstance = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    console.log("[MediaPipe] GestureRecognizer initialized successfully (GPU)");
    return recognizerInstance;
  } catch (gpuErr) {
    console.warn("[MediaPipe] GPU initialization failed, falling back to CPU:", gpuErr);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
      );
      recognizerInstance = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "CPU"
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      console.log("[MediaPipe] GestureRecognizer initialized successfully (CPU)");
      return recognizerInstance;
    } catch (cpuErr) {
      console.error("[MediaPipe] Failed to initialize GestureRecognizer:", cpuErr);
      return null;
    }
  } finally {
    isInitializing = false;
  }
}

// History buffer for detecting waving motion
interface WristHistoryPoint {
  x: number;
  y: number;
  time: number;
}
const wristHistory: WristHistoryPoint[] = [];
const WRIST_HISTORY_MAX_TIME = 800; // ms

function euclideanDistance(p1: LandmarkPoint, p2: LandmarkPoint): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
}

/**
 * Advanced Classifier:
 * Analyzes MediaPipe gesture categories AND 21 hand landmarks per hand
 * to detect: THUMBS_UP, THUMBS_DOWN, OPEN_PALM, PEACE, WAVE, HEART, ROCK, OK.
 */
export function classifyHandGesture(
  gestures: any[][],
  landmarksList: LandmarkPoint[][]
): {
  gesture: GestureType | null;
  confidence: number;
  x: number;
  y: number;
} {
  const defaultResult = { gesture: null, confidence: 0, x: 0.5, y: 0.5 };
  if (!landmarksList || landmarksList.length === 0) {
    wristHistory.length = 0;
    return defaultResult;
  }

  // Primary hand coordinates (or average of two hands)
  let avgX = 0;
  let avgY = 0;
  landmarksList.forEach((hand) => {
    // Wrist (0) and Middle MCP (9) midpoint
    if (hand[0] && hand[9]) {
      avgX += (hand[0].x + hand[9].x) / 2;
      avgY += (hand[0].y + hand[9].y) / 2;
    }
  });
  avgX /= landmarksList.length;
  avgY /= landmarksList.length;

  const now = performance.now();

  // ==========================================
  // 1. Two-Hand Special Gesture: TWO-HAND HEART
  // ==========================================
  if (landmarksList.length >= 2) {
    const hand1 = landmarksList[0];
    const hand2 = landmarksList[1];
    if (hand1.length >= 21 && hand2.length >= 21) {
      // Thumb tips (4) and Index tips (8) proximity
      const thumbDist = euclideanDistance(hand1[4], hand2[4]);
      const indexDist = euclideanDistance(hand1[8], hand2[8]);

      if (thumbDist < 0.18 && indexDist < 0.18) {
        return {
          gesture: "HEART",
          confidence: 0.95,
          x: avgX,
          y: avgY
        };
      }
    }
  }

  // Primary hand analysis
  const primaryHand = landmarksList[0];
  const primaryGesture = gestures && gestures[0] && gestures[0][0];
  const categoryName = primaryGesture ? primaryGesture.categoryName : "None";
  const confidence = primaryGesture ? primaryGesture.score : 0;

  // Track wrist history for WAVE motion
  const wrist = primaryHand[0];
  if (wrist) {
    wristHistory.push({ x: wrist.x, y: wrist.y, time: now });
    // Remove old history
    while (
      wristHistory.length > 0 &&
      now - wristHistory[0].time > WRIST_HISTORY_MAX_TIME
    ) {
      wristHistory.shift();
    }
  }

  // ==========================================
  // 2. Motion Detection: WAVE
  // ==========================================
  if (
    wristHistory.length >= 6 &&
    (categoryName === "Open_Palm" || isHandOpen(primaryHand))
  ) {
    let minX = 1;
    let maxX = 0;
    let reversals = 0;
    let lastDirection = 0;

    for (let i = 1; i < wristHistory.length; i++) {
      const dx = wristHistory[i].x - wristHistory[i - 1].x;
      minX = Math.min(minX, wristHistory[i].x);
      maxX = Math.max(maxX, wristHistory[i].x);

      if (Math.abs(dx) > 0.008) {
        const dir = Math.sign(dx);
        if (lastDirection !== 0 && dir !== lastDirection) {
          reversals++;
        }
        lastDirection = dir;
      }
    }

    const totalSpanX = maxX - minX;
    if (totalSpanX > 0.12 && reversals >= 2) {
      return {
        gesture: "WAVE",
        confidence: 0.92,
        x: avgX,
        y: avgY
      };
    }
  }

  // ==========================================
  // 3. Custom Landmark Classifiers: ROCK & OK
  // ==========================================
  if (primaryHand && primaryHand.length >= 21) {
    // Check ROCK (🤘): Index (8) & Pinky (20) extended up, Middle (12) & Ring (16) folded down
    if (isRockGesture(primaryHand)) {
      return { gesture: "ROCK", confidence: 0.9, x: avgX, y: avgY };
    }

    // Check OK (👌): Thumb tip (4) & Index tip (8) touching, Middle (12), Ring (16), Pinky (20) extended
    if (isOkGesture(primaryHand)) {
      return { gesture: "OK", confidence: 0.9, x: avgX, y: avgY };
    }
  }

  // ==========================================
  // 4. Built-in Category Mappings with fallback
  // ==========================================
  if (categoryName === "Thumb_Up" && confidence >= 0.45) {
    return { gesture: "THUMBS_UP", confidence, x: avgX, y: avgY };
  }
  if (categoryName === "Thumb_Down" && confidence >= 0.45) {
    return { gesture: "THUMBS_DOWN", confidence, x: avgX, y: avgY };
  }
  if (categoryName === "Victory" && confidence >= 0.45) {
    return { gesture: "PEACE", confidence, x: avgX, y: avgY };
  }
  if (categoryName === "Open_Palm" && confidence >= 0.45) {
    return { gesture: "OPEN_PALM", confidence, x: avgX, y: avgY };
  }
  if ((categoryName === "ILoveYou" || categoryName === "Heart") && confidence >= 0.45) {
    return { gesture: "HEART", confidence, x: avgX, y: avgY };
  }

  return defaultResult;
}

// Landmark helper routines
function isHandOpen(hand: LandmarkPoint[]): boolean {
  if (!hand || hand.length < 21) return false;
  const wrist = hand[0];
  const tips = [8, 12, 16, 20];
  const mcps = [5, 9, 13, 17];
  let extendedCount = 0;
  for (let i = 0; i < 4; i++) {
    if (
      euclideanDistance(hand[tips[i]], wrist) >
      euclideanDistance(hand[mcps[i]], wrist) * 1.15
    ) {
      extendedCount++;
    }
  }
  return extendedCount >= 3;
}

function isRockGesture(hand: LandmarkPoint[]): boolean {
  const wrist = hand[0];
  const indexTip = hand[8];
  const pinkyTip = hand[20];
  const middleTip = hand[12];
  const ringTip = hand[16];

  const indexExtended =
    euclideanDistance(indexTip, wrist) > euclideanDistance(hand[5], wrist) * 1.2;
  const pinkyExtended =
    euclideanDistance(pinkyTip, wrist) > euclideanDistance(hand[17], wrist) * 1.2;
  const middleFolded =
    euclideanDistance(middleTip, wrist) < euclideanDistance(hand[9], wrist) * 1.25;
  const ringFolded =
    euclideanDistance(ringTip, wrist) < euclideanDistance(hand[13], wrist) * 1.25;

  return indexExtended && pinkyExtended && middleFolded && ringFolded;
}

function isOkGesture(hand: LandmarkPoint[]): boolean {
  const thumbTip = hand[4];
  const indexTip = hand[8];
  const middleTip = hand[12];
  const ringTip = hand[16];
  const pinkyTip = hand[20];
  const wrist = hand[0];

  const pinchDist = euclideanDistance(thumbTip, indexTip);
  const middleExtended =
    euclideanDistance(middleTip, wrist) > euclideanDistance(hand[9], wrist) * 1.2;
  const ringExtended =
    euclideanDistance(ringTip, wrist) > euclideanDistance(hand[13], wrist) * 1.2;
  const pinkyExtended =
    euclideanDistance(pinkyTip, wrist) > euclideanDistance(hand[17], wrist) * 1.2;

  return pinchDist < 0.08 && middleExtended && ringExtended && pinkyExtended;
}

export function getVFXEffectForGesture(gesture: GestureType): VFXEffectType {
  return GESTURE_VFX_MAP[gesture] || "LIKE";
}

export function getGestureDetails(gesture: GestureType): {
  label: string;
  emoji: string;
  effect: VFXEffectType;
  description: string;
} {
  switch (gesture) {
    case "THUMBS_UP":
      return {
        label: "Thumbs Up",
        emoji: "👍",
        effect: "LIKE",
        description: "Floating 3D Like Badge & Sparkles"
      };
    case "THUMBS_DOWN":
      return {
        label: "Thumbs Down",
        emoji: "👎",
        effect: "DISLIKE",
        description: "Storm Rain Cloud & Droplets"
      };
    case "OPEN_PALM":
      return {
        label: "Open Palm",
        emoji: "✋",
        effect: "BALLOONS",
        description: "Glossy Floating Balloons"
      };
    case "PEACE":
      return {
        label: "Peace Sign",
        emoji: "✌️",
        effect: "CONFETTI",
        description: "Cinematic Particle Confetti Burst"
      };
    case "HEART":
      return {
        label: "Heart Gesture",
        emoji: "❤️",
        effect: "HEARTS",
        description: "Swirling 3D Gradient Hearts"
      };
    case "ROCK":
      return {
        label: "Rock On",
        emoji: "🤘",
        effect: "FIREWORKS",
        description: "Radiant Multi-Stage Fireworks"
      };
    case "WAVE":
      return {
        label: "Waving Hand",
        emoji: "👋",
        effect: "SPARKLES",
        description: "Real-time Hand Stardust Trail"
      };
    default:
      return {
        label: "Reaction",
        emoji: "✨",
        effect: "LIKE",
        description: "Visual Reaction Effect"
      };
  }
}

export function getReactionLabel(type: any): { label: string; emoji: string } {
  switch (type) {
    case "thumbs_up":
    case "LIKE":
    case "THUMBS_UP":
      return { label: "Thumbs Up", emoji: "👍" };
    case "thumbs_down":
    case "DISLIKE":
    case "THUMBS_DOWN":
      return { label: "Thumbs Down", emoji: "👎" };
    case "heart":
    case "HEARTS":
    case "HEART":
      return { label: "Heart", emoji: "❤️" };
    case "balloons":
    case "BALLOONS":
    case "OPEN_PALM":
      return { label: "Balloons", emoji: "🎈" };
    case "fireworks":
    case "FIREWORKS":
    case "ROCK":
      return { label: "Fireworks", emoji: "🎆" };
    case "confetti":
    case "CONFETTI":
    case "PEACE":
      return { label: "Confetti", emoji: "🎊" };
    case "sparkles":
    case "SPARKLES":
    case "WAVE":
      return { label: "Sparkles", emoji: "✨" };
    case "ok_bubble":
    case "OK_BUBBLE":
    case "OK":
      return { label: "OK Sign", emoji: "👌" };
    default:
      return { label: "Reaction", emoji: "✨" };
  }
}

export function classifyReaction(gestures: any[]): any {
  if (!gestures || gestures.length === 0) return null;
  const result = classifyHandGesture([gestures], []);
  return result.gesture;
}
