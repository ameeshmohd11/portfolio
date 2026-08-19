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

  // Position of floating PiP window
  const [pipPosition, setPipPosition] = useState<"top-right" | "top-left" | "bottom-right" | "bottom-left">("top-right");
  const [controlsHovered, setControlsHovered] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((e) => console.warn("Remote video autoPlay error:", e));
    }
  }, [remoteStream]);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((e) => console.warn("Local video autoPlay error:", e));
    }
  }, [localStream, isScreenSharing]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    let timeout: number;
    const handleMouseMove = () => {
      setControlsHovered(true);
      clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        setControlsHovered(false);
      }, 3500);
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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-zinc-950 overflow-hidden select-none flex items-center justify-center"
    >
      {/* Remote Video (Full Canvas) */}
      {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        /* Remote Avatar Fallback if remote video track is off / audio only */
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/10 shadow-2xl bg-zinc-800">
            <img
              src={remoteUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${remoteUser.id}`}
              alt={remoteUser.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white">{remoteUser.name}</h3>
            <p className="text-xs text-white/50">FaceTime Audio / Video Muted</p>
          </div>
        </div>
      )}

      {/* Hidden audio element to ensure remote audio plays */}
      <audio ref={(audio) => {
        if (audio && remoteStream && audio.srcObject !== remoteStream) {
          audio.srcObject = remoteStream;
          audio.play().catch(() => {});
        }
      }} autoPlay />

      {/* Top Floating Glass Bar */}
      <div
        className={`absolute top-3 left-0 right-0 px-4 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
          controlsHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* User Info & Connection Badge */}
        <div className="pointer-events-auto flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg text-xs text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">{remoteUser.name}</span>
          <span className="text-white/40">·</span>
          <span className="text-white/70 font-mono text-[11px]">{formatDuration(callDuration)}</span>
        </div>

        {/* Status Tag */}
        <div className="pointer-events-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg text-[11px] text-white/60">
          <ShieldCheckIcon className="text-emerald-400" size={13} />
          <span>Encrypted</span>
        </div>
      </div>

      {/* Floating Picture-in-Picture (PiP) Local Video Preview */}
      <div
        onClick={cyclePipPosition}
        title="Click to move video preview"
        className={`absolute ${getPipPositionClass()} w-40 h-28 sm:w-48 sm:h-34 md:w-56 md:h-38 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-zinc-900 cursor-pointer transition-all duration-300 z-20 hover:scale-105 group`}
      >
        {isCameraEnabled && localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isScreenSharing ? "scale-x-[-1]" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white/60 space-y-1">
            <VideoOffIcon size={22} />
            <span className="text-[10px]">Camera Off</span>
          </div>
        )}

        {/* Local Stream Indicators overlay in PiP */}
        <div className="absolute top-2 left-2 flex items-center space-x-1 pointer-events-none">
          {isMuted && (
            <span className="p-1 rounded-md bg-red-600/80 backdrop-blur text-white text-[10px] flex items-center justify-center shadow">
              <MicOffIcon size={11} />
            </span>
          )}
          {isScreenSharing && (
            <span className="p-1 rounded-md bg-blue-600/80 backdrop-blur text-white text-[10px] flex items-center justify-center shadow">
              <DesktopIcon size={11} />
            </span>
          )}
        </div>

        <div className="absolute bottom-1 right-2 text-[9px] text-white/60 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity">
          Move
        </div>
      </div>

      {/* Floating Bottom macOS Pill Control Bar */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
          controlsHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center space-x-3 px-5 py-3 rounded-full bg-zinc-900/80 dark:bg-black/80 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/60">
          {/* Mute Microphone Button */}
          <button
            onClick={onToggleMute}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md ${
              isMuted
                ? "bg-red-500/30 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOffIcon size={19} /> : <MicIcon size={19} />}
          </button>

          {/* Camera Toggle Button */}
          <button
            onClick={onToggleCamera}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md ${
              !isCameraEnabled
                ? "bg-red-500/30 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
            title={isCameraEnabled ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isCameraEnabled ? <VideoIcon size={19} /> : <VideoOffIcon size={19} />}
          </button>

          {/* Screen Share Toggle Button */}
          <button
            onClick={onToggleScreenShare}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-150 transform active:scale-90 shadow-md ${
              isScreenSharing
                ? "bg-blue-600 text-white shadow-blue-500/50 shadow-lg ring-2 ring-blue-400/50"
                : "bg-white/15 text-white hover:bg-white/25 border border-white/10"
            }`}
            title={isScreenSharing ? "Stop Screen Sharing" : "Share Your Screen"}
          >
            <DesktopIcon size={19} />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleContainerFullscreen}
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/15 text-white hover:bg-white/25 border border-white/10 transition-all duration-150 transform active:scale-90 shadow-md"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <ContractIcon size={18} /> : <ExpandIcon size={18} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/50 transition-all duration-150 transform active:scale-90 cursor-pointer ml-2"
            title="End Call"
          >
            <PhoneIcon className="rotate-[135deg]" size={21} />
          </button>
        </div>
      </div>
    </div>
  );
};
