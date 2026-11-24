"use client";

import React from "react";
import { TelemetryPoint } from "@/lib/simulationEngine";

interface HeadwaySparklineProps {
  history: TelemetryPoint[];
  theme: "dark" | "light";
}

export const HeadwaySparkline: React.FC<HeadwaySparklineProps> = ({
  history,
  theme,
}) => {
  const width = 560;
  const height = 104;
  const padX = 28;
  const padY = 14;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const isDark = theme === "dark";
  const maxCv = Math.max(60, ...history.map((p) => p.headwayCv));

  if (history.length < 2) {
    return (
      <div
        className={`flex h-[104px] items-center justify-center rounded-xl border text-xs ${
          isDark
            ? "border-slate-800 bg-slate-900/50 text-slate-400"
            : "border-slate-200 bg-slate-50 text-slate-500"
        }`}
      >
        Collecting headway stability telemetry...
      </div>
    );
  }

  const points = history.map((pt, idx) => {
    const x = padX + (idx / Math.max(1, history.length - 1)) * plotW;
    const y = padY + plotH - (Math.min(pt.headwayCv, maxCv) / maxCv) * plotH;
    return { x, y, pt };
  });

  const latest = history[history.length - 1];

  return (
    <div
      className={`rounded-xl border p-3 ${
        isDark
          ? "border-slate-800 bg-slate-900/60"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span
          className={`font-semibold ${
            isDark ? "text-slate-200" : "text-slate-800"
          }`}
        >
          Headway Instability (CV %) — Lower is Better
        </span>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-rose-500">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
            Uncontrolled
          </span>
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            AI Equalized
          </span>
          <span
            className={`font-bold ${
              latest.headwayCv < 25
                ? "text-emerald-500"
                : latest.headwayCv < 50
                  ? "text-amber-500"
                  : "text-rose-500"
            }`}
          >
            {latest.headwayCv.toFixed(1)}%
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[88px] w-full overflow-visible"
        role="img"
        aria-label="Headway Coefficient of Variation over time"
      >
        {/* Reference horizontal grid lines */}
        {[0, 0.5, 1].map((frac) => {
          const y = padY + plotH * (1 - frac);
          const val = Math.round(maxCv * frac);
          return (
            <g key={frac}>
              <line
                x1={padX}
                y1={y}
                x2={width - padX}
                y2={y}
                stroke={isDark ? "#1e293b" : "#e2e8f0"}
                strokeDasharray="3 3"
              />
              <text
                x={padX - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill={isDark ? "#64748b" : "#94a3b8"}
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Colored segments based on whether AI control was active at that tick */}
        {points.slice(1).map((curr, idx) => {
          const prev = points[idx];
          const stroke = curr.pt.isAiControlEnabled ? "#10b981" : "#f43f5e";
          return (
            <line
              key={idx}
              x1={prev.x}
              y1={prev.y}
              x2={curr.x}
              y2={curr.y}
              stroke={stroke}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          );
        })}

        {/* Latest point marker */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3.5}
          fill={latest.isAiControlEnabled ? "#10b981" : "#f43f5e"}
        />
      </svg>
    </div>
  );
};
