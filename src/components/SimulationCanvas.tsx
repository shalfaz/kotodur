"use client";

import React, { useEffect, useRef } from "react";
import {
  Bus,
  BusSimulationEngine,
  BusStop,
  SimulationSnapshot,
  TRACK_LENGTH,
  TrackGeometry,
  computeTrackGeometry,
  getTrackPoint,
} from "@/lib/simulationEngine";

export interface SimulationCanvasProps {
  engineRef: React.MutableRefObject<BusSimulationEngine>;
  isPaused: boolean;
  theme: "dark" | "light";
  selectedBusId: string | null;
  showHeadwayLinks?: boolean;
  onSelectBus?: (busId: string | null) => void;
  onSnapshot: (snapshot: SimulationSnapshot) => void;
}

interface Palette {
  bg: string;
  grid: string;
  trackOuter: string;
  trackRoad: string;
  trackCenterDash: string;
  trackEdge: string;
  stopFill: string;
  stopStroke: string;
  stopLabelBg: string;
  stopLabelBorder: string;
  stopLabelText: string;
  stopSubText: string;
  centerTitle: string;
  centerSub: string;
  passengerNormal: string;
  passengerBusy: string;
  passengerCrowded: string;
  busBody: string;
  busStroke: string;
  busWindshield: string;
  busIdBg: string;
  busIdText: string;
  bottleneckGlow: string;
  bottleneckStroke: string;
  bottleneckBadgeBg: string;
  bottleneckBadgeText: string;
}

const DARK_PALETTE: Palette = {
  bg: "#0b1220",
  grid: "rgba(6, 182, 212, 0.055)",
  trackOuter: "rgba(15, 23, 42, 0.95)",
  trackRoad: "#172338",
  trackCenterDash: "rgba(148, 163, 184, 0.28)",
  trackEdge: "rgba(71, 85, 105, 0.58)",
  stopFill: "#0f172a",
  stopStroke: "#94a3b8",
  stopLabelBg: "rgba(15, 23, 42, 0.92)",
  stopLabelBorder: "rgba(51, 65, 85, 0.85)",
  stopLabelText: "#f1f5f9",
  stopSubText: "#94a3b8",
  centerTitle: "#f8fafc",
  centerSub: "#94a3b8",
  passengerNormal: "#06b6d4",
  passengerBusy: "#f59e0b",
  passengerCrowded: "#fb7185",
  busBody: "#f8fafc",
  busStroke: "#0f172a",
  busWindshield: "#06b6d4",
  busIdBg: "rgba(15, 23, 42, 0.94)",
  busIdText: "#f8fafc",
  bottleneckGlow: "rgba(239, 68, 68, 0.24)",
  bottleneckStroke: "#ef4444",
  bottleneckBadgeBg: "rgba(127, 29, 29, 0.92)",
  bottleneckBadgeText: "#fecaca",
};

