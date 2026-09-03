import { useEffect, useRef, useState } from "react";
import {
  initGestureRecognizer,
  classifyHandGesture,
  getVFXEffectForGesture,
  getGestureDetails
} from "../services/gestureRecognizer";
import type { GestureRecognizer } from "@mediapipe/tasks-vision";
import type {
  GestureType,
  VFXEffectType,
  GestureDebugData,
  LandmarkPoint
} from "../types";

interface UseGestureRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  onReactionDetected: (event: {
    gesture: GestureType;
    effect: VFXEffectType;
    x: number;
    y: number;
  }) => void;
  onContinuousTrail?: (point: { x: number; y: number }) => void;
}

const STABILIZATION_TIME_MS = 400; // Hold gesture stable for ~400ms
const COOLDOWN_TIME_MS = 2000; // 2.0s cooldown per gesture

export function useGestureRecognition({
  videoRef,
  enabled,
  onReactionDetected,
  onContinuousTrail
}: UseGestureRecognitionProps) {
  const [isModelReady, setIsModelReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<GestureType | null>(null);
  const [gestureToast, setGestureToast] = useState<{
    gesture: GestureType;
    effect: VFXEffectType;
    emoji: string;
    label: string;
    id: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug HUD data state
  const [debugData, setDebugData] = useState<GestureDebugData>({
    gesture: null,
    confidence: 0,
    effect: null,
    stabilizationProgress: 0,
    cooldownRemaining: 0,
    landmarks: [],
    fps: 60
  });

  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const lastTriggeredTimeRef = useRef<number>(0);
  const holdCandidateRef = useRef<{
    gesture: GestureType;
    startTime: number;
    x: number;
    y: number;
  } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // FPS calculation refs
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(performance.now());
  const currentFpsRef = useRef(60);

  // Initialize MediaPipe Gesture Recognizer model
  useEffect(() => {
    let mounted = true;
    if (enabled) {
      setIsLoading(true);
      setError(null);
      initGestureRecognizer()
        .then((recognizer) => {
          if (mounted) {
            recognizerRef.current = recognizer;
            if (recognizer) {
              console.log("[useGestureRecognition] Gesture AI model loaded");
              setIsModelReady(true);
            } else {
              setError("Gesture model failed to initialize");
            }
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (mounted) {
            console.error("[useGestureRecognition] Model load error:", err);
            setError(err?.message || "Failed to load gesture recognizer");
            setIsLoading(false);
          }
        });
    } else {
      recognizerRef.current = null;
      setIsModelReady(false);
      setIsLoading(false);
      setCurrentGesture(null);
      setGestureToast(null);
    }
    return () => {
      mounted = false;
    };
  }, [enabled]);

  // Frame processing loop
  useEffect(() => {
    if (!enabled || !isModelReady) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      isRunningRef.current = false;
      setCurrentGesture(null);
      setGestureToast(null);
      return;
    }

    isRunningRef.current = true;
    let lastVideoTime = -1;

    const processFrame = () => {
      if (!isRunningRef.current) return;

      // Calculate FPS
      const nowMs = performance.now();
      frameCountRef.current++;
      if (nowMs - lastFpsTimeRef.current >= 1000) {
        currentFpsRef.current = Math.round(
          (frameCountRef.current * 1000) / (nowMs - lastFpsTimeRef.current)
        );
        frameCountRef.current = 0;
        lastFpsTimeRef.current = nowMs;
      }

      const recognizer = recognizerRef.current;
      const video = videoRef.current;

      if (
        recognizer &&
        video &&
        video.readyState >= 2 &&
        !video.paused &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          try {
            let processTime = performance.now();
            if (processTime <= lastTimestampRef.current) {
              processTime = lastTimestampRef.current + 1;
            }
            lastTimestampRef.current = processTime;

            const results = recognizer.recognizeForVideo(video, processTime);

            const landmarksList: LandmarkPoint[][] = (results?.landmarks || []).map(
              (hand) => hand.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z }))
            );

            if (results && results.landmarks && results.landmarks.length > 0) {
              const { gesture, confidence, x, y } = classifyHandGesture(
                results.gestures || [],
                landmarksList
              );

              const now = Date.now();
              const timeSinceLastTrigger = now - lastTriggeredTimeRef.current;
              const cooldownRemaining = Math.max(
                0,
                Number(((COOLDOWN_TIME_MS - timeSinceLastTrigger) / 1000).toFixed(1))
              );

              if (gesture) {
                setCurrentGesture(gesture);
                const effect = getVFXEffectForGesture(gesture);

                // Continuous trail for WAVE motion
                if (gesture === "WAVE" && onContinuousTrail) {
                  onContinuousTrail({ x, y });
                }

                // Check stabilization logic
                if (cooldownRemaining === 0) {
                  if (
                    holdCandidateRef.current &&
                    holdCandidateRef.current.gesture === gesture
                  ) {
                    const elapsed = now - holdCandidateRef.current.startTime;
                    const progress = Math.min(1, elapsed / STABILIZATION_TIME_MS);

                    setDebugData({
                      gesture,
                      confidence: Math.round(confidence * 100),
                      effect,
                      stabilizationProgress: progress,
                      cooldownRemaining: 0,
                      landmarks: landmarksList,
                      fps: currentFpsRef.current
                    });

                    if (elapsed >= STABILIZATION_TIME_MS) {
                      console.log(
                        `[Gesture Triggered] ${gesture} -> ${effect} at (${x.toFixed(
                          2
                        )}, ${y.toFixed(2)})`
                      );
                      onReactionDetected({ gesture, effect, x, y });

                      const details = getGestureDetails(gesture);
                      setGestureToast({
                        gesture,
                        effect,
                        emoji: details.emoji,
                        label: details.label,
                        id: `toast-${Date.now()}`
                      });

                      setTimeout(() => {
                        setGestureToast(null);
                      }, 2500);

                      lastTriggeredTimeRef.current = now;
                      holdCandidateRef.current = null;
                    }
                  } else {
                    holdCandidateRef.current = { gesture, startTime: now, x, y };
                    setDebugData({
                      gesture,
                      confidence: Math.round(confidence * 100),
                      effect,
                      stabilizationProgress: 0.1,
                      cooldownRemaining: 0,
                      landmarks: landmarksList,
                      fps: currentFpsRef.current
                    });
                  }
                } else {
                  // In Cooldown
                  holdCandidateRef.current = null;
                  setDebugData({
                    gesture,
                    confidence: Math.round(confidence * 100),
                    effect,
                    stabilizationProgress: 0,
                    cooldownRemaining,
                    landmarks: landmarksList,
                    fps: currentFpsRef.current
                  });
                }
              } else {
                setCurrentGesture(null);
                holdCandidateRef.current = null;
                setDebugData({
                  gesture: null,
                  confidence: 0,
                  effect: null,
                  stabilizationProgress: 0,
                  cooldownRemaining,
                  landmarks: landmarksList,
                  fps: currentFpsRef.current
                });
              }
            } else {
              setCurrentGesture(null);
              holdCandidateRef.current = null;
              setDebugData({
                gesture: null,
                confidence: 0,
                effect: null,
                stabilizationProgress: 0,
                cooldownRemaining: 0,
                landmarks: [],
                fps: currentFpsRef.current
              });
            }
          } catch (err) {
            console.warn("[MediaPipe Frame Error]", err);
          }
        }
      }

      if (isRunningRef.current) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunningRef.current = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [enabled, isModelReady, videoRef, onReactionDetected, onContinuousTrail]);

  return {
    isModelReady,
    isLoading,
    currentGesture,
    gestureToast,
    debugData,
    error
  };
}
