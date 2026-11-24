"use client";

import React, { useEffect } from "react";
import { Cpu, Radio, Server, Smartphone, X } from "lucide-react";

interface AlgorithmModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
}

export const AlgorithmModal: React.FC<AlgorithmModalProps> = ({
  isOpen,
  onClose,
  theme,
}) => {
  const isDark = theme === "dark";

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="algo-modal-title"
      onClick={onClose}
    >
      <div
        className={`relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
          isDark
            ? "border-slate-800 bg-[#0F172A] text-slate-100"
            : "border-slate-200 bg-white text-slate-900"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#06B6D4]/15 text-[#06B6D4]">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 id="algo-modal-title" className="text-base font-extrabold">
                KotoDur Control Algorithm &amp; Dhaka Architecture
              </h2>
              <p
                className={`text-xs ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Two-Way Headway Equalization &amp; Lightweight GPS Dispatch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`rounded-lg p-1.5 transition ${
              isDark
                ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section 1: Mathematical Formulation */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#06B6D4]">
            1. Forward &amp; Backward Headway Equalization Law
          </h3>
          <p
            className={`text-xs leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            In uncontrolled Dhaka corridors, a small traffic delay causes a bus
            to encounter more waiting passengers at the next stop, increasing
            boarding dwell time and amplifying the delay—while the following bus
            encounters fewer passengers and catches right up (Newell–Potts
            instability). KotoDur breaks this feedback loop by computing a
            real-time holding time at each stop after boarding completes:
          </p>

          <div
            className={`rounded-xl border p-4 font-mono text-xs ${
              isDark
                ? "border-slate-800 bg-[#0b1220] text-cyan-300"
                : "border-slate-200 bg-slate-50 text-cyan-800"
            }`}
          >
            <div className="text-[11px] font-bold">
              If H_front &lt; H_ideal AND H_back &gt; H_front:
            </div>
            <div className="mt-1.5 text-sm font-extrabold text-[#F59E0B]">
              Hold Time = α × (((H_front + H_back) / 2) − H_front)
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-3">
            <div
              className={`rounded-xl border p-3 ${
                isDark
                  ? "border-slate-800 bg-[#0b1220]"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="font-mono font-bold text-[#06B6D4]">H_front</div>
              <p
                className={`mt-1 text-[11px] ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Time gap to the bus directly ahead. Too small signals imminent
                bunching.
              </p>
            </div>
            <div
              className={`rounded-xl border p-3 ${
                isDark
                  ? "border-slate-800 bg-[#0b1220]"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="font-mono font-bold text-[#F59E0B]">H_back</div>
              <p
                className={`mt-1 text-[11px] ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Time gap to the bus directly behind. Used to center the bus
                between both neighbors.
              </p>
            </div>
            <div
              className={`rounded-xl border p-3 ${
                isDark
                  ? "border-slate-800 bg-[#0b1220]"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="font-mono font-bold text-emerald-400">
                Gain (α)
              </div>
              <p
                className={`mt-1 text-[11px] ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Control aggressiveness (0.3–1.0). Higher α restores spacing
                faster with slightly longer stop holds.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Real-World Deployment Architecture */}
        <div className="mt-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
            2. Real-World Dhaka Deployment Architecture
          </h3>
          <p
            className={`text-xs leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Zero roadside sensors or smart traffic signals are required. Every
            participating bus runs a lightweight Android cab app over standard
            3G/4G mobile data:
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div
              className={`rounded-xl border p-3.5 ${
                isDark
                  ? "border-slate-800 bg-[#0b1220]"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Smartphone className="h-4 w-4 text-[#06B6D4]" />
              <div className="mt-2 text-xs font-bold">
                1. Driver App GPS Stream
              </div>
              <p
                className={`mt-1 text-[11px] leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Streams 1 Hz GPS coordinates &amp; stop geofence arrival events
                (&lt;10 KB/min payload) to the cloud.
              </p>
            </div>

            <div
              className={`rounded-xl border p-3.5 ${
                isDark
                  ? "border-slate-800 bg-[#0b1220]"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Server className="h-4 w-4 text-[#F59E0B]" />
              <div className="mt-2 text-xs font-bold">
                2. Central Headway Engine
              </div>
              <p
                className={`mt-1 text-[11px] leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Maps all fleet buses onto the Mirpur–Motijheel polyline,
                computes live H_front / H_back, and solves optimal hold times.
              </p>
            </div>

            <div
              className={`rounded-xl border p-3.5 ${
                isDark
                  ? "border-slate-800 bg-[#0b1220]"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <Radio className="h-4 w-4 text-emerald-400" />
              <div className="mt-2 text-xs font-bold">
                3. Live Cab Driver HUD
              </div>
              <p
                className={`mt-1 text-[11px] leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Pushes an instant visual &amp; audio cue (PROCEED or HOLD AT
                STOP: Xs) via WebSocket to prevent bunching before it starts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
