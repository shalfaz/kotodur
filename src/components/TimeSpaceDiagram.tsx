"use client";

import React from "react";
import {
  DHAKA_STOPS,
  TRACK_LENGTH,
  TrajectorySample,
} from "@/lib/simulationEngine";

export const BUS_TRAJECTORY_COLORS: Record<string, string> = {
  "Bikolpo-01": "#06B6D4", // Cyan
  "Shikhor-02": "#10B981", // Emerald
  "BRTC-03": "#F59E0B", // Amber
  "Bikolpo-04": "#EC4899", // Pink
  "Shikhor-05": "#8B5CF6", // Violet
  "BRTC-06": "#38BDF8", // Sky
};

interface TimeSpaceDiagramProps {
  trajectories: TrajectorySample[];
  simTime: number;
  selectedBusId: string;
  theme: "dark" | "light";
}

export const TimeSpaceDiagram: React.FC<TimeSpaceDiagramProps> = ({
  trajectories,
  simTime,
  selectedBusId,
  theme,
}) => {
  const isDark = theme === "dark";
  const width = 420;
  const height = 164;
  const padLeft = 58;
  const padRight = 10;
  const padTop = 10;
  const padBottom = 22;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const windowSpan = 45; // Last 45 seconds
  const tEnd = Math.max(windowSpan, simTime);
  const tStart = tEnd - windowSpan;
  const samples = trajectories.filter((s) => s.time >= tStart - 1);

  const mapX = (t: number) =>
    padLeft + Math.min(1, Math.max(0, (t - tStart) / windowSpan)) * plotW;
  const mapY = (pos: number) =>
    padTop + plotH - (Math.min(TRACK_LENGTH, Math.max(0, pos)) / TRACK_LENGTH) * plotH;

  // Key stop labels along Y-axis matching authentic N-S clockwise loop positions
  const yStops = [
    { pos: 0, label: "Mirpur-10" },
    { pos: 250, label: "Agargaon" },
    { pos: 415, label: "Farmgate" },
    { pos: 500, label: "Motijheel" },
    { pos: 750, label: "Shahbag" },
  ];

  const busIds = Object.keys(BUS_TRAJECTORY_COLORS);

  // Build SVG polyline segments per bus, breaking cleanly on loop wraparound (999 -> 0)
  const buildBusPaths = (busId: string): string[] => {
    const paths: string[] = [];
    let current = "";
    let prevPos: number | null = null;

    for (const s of samples) {
      const pos = s.positions[busId];
      if (pos === undefined) continue;
      const x = mapX(s.time);
      const y = mapY(pos);

      if (prevPos !== null && prevPos - pos > 400) {
        // Loop wraparound from Motijheel back to Mirpur-10: finish segment and start a new one
        if (current) paths.push(current);
        current = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else if (!current) {
        current = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        current += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      prevPos = pos;
    }
    if (current) paths.push(current);
    return paths;
  };

  // Bottleneck band Y coords (Farmgate lower-right section: 345 -> 475)
  const bnTop = mapY(475);
  const bnHeight = mapY(345) - bnTop;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p
          className={`text-[10px] ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          Parallel lines = uniform headways • Converging lines = bus bunching
        </p>
        <span
          className={`font-mono text-[10px] ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Last 45s
        </span>
      </div>

      {samples.length < 2 ? (
        <div
          className={`flex h-[164px] items-center justify-center rounded-lg border border-dashed text-xs ${
            isDark
              ? "border-slate-800 text-slate-500"
              : "border-slate-300 text-slate-400"
          }`}
        >
          Recording bus trajectories...
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[164px] w-full overflow-visible"
          role="img"
          aria-label="Time-Space Trajectory Diagram for buses KD-101 to KD-106 over the last 45 seconds"
        >
          {/* Red shaded Traffic Bottleneck corridor band (Farmgate - Shahbag) */}
          <rect
            x={padLeft}
            y={bnTop}
            width={plotW}
            height={bnHeight}
            fill={isDark ? "rgba(239, 68, 68, 0.11)" : "rgba(239, 68, 68, 0.09)"}
          />

          {/* Horizontal stop gridlines */}
          {yStops.map((st) => {
            const y = mapY(st.pos);
            return (
              <g key={st.pos}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isDark ? "#1e293b" : "#e2e8f0"}
                  strokeWidth={1}
                  strokeDasharray={st.pos === 0 ? undefined : "2 3"}
                />
                <text
                  x={padLeft - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8.5"
                  fill={isDark ? "#94a3b8" : "#64748b"}
                  className="font-mono"
                >
                  {st.label}
                </text>
              </g>
            );
          })}

          {/* X-axis time labels */}
          <text
            x={padLeft}
            y={height - 4}
            textAnchor="start"
            fontSize="8.5"
            fill={isDark ? "#64748b" : "#94a3b8"}
            className="font-mono"
          >
            -45s
          </text>
          <text
            x={padLeft + plotW / 2}
            y={height - 4}
            textAnchor="middle"
            fontSize="8.5"
            fill={isDark ? "#64748b" : "#94a3b8"}
            className="font-mono"
          >
            -22s
          </text>
          <text
            x={width - padRight}
            y={height - 4}
            textAnchor="end"
            fontSize="8.5"
            fill={isDark ? "#64748b" : "#94a3b8"}
            className="font-mono"
          >
            NOW
          </text>

          {/* Trajectory paths for all 6 buses */}
          {busIds.map((busId) => {
            const color = BUS_TRAJECTORY_COLORS[busId];
            const isSel = busId === selectedBusId;
            const segments = buildBusPaths(busId);
            return (
              <g key={busId}>
                {segments.map((d, idx) => (
                  <path
                    key={idx}
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={isSel ? 2.6 : 1.65}
                    strokeOpacity={isSel ? 1 : 0.85}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      )}

      {/* Compact 6-bus legend */}
      <div
        className={`mt-1.5 flex flex-wrap items-center justify-between gap-1 border-t pt-2 text-[9.5px] font-mono ${
          isDark
            ? "border-slate-800/80 text-slate-400"
            : "border-slate-200 text-slate-600"
        }`}
      >
        {busIds.map((id) => (
          <span
            key={id}
            title={id}
            className={`flex items-center gap-1 ${
              id === selectedBusId
                ? isDark
                  ? "font-bold text-white"
                  : "font-bold text-slate-900"
                : ""
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: BUS_TRAJECTORY_COLORS[id] }}
            />
            {id.slice(-2)}
          </span>
        ))}
        <span className="text-[9px] text-red-400">
          ■ {DHAKA_STOPS[5].name} Bottleneck
        </span>
      </div>
    </div>
  );
};
