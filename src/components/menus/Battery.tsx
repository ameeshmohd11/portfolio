export default function Battery() {
  const batteryState = useBattery();

  const widthPercent = () => {
    return Math.min(100, Math.max(0, Math.round(batteryState.level * 100)));
  };

  const color = () => {
    if (batteryState.charging) return "bg-green-400";
    if (batteryState.level < 0.2) return "bg-red-500";
    else if (batteryState.level < 0.5) return "bg-yellow-500";
    else return "bg-white";
  };

  return (
    <div className="hstack space-x-1.5 items-center">
      <span className="text-xs">{(batteryState.level * 100).toFixed()}%</span>
      <div className="hstack items-center">
        {/* Battery shell outline */}
        <div className="w-[22px] h-[11px] rounded-[3px] border border-white/75 p-[1px] flex items-center relative">
          <div
            className={`h-full rounded-[1.5px] ${color()} transition-all duration-300`}
            style={{ width: `${widthPercent()}%` }}
          />
          {batteryState.charging && (
            <svg
              className="absolute inset-0 m-auto w-2.5 h-2.5 text-black fill-current"
              viewBox="0 0 16 16"
            >
              <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.089z" />
            </svg>
          )}
        </div>
        {/* Battery terminal positive cap */}
        <div className="w-[1.5px] h-[4px] bg-white/75 rounded-r-[1px] ml-[1px]" />
      </div>
    </div>
  );
}
