import { useEffect, useRef } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ElfsightApp?: any;
  }
}

const ELFSIGHT_APP_ID = "elfsight-app-4cd1038a-336f-4d19-80ec-3d0c4026f392";

export default function Gallery() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Re-initialise the Elfsight widget whenever the Gallery window mounts.
  // Elfsight's platform.js scans the DOM for [data-elfsight-app-lazy] nodes on
  // load, but if the node is added dynamically (React mount) we need to prod it.
  useEffect(() => {
    if (window.ElfsightApp && containerRef.current) {
      try {
        // Elfsight exposes `reloadWidget` or `init` depending on version
        window.ElfsightApp?.init?.();
      } catch {
        // silent – the script will pick it up on its own async scan
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto bg-black"
      style={{ minHeight: 0 }}
    >
      {/* Elfsight Instagram Feed widget */}
      <div
        className={ELFSIGHT_APP_ID}
        data-elfsight-app-lazy
        style={{ width: "100%", height: "80%" }}
      />
    </div>
  );
}
