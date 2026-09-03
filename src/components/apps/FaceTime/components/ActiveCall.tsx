import React, { useEffect, useRef, useState, useCallback } from "react";
import type {
  User,
  ReactionEvent,
  ReactionType,
  GestureType,
  VFXEffectType
} from "../types";
import { useGestureRecognition } from "../hooks/useGestureRecognition";
import { ReactionLayer } from "./reactions/ReactionLayer";
import { GestureSettingsPanel } from "./reactions/GestureSettingsPanel";
import { DebugOverlay } from "./reactions/DebugOverlay";
import { getGestureDetails } from "../services/gestureRecognizer";
import { signalingService } from "../services/signaling";
import {
  VideoIcon,
  VideoOffIcon,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  DesktopIcon,
  ExpandIcon,
  ContractIcon,
  ShieldCheckIcon,
  SparklesIcon,
  HandIcon
} from "./Icons";

interface ActiveCallProps {
  currentUser?: User | null;
  remoteUser: User;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export const ActiveCall: React.FC<ActiveCallProps> = ({
  currentUser,
  remoteUser,
  localStream,
  remoteStream,
  isMuted,
  isCameraEnabled,
  isScreenSharing,
  callDuration,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall
}) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const processingVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout mode: "split" (50/50 side-by-side) or "pip" (full screen remote + floating local)
  const [layoutMode, setLayoutMode] = useState<"split" | "pip">("split");
  const [pipPosition, setPipPosition] = useState<
    "top-right" | "top-left" | "bottom-right" | "bottom-left"
  >("top-right");
  const [controlsHovered, setControlsHovered] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reaction & Gesture recognition states
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [isGestureEnabled, setIsGestureEnabled] = useState(true);
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [trailPoint, setTrailPoint] = useState<{ x: number; y: number } | null>(null);

  // Trigger reaction locally and broadcast to peer via Socket.IO signaling
  const handleTriggerReaction = useCallback(
    (event: {
      gesture?: GestureType;
      effect: VFXEffectType | ReactionType;
      x?: number;
      y?: number;
    }) => {
      console.log(
        `[ActiveCall] Triggering reaction: ${event.effect} (${event.gesture || "manual"})`
      );
      const normX = typeof event.x === "number" ? event.x : 0.5;
      const normY = typeof event.y === "number" ? event.y : 0.5;

      const newReaction: ReactionEvent = {
        id: `rx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: event.effect,
        gesture: event.gesture,
        x: normX,
        y: normY,
        fromUserId: currentUser?.id || "local",
        timestamp: Date.now()
      };
      setReactions((prev) => [...prev, newReaction]);

      if (remoteUser?.id) {
        signalingService.sendReaction(
          remoteUser.id,
          event.effect,
          event.gesture,
          normX,
          normY
        );
      }
    },
    [currentUser, remoteUser]
  );

  // Remove finished reactions
  const handleReactionFinished = useCallback((id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Listen for incoming reactions from remote participant
  useEffect(() => {
    const unsub = signalingService.onReceiveReaction((data) => {
      console.log(
        `[ActiveCall] Received remote reaction "${data.reaction}" from ${data.fromUserId}`
      );
      const newReaction: ReactionEvent = {
        id: `rx-remote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: data.reaction,
        gesture: data.gesture,
        x: typeof data.x === "number" ? data.x : 0.5,
        y: typeof data.y === "number" ? data.y : 0.5,
        fromUserId: data.fromUserId,
        timestamp: data.timestamp || Date.now()
      };
      setReactions((prev) => [...prev, newReaction]);
    });

