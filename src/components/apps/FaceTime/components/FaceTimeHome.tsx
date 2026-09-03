import React, { useState, useEffect, useRef, useCallback } from "react";
import type { User, CallType, CallRecord, ReactionEvent, ReactionType } from "../types";
import { PRESET_USERS } from "../store/facetimeStore";
import { ContactList } from "./ContactList";
import { RecentCalls } from "./RecentCalls";
import { useGestureRecognition } from "../hooks/useGestureRecognition";
import { ReactionsOverlay } from "./ReactionsOverlay";
import { getReactionLabel } from "../services/gestureRecognizer";
import {
  VideoIcon,
  VideoOffIcon,
  LinkIcon,
  SearchIcon,
  WarningIcon,
  ChevronDownIcon,
  SparklesIcon,
  HandIcon
} from "./Icons";

interface FaceTimeHomeProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  onlineUsers: User[];
  recentCalls: CallRecord[];
  activeTab: "all" | "recents" | "contacts";
  onTabChange: (tab: "all" | "recents" | "contacts") => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onStartCall: (targetUser: User, type: CallType) => void;
  onClearRecents: () => void;
  permissionError: string | null;
  onDismissError: () => void;
  isSignalingConnected: boolean;
}

const GESTURE_DEMO_ITEMS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "thumbs_up", emoji: "👍", label: "Thumbs Up" },
  { type: "fireworks", emoji: "🎆", label: "Fireworks" },
  { type: "thumbs_down", emoji: "👎", label: "Thumbs Down" },
  { type: "balloons", emoji: "🎈", label: "Balloons" },
  { type: "confetti", emoji: "🎊", label: "Confetti" },
  { type: "heart", emoji: "❤️", label: "Heart" },
  { type: "lasers", emoji: "⚡", label: "Lasers" }
];

