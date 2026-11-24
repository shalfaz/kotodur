"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertOctagon,
  BookOpen,
  Clock,
  CloudRain,
  Cpu,
  Gauge,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Sun,
  Sunrise,
  TrendingDown,
  Zap,
} from "lucide-react";
import { SimulationCanvas } from "@/components/SimulationCanvas";
import { HeadwayVarianceChart } from "@/components/HeadwayVarianceChart";
import { TimeSpaceDiagram } from "@/components/TimeSpaceDiagram";
import { DriverHudWidget } from "@/components/DriverHudWidget";
import { AlgorithmModal } from "@/components/AlgorithmModal";
import {
  BusSimulationEngine,
  DEFAULT_CONFIG,
  SCENARIO_PRESETS,
  ScenarioPresetId,
  SimulationConfig,
  SimulationSnapshot,
} from "@/lib/simulationEngine";

function formatSimClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getDemandLabel(demand: number): string {
  if (demand <= 0.7) return "Off-Peak";
  if (demand <= 1.35) return "Normal";
  if (demand <= 2.0) return "Peak";
  return "Rush Hour";
}

function KotoDurInlineLogo({ isDark }: { isDark: boolean }) {
  return (
    <svg
      viewBox="0 0 182 38"
      className="h-9 w-auto shrink-0"
      fill="none"
      role="img"
      aria-label="KotoDur Logo"
    >
      {/* Stylized Road-K Emblem */}
      <rect
        x="1"
        y="2"
        width="34"
        height="34"
        rx="9"
        fill={isDark ? "#0b1220" : "#0F172A"}
        stroke="#06B6D4"
        strokeOpacity="0.6"
        strokeWidth="1.4"
      />
      {/* Vertical road stem of K */}
      <path
        d="M11 9.5V28.5"
        stroke="#F8FAFC"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M11 11.5V26.5"
        stroke="#06B6D4"
        strokeWidth="1.1"
        strokeDasharray="2.5 2.5"
      />
      {/* Upper & lower highway branches of K */}
      <path
        d="M13 19L24.5 9.8"
        stroke="#06B6D4"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M14.5 18.2L25 28.2"
        stroke="#F59E0B"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* Live transit node dot */}
      <circle cx="25" cy="9.8" r="2.2" fill="#10B981" />

      {/* "Koto" + cyan "Dur" wordmark */}
      <text
        x="44"
        y="25.5"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontSize="21"
        fontWeight="800"
        letterSpacing="-0.5"
      >
        <tspan fill={isDark ? "#F8FAFC" : "#0F172A"}>Koto</tspan>
        <tspan fill="#06B6D4">Dur</tspan>
      </text>

      {/* Subtle Bengali badge */}
      <text
        x="133"
        y="24.5"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        fontSize="11.5"
        fontWeight="700"
        fill={isDark ? "#94A3B8" : "#64748B"}
      >
        কতদূর
      </text>
    </svg>
  );
}