    return () => unsub();
  }, []);

  // Attach gesture recognition hook to processing video feed
  const {
    isModelReady: isGestureModelReady,
    isLoading: isGestureLoading,
    currentGesture,
    gestureToast,
    debugData
  } = useGestureRecognition({
    videoRef: processingVideoRef,
    enabled: isCameraEnabled && isGestureEnabled,
    onReactionDetected: (ev) =>
      handleTriggerReaction({ gesture: ev.gesture, effect: ev.effect, x: ev.x, y: ev.y }),
    onContinuousTrail: (pt) => {
      setTrailPoint(pt);
      setTimeout(() => setTrailPoint(null), 100);
    }
  });

  // Attach local stream to processing video ref & UI local video ref
  useEffect(() => {
    if (processingVideoRef.current && localStream) {
      processingVideoRef.current.srcObject = localStream;
      processingVideoRef.current
        .play()
        .catch((e) => console.warn("Processing video play error:", e));
    }
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current
        .play()
        .catch((e) => console.warn("Local video play error:", e));
    }
  }, [localStream, isScreenSharing, layoutMode]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current
        .play()
        .catch((e) => console.warn("Remote video play error:", e));
    }
  }, [remoteStream, layoutMode]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: number;
    const handleMouseMove = () => {
      setControlsHovered(true);
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        setControlsHovered(false);
      }, 4000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const toggleContainerFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const cyclePipPosition = () => {
    const positions: ("top-right" | "bottom-right" | "bottom-left" | "top-left")[] = [
      "top-right",
      "bottom-right",
      "bottom-left",
      "top-left"
    ];
    const currentIndex = positions.indexOf(pipPosition);
    setPipPosition(positions[(currentIndex + 1) % positions.length]);
  };

  const getPipPositionClass = () => {
    switch (pipPosition) {
      case "top-left":
        return "top-14 left-4";
      case "bottom-left":
        return "bottom-24 left-4";
      case "bottom-right":
        return "bottom-24 right-4";
      case "top-right":
      default:
        return "top-14 right-4";
    }
  };

  const currentUserName = currentUser?.name || "You (User A)";
  const remoteUserName = remoteUser?.name || "User B";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-zinc-950 overflow-hidden select-none flex flex-col items-center justify-center font-sans"
    >
      {/* Hidden processing video element for continuous MediaPipe AI gesture detection */}
      <video
        ref={processingVideoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
        className="hidden"
      />

      {/* Hidden audio element to ensure remote audio plays */}
      <audio
        ref={(audio) => {
          if (audio && remoteStream && audio.srcObject !== remoteStream) {
            audio.srcObject = remoteStream;
            audio.play().catch(() => {});
          }
        }}
        autoPlay
      />

      {/* ========================================================= */}
      {/* High Performance Canvas Reaction Layer Overlay (60 FPS)    */}
      {/* ========================================================= */}
      <ReactionLayer
        reactions={reactions}
        onReactionFinished={handleReactionFinished}
        trailPoint={trailPoint}
      />

      {/* ========================================================= */}
      {/* Developer Debug HUD Overlay                                */}
      {/* ========================================================= */}
      <DebugOverlay enabled={isDebugEnabled} debugData={debugData} />

      {/* ========================================================= */}
      {/* Automatic Gesture Recognized Action Notification Banner   */}
      {/* ========================================================= */}
      {gestureToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-4 py-2 rounded-full bg-emerald-500/90 text-white backdrop-blur-2xl border border-emerald-300/40 shadow-2xl shadow-emerald-500/30 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <span className="text-xl animate-bounce">{gestureToast.emoji}</span>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight">
              {gestureToast.label} Detected!
            </span>
            <span className="text-[10px] text-emerald-100/90 font-medium">
              VFX Effect: {gestureToast.effect}
            </span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Top Header Bar: FaceTime Call Duration & Status Info      */}
      {/* ========================================================= */}
      <div className="absolute top-3.5 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Left: Call Security / Peer Name */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-xs text-white shadow-lg pointer-events-auto">
          <ShieldCheckIcon className="text-emerald-400" size={15} />
          <span className="font-semibold">{remoteUserName}</span>
          <span className="text-white/40">|</span>
          <span className="text-white/80 font-mono">{formatDuration(callDuration)}</span>
        </div>

        {/* Right: Layout Switcher & Gesture AI Status HUD */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Hand Gesture Detection Status HUD */}
          {isGestureEnabled && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-xs text-white shadow-lg transition-all">
              <HandIcon
                size={14}
                className={
                  currentGesture
                    ? "text-emerald-400 animate-bounce"
                    : "text-emerald-300/80"
                }
              />
              {currentGesture ? (
                <span className="font-medium text-emerald-300 animate-pulse">
                  {getGestureDetails(currentGesture).emoji}{" "}
                  {getGestureDetails(currentGesture).label}
                </span>
              ) : isGestureLoading ? (
                <span className="text-white/70 animate-pulse">
                  Loading AI Gestures...
                </span>
              ) : isGestureModelReady ? (
                <span className="text-emerald-400/90 font-medium">Auto Gestures On</span>
              ) : (
                <span className="text-white/50">Gestures Standby</span>
              )}
            </div>
          )}

          {/* Layout Mode Toggle */}
          <button
            onClick={() => setLayoutMode((m) => (m === "split" ? "pip" : "split"))}
            className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/15 text-xs font-medium text-white transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            {layoutMode === "split" ? "Switch to PiP" : "Switch to Split"}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN VIDEO CANVAS DISPLAY                                 */}
      {/* ========================================================= */}
      {layoutMode === "split" ? (
        /* --------------------------------------------------------- */
        /* 1. SPLIT VIEW MODE: 50/50 Side-by-Side Video Layout     */
        /* --------------------------------------------------------- */
        <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-2 gap-2 p-2 sm:p-3 bg-zinc-950">
          {/* User A (Local Preview Video) */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl flex items-center justify-center group">
            {isCameraEnabled && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                className={`w-full h-full object-cover ${
                  !isScreenSharing ? "scale-x-[-1]" : ""
                }`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 p-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-white/10 bg-zinc-800 shadow-xl flex items-center justify-center">
                  <img
                    src={
                      currentUser?.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.id || "local"}`
                    }
                    alt={currentUserName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-white block">
                    {currentUserName}
                  </span>
                  <span className="text-[11px] text-white/50">Camera Off</span>
                </div>
              </div>
            )}

            {/* Local Status Indicators */}
            <div className="absolute top-3 left-3 flex items-center space-x-2 pointer-events-none">
              {isMuted && (
                <span className="px-2 py-0.5 rounded-full bg-red-600/90 backdrop-blur text-white text-[11px] font-medium flex items-center space-x-1 shadow">
                  <MicOffIcon size={11} />
                  <span>Muted</span>
                </span>
              )}
            </div>

            {/* Bottom Overlay Label for User A */}
            <div className="absolute bottom-3 left-3 flex items-center space-x-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-xs text-white shadow-lg pointer-events-none">
              <span className="font-medium">{currentUserName}</span>
            </div>
          </div>

          {/* User B (Remote User Video) */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl flex items-center justify-center">
            {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3 p-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-white/10 bg-zinc-800 shadow-xl flex items-center justify-center">
                  <img
                    src={
                      remoteUser.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${remoteUser.id}`
                    }
                    alt={remoteUserName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-white block">
                    {remoteUserName}
                  </span>
                  <span className="text-[11px] text-white/50">
                    FaceTime Audio • Video Off
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Overlay Label for User B */}
            <div className="absolute bottom-3 left-3 flex items-center space-x-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-xs text-white shadow-lg pointer-events-none">
              <span className="font-medium">{remoteUserName}</span>
            </div>
          </div>
        </div>
      ) : (
        /* --------------------------------------------------------- */
        /* 2. PiP VIEW MODE: Fullscreen Remote + Corner Floating PiP */
        /* --------------------------------------------------------- */
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Main Video (Remote User B) */}
          {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
              className="w-full h-full object-cover bg-black"
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-white/10 shadow-2xl bg-zinc-800">
                <img
                  src={
                    remoteUser.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${remoteUser.id}`
                  }
                  alt={remoteUserName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">{remoteUserName}</h3>
                <p className="text-xs text-white/50">FaceTime Audio • Video Off</p>
              </div>
            </div>
          )}

          {/* Floating Picture-in-Picture Local Preview (User A) */}
          <div
            onClick={cyclePipPosition}
            className={`absolute ${getPipPositionClass()} w-28 h-40 sm:w-34 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/30 bg-zinc-900 cursor-pointer transition-all duration-300 z-20 hover:scale-105 hover:border-white/50 group`}
          >
            {isCameraEnabled && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => e.currentTarget.play().catch(() => {})}
                className={`w-full h-full object-cover bg-zinc-950 ${
                  !isScreenSharing ? "scale-x-[-1]" : ""
                }`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white/60 space-y-1.5 p-2 text-center">
                <VideoOffIcon size={20} />
                <span className="text-[10px] leading-tight">Camera Off</span>
              </div>
            )}

            {/* Local Indicators */}
            <div className="absolute top-2 left-2 flex items-center space-x-1 pointer-events-none z-10">
              {isMuted && (
                <span className="p-1 rounded-md bg-red-600/90 backdrop-blur text-white text-[10px] flex items-center justify-center shadow">
                  <MicOffIcon size={10} />
                </span>
              )}
            </div>

            <div className="absolute bottom-1.5 inset-x-0 flex justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] font-medium text-white/90 bg-black/70 px-2 py-0.5 rounded-full backdrop-blur border border-white/10">
                Swap Corner
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Reactions & Gesture Settings Menu Card                     */}
      {/* ========================================================= */}
      <GestureSettingsPanel
        isOpen={showReactionMenu}
        onClose={() => setShowReactionMenu(false)}
        isGestureEnabled={isGestureEnabled}
        onToggleGestureEnabled={() => setIsGestureEnabled(!isGestureEnabled)}
        isDebugEnabled={isDebugEnabled}
        onToggleDebugEnabled={() => setIsDebugEnabled(!isDebugEnabled)}
        onTriggerReaction={(g, effect) => {
          handleTriggerReaction({ gesture: g, effect });
        }}
      />

      {/* ========================================================= */}
      {/* iOS / macOS FaceTime Floating Bottom Control Toolbar     */}
      {/* ========================================================= */}
      <div
        className={`absolute bottom-3.5 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
          controlsHovered || showReactionMenu
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center space-x-3 sm:space-x-4 px-5 py-2.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/80">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md cursor-pointer ${
              isMuted
                ? "bg-red-500/30 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
          </button>

          {/* Camera Button */}
          <button
            onClick={onToggleCamera}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md cursor-pointer ${
              !isCameraEnabled
                ? "bg-red-500/30 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
            title={isCameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isCameraEnabled ? <VideoIcon size={18} /> : <VideoOffIcon size={18} />}
          </button>

          {/* Reactions & Gestures Button */}
          <button
            onClick={() => setShowReactionMenu(!showReactionMenu)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md cursor-pointer ${
              showReactionMenu || (isGestureEnabled && currentGesture)
                ? "bg-emerald-600 text-white shadow-emerald-500/50 ring-2 ring-emerald-400/50"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
            title="FaceTime Reactions & Hand Gestures"
          >
            <SparklesIcon size={18} />
          </button>

          {/* Screen Share Button */}
          <button
            onClick={onToggleScreenShare}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md cursor-pointer ${
              isScreenSharing
                ? "bg-blue-600 text-white shadow-blue-500/50 shadow-lg ring-2 ring-blue-400/50"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
            title={isScreenSharing ? "Stop Screen Sharing" : "Share Screen"}
          >
            <DesktopIcon size={18} />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleContainerFullscreen}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center bg-white/15 text-white hover:bg-white/25 border border-white/10 transition-all duration-150 transform active:scale-90 shadow-md cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <ContractIcon size={17} /> : <ExpandIcon size={17} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transition-all duration-150 transform active:scale-90 cursor-pointer ml-1"
            title="End Call"
          >
            <PhoneIcon className="rotate-[135deg]" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
