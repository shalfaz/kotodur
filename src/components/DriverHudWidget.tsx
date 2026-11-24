"use client";

import React from "react";
import { ArrowDown, ArrowUp, Navigation, Radio, ShieldAlert } from "lucide-react";
import { Bus, BusStop } from "@/lib/simulationEngine";

interface DriverHudWidgetProps {
  buses: Bus[];
  stops: BusStop[];
  selectedBusId: string;
  onSelectBus: (busId: string) => void;
  idealHeadway: number;
  theme: "dark" | "light";
}

export const DriverHudWidget: React.FC<DriverHudWidgetProps> = ({
  buses,
  stops,
  selectedBusId,
  onSelectBus,
  idealHeadway,
  theme,
}) => {
  const isDark = theme === "dark";
  const bus = buses.find((b) => b.id === selectedBusId) ?? buses[1] ?? buses[0];
  if (!bus) return null;

  const isJammed = bus.jamTimer > 0;
  const isHolding = !isJammed && bus.state === "HOLDING";
  const isBoarding = !isJammed && bus.state === "BOARDING";

  let activeStopLabel = "En Route";
  if (bus.currentStopId !== null && stops[bus.currentStopId]) {
    activeStopLabel = stops[bus.currentStopId].name;
  } else {
    let minAhead = Infinity;
    let nextStop: BusStop | null = null;
    for (const s of stops) {
      const dist = (s.position - bus.position + 1000) % 1000;
      if (dist > 0.5 && dist < minAhead) {
        minAhead = dist;
        nextStop = s;
      }
    }
    if (nextStop) activeStopLabel = `Next: ${nextStop.name}`;
  }

  const totalGap = Math.max(1, bus.distanceFrontMeters + bus.distanceBackMeters);
  const busMarkerPct = Math.min(
    90,
    Math.max(10, (bus.distanceBackMeters / totalGap) * 100)
  );

  return (
    <div
      className={`rounded-xl border p-3.5 ${
        isDark
          ? "border-slate-800 bg-[#0b1220]"
          : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-[#06B6D4]" />
          <h3
            className={`text-xs font-semibold tracking-wide ${
              isDark ? "text-slate-200" : "text-slate-800"
            }`}
          >
            Live Driver HUD
          </h3>
        </div>
        <span className="font-mono text-[10px] text-slate-400">
          CAB TELEMETRY
        </span>
      </div>

      {/* Bus Selector Strip */}
      <div className="mb-3 grid grid-cols-6 gap-1">
        {buses.map((b) => {
          const active = b.id === bus.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBus(b.id)}
              className={`rounded-md py-1 font-mono text-[10px] font-bold transition ${
                active
                  ? "bg-[#06B6D4] text-slate-950 shadow-sm shadow-cyan-500/30"
                  : isDark
                    ? "border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    : "border border-slate-200 bg-slate-100 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              {b.id.replace("KD-", "")}
            </button>
          );
        })}
      </div>

      {/* Sleek Mobile Phone Frame (Always high-contrast dark cab screen) */}
      <div
        className={`mx-auto max-w-[276px] rounded-[24px] border-2 bg-[#070d18] p-2.5 shadow-lg ${
          isDark
            ? "border-slate-700/90 shadow-black/40"
            : "border-slate-800 shadow-slate-400/30"
        }`}
      >
        <div className="mb-2 flex items-center justify-between px-2 pt-0.5 font-mono text-[9px] text-slate-400">
          <span>{bus.id}</span>
          <div className="h-2.5 w-14 rounded-full bg-slate-900 ring-1 ring-slate-800" />
          <span className="text-emerald-400">5G LIVE</span>
        </div>

        <div className="space-y-2.5 rounded-[16px] border border-slate-800/90 bg-[#0F172A] p-3">
          {isJammed ? (
            <div className="rounded-xl border border-rose-500/50 bg-rose-500/15 px-3 py-2 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-300">
                <ShieldAlert className="h-3.5 w-3.5" />
                Traffic Jam Stall
              </div>
              <div className="mt-0.5 font-mono text-base font-extrabold tracking-tight text-rose-400">
                STALLED: {Math.ceil(bus.jamTimer)}s
              </div>
            </div>
          ) : isHolding ? (
            <div className="rounded-xl border border-[#F59E0B]/60 bg-[#F59E0B]/15 px-3 py-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                AI Headway Directive
              </div>
              <div className="mt-0.5 font-mono text-base font-extrabold tracking-tight text-[#F59E0B]">
                HOLD AT STOP: {Math.ceil(bus.stateTimer)}s
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/45 bg-emerald-500/12 px-3 py-2 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">
                <Navigation className="h-3 w-3" />
                {isBoarding ? "Boarding Passengers" : "Clear Corridor"}
              </div>
              <div className="mt-0.5 font-mono text-lg font-extrabold tracking-widest text-emerald-400">
                PROCEED
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg bg-slate-900/90 px-2.5 py-1.5 text-[10px]">
            <span className="truncate font-medium text-slate-300">
              {activeStopLabel}
            </span>
            <span className="shrink-0 font-mono text-slate-400">
              {bus.onboardPassengers} pax
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/75 p-2">
              <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                <ArrowUp className="h-3 w-3 text-[#06B6D4]" />
                Bus Ahead
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-slate-100">
                {bus.distanceFrontMeters >= 1000
                  ? `${(bus.distanceFrontMeters / 1000).toFixed(2)} km`
                  : `${bus.distanceFrontMeters} m`}
              </div>
              <div
                className={`font-mono text-[10px] ${
                  bus.headwayFront < idealHeadway * 0.45
                    ? "text-rose-400"
                    : "text-[#06B6D4]"
                }`}
              >
                {bus.headwayFront.toFixed(1)}s gap
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/75 p-2">
              <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                <ArrowDown className="h-3 w-3 text-[#F59E0B]" />
                Bus Behind
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-slate-100">
                {bus.distanceBackMeters >= 1000
                  ? `${(bus.distanceBackMeters / 1000).toFixed(2)} km`
                  : `${bus.distanceBackMeters} m`}
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                {bus.headwayBack.toFixed(1)}s gap
              </div>
            </div>
          </div>

          <div className="pt-0.5">
            <div className="mb-1 flex justify-between font-mono text-[9px] text-slate-500">
              <span>FOLLOWER</span>
              <span>IDEAL CENTER</span>
              <span>LEADER</span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-slate-800">
              <div className="absolute left-1/2 top-0 h-2 w-0.5 -translate-x-1/2 bg-slate-500/70" />
              <div
                className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0F172A] transition-all duration-150 ${
                  isHolding
                    ? "bg-[#F59E0B]"
                    : isJammed
                      ? "bg-rose-500"
                      : "bg-[#06B6D4]"
                }`}
                style={{ left: `${busMarkerPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-slate-700/80" />
      </div>
    </div>
  );
};
