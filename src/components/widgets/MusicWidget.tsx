import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  YouTubeTrack,
  CURATED_TRACKS,
  YOUTUBE_GENRES,
  searchYouTubeTracks,
  getStoredYouTubeApiKey,
  setStoredYouTubeApiKey
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
  const [activeGenre, setActiveGenre] = useState<string>("trending");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: -1, y: 40 });
  const [isDraggingState, setIsDraggingState] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const isPlayerReady = useRef<boolean>(false);
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const isSeeking = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const isDragging = useRef<boolean>(false);
  const hasDragged = useRef<boolean>(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const currentTrack: YouTubeTrack | undefined = tracks[currentIndex];

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

  // Load YouTube IFrame API Script
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player("youtube-widget-audio-player", {
        height: "100%",
        width: "100%",
        videoId: currentTrack?.id || CURATED_TRACKS[0].id,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            isPlayerReady.current = true;
            event.target.setVolume(volume);
            if (isMuted) event.target.mute();
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
          onError: () => {
            setIsBuffering(false);
            setIsPlaying(false);
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
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

  // Load new track when index changes
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
  }, [currentIndex, currentTrack?.id]);

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
    if (!playerRef.current || !isPlayerReady.current || !currentTrack) return;
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

  const handleNextTrack = (autoEnded = false) => {
    if (tracks.length === 0) return;
    if (autoEnded && repeatMode === "one") {
      if (playerRef.current && isPlayerReady.current) {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      }
      return;
    }
    if (isShuffle) {
      const nextIdx = Math.floor(Math.random() * tracks.length);
      setCurrentIndex(nextIdx);
    } else {
      const nextIdx = (currentIndex + 1) % tracks.length;
      setCurrentIndex(nextIdx);
    }
    setIsPlaying(true);
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
  };

  const cycleRepeat = () => {
    if (repeatMode === "off") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("off");
  };

  // Search & Genre handling
  const executeSearch = async (query: string) => {
    setIsLoading(true);
    const results = await searchYouTubeTracks(query);
    if (results.length > 0) {
      setTracks(results);
      setCurrentIndex(0);
      setCurrentTime(0);
    }
    setIsLoading(false);
  };

  const handleGenreClick = async (genre: (typeof YOUTUBE_GENRES)[0]) => {
    setActiveGenre(genre.id);
    setSearchQuery("");
    executeSearch(genre.query);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
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

  // Compute initial position: right-aligned by default (x=-1 is sentinel)
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
    // Don't drag from buttons/inputs
    if ((e.target as HTMLElement).closest("button, input, a")) return;
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

  if (hide) return null;

  return (
    <>
      {/* Minimized Pill */}
      {isMinimized && (
        <div
          data-draggable
          className="z-0 pointer-events-auto flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-[#181818]/85 backdrop-blur-2xl border border-white/15 text-white shadow-xl cursor-grab hover:bg-[#202020]/90 transition active:cursor-grabbing"
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
                "https://i.ytimg.com/vi/3Q8iuY9005E/hqdefault.jpg"
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

      <div
        ref={widgetRef}
        data-draggable
        className={`z-0 pointer-events-auto w-[345px] max-w-[calc(100vw-1.5rem)] rounded-3xl bg-[#1c1c1e]/90 backdrop-blur-3xl border border-white/15 shadow-2xl text-white select-none font-sans ${isDraggingState ? "" : "transition-all duration-300"} ${isMinimized ? "!w-0 !h-0 !overflow-hidden !opacity-0 !pointer-events-none" : ""}`}
        style={{
          ...getPositionStyle(345),
          ...(isMinimized
            ? {
                position: "absolute" as const,
                opacity: 0,
                pointerEvents: "none" as const
              }
            : {})
        }}
      >
        {/* Hidden YouTube IFrame Container (or live preview when showVideo is true) */}
        <div
          className={`transition-all duration-300 overflow-hidden rounded-t-3xl ${
            showVideo
              ? "h-[195px] w-full bg-black relative"
              : "w-0 h-0 opacity-0 pointer-events-none absolute"
          }`}
        >
          <div id="youtube-widget-audio-player" className="w-full h-full" />
        </div>

        {/* Main Glassmorphism Player Card */}
        <div className="p-3.5 flex flex-col space-y-3">
          {/* Top Row: Track Thumbnail, Title, Artist & Header Actions — also the drag handle */}
          <div
            className="flex items-center space-x-3 cursor-grab active:cursor-grabbing"
            onMouseDown={handleDragStart}
          >
            {/* Thumbnail Artwork */}
            <div className="relative group w-14 h-14 flex-shrink-0 rounded-2xl overflow-hidden bg-black/40 shadow-lg border border-white/10">
              <img
                src={
                  currentTrack?.thumbnail ||
                  "https://i.ytimg.com/vi/3Q8iuY9005E/hqdefault.jpg"
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

            {/* Top Right Actions: Heart Like, Video Toggle, Drawer Toggle, Minimize */}
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

          {/* Center Controls: Shuffle, Prev, Big Play/Pause, Next, Repeat */}
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
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <span className="i-bi:pause-fill text-base" />
              ) : (
                <span className="i-bi:play-fill text-base ml-0.5" />
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
                {/* Orange Gradient Scrubber Fill matching reference screenshot */}
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
            <div className="flex items-center space-x-2 text-white/40">
              <span className="i-bi:music-note text-xs" />
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

        {/* Expandable YouTube Search & Genre Playlist Drawer */}
        {showDrawer && (
          <div className="p-3 border-t border-white/15 bg-black/50 rounded-b-3xl flex flex-col space-y-2.5 max-h-[290px]">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search any song, artist, video on YouTube..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-7 pl-7 pr-7 text-xs bg-white/10 border border-white/15 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition"
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

            {/* Genre & Trending Category Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              {YOUTUBE_GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre)}
                  className={`px-2 py-0.5 rounded-full whitespace-nowrap transition border ${
                    activeGenre === genre.id && !searchQuery
                      ? "bg-white/25 border-white/40 text-white font-semibold"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/15"
                  }`}
                >
                  {genre.label}
                </button>
              ))}
            </div>

            {/* Tracks List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[160px] scrollbar-thin">
              {isLoading ? (
                <div className="flex items-center justify-center py-6 space-x-2 text-white/60 text-xs">
                  <span className="i-svg-spinners:180-ring-with-bg text-sm text-red-400" />
                  <span>Searching YouTube...</span>
                </div>
              ) : tracks.length === 0 ? (
                <div className="text-center py-4 text-xs text-white/50">
                  No tracks found
                </div>
              ) : (
                tracks.map((track, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsPlaying(true);
                      }}
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
