import React, { useEffect, useRef } from "react";
import type { GestureDebugData } from "../../types";

interface DebugOverlayProps {
  enabled: boolean;
  debugData: GestureDebugData;
}

// MediaPipe 21 Hand Landmark Connections
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // Thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // Index
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12], // Middle
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16], // Ring
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20], // Pinky
  [0, 17] // Palm base
];

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ enabled, debugData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw Skeleton Overlay Canvas
  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resizeCanvas();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (debugData.landmarks && debugData.landmarks.length > 0) {
      debugData.landmarks.forEach((hand) => {
        // Draw Skeleton Lines
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 8;

        HAND_CONNECTIONS.forEach(([i, j]) => {
          const p1 = hand[i];
          const p2 = hand[j];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
            ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
            ctx.stroke();
          }
        });

        // Draw Joint Dots
        hand.forEach((p, idx) => {
          ctx.beginPath();
          ctx.arc(
            p.x * canvas.width,
            p.y * canvas.height,
            idx === 4 || idx === 8 ? 5 : 3.5,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = idx === 4 || idx === 8 ? "#fbbf24" : "#60a5fa";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 6;
          ctx.fill();
        });
      });
    }
  }, [enabled, debugData]);

  if (!enabled) return null;

  return (
    <div className="absolute top-14 left-4 z-40 pointer-events-none select-none">
      {/* Hand Skeleton Overlay Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Developer Debug Telemetry HUD */}
      <div className="relative z-20 p-3 rounded-2xl bg-black/80 border border-emerald-400/40 backdrop-blur-xl shadow-2xl text-white font-mono text-[11px] space-y-1.5 min-w-[200px]">
        <div className="flex items-center justify-between pb-1 mb-1 border-b border-emerald-500/30">
          <span className="font-bold text-emerald-400">AI Gesture Debug HUD</span>
          <span className="text-[10px] text-emerald-300/80 font-bold">
            {debugData.fps} FPS
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Gesture:</span>
          <span className="font-bold text-amber-300">
            {debugData.gesture || "Searching..."}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Confidence:</span>
          <span className="font-bold text-emerald-300">
            {debugData.confidence > 0 ? `${debugData.confidence}%` : "0%"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Effect:</span>
          <span className="font-bold text-sky-300">{debugData.effect || "NONE"}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-white/60">Cooldown:</span>
          <span className="font-bold text-rose-400">
            {debugData.cooldownRemaining > 0
              ? `${debugData.cooldownRemaining}s`
              : "READY"}
          </span>
        </div>

        {/* Stabilization Progress Meter Bar */}
        <div className="pt-1">
          <div className="flex justify-between text-[10px] text-white/50 mb-0.5">
            <span>Hold Stabilization</span>
            <span>{Math.round(debugData.stabilizationProgress * 100)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-75"
              style={{ width: `${Math.round(debugData.stabilizationProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