const LIGHT_PALETTE: Palette = {
  bg: "#f8fafc",
  grid: "rgba(15, 23, 42, 0.055)",
  trackOuter: "rgba(226, 232, 240, 0.95)",
  trackRoad: "#334155",
  trackCenterDash: "rgba(241, 245, 249, 0.45)",
  trackEdge: "rgba(100, 116, 139, 0.6)",
  stopFill: "#ffffff",
  stopStroke: "#334155",
  stopLabelBg: "rgba(255, 255, 255, 0.94)",
  stopLabelBorder: "rgba(203, 213, 225, 0.95)",
  stopLabelText: "#0f172a",
  stopSubText: "#64748b",
  centerTitle: "#0f172a",
  centerSub: "#475569",
  passengerNormal: "#0284c7",
  passengerBusy: "#d97706",
  passengerCrowded: "#e11d48",
  busBody: "#ffffff",
  busStroke: "#0f172a",
  busWindshield: "#0284c7",
  busIdBg: "rgba(15, 23, 42, 0.9)",
  busIdText: "#ffffff",
  bottleneckGlow: "rgba(239, 68, 68, 0.22)",
  bottleneckStroke: "#dc2626",
  bottleneckBadgeBg: "rgba(220, 38, 38, 0.94)",
  bottleneckBadgeText: "#ffffff",
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function traceTrackPath(ctx: CanvasRenderingContext2D, geo: TrackGeometry) {
  const halfS = geo.straightLength / 2;
  const { centerX: cx, centerY: cy, radius: r } = geo;
  ctx.beginPath();
  // Vertical capsule/stadium: top semicircle -> right straightaway -> bottom semicircle -> left straightaway
  ctx.arc(cx, cy - halfS, r, Math.PI, 0, false);
  ctx.lineTo(cx + r, cy + halfS);
  ctx.arc(cx, cy + halfS, r, 0, Math.PI, false);
  ctx.lineTo(cx - r, cy - halfS);
  ctx.closePath();
}

function traceTrackSegment(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  startPos: number,
  endPos: number,
  steps = 48
) {
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const pos = startPos + ((endPos - startPos) * i) / steps;
    const pt = getTrackPoint(pos, geo);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  engineRef,
  isPaused,
  theme,
  selectedBusId,
  showHeadwayLinks = true,
  onSelectBus,
  onSnapshot,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 900, height: 540 });
  const isPausedRef = useRef(isPaused);
  const themeRef = useRef(theme);
  const selectedBusIdRef = useRef(selectedBusId);
  const showHeadwayLinksRef = useRef(showHeadwayLinks);
  const onSnapshotRef = useRef(onSnapshot);

  isPausedRef.current = isPaused;
  themeRef.current = theme;
  selectedBusIdRef.current = selectedBusId;
  showHeadwayLinksRef.current = showHeadwayLinks;
  onSnapshotRef.current = onSnapshot;

  // Observe container resize for crisp HiDPI canvas rendering
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(360, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      sizeRef.current = { width, height };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Main 60fps requestAnimationFrame loop
  useEffect(() => {
    let rafId = 0;
    let lastTimestamp = performance.now();
    let lastSnapshotEmit = 0;

    const renderFrame = (now: number) => {
      const dt = Math.max(0, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const engine = engineRef.current;
      if (!isPausedRef.current) {
        engine.step(dt);
      }

      // Emit React UI snapshot at ~7 Hz so dashboard stays fluid without 60fps re-renders
      if (now - lastSnapshotEmit >= 140) {
        lastSnapshotEmit = now;
        onSnapshotRef.current(engine.getSnapshot());
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const { width, height } = sizeRef.current;
          const dpr = canvas.width / Math.max(1, width);
          ctx.save();
          ctx.scale(dpr, dpr);
          drawScene(
            ctx,
            width,
            height,
            engine,
            now / 1000,
            themeRef.current === "dark" ? DARK_PALETTE : LIGHT_PALETTE,
            themeRef.current,
            selectedBusIdRef.current,
            showHeadwayLinksRef.current
          );
          ctx.restore();
        }
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [engineRef]);

  // Allow clicking on a bus on the canvas to inspect it
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectBus || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const { width, height } = sizeRef.current;
    const geo = computeTrackGeometry(width, height);

    let closestId: string | null = null;
    let minDist = 28;
    for (const bus of engineRef.current.buses) {
      const pt = getTrackPoint(bus.position, geo);
      const dist = Math.hypot(clickX - pt.x, clickY - pt.y);
      if (dist < minDist) {
        minDist = dist;
        closestId = bus.id;
      }
    }
    onSelectBus(closestId === selectedBusIdRef.current ? null : closestId);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full min-h-[460px] select-none overflow-hidden rounded-2xl"
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="block h-full w-full cursor-pointer"
        aria-label="KotoDur 2D Bus Bunching and Dynamic Headway Control Simulation Canvas"
      />
    </div>
  );
};

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  engine: BusSimulationEngine,
  animTime: number,
  palette: Palette,
  theme: "dark" | "light",
  selectedBusId: string | null,
  showHeadwayLinks: boolean
) {
  // 1. Background & subtle engineering grid
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  const gridSize = 32;
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = gridSize; x < width; x += gridSize) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = gridSize; y < height; y += gridSize) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();

  const geo = computeTrackGeometry(width, height);

  // 2. Oval Track Roadbed
  ctx.save();
  traceTrackPath(ctx, geo);
  ctx.strokeStyle = palette.trackOuter;
  ctx.lineWidth = 34;
  ctx.stroke();

  traceTrackPath(ctx, geo);
  ctx.strokeStyle = palette.trackRoad;
  ctx.lineWidth = 26;
  ctx.stroke();

  // Inner & outer road shoulder borders
  traceTrackPath(ctx, geo);
  ctx.strokeStyle = palette.trackEdge;
  ctx.lineWidth = 28;
  ctx.globalCompositeOperation = "source-over";
  // Redraw roadbed inside border for crisp double-edge look
  ctx.stroke();

  traceTrackPath(ctx, geo);
  ctx.strokeStyle = palette.trackRoad;
  ctx.lineWidth = 25;
  ctx.stroke();

  // Center dashed transit lane line
  traceTrackPath(ctx, geo);
  ctx.strokeStyle = palette.trackCenterDash;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 10]);
  ctx.lineDashOffset = -animTime * 18;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 3. Red Traffic Bottleneck Zone (Farmgate -> Shahbag)
  if (engine.bottleneck.enabled) {
    drawBottleneckZone(ctx, geo, engine, animTime, palette);
  }

  // 4. Directional flow chevrons on the track
  drawTrackDirectionChevrons(ctx, geo, palette);

  // 5. Center HUD Emblem inside the oval
  drawCenterStatus(ctx, geo, engine, palette);

  // 6. Stops & Waiting Passenger Dots
  for (const stop of engine.stops) {
    drawStopAndPassengers(ctx, geo, stop, palette, width, height);
  }

  // 7. Visual Headway Link Lines connecting each bus to the bus ahead
  if (showHeadwayLinks) {
    drawAllHeadwayLinks(ctx, geo, engine, theme, selectedBusId);
  } else if (selectedBusId) {
    const selected = engine.buses.find((b) => b.id === selectedBusId);
    if (selected) {
      drawSelectedBusHeadwayIndicator(ctx, geo, selected, engine);
    }
  }

  // 8. Buses with status rings & hold countdown badges
  for (const bus of engine.buses) {
    drawBus(ctx, geo, bus, animTime, palette, bus.id === selectedBusId);
  }
}

