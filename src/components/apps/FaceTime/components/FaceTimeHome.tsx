import React, { useState, useEffect, useRef } from "react";
import type { User, CallType, CallRecord } from "../types";
import { PRESET_USERS } from "../store/facetimeStore";
import { ContactList } from "./ContactList";
import { RecentCalls } from "./RecentCalls";
import {
  VideoIcon,
  VideoOffIcon,
  LinkIcon,
  SearchIcon,
  WarningIcon,
  ChevronDownIcon
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
  // Default camera preview to OFF to respect privacy/security and save battery
  const [cameraActive, setCameraActive] = useState(false);

  // Initialize preview stream only when user explicitly toggles it ON
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
        {/* User Identity Switcher (for easy 2-tab testing) */}
        <div className="p-3 pb-2 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
              Current Identity
            </div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSignalingConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span
                className={isSignalingConnected ? "text-emerald-400" : "text-amber-400"}
              >
                {isSignalingConnected ? "Signaling Live" : "Connecting..."}
              </span>
            </div>
          </div>

          <div className="relative">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const target = PRESET_USERS.find((u) => u.id === e.target.value);
                if (target) onSelectUser(target);
              }}
              className="w-full bg-white/10 hover:bg-white/15 dark:bg-white/10 text-white text-xs font-medium py-1.5 px-3 rounded-lg border border-white/15 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors cursor-pointer appearance-none"
            >
              {PRESET_USERS.map((user) => (
                <option key={user.id} value={user.id} className="bg-zinc-900 text-white">
                  {user.name} ({user.id})
                </option>
              ))}
            </select>
            <ChevronDownIcon
              className="absolute right-2.5 top-2 text-white/60 pointer-events-none"
              size={13}
            />
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 space-y-2.5">
          {/* Search Box */}
          <div className="relative flex items-center">
            <SearchIcon
              className="absolute left-2.5 text-white/40 pointer-events-none"
              size={13}
            />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white/10 dark:bg-white/10 placeholder-white/40 text-white text-xs rounded-lg pl-8 pr-7 py-1.5 border border-white/10 focus:outline-none focus:border-white/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-white font-medium transition-all transform active:scale-98 cursor-pointer"
            >
              <LinkIcon size={14} />
              <span>{copiedLink ? "Link Copied!" : "Create Link"}</span>
            </button>
            <button
              onClick={() => {
                // Call first available other user
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
        {/* Background Live Camera Preview (Mirrored) */}
        {previewStream && cameraActive ? (
          <video
            ref={previewVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black opacity-90" />
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

        {/* Error / Permission Alert Toast if any */}
        {permissionError && (
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between p-3 rounded-xl bg-red-900/80 border border-red-500/50 backdrop-blur-xl text-xs text-white shadow-xl">
            <div className="flex items-center space-x-2">
              <WarningIcon className="text-amber-300 flex-shrink-0" size={17} />
              <span>{permissionError}</span>
            </div>
            <button
              onClick={onDismissError}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80 font-medium ml-3 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Camera Toggle Button on Preview Screen */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setCameraActive(!cameraActive)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border border-white/15 text-xs transition-all cursor-pointer ${
              cameraActive
                ? "bg-black/50 text-white hover:bg-black/70"
                : "bg-red-600/70 text-white hover:bg-red-600"
            }`}
            title={cameraActive ? "Turn off camera preview" : "Turn on camera preview"}
          >
            {cameraActive ? <VideoIcon size={14} /> : <VideoOffIcon size={14} />}
            <span>{cameraActive ? "Preview On" : "Preview Off"}</span>
          </button>
        </div>

        {/* Center Quick Call Hub Card */}
        <div className="relative z-10 max-w-sm w-full mx-4 p-6 rounded-3xl bg-zinc-900/70 dark:bg-black/60 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80 text-center space-y-5">
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
