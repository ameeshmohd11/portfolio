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
  | "calling"      // Outgoing call dialing
  | "ringing"      // Incoming call ringing
  | "connecting"   // WebRTC peer connection handshake
  | "connected"    // Active call
  | "ended";       // Terminated

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
