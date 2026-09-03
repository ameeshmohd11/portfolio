import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import type { ReactionEvent } from "../types";
import { soundEffects } from "../services/soundEffects";

interface ReactionsOverlayProps {
  reactions: ReactionEvent[];
  onReactionFinished: (id: string) => void;
}

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({
  reactions,
  onReactionFinished
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playedAudioRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    reactions.forEach((r) => {
      if (!playedAudioRef.current.has(r.id)) {
        playedAudioRef.current.add(r.id);
        soundEffects.playReactionSound(r.type);

        if (r.type === "confetti" || r.type === "fireworks") {
          // Trigger confetti burst
          try {
            confetti({
              particleCount: 80,
              spread: 100,
              origin: { y: 0.6 },
              zIndex: 100,
              colors: ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"]
            });
          } catch (e) {}
        }
      }

      // Schedule removal after animation finishes (~3.8 seconds)
      const timer = window.setTimeout(() => {
        onReactionFinished(r.id);
        playedAudioRef.current.delete(r.id);
      }, 3800);

      return () => clearTimeout(timer);
    });
  }, [reactions, onReactionFinished]);

  if (reactions.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-30 flex items-center justify-center"
    >
      {reactions.map((r) => {
        if (r.type === "thumbs_up") {
          return <ThumbsUpReaction key={r.id} />;
        }
        if (r.type === "thumbs_down") {
          return <ThumbsDownReaction key={r.id} />;
        }
        if (r.type === "heart") {
          return <HeartBurstReaction key={r.id} />;
        }
        if (r.type === "balloons") {
          return <BalloonsReaction key={r.id} />;
        }
        if (r.type === "fireworks") {
          return <FireworksReaction key={r.id} />;
        }
        if (r.type === "lasers") {
          return <LasersReaction key={r.id} />;
        }
        return null;
      })}
    </div>
  );
};

/* ------------------- 1. Thumbs Up Apple 3D Bubble ------------------- */
const ThumbsUpReaction: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center justify-center animate-thumbsUpFloat">
      {/* Outer Glowing Halo */}
      <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600/90 via-sky-400/90 to-blue-300/90 shadow-[0_0_50px_rgba(56,189,248,0.7)] backdrop-blur-md border border-white/40 ring-4 ring-sky-400/30">
        <span className="text-5xl transform -rotate-6 select-none filter drop-shadow-md">
          👍
        </span>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/20 to-transparent animate-pulse" />
      </div>

      {/* Trailing sparkle particles */}
      <div className="absolute -bottom-6 w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_15px_#38bdf8] animate-ping" />
      <div className="absolute -bottom-10 left-6 w-3 h-3 rounded-full bg-blue-400 opacity-60 animate-bounce" />
    </div>
  );
};

/* ------------------- 2. Thumbs Down Rain Cloud ------------------- */
const ThumbsDownReaction: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-8 bg-black/40 backdrop-blur-[2px] animate-fadeInOut">
      {/* Dark Storm Cloud */}
      <div className="relative flex items-center space-x-2 px-6 py-3 rounded-3xl bg-zinc-800/90 border border-zinc-600/50 shadow-2xl shadow-black">
        <span className="text-4xl">🌩️</span>
        <span className="text-4xl transform rotate-6">👎</span>
      </div>

      {/* Raining Water Droplets */}
      <div className="relative w-full h-full overflow-hidden mt-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 w-[2px] h-8 bg-gradient-to-b from-sky-400 to-blue-600/0 rounded-full animate-rainDrop"
            style={{
              left: `${(i * 100) / 24 + (i % 3) * 2}%`,
              animationDelay: `${(i * 0.12) % 0.8}s`,
              animationDuration: `${0.8 + (i % 4) * 0.15}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

/* ------------------- 3. Heart Swarm Explosion ------------------- */
const HeartBurstReaction: React.FC = () => {
  const hearts = [
    { size: "text-6xl", left: "48%", delay: "0s", duration: "2.6s" },
    { size: "text-4xl", left: "38%", delay: "0.15s", duration: "2.4s" },
    { size: "text-5xl", left: "58%", delay: "0.22s", duration: "2.8s" },
    { size: "text-3xl", left: "30%", delay: "0.35s", duration: "2.2s" },
    { size: "text-4xl", left: "68%", delay: "0.4s", duration: "2.5s" },
    { size: "text-5xl", left: "44%", delay: "0.55s", duration: "2.7s" },
    { size: "text-3xl", left: "54%", delay: "0.65s", duration: "2.3s" }
  ];

  return (
    <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
      {hearts.map((h, i) => (
        <div
          key={i}
          className={`absolute bottom-6 ${h.size} select-none filter drop-shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-heartFloat`}
          style={{
            left: h.left,
            animationDelay: h.delay,
            animationDuration: h.duration
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
};

/* ------------------- 4. Floating Balloons ------------------- */
const BalloonsReaction: React.FC = () => {
  const balloons = [
    { color: "🎈", left: "45%", delay: "0s", dur: "3.2s" },
    { color: "🎈", left: "35%", delay: "0.2s", dur: "3.0s" },
    { color: "🎈", left: "55%", delay: "0.35s", dur: "3.4s" },
    { color: "🎈", left: "28%", delay: "0.5s", dur: "2.9s" },
    { color: "🎈", left: "65%", delay: "0.6s", dur: "3.1s" }
  ];

  return (
    <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
      {balloons.map((b, i) => (
        <div
          key={i}
          className="absolute bottom-0 text-6xl select-none filter drop-shadow-lg animate-balloonRise"
          style={{
            left: b.left,
            animationDelay: b.delay,
            animationDuration: b.dur
          }}
        >
          {b.color}
        </div>
      ))}
    </div>
  );
};

/* ------------------- 5. Fireworks Starburst ------------------- */
const FireworksReaction: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative flex items-center justify-center">
        <span className="text-7xl animate-ping opacity-80">🎆</span>
        <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-amber-400/40 via-red-500/40 to-purple-600/40 animate-pulse blur-xl" />
      </div>
    </div>
  );
};

/* ------------------- 6. Neon Lasers ------------------- */
const LasersReaction: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-purple-950/20">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-1 bg-cyan-400 shadow-[0_0_25px_#22d3ee] transform -rotate-12 animate-pulse" />
        <div className="w-full h-1 bg-pink-500 shadow-[0_0_25px_#ec4899] transform rotate-12 animate-pulse" />
      </div>
    </div>
  );
};
