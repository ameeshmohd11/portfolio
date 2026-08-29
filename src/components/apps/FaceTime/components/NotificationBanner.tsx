import React from "react";
import type { User, CallType } from "../types";
import { VideoIcon } from "./Icons";

interface NotificationBannerProps {
  caller: User;
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  caller,
  callType,
  onAccept,
  onDecline
}) => {
  return (
    <div className="fixed top-8 right-6 z-50 w-84 rounded-2xl bg-zinc-900/90 dark:bg-black/90 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/60 p-3.5 text-white animate-slide-in-right">
      <div className="flex items-start space-x-3">
        {/* App Icon + Caller Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={caller.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${caller.id}`}
            alt={caller.name}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/50"
          />
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center border border-zinc-900 shadow">
            <VideoIcon size={12} className="text-white" />
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              FaceTime {callType === "video" ? "Video" : "Audio"}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium animate-pulse">Incoming</span>
          </div>
          <div className="font-semibold text-sm text-white truncate mt-0.5">{caller.name}</div>
          <div className="text-xs text-white/60 truncate">{caller.email || "FaceTime"}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 mt-3 pt-2.5 border-t border-white/10">
        <button
          onClick={onDecline}
          className="flex-1 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-red-300 font-medium text-xs border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer"
        >
          Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/30 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <VideoIcon size={14} />
          <span>Accept</span>
        </button>
      </div>
    </div>
  );
};
