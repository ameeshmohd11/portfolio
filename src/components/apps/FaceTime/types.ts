export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status?: "online" | "offline" | "busy";
  socketId?: string;
}

export type CallState =
  | "idle"
  | "calling" // Outgoing call dialing
  | "ringing" // Incoming call ringing
  | "connecting" // WebRTC peer connection handshake
  | "connected" // Active call
  | "ended"; // Terminated

export type CallType = "video" | "audio";

export interface CallRecord {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: "incoming" | "outgoing" | "missed";
  callType: CallType;
  timestamp: number;
  duration?: number; // In seconds
}

export interface SignalingMessage {
  type: string;
  [key: string]: any;
}

export type GestureType =
  "THUMBS_UP" | "THUMBS_DOWN" | "OPEN_PALM" | "PEACE" | "WAVE" | "HEART" | "ROCK" | "OK";

export type VFXEffectType =
  | "LIKE"
  | "DISLIKE"
  | "BALLOONS"
  | "CONFETTI"
  | "HEARTS"
  | "FIREWORKS"
  | "SPARKLES"
  | "OK_BUBBLE";

export const GESTURE_VFX_MAP: Record<GestureType, VFXEffectType> = {
  THUMBS_UP: "LIKE",
  THUMBS_DOWN: "DISLIKE",
  OPEN_PALM: "BALLOONS",
  PEACE: "CONFETTI",
  HEART: "HEARTS",
  ROCK: "FIREWORKS",
  WAVE: "SPARKLES",
  OK: "OK_BUBBLE"
};

export type ReactionType =
  | "thumbs_up"
  | "thumbs_down"
  | "heart"
  | "balloons"
  | "fireworks"
  | "confetti"
  | "lasers"
  | "sparkles"
  | "ok_bubble"
  | VFXEffectType;

export interface ReactionEvent {
  id: string;
  type: ReactionType | VFXEffectType;
  gesture?: GestureType;
  fromUserId: string;
  x?: number; // Normalized X (0..1)
  y?: number; // Normalized Y (0..1)
  timestamp: number;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface GestureDebugData {
  gesture: GestureType | null;
  confidence: number;
  effect: VFXEffectType | null;
  stabilizationProgress: number; // 0 to 1
  cooldownRemaining: number; // seconds
  landmarks: LandmarkPoint[][]; // Hand landmarks for debug drawing
  fps: number;
}