function drawBottleneckZone(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  engine: BusSimulationEngine,
  animTime: number,
  palette: Palette
) {
  const { startPosition, endPosition } = engine.bottleneck;
  const pulse = 0.5 + 0.5 * Math.sin(animTime * 3.2);

  ctx.save();
  // Outer red congestion glow
  traceTrackSegment(ctx, geo, startPosition, endPosition, 56);
  ctx.strokeStyle = palette.bottleneckGlow;
  ctx.lineWidth = 38 + pulse * 6;
  ctx.lineCap = "round";
  ctx.stroke();

  // Red tinted asphalt overlay
  traceTrackSegment(ctx, geo, startPosition, endPosition, 56);
  ctx.strokeStyle = "rgba(220, 38, 38, 0.34)";
  ctx.lineWidth = 25;
  ctx.lineCap = "butt";
  ctx.stroke();

  // Animated hazard dashed stripes
  traceTrackSegment(ctx, geo, startPosition, endPosition, 56);
  ctx.strokeStyle = palette.bottleneckStroke;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -animTime * 12;
  ctx.stroke();
  ctx.setLineDash([]);

  // Bottleneck callout badge centered cleanly inside the lower inner loop (never touching track lines or center HUD)
  const badgeX = geo.centerX;
  const badgeY = geo.centerY + Math.min(geo.straightLength / 2 + 12, 76);

  const dropPct = Math.round((1 - engine.bottleneck.speedFactor) * 100);
  const label = `BOTTLENECK (-${dropPct}% SPEED)`;
  ctx.font = "700 9.5px ui-sans-serif, system-ui, -apple-system, sans-serif";
  const textW = ctx.measureText(label).width;
  const bw = textW + 16;
  const bh = 19;

  drawRoundedRect(ctx, badgeX - bw / 2, badgeY - bh / 2, bw, bh, 9.5);
  ctx.fillStyle = palette.bottleneckBadgeBg;
  ctx.fill();
  ctx.strokeStyle = "rgba(248, 113, 113, 0.7)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = palette.bottleneckBadgeText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, badgeX, badgeY + 0.5);
  ctx.restore();
}

