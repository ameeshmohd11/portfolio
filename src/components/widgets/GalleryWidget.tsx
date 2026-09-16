import { useState, useRef, useEffect, useCallback } from "react";

interface GalleryWidgetProps {
  hide?: boolean;
}

const ELFSIGHT_APP_CLASS = "elfsight-app-4cd1038a-336f-4d19-80ec-3d0c4026f392";

export default function GalleryWidget({ hide = false }: GalleryWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({
    x: -1,
    y: 60
  });
  const [isDraggingState, setIsDraggingState] = useState(false);

  const widgetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Elfsight init on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    try {
      w.ElfsightApp?.init?.();
    } catch {
      /* silent */
    }
  }, []);

  // Derived position
  const getPositionStyle = useCallback(
    (widgetWidth: number) => {
      const x = dragPos.x === -1 ? window.innerWidth - widgetWidth - 24 : dragPos.x;
      return {
        position: "absolute" as const,
        left: x,
        top: dragPos.y,
        zIndex: 50
      };
    },
    [dragPos]
  );

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    isDragging.current = true;
    hasDragged.current = false;
    const rect = widgetRef.current?.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0)
    };
    setIsDraggingState(true);

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      hasDragged.current = true;
      setDragPos({
        x: Math.max(
          0,
          Math.min(ev.clientX - dragOffset.current.x, window.innerWidth - 320)
        ),
        y: Math.max(
          28,
          Math.min(ev.clientY - dragOffset.current.y, window.innerHeight - 60)
        )
      });
    };
    const onUp = () => {
      isDragging.current = false;
      setIsDraggingState(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const WIDGET_W = isExpanded ? 480 : 320;
  const WIDGET_H = isExpanded ? 560 : 340;

  if (hide) return null;

  return (
    <>
      {/* Minimised pill */}
      {isMinimized && (
        <div
          data-draggable
          className="z-50 pointer-events-auto flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#181818]/85 backdrop-blur-2xl border border-white/15 text-white shadow-xl cursor-grab hover:bg-[#202020]/90 transition active:cursor-grabbing"
          style={getPositionStyle(160)}
          onMouseDown={handleDragStart}
          onClick={() => {
            if (!hasDragged.current) setIsMinimized(false);
          }}
          title="Gallery - click to expand"
        >
          <span className="i-bi:instagram text-pink-400 text-sm" />
          <span className="text-[11px] font-semibold">Instagram</span>
        </div>
      )}

      {/* Full widget */}
      <div
        ref={widgetRef}
        data-draggable
        className={`pointer-events-auto rounded-3xl bg-[#1c1c1e]/90 backdrop-blur-3xl border border-white/15 shadow-2xl text-white select-none font-sans overflow-hidden ${
          isDraggingState ? "" : "transition-all duration-300"
        } ${
          isMinimized ? "!w-0 !h-0 !overflow-hidden !opacity-0 !pointer-events-none" : ""
        }`}
        style={{
          ...getPositionStyle(WIDGET_W),
          width: WIDGET_W,
          height: WIDGET_H,
          ...(isMinimized ? { opacity: 0, pointerEvents: "none" } : {})
        }}
      >
        {/* Header / drag handle */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 cursor-grab active:cursor-grabbing bg-white/5"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600">
              <span className="i-bi:instagram text-white text-[10px]" />
            </div>
            <span className="text-[13px] font-semibold tracking-tight">Instagram</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Expand / collapse */}
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-white/70 hover:text-white transition"
              title={isExpanded ? "Compact view" : "Expand"}
            >
              <span
                className={
                  isExpanded ? "i-bi:arrows-angle-contract" : "i-bi:arrows-angle-expand"
                }
              />
            </button>

            {/* Minimise */}
            <button
              onClick={() => setIsMinimized(true)}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-amber-400/60 flex items-center justify-center text-[10px] text-white/70 hover:text-white transition"
              title="Minimise"
            >
              <span className="i-bi:dash-lg" />
            </button>
          </div>
        </div>

        {/* Elfsight Instagram Feed */}
        <div className="w-full overflow-y-auto" style={{ height: WIDGET_H - 44 }}>
          <div
            className={ELFSIGHT_APP_CLASS}
            data-elfsight-app-lazy
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </>
  );
}
