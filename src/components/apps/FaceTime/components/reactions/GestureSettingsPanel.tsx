import React from "react";
import type { GestureType, VFXEffectType } from "../../types";
import { GESTURE_VFX_MAP, getGestureDetails } from "../../services/gestureRecognizer";
import { SparklesIcon, HandIcon } from "../Icons";

interface GestureSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isGestureEnabled: boolean;
  onToggleGestureEnabled: () => void;
  isDebugEnabled: boolean;
  onToggleDebugEnabled: () => void;
  onTriggerReaction: (gesture: GestureType, effect: VFXEffectType) => void;
}

const GESTURE_LIST: GestureType[] = [
  "THUMBS_UP",
  "THUMBS_DOWN",
  "OPEN_PALM",
  "PEACE",
  "HEART",
  "ROCK",
  "WAVE",
  "OK"
];

export const GestureSettingsPanel: React.FC<GestureSettingsPanelProps> = ({
  isOpen,
  onClose,
  isGestureEnabled,
  onToggleGestureEnabled,
  isDebugEnabled,
  onToggleDebugEnabled,
  onTriggerReaction
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-20 right-4 sm:right-6 z-50 p-4 rounded-3xl bg-zinc-900/90 border border-white/20 backdrop-blur-2xl shadow-2xl max-w-sm w-full text-white animate-in fade-in slide-in-from-bottom-4 duration-200 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black shadow-md">
            <SparklesIcon size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide">Gesture Reactions</h3>
            <p className="text-[11px] text-white/60">FaceTime iOS 26 VFX System</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Main Gesture Grid */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
        {GESTURE_LIST.map((g) => {
          const details = getGestureDetails(g);
          return (
            <div
              key={g}
              onClick={() => onTriggerReaction(g, details.effect)}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/25 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {details.emoji}
                </span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {details.label}
                  </span>
                  <span className="text-[10px] text-white/50">{details.description}</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {details.effect}
              </span>
            </div>
          );
        })}
      </div>

      {/* Toggles Footer */}
      <div className="pt-3 mt-3 border-t border-white/10 space-y-2.5">
        {/* Toggle 1: Gesture Reactions Switch */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <HandIcon size={16} className="text-emerald-400" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-white">Gesture Detection</span>
              <span className="text-[10px] text-white/50">
                Auto-triggers from webcam feed
              </span>
            </div>
          </div>
          <button
            onClick={onToggleGestureEnabled}
            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              isGestureEnabled
                ? "bg-emerald-500 justify-end"
                : "bg-white/20 justify-start"
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md" />
          </button>
        </div>

        {/* Toggle 2: Developer Debug Overlay Switch */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs">🛠️</span>
            <div className="flex flex-col text-left">
              <span className="font-semibold text-white">Developer Debug Mode</span>
              <span className="text-[10px] text-white/50">
                Confidence, FPS & Hand Skeleton HUD
              </span>
            </div>
          </div>
          <button
            onClick={onToggleDebugEnabled}
            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              isDebugEnabled ? "bg-blue-500 justify-end" : "bg-white/20 justify-start"
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-md" />
          </button>
        </div>
      </div>
    </div>
  );
};