function drawTrackDirectionChevrons(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  palette: Palette
) {
  const positions = [50, 150, 250, 350, 450, 750, 850, 950];
  ctx.save();
  ctx.strokeStyle = palette.trackCenterDash;
  ctx.lineWidth = 1.5;
  for (const pos of positions) {
    const pt = getTrackPoint(pos, geo);
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.angle);
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(2, 0);
    ctx.lineTo(-4, 4);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawCenterStatus(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  engine: BusSimulationEngine,
  palette: Palette
) {
  const { centerX: cx } = geo;
  // Slightly above geometric center so it stays well clear of the lower bottleneck badge
  const cy = geo.centerY - 14;
  const metrics = engine.getMetrics();
  const isAi = engine.config.isAiControlEnabled;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Brand Title
  ctx.fillStyle = palette.centerTitle;
  ctx.font = "800 17px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("KotoDur  কতদূর", cx, cy - 26);

  // Mode Pill (compact for vertical stadium interior)
  const modeText = isAi ? "AI HEADWAY CONTROL" : "UNCONTROLLED MODE";
  ctx.font = "700 9.5px ui-sans-serif, system-ui, -apple-system, sans-serif";
  const mw = ctx.measureText(modeText).width + 18;
  drawRoundedRect(ctx, cx - mw / 2, cy - 9, mw, 20, 10);
  ctx.fillStyle = isAi ? "rgba(6, 182, 212, 0.16)" : "rgba(245, 158, 11, 0.16)";
  ctx.fill();
  ctx.strokeStyle = isAi ? "rgba(6, 182, 212, 0.6)" : "rgba(245, 158, 11, 0.6)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = isAi ? "#0891b2" : "#d97706";
  ctx.fillText(modeText, cx, cy + 1.5);

  // Compact two-line live summary so it never touches left/right headway links
  ctx.fillStyle = palette.centerSub;
  ctx.font = "600 10.5px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(
    `H*: ${metrics.idealHeadway.toFixed(1)}s  •  CV: ${metrics.headwayCv.toFixed(0)}%`,
    cx,
    cy + 25
  );
  ctx.fillText(`Waiting: ${metrics.totalWaiting} pax`, cx, cy + 41);

  ctx.restore();
}

