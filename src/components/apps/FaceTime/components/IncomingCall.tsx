import React from "react";
import type { User, CallType } from "../types";
import { VideoIcon, PhoneIcon } from "./Icons";

interface IncomingCallProps {
  caller: User;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCall: React.FC<IncomingCallProps> = ({
  caller,
  callType,
  onAccept,
  onDecline
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-900/95 via-zinc-900 to-black text-white select-none">
      {/* Background Animated Atmosphere Glow */}
      <div className="absolute w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl animate-pulse pointer-events-none" />

      {/* Top Banner Tag */}
      <div className="absolute top-6 flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-emerald-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>Incoming FaceTime {callType === "video" ? "Video" : "Audio"}...</span>
      </div>

      {/* Caller Avatar with Pulsing Radar Rings */}
      <div className="relative flex items-center justify-center my-8">
        {/* Radar Ring 1 */}
        <div className="absolute w-36 h-36 rounded-full border border-emerald-500/30 animate-ping opacity-60 pointer-events-none" />
        {/* Radar Ring 2 */}
        <div className="absolute w-44 h-44 rounded-full border border-emerald-500/20 animate-pulse pointer-events-none" />

        <div className="relative z-10 w-28 h-28 rounded-full overflow-hidden ring-4 ring-emerald-500/40 shadow-2xl shadow-emerald-500/20 bg-zinc-800">
          <img
            src={caller.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${caller.id}`}
            alt={caller.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Caller Info */}
      <div className="text-center space-y-1 mb-10 z-10">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{caller.name}</h2>
        <p className="text-sm text-white/60">{caller.email || "FaceTime Video"}</p>
      </div>

      {/* Action Buttons: Decline / Accept */}
      <div className="flex items-center space-x-12 z-10">
        {/* Decline Button */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onDecline}
            className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-600/40 transition-all duration-150 cursor-pointer"
            title="Decline Call"
          >
            <PhoneIcon className="rotate-[135deg]" size={26} />
          </button>
          <span className="text-xs text-white/70 font-medium">Decline</span>
        </div>

        {/* Accept Button */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all duration-150 animate-bounce cursor-pointer"
            title="Accept Call"
          >
            <VideoIcon size={26} />
          </button>
          <span className="text-xs text-emerald-400 font-medium">Accept</span>
        </div>
      </div>
    </div>
  );
};
