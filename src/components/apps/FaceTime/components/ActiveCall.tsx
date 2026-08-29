import React, { useEffect, useRef, useState } from "react";
import type { User } from "../types";
import {
  VideoIcon,
  VideoOffIcon,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  DesktopIcon,
  ExpandIcon,
  ContractIcon,
  ShieldCheckIcon
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout mode: "split" (50/50 side-by-side) or "pip" (full screen remote + floating local)
  const [layoutMode, setLayoutMode] = useState<"split" | "pip">("split");
  // Position of floating PiP window (for PiP mode)
  const [pipPosition, setPipPosition] = useState<
    "top-right" | "top-left" | "bottom-right" | "bottom-left"
  >("top-right");
  const [controlsHovered, setControlsHovered] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current
        .play()
        .catch((e) => console.warn("Remote video autoPlay error:", e));
    }
  }, [remoteStream, layoutMode]);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current
        .play()
        .catch((e) => console.warn("Local video autoPlay error:", e));
    }
  }, [localStream, isScreenSharing, layoutMode]);

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

      {/* Top Floating iOS/macOS Header */}
      <div
        className={`absolute top-3 inset-x-0 px-4 flex items-center justify-between pointer-events-none z-30 transition-opacity duration-300 ${
          controlsHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Call Info & Duration */}
        <div className="pointer-events-auto flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-2xl border border-white/15 shadow-xl text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="font-semibold text-xs leading-none">{remoteUserName}</span>
            <span className="text-[10px] text-white/60 font-mono mt-0.5">
              FaceTime Video · {formatDuration(callDuration)}
            </span>
          </div>
        </div>

        {/* Top Right Actions: Layout Switcher + Encryption Badge */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Toggle Layout (Split 50/50 vs Floating PiP) */}
          <button
            onClick={() => setLayoutMode(layoutMode === "split" ? "pip" : "split")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition backdrop-blur-xl border border-white/20 text-white text-xs font-medium shadow-lg"
          >
            {layoutMode === "split" ? (
              <>
                <span className="text-white/80">◫</span>
                <span>Split View (50/50)</span>
              </>
            ) : (
              <>
                <span className="text-white/80">▣</span>
                <span>PiP View</span>
              </>
            )}
          </button>

          {/* Encrypted Badge */}
          <div className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-[11px] text-emerald-400 shadow-lg">
            <ShieldCheckIcon size={13} />
            <span className="text-white/70">Encrypted</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. SPLIT VIEW MODE: 50% User A / 50% User B Side-by-Side  */}
      {/* ========================================================= */}
      {layoutMode === "split" ? (
        <div className="w-full h-full p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-center justify-center">
          {/* Left Tile: User A (Local User) */}
          <div className="relative w-full h-full min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 border border-white/15 shadow-2xl flex items-center justify-center group">
            {isCameraEnabled && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover bg-zinc-950 ${
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
                  <span className="text-[11px] text-white/50">Camera Muted</span>
                </div>
              </div>
            )}

            {/* Bottom Overlay Label for User A */}
            <div className="absolute bottom-3 left-3 flex items-center space-x-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-xs text-white shadow-lg pointer-events-none">
              <span className="font-medium">{currentUserName}</span>
              {isMuted && (
                <span className="text-red-400 text-[10px] flex items-center">
                  <MicOffIcon size={11} />
                </span>
              )}
            </div>
          </div>

          {/* Right Tile: User B (Remote User) */}
          <div className="relative w-full h-full min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 border border-white/15 shadow-2xl flex items-center justify-center group">
            {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-zinc-950"
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
                    FaceTime Audio · Video Off
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
        /* ========================================================= */
        /* 2. PiP VIEW MODE: Fullscreen Remote + Corner Floating PiP */
        /* ========================================================= */
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Main Video (Remote User B) */}
          {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
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
                <p className="text-xs text-white/50">FaceTime Audio · Video Off</p>
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
      {/* iOS / macOS FaceTime Floating Bottom Control Toolbar     */}
      {/* ========================================================= */}
      <div
        className={`absolute bottom-3.5 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
          controlsHovered
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center space-x-3 sm:space-x-4 px-5 py-2.5 rounded-full bg-black/75 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/80">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md ${
              isMuted
                ? "bg-red-500/30 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
          >
            {isMuted ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
          </button>

          {/* Camera Button */}
          <button
            onClick={onToggleCamera}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md ${
              !isCameraEnabled
                ? "bg-red-500/30 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
          >
            {isCameraEnabled ? <VideoIcon size={18} /> : <VideoOffIcon size={18} />}
          </button>

          {/* Screen Share Button */}
          <button
            onClick={onToggleScreenShare}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md ${
              isScreenSharing
                ? "bg-blue-600 text-white shadow-blue-500/50 shadow-lg ring-2 ring-blue-400/50"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
          >
            <DesktopIcon size={18} />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleContainerFullscreen}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center bg-white/15 text-white hover:bg-white/25 border border-white/10 transition-all duration-150 transform active:scale-90 shadow-md"
          >
            {isFullscreen ? <ContractIcon size={17} /> : <ExpandIcon size={17} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transition-all duration-150 transform active:scale-90 cursor-pointer ml-1"
          >
            <PhoneIcon className="rotate-[135deg]" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
