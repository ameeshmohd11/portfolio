import { create } from "zustand";
import type { User, CallState, CallType, CallRecord } from "../types";

export const PRESET_USERS: User[] = [
  {
    id: "user-a",
    name: "Ameesh (User A)",
    email: "ameesh@apple.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    status: "offline"
  },
  {
    id: "user-b",
    name: "Sarah (User B)",
    email: "sarah@apple.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    status: "offline"
  },
  {
    id: "user-c",
    name: "Mohammed (User C)",
    email: "mohammed@apple.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    status: "offline"
  },
  {
    id: "user-d",
    name: "Raseel (User D)",
    email: "raseel@apple.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    status: "offline"
  }
];

const STORAGE_KEY_RECENT_CALLS = "facetime_recent_calls_v1";
const STORAGE_KEY_USER_ID = "facetime_current_user_id";

function getInitialUser(): User {
  const savedId = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY_USER_ID) : null;
  const matched = PRESET_USERS.find((u) => u.id === savedId);
  if (matched) return matched;
  return PRESET_USERS[0];
}

function getStoredRecentCalls(): CallRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECENT_CALLS);
    if (!raw) {
      // Default sample call history
      return [
        {
          id: "hist-1",
          userId: "user-b",
          userName: "Sarah (User B)",
          userAvatar: PRESET_USERS[1].avatar,
          type: "incoming",
          callType: "video",
          timestamp: Date.now() - 1000 * 60 * 45,
          duration: 342
        },
        {
          id: "hist-2",
          userId: "user-c",
          userName: "Alex (User C)",
          userAvatar: PRESET_USERS[2].avatar,
          type: "missed",
          callType: "video",
          timestamp: Date.now() - 1000 * 60 * 60 * 4
        }
      ];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export interface FaceTimeStoreState {
  // Current logged in user profile in this session
  currentUser: User;
  setCurrentUser: (user: User) => void;

  // Real-time online users
  onlineUsers: User[];
  setOnlineUsers: (users: User[]) => void;

  // Active call state
  callState: CallState;
  callType: CallType;
  remoteUser: User | null;
  setCallState: (state: CallState, remoteUser?: User | null, callType?: CallType) => void;

  // Streams
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;

  // Controls
  isMuted: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
  setScreenSharing: (sharing: boolean) => void;

  // Call metrics & timers
  callStartedAt: number | null;
  callDuration: number;
  setCallDuration: (duration: number) => void;
  resetCallMetrics: () => void;

  // Permission & error handling
  permissionError: string | null;
  setPermissionError: (err: string | null) => void;

  // Call history
  recentCalls: CallRecord[];
  addRecentCall: (record: Omit<CallRecord, "id">) => void;
  clearRecentCalls: () => void;

  // UI state
  activeSidebarTab: "all" | "recents" | "contacts";
  setActiveSidebarTab: (tab: "all" | "recents" | "contacts") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Signaling connection status
  isSignalingConnected: boolean;
  setIsSignalingConnected: (connected: boolean) => void;
}

export const useFaceTimeStore = create<FaceTimeStoreState>((set, get) => ({
  currentUser: getInitialUser(),
  setCurrentUser: (user) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY_USER_ID, user.id);
    }
    set({ currentUser: user });
  },

  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  callState: "idle",
  callType: "video",
  remoteUser: null,
  setCallState: (callState, remoteUser = null, callType = "video") =>
    set((state) => ({
      callState,
      remoteUser: remoteUser !== undefined ? remoteUser : state.remoteUser,
      callType: callType || state.callType
    })),

  localStream: null,
  remoteStream: null,
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),

  isMuted: false,
  isCameraEnabled: true,
  isScreenSharing: false,
  toggleMute: () =>
    set((state) => {
      const next = !state.isMuted;
      if (state.localStream) {
        state.localStream.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return { isMuted: next };
    }),

  toggleCamera: () =>
    set((state) => {
      const next = !state.isCameraEnabled;
      if (state.localStream) {
        state.localStream.getVideoTracks().forEach((track) => {
          track.enabled = next;
        });
      }
      return { isCameraEnabled: next };
    }),

  setScreenSharing: (sharing) => set({ isScreenSharing: sharing }),

  callStartedAt: null,
  callDuration: 0,
  setCallDuration: (callDuration) => set({ callDuration }),
  resetCallMetrics: () => set({ callStartedAt: null, callDuration: 0 }),

  permissionError: null,
  setPermissionError: (err) => set({ permissionError: err }),

  recentCalls: getStoredRecentCalls(),
  addRecentCall: (record) =>
    set((state) => {
      const newRecord: CallRecord = {
        ...record,
        id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      };
      const updated = [newRecord, ...state.recentCalls].slice(0, 50);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY_RECENT_CALLS, JSON.stringify(updated));
        } catch (e) { }
      }
      return { recentCalls: updated };
    }),
  clearRecentCalls: () =>
    set(() => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY_RECENT_CALLS);
      }
      return { recentCalls: [] };
    }),

  activeSidebarTab: "all",
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  isSignalingConnected: false,
  setIsSignalingConnected: (isSignalingConnected) => set({ isSignalingConnected })
}));