export const FaceTimeHome: React.FC<FaceTimeHomeProps> = ({
  currentUser,
  onSelectUser,
  onlineUsers,
  recentCalls,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onStartCall,
  onClearRecents,
  permissionError,
  onDismissError,
  isSignalingConnected
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);

  // Trigger reaction locally for visual preview
  const handleTriggerReaction = useCallback(
    (type: ReactionType) => {
      console.log(`[FaceTimeHome] Triggering gesture reaction action: ${type}`);
      const newReaction: ReactionEvent = {
        id: `rx-home-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        fromUserId: currentUser.id,
        timestamp: Date.now()
      };
      setReactions((prev) => [...prev, newReaction]);
    },
    [currentUser]
  );

  const handleReactionFinished = useCallback((id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Hook gesture recognition on home camera preview video
  const {
    isModelReady: isGestureReady,
    currentGesture,
    gestureToast
  } = useGestureRecognition({
    videoRef: previewVideoRef,
    enabled: cameraActive,
    onReactionDetected: handleTriggerReaction
  });

  // Initialize preview camera stream
  useEffect(() => {
    let active = true;
    let streamInstance: MediaStream | null = null;

    if (cameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamInstance = stream;
          setPreviewStream(stream);
          if (previewVideoRef.current) {
            previewVideoRef.current.srcObject = stream;
            previewVideoRef.current.play().catch(() => {});
          }
        })
        .catch((e) => {
          console.log("Home preview camera not available or disabled:", e.message);
          setCameraActive(false);
        });
    } else {
      setPreviewStream(null);
    }

    return () => {
      active = false;
      if (streamInstance) {
        streamInstance.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraActive]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-zinc-900 text-white select-none">
      {/* ----------------- LEFT SIDEBAR ----------------- */}
      <div className="w-72 sm:w-80 h-full flex flex-col bg-zinc-900/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-r border-white/10 z-10">
        {/* User Identity Switcher */}
        <div className="p-3 pb-2 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
              Current Identity
            </span>
            <span className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isSignalingConnected ? "Signaling Online" : "Connecting..."}</span>
            </span>
          </div>

          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const selected = PRESET_USERS.find((u) => u.id === e.target.value);
                if (selected) onSelectUser(selected);
              }}
              className="w-full bg-white/10 hover:bg-white/15 text-white text-xs font-medium py-2 px-3 pr-8 rounded-xl appearance-none cursor-pointer border border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            >
              {PRESET_USERS.map((user) => (
                <option key={user.id} value={user.id} className="bg-zinc-900 text-white">
                  {user.name} ({user.id})
                </option>
              ))}
            </select>
            <ChevronDownIcon
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
            />
          </div>
        </div>

        {/* Action Header Controls */}
        <div className="p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-medium border border-white/10 transition-all active:scale-98 cursor-pointer"
            >
              <LinkIcon size={14} />
              <span>{copiedLink ? "Link Copied!" : "Create Link"}</span>
            </button>
            <button
              onClick={() => {
                const other = PRESET_USERS.find((u) => u.id !== currentUser.id);
                if (other) onStartCall(other, "video");
              }}
              className="flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium shadow-sm transition-all transform active:scale-98 cursor-pointer"
            >
              <VideoIcon size={15} />
              <span>New FaceTime</span>
            </button>
          </div>

          {/* Tab Filter Navigation */}
          <div className="flex p-0.5 bg-black/30 rounded-lg text-xs font-medium">
            <button
              onClick={() => onTabChange("all")}
              className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-white/20 text-white shadow-sm font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => onTabChange("recents")}
              className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                activeTab === "recents"
                  ? "bg-white/20 text-white shadow-sm font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Recents
            </button>
            <button
              onClick={() => onTabChange("contacts")}
              className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                activeTab === "contacts"
                  ? "bg-white/20 text-white shadow-sm font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Contacts
            </button>
          </div>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin">
          {activeTab === "recents" ? (
            <RecentCalls
              calls={recentCalls}
              onRedial={(user, type) => onStartCall(user, type)}
              onClear={onClearRecents}
            />
          ) : (
            <ContactList
              currentUser={currentUser}
              onlineUsers={onlineUsers}
              searchQuery={searchQuery}
              onCallUser={(user, type) => onStartCall(user, type)}
            />
          )}
        </div>
      </div>

      {/* ----------------- RIGHT MAIN PANEL ----------------- */}
      <div className="flex-1 relative h-full flex flex-col items-center justify-center overflow-hidden bg-zinc-950">
        {/* Full-screen Reaction Animation Canvas */}
        <ReactionsOverlay
          reactions={reactions}
          onReactionFinished={handleReactionFinished}
        />

        {/* Background Live Camera Preview (Mirrored) */}
        {previewStream && cameraActive ? (
          <video
            ref={previewVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black opacity-90" />
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

        {/* Automatic Gesture Recognized Action Banner */}
        {gestureToast && (
          <div className="absolute top-16 z-50 flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/90 text-white backdrop-blur-2xl border border-emerald-300/40 shadow-2xl shadow-emerald-500/30 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
            <span className="text-2xl animate-bounce">{gestureToast.emoji}</span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight">
                {gestureToast.label} Gesture Detected!
              </span>
              <span className="text-[10px] text-emerald-100/90 font-medium">
                Automatically Showing Action
              </span>
            </div>
          </div>
        )}

        {/* Top Header Controls: Camera Toggle & AI Gesture Status */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          {cameraActive && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-xs text-white shadow-lg">
              <HandIcon
                size={14}
                className={
                  currentGesture
                    ? "text-emerald-400 animate-bounce"
                    : "text-emerald-300/80"
                }
              />
              {currentGesture ? (
                <span className="font-semibold text-emerald-300">
                  {getReactionLabel(currentGesture).emoji}{" "}
                  {getReactionLabel(currentGesture).label}
                </span>
              ) : isGestureReady ? (
                <span className="text-emerald-400 font-medium">Auto Gestures Ready</span>
              ) : (
                <span className="text-white/60">Initializing AI...</span>
              )}
            </div>
          )}

          <button
            onClick={() => setCameraActive(!cameraActive)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/15 text-xs transition-all cursor-pointer ${
              cameraActive
                ? "bg-black/50 text-white hover:bg-black/70"
                : "bg-red-600/70 text-white hover:bg-red-600"
            }`}
          >
            {cameraActive ? <VideoIcon size={14} /> : <VideoOffIcon size={14} />}
            <span>{cameraActive ? "Preview On" : "Preview Off"}</span>
          </button>
        </div>

        {/* Center Quick Call Hub Card */}
        <div className="relative z-10 max-w-sm w-full mx-4 p-6 rounded-3xl bg-zinc-900/70 dark:bg-black/60 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <VideoIcon size={32} className="text-white" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white">FaceTime</h2>
            <p className="text-xs text-white/60">
              Logged in as{" "}
              <span className="text-emerald-400 font-semibold">{currentUser.name}</span>
            </p>
          </div>

          {/* Quick Hand Gesture Action Test Bar */}
          <div className="pt-2 border-t border-white/10 text-left space-y-1.5">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/50 font-semibold">
              <span className="flex items-center space-x-1">
                <SparklesIcon size={12} className="text-amber-400" />
                <span>Test FaceTime Gestures & Actions</span>
              </span>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-1.5">
              {GESTURE_DEMO_ITEMS.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleTriggerReaction(item.type)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-white transition-all transform active:scale-95 cursor-pointer"
                  title={`Test ${item.label} Action`}
                >
                  <span>{item.emoji}</span>
                  <span className="text-[10px] text-white/80">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Contact Chips */}
          <div className="space-y-2 text-left pt-2 border-t border-white/10">
            <div className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">
              Quick Call
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_USERS.filter((u) => u.id !== currentUser.id).map((user) => {
                const isOnline = onlineUsers.some((ou) => ou.id === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => onStartCall(user, "video")}
                    className="flex items-center space-x-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-left group cursor-pointer"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`
                        }
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                          isOnline ? "bg-emerald-400 shadow-sm" : "bg-zinc-500"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-white font-medium truncate group-hover:text-emerald-300">
                        {user.name.split(" ")[0]}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        {isOnline ? "Online" : "Offline"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
