"use client";

import React from "react";
import { TelemetryPoint } from "@/lib/simulationEngine";

interface HeadwayVarianceChartProps {
  history: TelemetryPoint[];
  simTime: number;
  currentVariance: number;
  isAiControlEnabled: boolean;
  theme: "dark" | "light";
}

export const HeadwayVarianceChart: React.FC<HeadwayVarianceChartProps> = ({
  history,
  simTime,
  currentVariance,
  isAiControlEnabled,
  theme,
}) => {
  const isDark = theme === "dark";
  const width = 420;
  const height = 164;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 22;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const windowStart = Math.max(0, simTime - 60);
  const windowPoints = history.filter((pt) => pt.time >= windowStart - 1);

  const maxVar = Math.max(40, ...windowPoints.map((p) => p.headwayVariance));
  const yCeiling = Math.ceil(maxVar / 20) * 20;

  const mapX = (t: number) => {
    const span = Math.max(10, Math.min(60, simTime - windowStart || 60));
    const rel = (t - (simTime - span)) / span;
    return padLeft + Math.min(1, Math.max(0, rel)) * plotW;
  };

  const mapY = (v: number) => {
    const clamped = Math.min(yCeiling, Math.max(0, v));
    return padTop + plotH - (clamped / yCeiling) * plotH;
  };

  const coords = windowPoints.map((pt) => ({
    x: mapX(pt.time),
    y: mapY(pt.headwayVariance),
    pt,
  }));

  const areaPath =
    coords.length >= 2
      ? `M ${coords[0].x} ${padTop + plotH} ` +
        coords.map((c) => `L ${c.x} ${c.y}`).join(" ") +
        ` L ${coords[coords.length - 1].x} ${padTop + plotH} Z`
      : "";

  const latest = coords.length > 0 ? coords[coords.length - 1] : null;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p
          className={`text-[10px] ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}
        >
          σ² (s²) over last 60s — Spikes = bunching; flat = equalized
        </p>
        <div
          className={`font-mono text-xs font-bold ${
            currentVariance < 25
              ? "text-[#06B6D4]"
              : currentVariance < 80
                ? "text-[#F59E0B]"
                : "text-rose-500"
          }`}
        >
          {currentVariance.toFixed(1)} s²
        </div>
      </div>

      {coords.length < 2 ? (
        <div
          className={`flex h-[164px] items-center justify-center rounded-lg border border-dashed text-xs ${
            isDark
              ? "border-slate-800 text-slate-500"
              : "border-slate-300 text-slate-400"
          }`}
        >
          Sampling headway telemetry...
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[164px] w-full overflow-visible"
          role="img"
          aria-label="Headway variance over the last 60 seconds"
        >
          <defs>
            <linearGradient id="varAreaCyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="varAreaAmber" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((frac) => {
            const y = padTop + plotH * (1 - frac);
            const val = Math.round(yCeiling * frac);
            return (
              <g key={frac}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={isDark ? "#1e293b" : "#e2e8f0"}
                  strokeWidth={1}
                  strokeDasharray={frac === 0 ? undefined : "3 3"}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill={isDark ? "#64748b" : "#94a3b8"}
                  className="font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          <text
            x={padLeft}
            y={height - 4}
            textAnchor="start"
            fontSize="8.5"
            fill={isDark ? "#64748b" : "#94a3b8"}
            className="font-mono"
          >
            -60s
          </text>
          <text
            x={padLeft + plotW / 2}
            y={height - 4}
            textAnchor="middle"
            fontSize="8.5"
            fill={isDark ? "#64748b" : "#94a3b8"}
            className="font-mono"
          >
            -30s
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

          <path
            d={areaPath}
            fill={
              isAiControlEnabled ? "url(#varAreaCyan)" : "url(#varAreaAmber)"
            }
          />

          {coords.slice(1).map((curr, idx) => {
            const prev = coords[idx];
            const color = curr.pt.isAiControlEnabled ? "#06B6D4" : "#F59E0B";
            return (
              <line
                key={idx}
                x1={prev.x}
                y1={prev.y}
                x2={curr.x}
                y2={curr.y}
                stroke={color}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            );
          })}

          {latest && (
            <g>
              <circle
                cx={latest.x}
                cy={latest.y}
                r={6}
                fill={
                  latest.pt.isAiControlEnabled
                    ? "rgba(6, 182, 212, 0.25)"
                    : "rgba(245, 158, 11, 0.28)"
                }
              />
              <circle
                cx={latest.x}
                cy={latest.y}
                r={3}
                fill={latest.pt.isAiControlEnabled ? "#06B6D4" : "#F59E0B"}
              />
            </g>
          )}
        </svg>
      )}

      <div
        className={`mt-1.5 flex items-center justify-between border-t pt-2 text-[10px] ${
          isDark
            ? "border-slate-800/80 text-slate-400"
            : "border-slate-200 text-slate-500"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
          Uncontrolled (Chaos)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#06B6D4]" />
          AI Headway Control
        </span>
      </div>
    </div>
  );
};
