import React, { useState, useEffect, useRef } from "react";
import {
  YouTubeTrack,
  CURATED_TRACKS,
  searchYouTubeTracks,
  extractYouTubeVideoId,
  fetchYouTubeVideoDetails
} from "~/services/youtube";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface MusicWidgetProps {
  hide?: boolean;
}

export default function MusicWidget({ hide = false }: MusicWidgetProps) {
  const [tracks, setTracks] = useState<YouTubeTrack[]>(CURATED_TRACKS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("all");
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: -1, y: 40 });
  const [isDraggingState, setIsDraggingState] = useState<boolean>(false);
  const [isPlayerReadyState, setIsPlayerReadyState] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const isPlayerReady = useRef<boolean>(false);
  const pendingPlayRef = useRef<boolean>(false);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const isSeeking = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const statusTimerRef = useRef<any>(null);
  const isDragging = useRef<boolean>(false);
  const hasDragged = useRef<boolean>(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const currentTrack: YouTubeTrack | undefined = tracks[currentIndex] || tracks[0];

  // Show status banner notification with auto-dismiss
  const showStatus = (msg: string, durationMs = 3500) => {
    setStatusMessage(msg);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatusMessage("");
    }, durationMs);
  };

  // Load liked tracks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("youtube_liked_tracks");
      if (saved) setLikedTracks(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const toggleLike = (trackId: string) => {
    const updated = { ...likedTracks, [trackId]: !likedTracks[trackId] };
    if (!updated[trackId]) delete updated[trackId];
    setLikedTracks(updated);
    try {
      localStorage.setItem("youtube_liked_tracks", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Robust YouTube IFrame API Initialization
  useEffect(() => {
    let checkInterval: any = null;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return false;
      if (playerRef.current) return true;

      const playerContainer = document.getElementById("youtube-widget-audio-player");
      if (!playerContainer) return false;

      try {
        const initialVideoId = currentTrack?.id || CURATED_TRACKS[0].id;
        playerRef.current = new window.YT.Player("youtube-widget-audio-player", {
          height: "100%",
          width: "100%",
          videoId: initialVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            enablejsapi: 1
          },
          events: {
            onReady: (event: any) => {
              isPlayerReady.current = true;
              setIsPlayerReadyState(true);
              try {
                event.target.setVolume(volume);
                if (isMuted) event.target.mute();
              } catch {}
              if (pendingPlayRef.current) {
                pendingPlayRef.current = false;
                try {
                  event.target.playVideo();
                  setIsPlaying(true);
                } catch (e) {
                  console.warn("Auto play after ready error:", e);
                }
              }
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
              if (event.data === 1) {
                setIsPlaying(true);
                setIsBuffering(false);
              } else if (event.data === 2) {
                setIsPlaying(false);
                setIsBuffering(false);
              } else if (event.data === 3) {
                setIsBuffering(true);
              } else if (event.data === 0) {
                handleNextTrack(true);
              }
            },
            onError: (event: any) => {
              console.warn("YouTube player error event code:", event.data);
              setIsBuffering(false);
              setIsPlaying(false);
              showStatus("Track restricted for embedding. Skipping...");
              setTimeout(() => {
                handleNextTrack();
              }, 1200);
            }
          }
        });
        return true;
      } catch (err) {
        console.error("Failed to initialize YT.Player:", err);
        return false;
      }
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api-script")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === "function") prevCallback();
        setupPlayer();
      };

      // Periodic check in case onYouTubeIframeAPIReady already fired
      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player && !playerRef.current) {
          if (setupPlayer()) {
            clearInterval(checkInterval);
          }
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  // Time update polling
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (playerRef.current && isPlayerReady.current && !isSeeking.current) {
        try {
          const current = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof current === "number" && !isNaN(current)) setCurrentTime(current);
          if (typeof dur === "number" && !isNaN(dur) && dur > 0) setDuration(dur);
        } catch {
          // ignore
        }
      }
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Load new track when index changes or track id changes
  useEffect(() => {
    if (!currentTrack || !playerRef.current || !isPlayerReady.current) return;
    try {
      if (isPlaying) {
        playerRef.current.loadVideoById(currentTrack.id);
      } else {
        playerRef.current.cueVideoById(currentTrack.id);
      }
      setCurrentTime(0);
      setDuration(currentTrack.duration || 0);
    } catch (e) {
      console.warn("YouTube player loadVideoById error:", e);
    }
  }, [currentIndex, currentTrack?.id, isPlayerReadyState]);

  // Volume & Mute handling
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady.current) return;
    try {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      }
    } catch {
      // ignore
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!currentTrack) return;

    if (!playerRef.current || !isPlayerReady.current) {
      // Player is still bootstrapping, queue the play command
      pendingPlayRef.current = true;
      setIsPlaying(true);
      setIsBuffering(true);
      showStatus("Connecting to YouTube...");
      return;
    }

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn("togglePlay error:", err);
    }
  };

  const playSpecificTrack = (idx: number) => {
    setCurrentIndex(idx);
    setIsPlaying(true);
    if (playerRef.current && isPlayerReady.current) {
      try {
        playerRef.current.loadVideoById(tracks[idx].id);
      } catch (e) {
        console.warn("playSpecificTrack error:", e);
      }
    } else {
      pendingPlayRef.current = true;
    }
  };

  const handleNextTrack = (autoEnded = false) => {
    if (tracks.length === 0) return;
    if (autoEnded && repeatMode === "one") {
      if (playerRef.current && isPlayerReady.current) {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      }
      return;
    }

    let nextIdx = (currentIndex + 1) % tracks.length;
    if (isShuffle && tracks.length > 1) {
      nextIdx = Math.floor(Math.random() * tracks.length);
      if (nextIdx === currentIndex) {
        nextIdx = (currentIndex + 1) % tracks.length;
      }
    }

    setCurrentIndex(nextIdx);
    setIsPlaying(true);
    if (playerRef.current && isPlayerReady.current) {
      try {
        playerRef.current.loadVideoById(tracks[nextIdx].id);
      } catch {}
    }
  };

  const handlePrevTrack = () => {
    if (tracks.length === 0) return;
    if (currentTime > 4 && playerRef.current && isPlayerReady.current) {
      playerRef.current.seekTo(0, true);
      return;
    }
    const prevIdx = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prevIdx);
    setIsPlaying(true);
    if (playerRef.current && isPlayerReady.current) {
      try {
        playerRef.current.loadVideoById(tracks[prevIdx].id);
      } catch {}
    }
  };

  const cycleRepeat = () => {
    if (repeatMode === "off") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("off");
  };

  // Search & Genre handling
  const executeSearch = async (query: string, genreId?: string) => {
    const trimmed = query.trim();
    setIsLoading(true);

    // Check if input is a YouTube URL or direct Video ID
    const directId = extractYouTubeVideoId(trimmed);
    if (directId) {
      showStatus("Resolving YouTube link...");
      const track = await fetchYouTubeVideoDetails(directId);
      if (track) {
        const updated = [track, ...tracks.filter((t) => t.id !== track.id)];
        setTracks(updated);
        setCurrentIndex(0);
        setCurrentTime(0);
        setIsPlaying(true);
        if (playerRef.current && isPlayerReady.current) {
          playerRef.current.loadVideoById(track.id);
        } else {
          pendingPlayRef.current = true;
        }
        showStatus(`Playing: ${track.title}`);
        setIsLoading(false);
        return;
      }
    }

    // Standard search
    const results = await searchYouTubeTracks(trimmed);
    if (results.length > 0) {
      setTracks(results);
      setCurrentIndex(0);
      setCurrentTime(0);
    } else {
      showStatus("No tracks found");
    }
    setIsLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setTracks(CURATED_TRACKS);
      return;
    }
    executeSearch(searchQuery);
  };

  // Progress Bar Scrubber
  const updateSeekFromEvent = (e: MouseEvent | React.MouseEvent) => {
    if (!progressContainerRef.current || !duration) return;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (clickX / rect.width) * duration;
    setCurrentTime(newTime);
    return newTime;
  };

  const handleSeekMouseDown = (e: React.MouseEvent) => {
    isSeeking.current = true;
    const newTime = updateSeekFromEvent(e);

    const onMouseMove = (ev: MouseEvent) => {
      if (isSeeking.current) updateSeekFromEvent(ev);
    };

    const onMouseUp = (ev: MouseEvent) => {
      if (isSeeking.current) {
        const finalTime = updateSeekFromEvent(ev) ?? newTime;
        if (playerRef.current && isPlayerReady.current && finalTime !== undefined) {
          playerRef.current.seekTo(finalTime, true);
        }
        isSeeking.current = false;
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  // Compute position: right-aligned by default (x=-1 is sentinel)
  const getPositionStyle = (widthEstimate: number): React.CSSProperties => {
    const x = dragPos.x === -1 ? window.innerWidth - widthEstimate - 16 : dragPos.x;
    return {
      position: "fixed",
      top: `${dragPos.y}px`,
      left: `${x}px`,
      right: "auto"
    };
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, a, form")) return;
    e.preventDefault();
    isDragging.current = true;
    hasDragged.current = false;
    setIsDraggingState(true);
    const rect = (e.currentTarget as HTMLElement)
      .closest("[data-draggable]")
      ?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      hasDragged.current = true;
      const newX = Math.max(
        0,
        Math.min(ev.clientX - dragOffset.current.x, window.innerWidth - 60)
      );
      const newY = Math.max(
        0,
        Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - 60)
      );
      setDragPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      setIsDraggingState(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const isHidden = isMinimized || hide;
  const cardClassName = [
    "z-40 pointer-events-auto w-[345px] max-w-[calc(100vw-1.5rem)] rounded-3xl bg-[#1c1c1e]/90 backdrop-blur-3xl border border-white/20 shadow-2xl text-white select-none font-sans",
    isDraggingState ? "" : "transition-all duration-300",
    isHidden ? "!opacity-0 !pointer-events-none !scale-95" : "opacity-100 scale-100"
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {/* 
        CRITICAL FOR PLAYBACK:
        Always keep the YouTube IFrame container mounted with a valid size (at least 320x180).
        When showVideo is false, place it offscreen so YouTube player never throws 0x0 viewport errors.
      */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          showVideo
            ? "h-[195px] w-full bg-black relative rounded-t-3xl block"
            : "fixed -left-[9999px] -top-[9999px] w-[320px] h-[180px] pointer-events-none opacity-[0.01]"
        }`}
        style={showVideo ? {} : { zIndex: -1000 }}
      >
        <div id="youtube-widget-audio-player" className="w-full h-full" />
      </div>

      {/* Minimized Pill View */}
      {isMinimized && !hide && (
        <div
          data-draggable
          className="z-40 pointer-events-auto flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-[#181818]/90 backdrop-blur-2xl border border-white/20 text-white shadow-xl cursor-grab hover:bg-[#202020]/95 transition active:cursor-grabbing"
          style={getPositionStyle(220)}
          onMouseDown={handleDragStart}
          onClick={() => {
            if (!hasDragged.current) setIsMinimized(false);
          }}
          title="Drag to move · Click to expand"
        >
          <div
            className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ${
              isPlaying ? "animate-spin animate-duration-[4000ms]" : ""
            }`}
          >
            <img
              src={
                currentTrack?.thumbnail ||
                "https://i.ytimg.com/vi/ApXoWvfEYVU/hqdefault.jpg"
              }
              alt="cover"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col max-w-[120px]">
            <span className="text-[11px] font-semibold truncate leading-tight">
              {currentTrack?.title || "YouTube Music"}
            </span>
            <span className="text-[9px] text-white/70 truncate">
              {currentTrack?.artist || "YouTube"}
            </span>
          </div>
          <button
            className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            {isPlaying ? (
              <span className="i-bi:pause-fill" />
            ) : (
              <span className="i-bi:play-fill ml-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Full Music Player Card */}
      <div
        ref={widgetRef}
        data-draggable
        className={cardClassName}
        style={getPositionStyle(345)}
      >
        {/* Status / Error Toast Banner */}
        {statusMessage && (
          <div className="px-3 py-1 bg-gradient-to-r from-emerald-600/90 to-teal-700/90 text-white text-[11px] font-medium text-center rounded-t-3xl flex items-center justify-center space-x-1.5 animate-fadeIn">
            <span className="i-bi:info-circle-fill text-xs" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        {/* Main Glassmorphism Player Card */}
        <div className="p-3.5 flex flex-col space-y-3">
          {/* Top Row: Track Thumbnail, Title, Artist & Actions (also Drag Handle) */}
          <div
            className="flex items-center space-x-3 cursor-grab active:cursor-grabbing"
            onMouseDown={handleDragStart}
          >
            {/* Thumbnail Artwork */}
            <div className="relative group w-14 h-14 flex-shrink-0 rounded-2xl overflow-hidden bg-black/40 shadow-lg border border-white/15">
              <img
                src={
                  currentTrack?.thumbnail ||
                  "https://i.ytimg.com/vi/ApXoWvfEYVU/hqdefault.jpg"
                }
                alt={currentTrack?.title || "thumbnail"}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isPlaying ? "scale-105" : "scale-100"
                }`}
              />
              {isBuffering && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="i-svg-spinners:180-ring-with-bg text-base text-white" />
                </div>
              )}
            </div>

            {/* Title, Artist & Now Playing indicator */}
            <div className="flex-1 min-w-0 pr-1">
              {isPlaying && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ed760] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1ed760]" />
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-[#1ed760]">
                    Now Playing
                  </span>
                </div>
              )}
              <h4
                className="text-[13px] font-bold text-white leading-snug truncate"
                title={currentTrack?.title}
              >
                {currentTrack?.title || "Select a song"}
              </h4>
              <p
                className="text-[11px] text-white/70 truncate mt-0.5"
                title={currentTrack?.artist}
              >
                {currentTrack?.artist || "YouTube Music"}
              </p>
            </div>

            {/* Top Right Actions: Like, Video, Drawer, Minimize */}
            <div className="flex items-center space-x-2 text-white/80">
              {currentTrack && (
                <button
                  onClick={() => toggleLike(currentTrack.id)}
                  className="hover:scale-110 active:scale-95 transition"
                  title={likedTracks[currentTrack.id] ? "Unlike" : "Like"}
                >
                  {likedTracks[currentTrack.id] ? (
                    <span className="i-bi:heart-fill text-[#1ed760] text-sm" />
                  ) : (
                    <span className="i-bi:heart text-white/70 hover:text-white text-sm" />
                  )}
                </button>
              )}

              {/* Video View Toggle */}
              <button
                onClick={() => setShowVideo(!showVideo)}
                className={`hover:scale-110 active:scale-95 transition ${
                  showVideo ? "text-red-500" : "text-white/70 hover:text-white"
                }`}
                title={showVideo ? "Hide Video View" : "Show Video View"}
              >
                <span className="i-bi:youtube text-base" />
              </button>

              {/* Playlist & Search Drawer */}
              <button
                onClick={() => setShowDrawer(!showDrawer)}
                className={`hover:scale-110 active:scale-95 transition ${
                  showDrawer ? "text-[#1ed760]" : "text-white/70 hover:text-white"
                }`}
                title="YouTube Search & Playlists"
              >
                <span className="i-bi:music-note-list text-sm" />
              </button>

              {/* Minimize Pill */}
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white/60 hover:text-white hover:scale-110 active:scale-95 transition"
                title="Minimize to Pill"
              >
                <span className="i-bi:chevron-up text-xs" />
              </button>
            </div>
          </div>

          {/* Center Controls: Shuffle, Prev, Play/Pause, Next, Repeat */}
          <div className="flex items-center justify-center space-x-5 py-0.5">
            {/* Shuffle Button */}
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`transition hover:scale-110 active:scale-90 relative ${
                isShuffle ? "text-[#1ed760]" : "text-white/60 hover:text-white"
              }`}
              title={`Shuffle: ${isShuffle ? "On" : "Off"}`}
            >
              <span className="i-bi:shuffle text-sm" />
              {isShuffle && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1ed760]" />
              )}
            </button>

            {/* Previous Track */}
            <button
              onClick={handlePrevTrack}
              className="text-white/80 hover:text-white transition hover:scale-110 active:scale-90"
              title="Previous Track"
            >
              <span className="i-bi:skip-backward-fill text-sm" />
            </button>

            {/* Big Play/Pause Circular Button */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <span className="i-bi:pause-fill text-lg" />
              ) : (
                <span className="i-bi:play-fill text-lg ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={() => handleNextTrack()}
              className="text-white/80 hover:text-white transition hover:scale-110 active:scale-90"
              title="Next Track"
            >
              <span className="i-bi:skip-forward-fill text-sm" />
            </button>

            {/* Repeat Mode */}
            <button
              onClick={cycleRepeat}
              className={`transition hover:scale-110 active:scale-90 relative ${
                repeatMode !== "off" ? "text-[#1ed760]" : "text-white/60 hover:text-white"
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === "one" ? (
                <span className="i-bi:repeat-1 text-sm font-bold" />
              ) : (
                <span className="i-bi:repeat text-sm" />
              )}
              {repeatMode !== "off" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1ed760]" />
              )}
            </button>
          </div>

          {/* Timeline Progress Bar */}
          <div className="flex items-center space-x-2.5 text-[10px] text-white/70 font-mono select-none">
            <span className="w-7 text-right">{formatTime(currentTime)}</span>
            <div
              ref={progressContainerRef}
              onMouseDown={handleSeekMouseDown}
              className="group relative flex-1 h-3 flex items-center cursor-pointer"
            >
              {/* Background Track */}
              <div className="w-full h-1 bg-white/20 rounded-full group-hover:h-1.5 transition-all overflow-hidden relative">
                {/* Orange Gradient Scrubber Fill */}
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {/* Scrubber Thumb */}
              <div
                className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-md -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
            <span className="w-7 text-left">{formatTime(duration)}</span>
          </div>

          {/* Bottom Toolbar: Volume Slider */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-white/70 text-xs">
            <div className="flex items-center space-x-1 text-white/40 text-[10px]">
              <span className="i-bi:youtube text-xs text-red-500" />
              <span className="font-mono">YouTube Music</span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-white/70 hover:text-white transition"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <span className="i-bi:volume-mute-fill text-xs text-red-400" />
                ) : (
                  <span className="i-bi:volume-up-fill text-xs" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 h-1 bg-white/25 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>
        </div>

        {/* Expandable YouTube Search & Playlist Drawer */}
        {showDrawer && (
          <div className="p-3 border-t border-white/15 bg-black/60 rounded-b-3xl flex flex-col space-y-2.5 max-h-[310px]">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search song or paste YouTube link/ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-7 pl-7 pr-7 text-xs bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition"
              />
              <span className="i-bi:search absolute left-2 text-xs text-white/50" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setTracks(CURATED_TRACKS);
                  }}
                  className="absolute right-2 text-white/50 hover:text-white text-xs"
                >
                  <span className="i-bi:x-lg" />
                </button>
              )}
            </form>

            {/* Tracks List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[200px] scrollbar-thin">
              {isLoading ? (
                <div className="flex items-center justify-center py-6 space-x-2 text-white/60 text-xs">
                  <span className="i-svg-spinners:180-ring-with-bg text-sm text-red-400" />
                  <span>Searching YouTube...</span>
                </div>
              ) : tracks.length === 0 ? (
                <div className="text-center py-5 text-xs text-white/50 space-y-1">
                  <p>No matching tracks found</p>
                  <p className="text-[10px] text-white/40">
                    Paste any YouTube URL or 11-char Video ID to play it!
                  </p>
                </div>
              ) : (
                tracks.map((track, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => playSpecificTrack(idx)}
                      className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition ${
                        isCurrent
                          ? "bg-white/20 border border-white/30 text-white"
                          : "hover:bg-white/10 text-white/80"
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-black/30">
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          {isCurrent && isPlaying && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="i-svg-spinners:bars-scale-middle text-xs text-[#1ed760]" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className={`text-xs truncate leading-tight ${
                              isCurrent ? "font-bold text-[#1ed760]" : "text-white"
                            }`}
                          >
                            {track.title}
                          </span>
                          <span className="text-[10px] text-white/60 truncate">
                            {track.artist}
                          </span>
                        </div>
                      </div>
                      {track.duration ? (
                        <span className="text-[10px] font-mono text-white/50 ml-2">
                          {formatTime(track.duration)}
                        </span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
