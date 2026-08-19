import React, { useEffect, useRef } from "react";
import type { User, CallType } from "../types";
import { PhoneIcon } from "./Icons";

interface OutgoingCallProps {
  remoteUser: User;
  callType: CallType;
  localStream: MediaStream | null;
  onCancel: () => void;
}

export const OutgoingCall: React.FC<OutgoingCallProps> = ({
  remoteUser,
  callType,
  localStream,
  onCancel
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-zinc-950 text-white select-none">
      {/* Background Local Camera Stream (Blurred / Ambient) */}
      {localStream && callType === "video" && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover filter blur-xl opacity-30 scale-110"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-zinc-950/80 to-black pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="absolute top-6 flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/80 font-medium z-10">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
        <span>FaceTime {callType === "video" ? "Video" : "Audio"}...</span>
      </div>

      {/* Target User Avatar with Pulsing Rings */}
      <div className="relative flex items-center justify-center my-8 z-10">
        <div className="absolute w-36 h-36 rounded-full border border-white/20 animate-ping opacity-40 pointer-events-none" />
        <div className="relative z-10 w-28 h-28 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl bg-zinc-800">
          <img
            src={remoteUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${remoteUser.id}`}
            alt={remoteUser.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* User Info & Calling Status */}
      <div className="text-center space-y-1 mb-12 z-10">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{remoteUser.name}</h2>
        <p className="text-sm text-white/60 animate-pulse">Calling...</p>
      </div>

      {/* Cancel Call Button */}
      <div className="flex flex-col items-center space-y-2 z-10">
        <button
          onClick={onCancel}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-all duration-150 cursor-pointer"
          title="End / Cancel Call"
        >
          <PhoneIcon className="rotate-[135deg]" size={26} />
        </button>
        <span className="text-xs text-white/70 font-medium">Cancel</span>
      </div>
    </div>
  );
};