function drawStopAndPassengers(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  stop: BusStop,
  palette: Palette,
  canvasWidth: number,
  canvasHeight: number
) {
  const pt = getTrackPoint(stop.position, geo);
  const tangentX = Math.cos(pt.angle);
  const tangentY = Math.sin(pt.angle);
  const waitCount = stop.waitingPassengers.length;

  // 1. Waiting passenger dots clustered beside the stop (outer side of vertical oval)
  const dotColor =
    waitCount >= 18
      ? palette.passengerCrowded
      : waitCount >= 9
        ? palette.passengerBusy
        : palette.passengerNormal;

  ctx.save();
  ctx.fillStyle = dotColor;
  for (const p of stop.waitingPassengers) {
    const px = pt.x + tangentX * p.tangentOffset + pt.normalX * p.normalOffset;
    const py = pt.y + tangentY * p.tangentOffset + pt.normalY * p.normalOffset;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. Stop marker node on the track
  ctx.save();
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, 6.5, 0, Math.PI * 2);
  ctx.fillStyle = palette.stopFill;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle =
    waitCount >= 18
      ? palette.passengerCrowded
      : waitCount >= 9
        ? palette.passengerBusy
        : palette.stopStroke;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
  ctx.fillStyle = palette.stopStroke;
  ctx.fill();

  // 3. Stop name label aligned cleanly outside the vertical stadium
  const compact = canvasWidth < 560;
  ctx.font = compact
    ? "600 9.5px ui-sans-serif, system-ui, -apple-system, sans-serif"
    : "600 10.5px ui-sans-serif, system-ui, -apple-system, sans-serif";
  const countSuffix = waitCount > 0 ? ` (${waitCount})` : "";
  const text = `${stop.name}${countSuffix}`;
  const tw = ctx.measureText(text).width;
  const padX = 7;
  const boxW = tw + padX * 2;
  const boxH = 20;

  let lx: number;
  let ly: number;

  if (Math.abs(pt.normalX) > 0.35) {
    // Left or Right side of vertical loop: place label cleanly outward horizontally
    const sideDir = pt.normalX > 0 ? 1 : -1;
    const edgeGap = 38;
    lx = pt.x + sideDir * (edgeGap + boxW / 2);
    ly = pt.y + pt.normalY * 14;
  } else {
    // North (top) or South (bottom) apex: center label neatly above or below
    lx = pt.x;
    ly = pt.y + pt.normalY * 42;
  }

  // Clamp neatly inside canvas bounds
  lx = Math.max(boxW / 2 + 8, Math.min(canvasWidth - boxW / 2 - 8, lx));
  ly = Math.max(boxH / 2 + 8, Math.min(canvasHeight - boxH / 2 - 8, ly));

  drawRoundedRect(ctx, lx - boxW / 2, ly - boxH / 2, boxW, boxH, 6);
  ctx.fillStyle = palette.stopLabelBg;
  ctx.fill();
  ctx.strokeStyle =
    waitCount >= 18 ? "rgba(244, 63, 94, 0.65)" : palette.stopLabelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = palette.stopLabelText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, lx, ly + 0.5);
  ctx.restore();
}

function drawAllHeadwayLinks(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  engine: BusSimulationEngine,
  theme: "dark" | "light",
  selectedBusId: string | null
) {
  if (engine.buses.length < 2) return;
  const ordered = [...engine.buses].sort((a, b) => a.position - b.position);
  const ideal = engine.getIdealHeadwaySeconds();
  const innerOffset = 20; // offset slightly inside the oval so lines never clutter stop nodes

  for (let i = 0; i < ordered.length; i++) {
    const bus = ordered[i];
    const front = ordered[(i + 1) % ordered.length];

    const start = bus.position;
    let end = front.position;
    if (end <= start) end += TRACK_LENGTH;
    const span = end - start;
    if (span < 12) continue;

    // Trim slightly near bus centers so the link starts/ends cleanly beside the rings
    const trim = Math.min(14, span * 0.22);
    const segStart = start + trim;
    const segEnd = end - trim;
    if (segEnd <= segStart) continue;

    // Dynamic color coding: Red = bunching risk, Cyan = balanced, Amber = wide gap
    const isBunching = bus.headwayFront < ideal * 0.55;
    const isWide = bus.headwayFront > ideal * 1.45;
    const strokeColor = isBunching
      ? theme === "dark"
        ? "#EF4444"
        : "#DC2626"
      : isWide
        ? theme === "dark"
          ? "#F59E0B"
          : "#D97706"
        : theme === "dark"
          ? "#06B6D4"
          : "#0891B2";
    const isHighlighted = bus.id === selectedBusId;

    ctx.save();
    ctx.beginPath();
    const steps = Math.max(12, Math.round((segEnd - segStart) / 6));
    for (let s = 0; s <= steps; s++) {
      const pos = segStart + ((segEnd - segStart) * s) / steps;
      const pt = getTrackPoint(pos, geo);
      const x = pt.x - pt.normalX * innerOffset;
      const y = pt.y - pt.normalY * innerOffset;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = strokeColor;
    ctx.globalAlpha = isHighlighted ? 0.95 : 0.62;
    ctx.lineWidth = isHighlighted ? 2.6 : 1.75;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Midpoint pill badge showing live headway in seconds
    if (span >= 42) {
      const midPos = (start + end) / 2;
      const midPt = getTrackPoint(midPos, geo);
      const mx = midPt.x - midPt.normalX * (innerOffset + 4);
      const my = midPt.y - midPt.normalY * (innerOffset + 4);

      const label = `${bus.headwayFront.toFixed(1)}s`;
      ctx.font = "700 9.5px ui-monospace, SFMono-Regular, Menlo, monospace";
      const pw = ctx.measureText(label).width + 10;
      const ph = 16;

      drawRoundedRect(ctx, mx - pw / 2, my - ph / 2, pw, ph, 8);
      ctx.fillStyle =
        theme === "dark" ? "rgba(11, 18, 32, 0.92)" : "rgba(255, 255, 255, 0.94)";
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isHighlighted ? 1.5 : 1;
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, mx, my + 0.5);
    }

    ctx.restore();
  }
}