export default function KotoDurDashboard() {
  const engineRef = useRef<BusSimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new BusSimulationEngine(DEFAULT_CONFIG);
  }

  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [isPaused, setIsPaused] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [selectedBusId, setSelectedBusId] = useState<string>("Shikhor-02");
  const [showHeadwayLinks, setShowHeadwayLinks] = useState<boolean>(true);
  const [chartTab, setChartTab] = useState<"variance" | "timespace">(
    "variance"
  );
  const [activePreset, setActivePreset] = useState<ScenarioPresetId | null>(
    null
  );
  const [isAlgoModalOpen, setIsAlgoModalOpen] = useState(false);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const [lastJamNotice, setLastJamNotice] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() =>
    engineRef.current!.getSnapshot()
  );

  // Silently check if /logo.png exists without ever flashing a broken image icon
  useEffect(() => {
    let active = true;
    const probe = new window.Image();
    probe.onload = () => {
      if (active && probe.naturalWidth > 0) setHasCustomLogo(true);
    };
    probe.onerror = () => {
      if (active) setHasCustomLogo(false);
    };
    probe.src = "/logo.png";
    return () => {
      active = false;
    };
  }, []);

  const updateEngineConfig = useCallback(
    (partial: Partial<SimulationConfig>, clearPreset = false) => {
      if (clearPreset) setActivePreset(null);
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        engineRef.current?.updateConfig(next);
        return next;
      });
    },
    []
  );

  const handleApplyPreset = useCallback((presetId: ScenarioPresetId) => {
    const preset = SCENARIO_PRESETS[presetId];
    setActivePreset(presetId);
    setConfig((prev) => {
      const next = { ...prev, ...preset.patch };
      engineRef.current?.updateConfig(next);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    engineRef.current?.reset();
    setLastJamNotice(null);
    if (engineRef.current) {
      setSnapshot(engineRef.current.getSnapshot());
    }
  }, []);

  const handleInjectTrafficJam = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const busId = engine.injectTrafficJam(8);
    if (busId) {
      setSelectedBusId(busId);
      setLastJamNotice(`${busId} stalled for 8s`);
      setSnapshot(engine.getSnapshot());
    }
  }, []);

  const handleCanvasSelectBus = useCallback((busId: string | null) => {
    if (busId) setSelectedBusId(busId);
  }, []);

  const isDark = theme === "dark";
  const { metrics, buses, stops, history, trajectories, aiImpact } = snapshot;
  const avgWaitMins = metrics.avgWaitTime / 60;
  const isAi = config.isAiControlEnabled;

  const cardSurface = isDark
    ? "border-slate-800 bg-[#0b1220]"
    : "border-slate-200 bg-white shadow-sm";

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark
          ? "bg-[#0F172A] text-slate-100 selection:bg-[#06B6D4]/30 selection:text-cyan-100"
          : "bg-[#F8FAFC] text-[#0F172A] selection:bg-cyan-500/20"
      }`}
    >
      {/* Top Engineering Header */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md ${
          isDark
            ? "border-slate-800/90 bg-[#0F172A]/95"
            : "border-slate-200 bg-white/95"
        }`}
      >
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          {/* Brand Identity: uses /logo.png when available, otherwise crisp inline Road-K SVG */}
          <div className="flex min-w-0 flex-col">
            {hasCustomLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logo.png"
                alt="KotoDur"
                onError={() => setHasCustomLogo(false)}
                className="h-9 w-auto max-w-[168px] object-contain"
              />
            ) : (
              <KotoDurInlineLogo isDark={isDark} />
            )}
            <p
              className={`truncate pl-0.5 text-[11px] ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Dynamic Bus Headway &amp; Bunching Control Simulator
            </p>
          </div>

          {/* Center-Right: Prominent Master Toggle Switch */}
          <div
            className={`flex items-center gap-2 rounded-xl border p-1 shadow-sm ${
              isDark
                ? "border-slate-800 bg-[#0b1220]"
                : "border-slate-200 bg-slate-100"
            }`}
          >
            <button
              type="button"
              onClick={() => updateEngineConfig({ isAiControlEnabled: false })}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition sm:px-3 sm:text-xs ${
                !isAi
                  ? "bg-[#F59E0B] text-slate-950 shadow-sm shadow-amber-500/20"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                Uncontrolled (Dhaka Chaos)
              </span>
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={isAi}
              aria-label="Toggle AI Headway Control"
              onClick={() => updateEngineConfig({ isAiControlEnabled: !isAi })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors ${
                isAi
                  ? "border-[#06B6D4]/60 bg-[#06B6D4]/25"
                  : "border-[#F59E0B]/60 bg-[#F59E0B]/20"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full shadow transition-transform ${
                  isAi
                    ? "translate-x-5 bg-[#06B6D4]"
                    : "translate-x-1 bg-[#F59E0B]"
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => updateEngineConfig({ isAiControlEnabled: true })}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition sm:px-3 sm:text-xs ${
                isAi
                  ? "bg-[#06B6D4] text-slate-950 shadow-sm shadow-cyan-500/25"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Cpu className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">AI Headway Control</span>
            </button>
          </div>

          {/* Utility Buttons: Algorithm & Math Modal + Light/Dark Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAlgoModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-[#06B6D4]/60 hover:text-[#06B6D4]"
                  : "border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:text-cyan-700"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-[#06B6D4]" />
              Algorithm &amp; Math
            </button>

            <button
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label="Toggle Light or Dark mode"
              title="Toggle Light / Dark theme"
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-[#F59E0B] hover:bg-slate-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main 3-Column Engineering Control Room Layout */}
      <main className="mx-auto grid max-w-[1680px] grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-12">
        {/* LEFT CONTROL PANEL */}
        <aside className="flex flex-col gap-4 lg:col-span-3">
          {/* Playback & Speed Controls */}
          <div className={`rounded-2xl border p-4 ${cardSurface}`}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#06B6D4]" />
                <h2
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Simulation Controls
                </h2>
              </div>
              <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
                <Clock className="h-3 w-3 text-[#06B6D4]" />
                {formatSimClock(metrics.simTime)}
              </span>
            </div>

            <div className="mb-3">
              <label
                className={`mb-1.5 block text-[11px] font-medium ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Simulation Speed
              </label>
              <div
                className={`grid grid-cols-3 gap-1.5 rounded-xl border p-1 ${
                  isDark
                    ? "border-slate-800 bg-[#0F172A]"
                    : "border-slate-200 bg-slate-100"
                }`}
                role="group"
                aria-label="Simulation speed multiplier"
              >
                {([1, 2, 5] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => updateEngineConfig({ speedMultiplier: spd })}
                    className={`rounded-lg py-1.5 font-mono text-xs font-bold transition ${
                      config.speedMultiplier === spd
                        ? "bg-[#06B6D4] text-slate-950 shadow-sm shadow-cyan-500/20"
                        : isDark
                          ? "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                  isPaused
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25"
                    : isDark
                      ? "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800"
                      : "border-slate-200 bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="h-3.5 w-3.5" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition ${
                  isDark
                    ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Dhaka Scenario Presets + Corridor Sliders */}
          <div className={`rounded-2xl border p-4 ${cardSurface}`}>
            <h2
              className={`mb-2.5 text-xs font-bold uppercase tracking-wider ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Dhaka Scenario Presets
            </h2>

            {/* 1-Click Scenario Preset Buttons */}
            <div className="mb-4 grid grid-cols-1 gap-1.5">
              {(
                [
                  {
                    id: "office_rush" as ScenarioPresetId,
                    icon: Sunrise,
                    accent: "text-[#F59E0B]",
                  },
                  {
                    id: "rainy_dhaka" as ScenarioPresetId,
                    icon: CloudRain,
                    accent: "text-[#06B6D4]",
                  },
                  {
                    id: "midnight_free" as ScenarioPresetId,
                    icon: Moon,
                    accent: "text-emerald-400",
                  },
                ] as const
              ).map(({ id, icon: Icon, accent }) => {
                const preset = SCENARIO_PRESETS[id];
                const isSelected = activePreset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleApplyPreset(id)}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                      isSelected
                        ? "border-[#06B6D4] bg-[#06B6D4]/12"
                        : isDark
                          ? "border-slate-800 bg-[#0F172A]/80 hover:border-slate-700"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${accent}`} />
                      <div>
                        <div className="text-xs font-bold">{preset.label}</div>
                        <div
                          className={`text-[10px] ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {preset.shortDesc}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="rounded bg-[#06B6D4]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#06B6D4]">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sliders */}
            <div
              className={`space-y-4 border-t pt-3.5 ${
                isDark ? "border-slate-800/80" : "border-slate-200"
              }`}
            >
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span
                    className={`font-medium ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Passenger Demand
                  </span>
                  <span className="font-mono text-xs font-bold text-[#06B6D4]">
                    {config.passengerDemand.toFixed(1)}x{" "}
                    <span className="text-[10px] font-normal text-slate-400">
                      ({getDemandLabel(config.passengerDemand)})
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={3.0}
                  step={0.1}
                  value={config.passengerDemand}
                  onChange={(e) =>
                    updateEngineConfig(
                      { passengerDemand: parseFloat(e.target.value) },
                      true
                    )
                  }
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700/60 accent-[#06B6D4]"
                />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
                  <span>Off-Peak</span>
                  <span>Normal</span>
                  <span>Rush Hour</span>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span
                    className={`font-medium ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Control Aggressiveness (α)
                  </span>
                  <span className="font-mono text-xs font-bold text-[#F59E0B]">
                    {config.alpha.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  value={config.alpha}
                  onChange={(e) =>
                    updateEngineConfig(
                      { alpha: parseFloat(e.target.value) },
                      true
                    )
                  }
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700/60 accent-[#F59E0B]"
                />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
                  <span>Gentle (0.30)</span>
                  <span>Balanced</span>
                  <span>Strict (1.00)</span>
                </div>
              </div>
            </div>
          </div>

          {/* High-Impact Disruption Injector */}
          <div
            className={`rounded-2xl border p-4 ${
              isDark
                ? "border-[#F59E0B]/35 bg-gradient-to-b from-[#F59E0B]/10 to-[#0b1220]"
                : "border-amber-300 bg-amber-50/70"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                Disruption Test
              </span>
              {metrics.jammedBusId && (
                <span className="animate-pulse rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-500">
                  {metrics.jammedBusId} JAMMED
                </span>
              )}
            </div>
            <p
              className={`mb-3 text-[11px] leading-relaxed ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Stalls a random moving bus for{" "}
              <span className="font-mono font-semibold">8s</span> to trigger a
              bunching chain-reaction, then toggle AI Control to watch it
              self-heal.
            </p>
            <button
              type="button"
              onClick={handleInjectTrafficJam}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 py-2.5 text-xs font-extrabold tracking-wide text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:scale-[0.99]"
            >
              <Zap className="h-4 w-4 fill-slate-950" />
              Inject Traffic Jam (8s Stall)
            </button>
            {lastJamNotice && (
              <div className="mt-2 text-center font-mono text-[10px] text-amber-500">
                Last event: {lastJamNotice}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER SIMULATION STAGE */}
        <section className="flex flex-col gap-3 lg:col-span-6">
          <div
            className={`flex flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm ${cardSurface}`}
          >
            {/* Top Canvas Telemetry Strip */}
            <div
              className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-[11px] ${
                isDark
                  ? "border-slate-800/90 bg-[#0F172A]/80"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isPaused
                      ? "bg-slate-500"
                      : isAi
                        ? "animate-pulse bg-[#06B6D4]"
                        : "animate-pulse bg-[#F59E0B]"
                  }`}
                />
                <span
                  className={`font-mono font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  MIRPUR-10 ⇄ MOTIJHEEL LOOP
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                <span>
                  Waiting:{" "}
                  <strong className={isDark ? "text-slate-100" : "text-slate-900"}>
                    {metrics.totalWaiting}
                  </strong>
                </span>
                <span>
                  Served:{" "}
                  <strong className="text-[#06B6D4]">
                    {metrics.totalServed}
                  </strong>
                </span>
                <span>
                  Holds:{" "}
                  <strong className="text-[#F59E0B]">
                    {metrics.activeHolds}
                  </strong>
                </span>
              </div>
            </div>

            {/* 60fps HTML5 Canvas (tall vertical container for N-S Dhaka stadium loop) */}
            <div className="min-h-[560px] flex-1 lg:min-h-[680px]">
              <SimulationCanvas
                engineRef={
                  engineRef as React.MutableRefObject<BusSimulationEngine>
                }
                isPaused={isPaused}
                theme={theme}
                selectedBusId={selectedBusId}
                showHeadwayLinks={showHeadwayLinks}
                onSelectBus={handleCanvasSelectBus}
                onSnapshot={setSnapshot}
              />
            </div>

            {/* Bottom Legend Bar with "Show Headway Links" Toggle Checkbox */}
            <div
              className={`flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-[11px] ${
                isDark
                  ? "border-slate-800/90 bg-[#0F172A]/90 text-slate-400"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3.5">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                  Moving
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400 ring-2 ring-sky-400/30" />
                  Boarding
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#F59E0B] ring-2 ring-red-500/40" />
                  Holding
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-3.5 rounded-sm bg-red-500/80" />
                  Bottleneck
                </span>
              </div>

              <label className="inline-flex cursor-pointer select-none items-center gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={showHeadwayLinks}
                  onChange={(e) => setShowHeadwayLinks(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded accent-[#06B6D4]"
                />
                <span className={isDark ? "text-slate-200" : "text-slate-700"}>
                  Show Headway Links
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* RIGHT TELEMETRY, ANALYTICS & DRIVER HUD PANEL */}
        <aside className="flex flex-col gap-4 lg:col-span-3">
          {/* Live "AI Impact Summary" Badge */}
          <div
            className={`rounded-xl border px-3.5 py-2.5 ${
              aiImpact.isReady
                ? isDark
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-emerald-300 bg-emerald-50"
                : isDark
                  ? "border-slate-800 bg-[#0b1220]"
                  : "border-slate-200 bg-white"
            }`}
          >
            {aiImpact.isReady ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-500">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Impact Summary
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    vs Uncontrolled
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 font-mono text-xs">
                  <span
                    className={`flex items-center gap-1 font-bold ${
                      isDark ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Wait:{" "}
                    {aiImpact.waitReductionPct >= 0
                      ? `-${aiImpact.waitReductionPct.toFixed(0)}%`
                      : `+${Math.abs(aiImpact.waitReductionPct).toFixed(0)}%`}
                  </span>
                  <span
                    className={`flex items-center gap-1 font-bold ${
                      isDark ? "text-[#06B6D4]" : "text-cyan-700"
                    }`}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Bunching:{" "}
                    {aiImpact.bunchedReductionPct >= 0
                      ? `-${aiImpact.bunchedReductionPct.toFixed(0)}%`
                      : `+${Math.abs(aiImpact.bunchedReductionPct).toFixed(0)}%`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold text-slate-400">
                  <Sparkles className="h-3.5 w-3.5 text-[#06B6D4]" />
                  AI Impact Benchmark
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  Unc {Math.min(15, Math.floor(aiImpact.uncontrolledSeconds))}s
                  /15s • AI {Math.min(15, Math.floor(aiImpact.aiSeconds))}s/15s
                </span>
              </div>
            )}
          </div>

          {/* Real-Time KPI Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`rounded-xl border p-2.5 ${cardSurface}`}>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Avg Wait</span>
                <Clock className="h-3 w-3 text-[#06B6D4]" />
              </div>
              <div className="mt-1 font-mono text-lg font-extrabold">
                {avgWaitMins.toFixed(2)}
                <span className="ml-0.5 text-[10px] font-medium text-slate-400">
                  m
                </span>
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                {metrics.avgWaitTime.toFixed(1)}s
              </div>
            </div>

            <div className={`rounded-xl border p-2.5 ${cardSurface}`}>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Bunched</span>
                <Activity className="h-3 w-3 text-[#F59E0B]" />
              </div>
              <div
                className={`mt-1 font-mono text-lg font-extrabold ${
                  metrics.bunchedPairs === 0
                    ? "text-emerald-500"
                    : metrics.bunchedPairs <= 2
                      ? "text-[#F59E0B]"
                      : "text-rose-500"
                }`}
              >
                {metrics.bunchedPairs}
                <span className="ml-0.5 text-[10px] font-medium text-slate-400">
                  prs
                </span>
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                H&lt;{(metrics.idealHeadway * 0.45).toFixed(0)}s
              </div>
            </div>

            <div className={`rounded-xl border p-2.5 ${cardSurface}`}>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Stability</span>
                <Gauge className="h-3 w-3 text-[#06B6D4]" />
              </div>
              <div
                className={`mt-1 font-mono text-lg font-extrabold ${
                  metrics.stabilityScore >= 75
                    ? "text-[#06B6D4]"
                    : metrics.stabilityScore >= 45
                      ? "text-[#F59E0B]"
                      : "text-rose-500"
                }`}
              >
                {metrics.stabilityScore}%
              </div>
              <div className="font-mono text-[10px] text-slate-500">
                CV {metrics.headwayCv.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Tabbed Analytics Chart: Headway Variance | Time-Space Diagram */}
          <div className={`rounded-xl border p-3.5 ${cardSurface}`}>
            <div
              className={`mb-3 grid grid-cols-2 gap-1 rounded-lg border p-0.5 ${
                isDark
                  ? "border-slate-800 bg-[#0F172A]"
                  : "border-slate-200 bg-slate-100"
              }`}
              role="tablist"
              aria-label="Telemetry chart view"
            >
              <button
                type="button"
                role="tab"
                aria-selected={chartTab === "variance"}
                onClick={() => setChartTab("variance")}
                className={`rounded-md py-1.5 text-[11px] font-bold transition ${
                  chartTab === "variance"
                    ? "bg-[#06B6D4] text-slate-950 shadow-sm"
                    : isDark
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Headway Variance
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={chartTab === "timespace"}
                onClick={() => setChartTab("timespace")}
                className={`rounded-md py-1.5 text-[11px] font-bold transition ${
                  chartTab === "timespace"
                    ? "bg-[#06B6D4] text-slate-950 shadow-sm"
                    : isDark
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Time-Space Diagram
              </button>
            </div>

            {chartTab === "variance" ? (
              <HeadwayVarianceChart
                history={history}
                simTime={metrics.simTime}
                currentVariance={metrics.headwayVariance}
                isAiControlEnabled={isAi}
                theme={theme}
              />
            ) : (
              <TimeSpaceDiagram
                trajectories={trajectories}
                simTime={metrics.simTime}
                selectedBusId={selectedBusId}
                theme={theme}
              />
            )}
          </div>

          {/* Live Mobile-Frame Driver HUD Widget */}
          <DriverHudWidget
            buses={buses}
            stops={stops}
            selectedBusId={selectedBusId}
            onSelectBus={setSelectedBusId}
            idealHeadway={metrics.idealHeadway}
            theme={theme}
          />
        </aside>
      </main>

      {/* Algorithm & Math Explanation Modal */}
      <AlgorithmModal
        isOpen={isAlgoModalOpen}
        onClose={() => setIsAlgoModalOpen(false)}
        theme={theme}
      />
    </div>
  );
}
