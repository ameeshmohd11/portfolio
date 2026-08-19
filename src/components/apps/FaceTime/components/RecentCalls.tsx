import React from "react";
import { format, isToday, isYesterday } from "date-fns";
import type { CallRecord, User } from "../types";
import { PRESET_USERS } from "../store/facetimeStore";
import { VideoIcon, PhoneIcon, ClockIcon } from "./Icons";

interface RecentCallsProps {
  calls: CallRecord[];
  onRedial: (user: User, type: "video" | "audio") => void;
  onClear: () => void;
}

export const RecentCalls: React.FC<RecentCallsProps> = ({
  calls,
  onRedial,
  onClear
}) => {
  const formatCallTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, "h:mm a");
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    return format(date, "MMM d");
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-1 py-1">
      {calls.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1 text-[11px] text-white/40 uppercase tracking-wider font-semibold">
          <span>Recents</span>
          <button
            onClick={onClear}
            className="hover:text-red-400 transition-colors cursor-pointer text-[10px] normal-case"
          >
            Clear
          </button>
        </div>
      )}

      {calls.map((call) => {
        const isMissed = call.type === "missed";
        const isIncoming = call.type === "incoming";

        const contactUser: User = PRESET_USERS.find((u) => u.id === call.userId) || {
          id: call.userId,
          name: call.userName,
          avatar: call.userAvatar,
          status: "offline"
        };

        return (
          <div
            key={call.id}
            onClick={() => onRedial(contactUser, call.callType)}
            className="group relative flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/10 cursor-pointer transition-all duration-150"
          >
            <div className="flex items-center space-x-3 min-w-0">
              {/* Call Type Icon indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isMissed
                    ? "bg-red-500/20 text-red-400"
                    : isIncoming
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {call.callType === "video" ? (
                  <VideoIcon size={15} />
                ) : (
                  <PhoneIcon size={14} />
                )}
              </div>

              {/* Contact Name & Call Info */}
              <div className="min-w-0 flex-1 text-left">
                <div
                  className={`font-medium text-sm truncate ${
                    isMissed ? "text-red-400" : "text-white"
                  }`}
                >
                  {call.userName}
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-white/50">
                  <span>
                    {isMissed
                      ? "Missed FaceTime"
                      : isIncoming
                      ? "Incoming FaceTime"
                      : "Outgoing FaceTime"}
                  </span>
                  {call.duration ? (
                    <>
                      <span>·</span>
                      <span>{formatDuration(call.duration)}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Timestamp & Redial Action */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-white/40 group-hover:hidden">
                {formatCallTime(call.timestamp)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRedial(contactUser, call.callType);
                }}
                className="hidden group-hover:flex items-center justify-center p-1.5 rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-400 transition-all transform active:scale-95"
                title="Call Back"
              >
                <VideoIcon size={14} />
              </button>
            </div>
          </div>
        );
      })}

      {calls.length === 0 && (
        <div className="text-center py-12 text-white/40 text-xs">
          <ClockIcon className="mb-1 mx-auto opacity-50" size={24} />
          No recent calls
        </div>
      )}
    </div>
  );
};
