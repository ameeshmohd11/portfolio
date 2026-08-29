import React from "react";
import type { User } from "../types";
import { PRESET_USERS } from "../store/facetimeStore";
import { VideoIcon, PhoneIcon } from "./Icons";

interface ContactListProps {
  currentUser: User;
  onlineUsers: User[];
  searchQuery: string;
  onCallUser: (user: User, type: "video" | "audio") => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  currentUser,
  onlineUsers,
  searchQuery,
  onCallUser
}) => {
  // Combine preset contacts and any dynamically joined online users
  const allContactsMap = new Map<string, User>();

  PRESET_USERS.forEach((u) => {
    allContactsMap.set(u.id, {
      ...u,
      status: onlineUsers.some((ou) => ou.id === u.id) ? "online" : "offline"
    });
  });

  onlineUsers.forEach((ou) => {
    if (!allContactsMap.has(ou.id)) {
      allContactsMap.set(ou.id, { ...ou, status: "online" });
    }
  });

  const contactsList = Array.from(allContactsMap.values()).filter((user) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      (user.email && user.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-1 py-1">
      {contactsList.map((user) => {
        const isSelf = user.id === currentUser.id;
        const isOnline = user.status === "online";

        return (
          <div
            key={user.id}
            className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 ${
              isSelf
                ? "bg-white/5 opacity-80 cursor-default"
                : "hover:bg-white/10 dark:hover:bg-white/10 cursor-pointer"
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              {/* Avatar with status indicator */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                    isOnline ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-zinc-500"
                  }`}
                  title={isOnline ? "Online" : "Offline"}
                />
              </div>

              {/* User details */}
              <div className="min-w-0 flex-1 text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="font-medium text-sm text-white truncate">
                    {user.name}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 border border-blue-400/30">
                      You
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/50 truncate">
                  {user.email || (isOnline ? "Available for call" : "Offline")}
                </div>
              </div>
            </div>

            {/* Quick Action Call Buttons */}
            {!isSelf && (
              <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCallUser(user, "video");
                  }}
                  className="p-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-500 text-emerald-300 hover:text-white transition-all transform active:scale-95 shadow-sm cursor-pointer"
                  title="FaceTime Video"
                >
                  <VideoIcon size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCallUser(user, "audio");
                  }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all transform active:scale-95 cursor-pointer"
                  title="FaceTime Audio"
                >
                  <PhoneIcon size={15} />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {contactsList.length === 0 && (
        <div className="text-center py-8 text-white/40 text-xs">
          No contacts match "{searchQuery}"
        </div>
      )}
    </div>
  );
};