function drawSelectedBusHeadwayIndicator(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  selected: Bus,
  engine: BusSimulationEngine
) {
  const ordered = [...engine.buses].sort((a, b) => a.position - b.position);
  const idx = ordered.findIndex((b) => b.id === selected.id);
  if (idx === -1) return;
  const front = ordered[(idx + 1) % ordered.length];

  const start = selected.position;
  let end = front.position;
  if (end <= start) end += TRACK_LENGTH;

  ctx.save();
  traceTrackSegment(ctx, geo, start, end, 40);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
  ctx.lineWidth = 5;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawBus(
  ctx: CanvasRenderingContext2D,
  geo: TrackGeometry,
  bus: Bus,
  animTime: number,
  palette: Palette,
  isSelected: boolean
) {
  const pt = getTrackPoint(bus.position, geo);

  ctx.save();
  ctx.translate(pt.x, pt.y);

  // 1. Status Ring (Jam Override = Red Hazard, Emerald = Moving, Sky Blue = Boarding, Amber/Red pulsing = Holding)
  if (bus.jamTimer > 0) {
    const pulsePhase = (animTime * 3.0) % 1;
    const pulseRadius = 16 + pulsePhase * 16;
    const pulseAlpha = (1 - pulsePhase) * 0.85;

    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha.toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 17.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(239, 68, 68, 0.28)";
    ctx.fill();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (bus.state === "MOVING") {
    ctx.beginPath();
    ctx.arc(0, 0, isSelected ? 19 : 16, 0, Math.PI * 2);
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = isSelected ? 3 : 2.25;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(16, 185, 129, 0.14)";
    ctx.fill();
  } else if (bus.state === "BOARDING") {
    // Base Sky Blue ring
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Progress arc
    const progress =
      bus.stateTotalDuration > 0
        ? 1 - Math.max(0, bus.stateTimer) / bus.stateTotalDuration
        : 1;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      17,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * Math.min(1, Math.max(0.05, progress))
    );
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 3.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(14, 165, 233, 0.16)";
    ctx.fill();
  } else {
    // HOLDING: Amber/Red pulsing ring
    const pulsePhase = (animTime * 2.2) % 1;
    const pulseRadius = 16 + pulsePhase * 13;
    const pulseAlpha = (1 - pulsePhase) * 0.75;

    // Expanding outer radar pulse
    ctx.beginPath();
    ctx.arc(0, 0, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha.toFixed(3)})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner bright amber/red ring
    const osc = 0.5 + 0.5 * Math.sin(animTime * 7);
    ctx.beginPath();
    ctx.arc(0, 0, 17.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(245, 158, 11, 0.22)";
    ctx.fill();
    ctx.strokeStyle = osc > 0.5 ? "#f59e0b" : "#ef4444";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 2. Directional Vector Bus Icon
  ctx.save();
  ctx.rotate(pt.angle);

  const busLen = 22;
  const busWid = 11.5;

  // Chassis
  drawRoundedRect(ctx, -busLen / 2, -busWid / 2, busLen, busWid, 3.5);
  ctx.fillStyle = palette.busBody;
  ctx.fill();
  ctx.strokeStyle = palette.busStroke;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Status-tinted roof stripe
  const stripeColor =
    bus.state === "MOVING"
      ? "#10b981"
      : bus.state === "BOARDING"
        ? "#0ea5e9"
        : "#f59e0b";
  drawRoundedRect(ctx, -busLen / 2 + 3, -busWid / 2 + 2.5, 10, busWid - 5, 1.5);
  ctx.fillStyle = stripeColor;
  ctx.fill();

  // Front windshield (right side = direction of travel)
  drawRoundedRect(ctx, busLen / 2 - 5.2, -busWid / 2 + 1.8, 3.6, busWid - 3.6, 1.2);
  ctx.fillStyle = palette.busWindshield;
  ctx.fill();

  // Tiny directional headlight beams when moving
  if (bus.state === "MOVING") {
    ctx.fillStyle = "rgba(253, 224, 71, 0.85)";
    ctx.fillRect(busLen / 2 - 0.8, -busWid / 2 + 1.5, 1.6, 2);
    ctx.fillRect(busLen / 2 - 0.8, busWid / 2 - 3.5, 1.6, 2);
  }
  ctx.restore();

  // 3. Bus Short Label Tag on the INNER side of the track loop (facing inward, zero overlap with outer stop labels)
  ctx.font = "700 8.5px ui-monospace, SFMono-Regular, Menlo, monospace";
  const idW = ctx.measureText(bus.id).width + 9;
  const idH = 14.5;

  let tagOffsetX: number;
  let tagOffsetY: number;
  if (Math.abs(pt.normalX) > 0.35) {
    const inwardDir = pt.normalX > 0 ? -1 : 1;
    tagOffsetX = inwardDir * (21 + idW / 2);
    tagOffsetY = -pt.normalY * 10;
  } else {
    tagOffsetX = 0;
    tagOffsetY = -pt.normalY * 26;
  }

  drawRoundedRect(
    ctx,
    tagOffsetX - idW / 2,
    tagOffsetY - idH / 2,
    idW,
    idH,
    4
  );
  ctx.fillStyle = isSelected ? "#06B6D4" : palette.busIdBg;
  ctx.fill();
  ctx.fillStyle = isSelected ? "#0f172a" : palette.busIdText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(bus.id, tagOffsetX, tagOffsetY + 0.5);

  // 4. Jammed or Holding Countdown Badge (stacked neatly beside the inner bus label)
  if (bus.jamTimer > 0) {
    const jamText = `JAM ${bus.jamTimer.toFixed(1)}s`;
    ctx.font = "800 9.5px ui-monospace, SFMono-Regular, Menlo, monospace";
    const cw = ctx.measureText(jamText).width + 11;
    const bx = tagOffsetX;
    const by = tagOffsetY - 17;

    drawRoundedRect(ctx, bx - cw / 2, by - 8.5, cw, 17, 8.5);
    ctx.fillStyle = "#991b1b";
    ctx.fill();
    ctx.strokeStyle = "#f87171";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#fee2e2";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(jamText, bx, by + 0.5);
  } else if (bus.state === "HOLDING") {
    const countdownText = `HOLD ${Math.max(0, bus.stateTimer).toFixed(1)}s`;
    ctx.font = "800 9.5px ui-monospace, SFMono-Regular, Menlo, monospace";
    const cw = ctx.measureText(countdownText).width + 11;
    const bx = tagOffsetX;
    const by = tagOffsetY - 17;

    drawRoundedRect(ctx, bx - cw / 2, by - 8.5, cw, 17, 8.5);
    ctx.fillStyle = "#b45309";
    ctx.fill();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#fef3c7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(countdownText, bx, by + 0.5);
  }

  ctx.restore();
}
