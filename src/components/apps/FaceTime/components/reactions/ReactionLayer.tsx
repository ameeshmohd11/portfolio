import React, { useEffect, useRef } from "react";
import type { ReactionEvent, ReactionType, VFXEffectType } from "../../types";
import { soundEffects } from "../../services/soundEffects";
import { LikeParticleSystem } from "./LikeEffect";
import { HeartParticleSystem } from "./HeartEffect";
import { ConfettiParticleSystem } from "./ConfettiEffect";
import { BalloonParticleSystem } from "./BalloonEffect";
import { FireworkParticleSystem } from "./FireworkEffect";
import { SparkleParticleSystem } from "./SparkleEffect";
import { DislikeParticleSystem } from "./DislikeEffect";
import { OkParticleSystem } from "./OkEffect";

interface ReactionLayerProps {
  reactions: ReactionEvent[];
  onReactionFinished: (id: string) => void;
  trailPoint?: { x: number; y: number } | null;
}

interface ActiveSystem {
  id: string;
  type: string;
  system: any;
}

export const ReactionLayer: React.FC<ReactionLayerProps> = ({
  reactions,
  onReactionFinished,
  trailPoint
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeSystemsRef = useRef<ActiveSystem[]>([]);
  const playedAudioRef = useRef<Set<string>>(new Set());
  const sparkleSystemRef = useRef<SparkleParticleSystem | null>(null);

  // Synchronize incoming reaction props with particle engines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    reactions.forEach((r) => {
      // Prevent duplicate instantiation
      if (activeSystemsRef.current.some((sys) => sys.id === r.id)) return;

      const normX = typeof r.x === "number" ? r.x : 0.5;
      const normY = typeof r.y === "number" ? r.y : 0.5;

      // Map reaction type
      const effectType = mapToVFXType(r.type);

      // Play matching audio sound effect once per reaction
      if (!playedAudioRef.current.has(r.id)) {
        playedAudioRef.current.add(r.id);
        soundEffects.playReactionSound(effectType.toLowerCase() as any);
      }

      let systemInstance: any = null;
      switch (effectType) {
        case "LIKE":
          systemInstance = new LikeParticleSystem(normX, normY, width, height);
          break;
        case "HEARTS":
          systemInstance = new HeartParticleSystem(normX, normY, width, height);
          break;
        case "CONFETTI":
          systemInstance = new ConfettiParticleSystem(normX, normY, width, height);
          break;
        case "BALLOONS":
          systemInstance = new BalloonParticleSystem(normX, normY, width, height);
          break;
        case "FIREWORKS":
          systemInstance = new FireworkParticleSystem(normX, normY, width, height);
          break;
        case "SPARKLES":
          systemInstance = new SparkleParticleSystem(normX, normY, width, height);
          break;
        case "DISLIKE":
          systemInstance = new DislikeParticleSystem(normX, normY, width, height);
          break;
        case "OK_BUBBLE":
          systemInstance = new OkParticleSystem(normX, normY, width, height);
          break;
        default:
          systemInstance = new LikeParticleSystem(normX, normY, width, height);
      }

      if (systemInstance) {
        activeSystemsRef.current.push({
          id: r.id,
          type: effectType,
          system: systemInstance
        });
      }
    });
  }, [reactions]);

  // Handle continuous wave trail emission
  useEffect(() => {
    if (!trailPoint || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const px = trailPoint.x * canvas.width;
    const py = trailPoint.y * canvas.height;

    if (!sparkleSystemRef.current) {
      sparkleSystemRef.current = new SparkleParticleSystem(
        trailPoint.x,
        trailPoint.y,
        canvas.width,
        canvas.height
      );
      activeSystemsRef.current.push({
        id: `continuous-sparkle-${Date.now()}`,
        type: "SPARKLES",
        system: sparkleSystemRef.current
      });
    } else {
      sparkleSystemRef.current.addSparklesAt(px, py, 4);
    }
  }, [trailPoint]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const render = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = activeSystemsRef.current.length - 1; i >= 0; i--) {
        const item = activeSystemsRef.current[i];
        item.system.update(now);
        item.system.draw(ctx, now);

        if (item.system.isFinished()) {
          if (item.system === sparkleSystemRef.current) {
            sparkleSystemRef.current = null;
          }
          activeSystemsRef.current.splice(i, 1);
          playedAudioRef.current.delete(item.id);
          onReactionFinished(item.id);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [onReactionFinished]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
    />
  );
};

function mapToVFXType(type: ReactionType | VFXEffectType): VFXEffectType {
  switch (type) {
    case "thumbs_up":
    case "LIKE":
      return "LIKE";
    case "thumbs_down":
    case "DISLIKE":
      return "DISLIKE";
    case "heart":
    case "HEARTS":
      return "HEARTS";
    case "balloons":
    case "BALLOONS":
      return "BALLOONS";
    case "fireworks":
    case "FIREWORKS":
      return "FIREWORKS";
    case "confetti":
    case "CONFETTI":
      return "CONFETTI";
    case "sparkles":
    case "SPARKLES":
      return "SPARKLES";
    case "ok_bubble":
    case "OK_BUBBLE":
      return "OK_BUBBLE";
    default:
      return "LIKE";
  }
}
