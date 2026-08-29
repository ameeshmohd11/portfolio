import React, { useRef } from "react";
import { music } from "~/configs";

interface CCMProps {
  toggleControlCenter: () => void;
  toggleAudio: (target: boolean) => void;
  setBrightness: (value: number) => void;
  setVolume: (value: number) => void;
  playing: boolean;
  btnRef: React.RefObject<HTMLDivElement>;
}

const GlassSlider = ({
  icon,
  value,
  setValue,
  title
}: {
  icon: string;
  value: number;
  setValue: (v: number) => void;
  title: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateFromMouse = (e: MouseEvent | React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const percent = Math.round((x / rect.width) * 100);
    setValue(Math.max(1, Math.min(100, percent)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    updateFromMouse(e);

    const onMouseMove = (ev: MouseEvent) => {
      if (isDragging.current) updateFromMouse(ev);
    };
    const onMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="p-2.5 rounded-2xl backdrop-blur-2xl bg-white/15 dark:bg-white/10 border border-white/20 shadow-sm flex flex-col justify-center">
      <div className="text-[11px] font-semibold text-white/80 mb-1.5 px-0.5">{title}</div>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="relative w-full h-6.5 rounded-full bg-black/20 dark:bg-black/40 overflow-hidden cursor-pointer flex items-center select-none"
      >
        <div
          className="h-full bg-white/90 dark:bg-white/80 transition-all rounded-full"
          style={{ width: `${value}%` }}
        />
        <div className="absolute left-2.5 flex items-center pointer-events-none">
          <span className={`${icon} text-xs ${value > 15 ? "text-gray-800" : "text-white"}`} />
        </div>
      </div>
    </div>
  );
};

export default function ControlCenterMenu({
  toggleControlCenter,
  toggleAudio,
  setBrightness,
  setVolume,
  playing,
  btnRef
}: CCMProps) {
  const controlCenterRef = useRef<HTMLDivElement>(null);
  const { dark, wifi, brightness, bluetooth, airdrop, fullscreen, volume } = useStore(
    (state) => ({
      dark: state.dark,
      wifi: state.wifi,
      brightness: state.brightness,
      bluetooth: state.bluetooth,
      airdrop: state.airdrop,
      fullscreen: state.fullscreen,
      volume: state.volume
    })
  );
  const { toggleWIFI, toggleBluetooth, toggleAirdrop, toggleDark, toggleFullScreen } =
    useStore((state) => ({
      toggleWIFI: state.toggleWIFI,
      toggleBluetooth: state.toggleBluetooth,
      toggleAirdrop: state.toggleAirdrop,
      toggleDark: state.toggleDark,
      toggleFullScreen: state.toggleFullScreen
    }));

  useClickOutside(controlCenterRef, toggleControlCenter, [btnRef]);

  return (
    <div
      ref={controlCenterRef}
      className="w-[325px] max-w-[calc(100vw-1rem)] shadow-2xl p-3 text-white backdrop-blur-3xl bg-white/20 dark:bg-black/35 border border-white/25 dark:border-white/10 rounded-[26px] flex flex-col space-y-2.5 select-none"
      pos="fixed top-9 right-1 sm:right-2 z-30"
    >
      {/* Top Section: Left Pills + Right Music Card */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Left Pills */}
        <div className="flex flex-col justify-between space-y-2">
          {/* Wi-Fi Pill */}
          <div
            onClick={toggleWIFI}
            className={`h-14 px-2.5 rounded-2xl flex items-center space-x-2.5 cursor-pointer backdrop-blur-2xl border transition-all active:scale-95 ${
              wifi
                ? "bg-blue-500/80 border-blue-400/40 text-white shadow-md shadow-blue-500/20"
                : "bg-white/15 dark:bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
            }`}
          >
            <div
              className={`w-8.5 h-8.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                wifi ? "bg-white text-blue-500 shadow" : "bg-white/20 text-white"
              }`}
            >
              <span className="i-material-symbols:wifi text-base" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs leading-tight">Wi-Fi</span>
              <span className="text-[10px] opacity-75 truncate">{wifi ? "Home 5G" : "Off"}</span>
            </div>
          </div>

          {/* Focus / Dark Mode Pill */}
          <div
            onClick={toggleDark}
            className={`h-14 px-2.5 rounded-2xl flex items-center space-x-2.5 cursor-pointer backdrop-blur-2xl border transition-all active:scale-95 ${
              dark
                ? "bg-indigo-600/80 border-indigo-400/40 text-white shadow-md shadow-indigo-500/20"
                : "bg-white/15 dark:bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
            }`}
          >
            <div
              className={`w-8.5 h-8.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                dark ? "bg-white text-indigo-600 shadow" : "bg-white/20 text-white"
              }`}
            >
              {dark ? (
                <span className="i-ion:moon text-sm" />
              ) : (
                <span className="i-ion:sunny text-sm" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs leading-tight">Focus</span>
              <span className="text-[10px] opacity-75 truncate">{dark ? "Dark" : "Light"}</span>
            </div>
          </div>
        </div>

        {/* Right Music Player Card */}
        <div className="h-[120px] p-2.5 rounded-2xl flex flex-col justify-between backdrop-blur-2xl bg-white/15 dark:bg-white/10 border border-white/20 shadow-sm">
          <div className="flex items-center space-x-2">
            <img
              className="w-10 h-10 rounded-xl object-cover shadow-sm flex-shrink-0"
              src={music.cover}
              alt="cover"
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs truncate leading-tight text-white">{music.title}</div>
              <div className="text-[10px] opacity-75 truncate text-white/80">{music.artist}</div>
            </div>
          </div>

          {/* Music Controls */}
          <div className="flex items-center justify-around px-1 pt-1">
            <button
              className="text-white/80 hover:text-white transition active:scale-90"
              onClick={() => toggleAudio(!playing)}
            >
              <span className="i-bi:skip-backward-fill text-xs" />
            </button>
            <button
              className="w-7 h-7 rounded-full bg-white/25 hover:bg-white/35 flex items-center justify-center text-white transition active:scale-90 shadow"
              onClick={() => toggleAudio(!playing)}
            >
              {playing ? (
                <span className="i-bi:pause-fill text-sm" />
              ) : (
                <span className="i-bi:play-fill text-sm ml-0.5" />
              )}
            </button>
            <button
              className="text-white/80 hover:text-white transition active:scale-90"
              onClick={() => toggleAudio(!playing)}
            >
              <span className="i-bi:skip-forward-fill text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Row of 4 Circular Quick Toggles */}
      <div className="grid grid-cols-4 gap-2">
        {/* Bluetooth */}
        <div
          onClick={toggleBluetooth}
          className={`h-12 rounded-2xl flex items-center justify-center cursor-pointer backdrop-blur-2xl border transition-all active:scale-95 ${
            bluetooth
              ? "bg-blue-500/80 border-blue-400/40 text-white shadow-md shadow-blue-500/20"
              : "bg-white/15 dark:bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
          }`}
          title="Bluetooth"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              bluetooth ? "bg-white text-blue-500 shadow" : "bg-white/20 text-white"
            }`}
          >
            <span className="i-charm:bluetooth text-sm" />
          </div>
        </div>

        {/* AirDrop */}
        <div
          onClick={toggleAirdrop}
          className={`h-12 rounded-2xl flex items-center justify-center cursor-pointer backdrop-blur-2xl border transition-all active:scale-95 ${
            airdrop
              ? "bg-blue-500/80 border-blue-400/40 text-white shadow-md shadow-blue-500/20"
              : "bg-white/15 dark:bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
          }`}
          title="AirDrop"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              airdrop ? "bg-white text-blue-500 shadow" : "bg-white/20 text-white"
            }`}
          >
            <span className="i-material-symbols:rss-feed-rounded text-sm" />
          </div>
        </div>

        {/* Keyboard Brightness */}
        <div
          className="h-12 rounded-2xl flex items-center justify-center cursor-pointer backdrop-blur-2xl bg-white/15 dark:bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all active:scale-95"
          title="Keyboard Brightness"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center">
            <span className="i-bi:brightness-alt-high text-sm" />
          </div>
        </div>

        {/* Fullscreen */}
        <div
          onClick={() => toggleFullScreen(!fullscreen)}
          className={`h-12 rounded-2xl flex items-center justify-center cursor-pointer backdrop-blur-2xl border transition-all active:scale-95 ${
            fullscreen
              ? "bg-blue-500/80 border-blue-400/40 text-white shadow-md shadow-blue-500/20"
              : "bg-white/15 dark:bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
          }`}
          title={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              fullscreen ? "bg-white text-blue-500 shadow" : "bg-white/20 text-white"
            }`}
          >
            {fullscreen ? (
              <span className="i-bi:fullscreen-exit text-sm" />
            ) : (
              <span className="i-bi:fullscreen text-sm" />
            )}
          </div>
        </div>
      </div>

      {/* Sliders */}
      <GlassSlider
        icon="i-ion:sunny"
        value={brightness}
        setValue={setBrightness}
        title="Display"
      />
      <GlassSlider
        icon="i-ion:volume-high"
        value={volume}
        setValue={setVolume}
        title="Sound"
      />
    </div>
  );
}
