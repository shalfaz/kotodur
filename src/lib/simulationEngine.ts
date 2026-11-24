export type BusState = "MOVING" | "BOARDING" | "HOLDING";

export interface PassengerDot {
  id: number;
  /** Offset along the track tangent (normalized units) */
  tangentOffset: number;
  /** Offset outward from the track (normalized units) */
  normalOffset: number;
  /** Simulation time when the passenger arrived */
  arrivedAt: number;
}

export interface BusStop {
  id: number;
  name: string;
  bnName: string;
  /** Position along the closed loop in [0, TRACK_LENGTH) */
  position: number;
  /** Relative demand weight for this Dhaka stop */
  demandWeight: number;
  waitingPassengers: PassengerDot[];
  totalBoarded: number;
}

export interface Bus {
  /** Short display label for canvas & telemetry (e.g. Bikolpo-01, Shikhor-02) */
  id: string;
  /** Two-digit fleet selector number ("01" to "06") */
  fleetNumber: string;
  /** Full Dhaka bus operator name */
  operatorName: string;
  /** Dhaka Metro registration license plate */
  licensePlate: string;
  /** Position along the closed loop in [0, TRACK_LENGTH) */
  position: number;
  /** Current linear speed in track units / second */
  speed: number;
  /** Target cruise speed before traffic/queueing */
  baseSpeed: number;
  state: BusState;
  /** Remaining seconds in BOARDING or HOLDING state */
  stateTimer: number;
  /** Total duration of the current BOARDING or HOLDING phase */
  stateTotalDuration: number;
  /** Stop index currently stopped at, or null when moving */
  currentStopId: number | null;
  /** Most recently departed stop index to prevent re-triggering */
  lastStopId: number | null;
  /** Passengers queued to board during the current BOARDING phase */
  boardingRemaining: number;
  /** Accumulator for dequeuing visual passenger dots smoothly during boarding */
  boardingDotAccumulator: number;
  /** Current passengers onboard (for telemetry) */
  onboardPassengers: number;
  /** Calculated headway to bus ahead (seconds) */
  headwayFront: number;
  /** Calculated headway to bus behind (seconds) */
  headwayBack: number;
  /** Distance to bus ahead in meters (1 track unit = 10 m on 10 km Dhaka loop) */
  distanceFrontMeters: number;
  /** Distance to bus behind in meters */
  distanceBackMeters: number;
  /** Remaining seconds stalled by an injected traffic jam (0 when clear) */
  jamTimer: number;
  /** Whether bus is currently inside the traffic bottleneck */
  inBottleneck: boolean;
  /** Whether bus is currently slowed by safe-distance following */
  isQueuedBehindBus: boolean;
  /** Total holds executed by AI controller */
  holdCount: number;
}

export interface BottleneckZone {
  name: string;
  startPosition: number;
  endPosition: number;
  /** Remaining speed factor (0.4 = 60% speed drop) */
  speedFactor: number;
  enabled: boolean;
}

export type ScenarioPresetId = "office_rush" | "rainy_dhaka" | "midnight_free";

export interface SimulationConfig {
  isAiControlEnabled: boolean;
  passengerDemand: number; // multiplier: 0.4 to 3.0
  speedMultiplier: 1 | 2 | 5;
  baseSpeedMultiplier: number; // 0.65 (rainy) to 1.25 (midnight)
  baseDwellTime: number; // seconds
  timePerPassenger: number; // seconds per waiting passenger
  alpha: number; // headway equalization gain (0.3 - 1.0)
  maxHoldTime: number; // max seconds a bus can be held at a stop
  minSafeDistance: number; // track units
  bottleneckEnabled: boolean;
  bottleneckSpeedFactor: number; // 0.4 = 60% drop, 0.9 = minimal slowdown
}

export interface TrajectorySample {
  time: number;
  positions: Record<string, number>;
}

export interface AiImpactSummary {
  uncontrolledSeconds: number;
  aiSeconds: number;
  isReady: boolean;
  uncontrolledAvgWait: number;
  aiAvgWait: number;
  waitReductionPct: number;
  uncontrolledAvgBunched: number;
  aiAvgBunched: number;
  bunchedReductionPct: number;
}

export interface TelemetryPoint {
  time: number;
  headwayCv: number; // percentage 0..100+
  headwayVariance: number; // variance of headways (s^2)
  stabilityScore: number; // 0..100%
  avgWaitTime: number; // seconds
  bunchedPairs: number;
  isAiControlEnabled: boolean;
}

export interface SimulationMetrics {
  simTime: number;
  idealHeadway: number;
  headwayStdDev: number;
  headwayVariance: number;
  headwayCv: number; // Coefficient of variation (%)
  stabilityScore: number; // 0 (chaotic) to 100 (perfectly uniform)
  bunchingIndex: number; // 0 (perfect) to 100 (severe bunching)
  bunchedPairs: number;
  totalWaiting: number;
  totalServed: number;
  avgWaitTime: number;
  activeHolds: number;
  totalHoldsExecuted: number;
  jammedBusId: string | null;
}

export interface SimulationSnapshot {
  stops: BusStop[];
  buses: Bus[];
  bottleneck: BottleneckZone;
  config: SimulationConfig;
  metrics: SimulationMetrics;
  history: TelemetryPoint[];
  trajectories: TrajectorySample[];
  aiImpact: AiImpactSummary;
}

export interface TrackGeometry {
  centerX: number;
  centerY: number;
  straightLength: number;
  radius: number;
  perimeter: number;
}

export interface TrackPoint {
  x: number;
  y: number;
  angle: number;
  normalX: number;
  normalY: number;
}

export const TRACK_LENGTH = 1000;
export const MAX_WAITING_PER_STOP = 48;
export const BUS_BASE_SPEED = 24; // track units / sec

export const DHAKA_STOPS: ReadonlyArray<{
  name: string;
  bnName: string;
  demandWeight: number;
  /** Explicit clockwise loop position in [0, TRACK_LENGTH): 0 = North (Mirpur-10), 500 = South (Motijheel) */
  position: number;
}> = [
  { name: "Mirpur-10", bnName: "মিরপুর-১০", demandWeight: 1.25, position: 0 },
  { name: "Kazipara", bnName: "কাজীপাড়া", demandWeight: 0.9, position: 85 },
  { name: "Shewrapara", bnName: "শেওড়াপাড়া", demandWeight: 0.95, position: 165 },
  { name: "Agargaon", bnName: "আগারগাঁও", demandWeight: 1.0, position: 250 },
  { name: "Bijoy Sarani", bnName: "বিজয় সরণি", demandWeight: 0.85, position: 335 },
  { name: "Farmgate", bnName: "ফার্মগেট", demandWeight: 1.45, position: 415 },
  { name: "Motijheel", bnName: "মতিঝিল", demandWeight: 1.35, position: 500 },
  { name: "Press Club", bnName: "প্রেস ক্লাব", demandWeight: 0.9, position: 625 },
  { name: "Shahbag", bnName: "শাহবাগ", demandWeight: 1.2, position: 750 },
  { name: "Karwan Bazar", bnName: "কারওয়ান বাজার", demandWeight: 1.15, position: 875 },
];

export const DHAKA_BUS_FLEET: ReadonlyArray<{
  id: string;
  fleetNumber: string;
  operatorName: string;
  licensePlate: string;
}> = [
  {
    id: "Bikolpo-01",
    fleetNumber: "01",
    operatorName: "Bikolpo Auto Service",
    licensePlate: "ঢাকা মেট্রো-ব-১১-২৪০১",
  },
  {
    id: "Shikhor-02",
    fleetNumber: "02",
    operatorName: "Shikhor Paribahan",
    licensePlate: "ঢাকা মেট্রো-ব-১৫-৪৮১২",
  },
  {
    id: "BRTC-03",
    fleetNumber: "03",
    operatorName: "BRTC Articulated",
    licensePlate: "ঢাকা মেট্রো-ব-১১-৯০০৩",
  },
  {
    id: "Bikolpo-04",
    fleetNumber: "04",
    operatorName: "Bikolpo Auto Service",
    licensePlate: "ঢাকা মেট্রো-ব-১১-২৪০৪",
  },
  {
    id: "Shikhor-05",
    fleetNumber: "05",
    operatorName: "Shikhor Paribahan",
    licensePlate: "ঢাকা মেট্রো-ব-১৫-৪৮০৫",
  },
  {
    id: "BRTC-06",
    fleetNumber: "06",
    operatorName: "BRTC Articulated",
    licensePlate: "ঢাকা মেট্রো-ব-১১-৯০০৬",
  },
];

export const DEFAULT_CONFIG: SimulationConfig = {
  isAiControlEnabled: false,
  passengerDemand: 1.0,
  speedMultiplier: 1,
  baseSpeedMultiplier: 1.0,
  baseDwellTime: 1.2,
  timePerPassenger: 0.45,
  alpha: 0.78,
  maxHoldTime: 12.0,
  minSafeDistance: 26,
  bottleneckEnabled: true,
  bottleneckSpeedFactor: 0.4,
};

export const SCENARIO_PRESETS: Record<
  ScenarioPresetId,
  {
    label: string;
    shortDesc: string;
    patch: Partial<SimulationConfig>;
  }
> = {
  office_rush: {
    label: "Office Rush (9 AM)",
    shortDesc: "2.2x demand, α=0.85, heavy bottleneck",
    patch: {
      passengerDemand: 2.2,
      alpha: 0.85,
      baseSpeedMultiplier: 1.0,
      baseDwellTime: 1.2,
      timePerPassenger: 0.45,
      bottleneckEnabled: true,
      bottleneckSpeedFactor: 0.4,
    },
  },
  rainy_dhaka: {
    label: "Rainy Dhaka",
    shortDesc: "-35% speed, 1.8x demand, slow boarding",
    patch: {
      passengerDemand: 1.8,
      baseSpeedMultiplier: 0.65,
      baseDwellTime: 2.1,
      timePerPassenger: 0.65,
      bottleneckEnabled: true,
      bottleneckSpeedFactor: 0.4,
    },
  },
  midnight_free: {
    label: "Midnight Free Flow",
    shortDesc: "0.4x demand, fast cruise, light traffic",
    patch: {
      passengerDemand: 0.4,
      baseSpeedMultiplier: 1.25,
      baseDwellTime: 1.0,
      timePerPassenger: 0.35,
      bottleneckEnabled: true,
      bottleneckSpeedFactor: 0.9,
    },
  },
};

/**
 * Exact Poisson sampler using Knuth's algorithm (for small/moderate lambda).
 */
function samplePoisson(lambda: number): number {
  if (lambda <= 0) return 0;
  if (lambda > 20) {
    // Normal approximation fallback for very high rates
    const u1 = Math.max(1e-9, Math.random());
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * z));
  }
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export function wrapPosition(pos: number): number {
  const m = pos % TRACK_LENGTH;
  return m < 0 ? m + TRACK_LENGTH : m;
}

export function forwardDistance(fromPos: number, toPos: number): number {
  return wrapPosition(toPos - fromPos);
}

/**
 * Computes a tall vertical stadium (capsule) track geometry oriented North-to-South
 * to match Dhaka's Mirpur-10 (North) -> Motijheel (South) corridor.
 */
export function computeTrackGeometry(width: number, height: number): TrackGeometry {
  const padX = Math.max(118, width * 0.22);
  const padY = Math.max(58, height * 0.11);
  const availW = Math.max(180, width - padX * 2);
  const availH = Math.max(260, height - padY * 2);

  // Horizontal radius of top & bottom semicircles; keep wide enough for center HUD
  const radius = Math.min(availW / 2, availH * 0.28);
  const straightLength = Math.max(80, availH - radius * 2);
  const perimeter = 2 * straightLength + 2 * Math.PI * radius;

  return {
    centerX: width / 2,
    centerY: height / 2,
    straightLength,
    radius,
    perimeter,
  };
}

/**
 * Maps a track position in [0, TRACK_LENGTH) to exact arc-length coordinates,
 * tangent angle (clockwise), and outward normal vector on the vertical stadium loop.
 *
 * Position 0 starts at the North top apex (Mirpur-10) and proceeds clockwise:
 * top-right arc -> right straightaway (Southbound) -> bottom arc -> left straightaway (Northbound) -> top-left arc.
 */
export function getTrackPoint(position: number, geo: TrackGeometry): TrackPoint {
  const norm = wrapPosition(position) / TRACK_LENGTH;
  const dist = norm * geo.perimeter;
  const halfStraight = geo.straightLength / 2;
  const quarterArc = (Math.PI * geo.radius) / 2;
  const semiArc = Math.PI * geo.radius;

  // Segment 1: Top-right quarter arc (North apex -> top of right straightaway)
  if (dist < quarterArc) {
    const theta = -Math.PI / 2 + dist / geo.radius;
    const x = geo.centerX + geo.radius * Math.cos(theta);
    const y = geo.centerY - halfStraight + geo.radius * Math.sin(theta);
    return {
      x,
      y,
      angle: theta + Math.PI / 2,
      normalX: Math.cos(theta),
      normalY: Math.sin(theta),
    };
  }

  // Segment 2: Right straightaway (Southbound: top -> bottom)
  const d2 = dist - quarterArc;
  if (d2 < geo.straightLength) {
    const x = geo.centerX + geo.radius;
    const y = geo.centerY - halfStraight + d2;
    return { x, y, angle: Math.PI / 2, normalX: 1, normalY: 0 };
  }

  // Segment 3: Bottom semicircle (right -> South apex -> left, clockwise)
  const d3 = d2 - geo.straightLength;
  if (d3 < semiArc) {
    const theta = d3 / geo.radius;
    const x = geo.centerX + geo.radius * Math.cos(theta);
    const y = geo.centerY + halfStraight + geo.radius * Math.sin(theta);
    return {
      x,
      y,
      angle: theta + Math.PI / 2,
      normalX: Math.cos(theta),
      normalY: Math.sin(theta),
    };
  }

  // Segment 4: Left straightaway (Northbound: bottom -> top)
  const d4 = d3 - semiArc;
  if (d4 < geo.straightLength) {
    const x = geo.centerX - geo.radius;
    const y = geo.centerY + halfStraight - d4;
    return { x, y, angle: -Math.PI / 2, normalX: -1, normalY: 0 };
  }

  // Segment 5: Top-left quarter arc (top of left straightaway -> North apex)
  const d5 = d4 - geo.straightLength;
  const theta = Math.PI + d5 / geo.radius;
  const x = geo.centerX + geo.radius * Math.cos(theta);
  const y = geo.centerY - halfStraight + geo.radius * Math.sin(theta);
  return {
    x,
    y,
    angle: theta + Math.PI / 2,
    normalX: Math.cos(theta),
    normalY: Math.sin(theta),
  };
}

export class BusSimulationEngine {
  public stops: BusStop[] = [];
  public buses: Bus[] = [];
  public bottleneck: BottleneckZone;
  public config: SimulationConfig;
  public simTime = 0;
  public history: TelemetryPoint[] = [];
  public trajectories: TrajectorySample[] = [];

  private nextPassengerId = 1;
  private totalServed = 0;
  private cumulativeWaitSeconds = 0;
  private totalHoldsExecuted = 0;
  private lastHistorySampleTime = -1;
  private lastTrajectorySampleTime = -1;
  private baseArrivalRatePerStop = 0.22; // passengers/sec at demand=1.0

  // Rolling per-mode baseline stats for AI Impact Summary
  private uncontrolledStats = {
    elapsedSeconds: 0,
    boardedWaitSum: 0,
    boardedCount: 0,
    waitSnapshotIntegral: 0,
    bunchedIntegral: 0,
  };
  private aiStats = {
    elapsedSeconds: 0,
    boardedWaitSum: 0,
    boardedCount: 0,
    waitSnapshotIntegral: 0,
    bunchedIntegral: 0,
  };

  constructor(initialConfig?: Partial<SimulationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...initialConfig };
    // Lower-right Farmgate southbound bottleneck section (between Bijoy Sarani and Motijheel)
    this.bottleneck = {
      name: "Farmgate Lower-Right Traffic Bottleneck",
      startPosition: 345,
      endPosition: 475,
      speedFactor: this.config.bottleneckSpeedFactor,
      enabled: this.config.bottleneckEnabled,
    };
    this.reset();
  }

  public reset(): void {
    this.simTime = 0;
    this.nextPassengerId = 1;
    this.totalServed = 0;
    this.cumulativeWaitSeconds = 0;
    this.totalHoldsExecuted = 0;
    this.lastHistorySampleTime = -1;
    this.lastTrajectorySampleTime = -1;
    this.history = [];
    this.trajectories = [];
    this.uncontrolledStats = {
      elapsedSeconds: 0,
      boardedWaitSum: 0,
      boardedCount: 0,
      waitSnapshotIntegral: 0,
      bunchedIntegral: 0,
    };
    this.aiStats = {
      elapsedSeconds: 0,
      boardedWaitSum: 0,
      boardedCount: 0,
      waitSnapshotIntegral: 0,
      bunchedIntegral: 0,
    };

    // 10 authentic North-to-South clockwise Dhaka stops (deterministic initial seed for zero SSR hydration mismatch)
    this.stops = DHAKA_STOPS.map((def, idx) => {
      const stop: BusStop = {
        id: idx,
        name: def.name,
        bnName: def.bnName,
        position: def.position,
        demandWeight: def.demandWeight,
        waitingPassengers: [],
        totalBoarded: 0,
      };
      const initialCount = 2 + (idx % 3);
      for (let i = 0; i < initialCount; i++) {
        this.addPassengerToStop(stop, true);
      }
      return stop;
    });

    // Spawn 6 realistic Dhaka Mirpur-Motijheel corridor buses evenly spaced along the track
    const busCount = DHAKA_BUS_FLEET.length;
    const busSpacing = TRACK_LENGTH / busCount;
    this.buses = DHAKA_BUS_FLEET.map((spec, idx) => {
      const startPos = wrapPosition(idx * busSpacing + 35);
      const cruiseSpeed = BUS_BASE_SPEED * this.config.baseSpeedMultiplier;
      return {
        id: spec.id,
        fleetNumber: spec.fleetNumber,
        operatorName: spec.operatorName,
        licensePlate: spec.licensePlate,
        position: startPos,
        speed: cruiseSpeed,
        baseSpeed: BUS_BASE_SPEED,
        state: "MOVING" as BusState,
        stateTimer: 0,
        stateTotalDuration: 0,
        currentStopId: null,
        lastStopId: null,
        boardingRemaining: 0,
        boardingDotAccumulator: 0,
        onboardPassengers: 10 + ((idx * 3) % 9),
        headwayFront: 0,
        headwayBack: 0,
        distanceFrontMeters: 0,
        distanceBackMeters: 0,
        jamTimer: 0,
        inBottleneck: this.isInBottleneck(startPos),
        isQueuedBehindBus: false,
        holdCount: 0,
      };
    });

    this.recomputeHeadways();
    this.recordHistoryPoint();
    this.recordTrajectorySample();
  }

  public updateConfig(partial: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...partial };
    this.bottleneck.enabled = this.config.bottleneckEnabled;
    this.bottleneck.speedFactor = this.config.bottleneckSpeedFactor;
  }

  /**
   * Stalls a random moving bus for `durationSeconds` (default 8s) so users can
   * visually watch a bunching chain-reaction start and self-heal under AI Control.
   * Returns the affected bus ID.
   */
  public injectTrafficJam(durationSeconds = 8): string | null {
    const movingCandidates = this.buses.filter(
      (b) => b.state === "MOVING" && b.jamTimer <= 0
    );
    const pool = movingCandidates.length > 0 ? movingCandidates : this.buses;
    if (pool.length === 0) return null;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    chosen.jamTimer = durationSeconds;
    chosen.speed = 0;
    return chosen.id;
  }

  /**
   * Injects a sudden demand surge at Farmgate & Shahbag or triggers a manual delay
   * so users can test how quickly AI Headway Equalization recovers from disruption.
   */
  public triggerDemandSurge(): void {
    const surgeStopIds = [0, 5, 7, 9]; // Mirpur-10, Farmgate, Shahbag, Motijheel
    for (const id of surgeStopIds) {
      const stop = this.stops[id];
      if (!stop) continue;
      const count = 8 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        this.addPassengerToStop(stop);
      }
    }
  }

  /**
   * Advances simulation by `rawDt` seconds (real time), scaled by speedMultiplier,
   * using fixed sub-stepping to keep collision/stop checks deterministic at 1x, 2x, 5x.
   */
  public step(rawDt: number): void {
    // Clamp frame delta to avoid huge jumps on tab switch
    const clampedRawDt = Math.min(rawDt, 0.1);
    const totalSimDt = clampedRawDt * this.config.speedMultiplier;
    const maxSubStep = 0.05; // 20 Hz minimum physics resolution
    let remaining = totalSimDt;

    while (remaining > 1e-6) {
      const dt = Math.min(remaining, maxSubStep);
      this.stepPhysics(dt);
      remaining -= dt;
    }

    if (this.simTime - this.lastHistorySampleTime >= 1.0) {
      this.recordHistoryPoint();
    }
    if (this.simTime - this.lastTrajectorySampleTime >= 0.5) {
      this.recordTrajectorySample();
    }
  }

  private stepPhysics(dt: number): void {
    this.simTime += dt;

    // 1. Stochastically spawn waiting passengers at every stop
    for (const stop of this.stops) {
      const lambda =
        this.baseArrivalRatePerStop *
        stop.demandWeight *
        this.config.passengerDemand *
        dt;
      const arrivals = samplePoisson(lambda);
      for (let i = 0; i < arrivals; i++) {
        this.addPassengerToStop(stop);
      }
    }

    // 2. Update headways before state transitions so AI control uses fresh gaps
    this.recomputeHeadways();

    // 3. Sort bus indices by position for safe-distance checks
    const orderedBuses = [...this.buses].sort((a, b) => a.position - b.position);
    const frontBusMap = new Map<string, Bus>();
    for (let i = 0; i < orderedBuses.length; i++) {
      const current = orderedBuses[i];
      const front = orderedBuses[(i + 1) % orderedBuses.length];
      frontBusMap.set(current.id, front);
    }

    // 4. Advance each bus state machine
    for (const bus of this.buses) {
      bus.inBottleneck = this.isInBottleneck(bus.position);

      if (bus.jamTimer > 0) {
        bus.jamTimer = Math.max(0, bus.jamTimer - dt);
        bus.speed = 0;
        bus.isQueuedBehindBus = false;
        continue;
      }

      if (bus.state === "BOARDING") {
        bus.speed = 0;
        bus.isQueuedBehindBus = false;
        this.updateBoardingState(bus, dt);
      } else if (bus.state === "HOLDING") {
        bus.speed = 0;
        bus.isQueuedBehindBus = false;
        this.updateHoldingState(bus, dt);
      } else {
        const frontBus = frontBusMap.get(bus.id)!;
        this.updateMovingState(bus, frontBus, dt);
      }
    }

    // 5. Refresh headways after movement
    this.recomputeHeadways();

    // 6. Accumulate per-mode baseline stats for live AI Impact Summary
    const idealHeadway = this.getIdealHeadwaySeconds();
    const bunchedNow = this.buses.filter(
      (b) => b.headwayFront < idealHeadway * 0.45
    ).length;
    let waitingCount = 0;
    let waitingSum = 0;
    for (const stop of this.stops) {
      for (const p of stop.waitingPassengers) {
        waitingCount++;
        waitingSum += Math.max(0, this.simTime - p.arrivedAt);
      }
    }
    const instantAvgWait = waitingCount > 0 ? waitingSum / waitingCount : 0;
    const bucket = this.config.isAiControlEnabled
      ? this.aiStats
      : this.uncontrolledStats;
    bucket.elapsedSeconds += dt;
    bucket.bunchedIntegral += bunchedNow * dt;
    bucket.waitSnapshotIntegral += instantAvgWait * dt;
  }

  private updateBoardingState(bus: Bus, dt: number): void {
    const stop = bus.currentStopId !== null ? this.stops[bus.currentStopId] : null;
    bus.stateTimer -= dt;

    // Smoothly dequeue waiting passenger dots during the boarding dwell
    if (stop && stop.waitingPassengers.length > 0 && bus.boardingRemaining > 0) {
      const rate = 1 / Math.max(0.05, this.config.timePerPassenger);
      bus.boardingDotAccumulator += rate * dt;
      while (
        bus.boardingDotAccumulator >= 1 &&
        bus.boardingRemaining > 0 &&
        stop.waitingPassengers.length > 0
      ) {
        this.boardOnePassenger(bus, stop);
        bus.boardingRemaining--;
        bus.boardingDotAccumulator -= 1;
      }
    }

    if (bus.stateTimer <= 0) {
      // Ensure any remaining targeted passengers finish boarding
      if (stop) {
        while (bus.boardingRemaining > 0 && stop.waitingPassengers.length > 0) {
          this.boardOnePassenger(bus, stop);
          bus.boardingRemaining--;
        }
      }

      // Transition out of BOARDING: check AI Headway Equalization
      if (this.config.isAiControlEnabled) {
        this.recomputeHeadways();
        const idealHeadway = this.getIdealHeadwaySeconds();
        const hFront = bus.headwayFront;
        const hBack = bus.headwayBack;

        if (hFront < idealHeadway && hBack > hFront) {
          const rawHold = this.config.alpha * ((hFront + hBack) / 2 - hFront);
          const holdTime = Math.min(this.config.maxHoldTime, Math.max(0, rawHold));

          if (holdTime >= 0.4) {
            bus.state = "HOLDING";
            bus.stateTimer = holdTime;
            bus.stateTotalDuration = holdTime;
            bus.holdCount += 1;
            this.totalHoldsExecuted += 1;
            return;
          }
        }
      }

      // Uncontrolled mode or no hold needed: depart immediately
      bus.lastStopId = bus.currentStopId;
      bus.currentStopId = null;
      bus.state = "MOVING";
      bus.stateTimer = 0;
      bus.stateTotalDuration = 0;
    }
  }

  private updateHoldingState(bus: Bus, dt: number): void {
    const stop = bus.currentStopId !== null ? this.stops[bus.currentStopId] : null;
    bus.stateTimer -= dt;

    // Passengers who arrive while the bus is holding can hop right on
    if (stop && stop.waitingPassengers.length > 0) {
      this.boardOnePassenger(bus, stop);
    }

    // Also release early if user toggled AI control off
    if (!this.config.isAiControlEnabled || bus.stateTimer <= 0) {
      bus.lastStopId = bus.currentStopId;
      bus.currentStopId = null;
      bus.state = "MOVING";
      bus.stateTimer = 0;
      bus.stateTotalDuration = 0;
    }
  }

  private updateMovingState(bus: Bus, frontBus: Bus, dt: number): void {
    const speedFactor = bus.inBottleneck ? this.bottleneck.speedFactor : 1.0;
    const targetSpeed =
      bus.baseSpeed * this.config.baseSpeedMultiplier * speedFactor;

    // Distance to the bus immediately ahead
    const distToFront = forwardDistance(bus.position, frontBus.position);
    const maxStepAllowed = Math.max(0, distToFront - this.config.minSafeDistance);

    let desiredStep = targetSpeed * dt;
    if (desiredStep >= maxStepAllowed) {
      desiredStep = maxStepAllowed;
      bus.isQueuedBehindBus = true;
      bus.speed = dt > 0 ? desiredStep / dt : 0;
    } else {
      bus.isQueuedBehindBus = false;
      bus.speed = targetSpeed;
    }

    if (desiredStep <= 1e-6) {
      return;
    }

    const prevPos = bus.position;
    const nextPos = wrapPosition(prevPos + desiredStep);

    // Check if the bus reached/crossed any stop along [prevPos, prevPos + desiredStep]
    let reachedStop: BusStop | null = null;
    let minStopDist = Infinity;

    for (const stop of this.stops) {
      if (stop.id === bus.lastStopId) continue;
      const distToStop = forwardDistance(prevPos, stop.position);
      if (distToStop <= desiredStep + 0.001 && distToStop < minStopDist) {
        minStopDist = distToStop;
        reachedStop = stop;
      }
    }

    if (reachedStop) {
      // Snap cleanly to stop and enter BOARDING state
      bus.position = reachedStop.position;
      bus.speed = 0;
      bus.state = "BOARDING";
      bus.currentStopId = reachedStop.id;
      bus.lastStopId = null;

      // Some onboard passengers alight at each stop
      const alighting = Math.min(
        bus.onboardPassengers,
        Math.floor(bus.onboardPassengers * (0.15 + Math.random() * 0.2))
      );
      bus.onboardPassengers = Math.max(0, bus.onboardPassengers - alighting);

      const waitingCount = reachedStop.waitingPassengers.length;
      const dwellTime =
        this.config.baseDwellTime + waitingCount * this.config.timePerPassenger;

      bus.stateTimer = dwellTime;
      bus.stateTotalDuration = dwellTime;
      bus.boardingRemaining = waitingCount;
      bus.boardingDotAccumulator = 0;
    } else {
      bus.position = nextPos;
      // Clear lastStopId once well clear of it
      if (bus.lastStopId !== null) {
        const lastStop = this.stops[bus.lastStopId];
        if (forwardDistance(lastStop.position, bus.position) > 8) {
          bus.lastStopId = null;
        }
      }
    }
  }

  private addPassengerToStop(stop: BusStop, deterministic = false): void {
    if (stop.waitingPassengers.length >= MAX_WAITING_PER_STOP) return;
    const idx = stop.waitingPassengers.length;
    // Arrange dots in a neat organic cluster beside the stop (rows of 6)
    const col = idx % 6;
    const row = Math.floor(idx / 6);
    const jitterT = deterministic ? 0 : (Math.random() - 0.5) * 2.2;
    const jitterN = deterministic ? 0 : (Math.random() - 0.5) * 2.0;

    stop.waitingPassengers.push({
      id: this.nextPassengerId++,
      tangentOffset: (col - 2.5) * 6.5 + jitterT,
      normalOffset: 20 + row * 6.5 + jitterN,
      arrivedAt: this.simTime,
    });
  }

  private boardOnePassenger(bus: Bus, stop: BusStop): void {
    const passenger = stop.waitingPassengers.shift();
    if (!passenger) return;
    const wait = Math.max(0, this.simTime - passenger.arrivedAt);
    this.cumulativeWaitSeconds += wait;
    this.totalServed += 1;
    stop.totalBoarded += 1;
    bus.onboardPassengers = Math.min(55, bus.onboardPassengers + 1);

    const bucket = this.config.isAiControlEnabled
      ? this.aiStats
      : this.uncontrolledStats;
    bucket.boardedWaitSum += wait;
    bucket.boardedCount += 1;
  }

  public isInBottleneck(position: number): boolean {
    if (!this.bottleneck.enabled) return false;
    const p = wrapPosition(position);
    return p >= this.bottleneck.startPosition && p <= this.bottleneck.endPosition;
  }

  /**
   * Effective average loop speed (including bottleneck and typical dwell times)
   * used to convert circular track gaps into realistic headway seconds.
   */
  private getEffectiveLoopSpeed(): number {
    const cruise = BUS_BASE_SPEED * this.config.baseSpeedMultiplier;
    const bottleneckLen = this.bottleneck.enabled
      ? this.bottleneck.endPosition - this.bottleneck.startPosition
      : 0;
    const normalLen = TRACK_LENGTH - bottleneckLen;
    const drivingTime =
      normalLen / cruise +
      bottleneckLen / (cruise * this.bottleneck.speedFactor);
    const estDwellPerLap =
      this.stops.length *
      (this.config.baseDwellTime +
        3.2 * this.config.passengerDemand * this.config.timePerPassenger);
    const estLapTime = drivingTime + estDwellPerLap;
    return TRACK_LENGTH / Math.max(10, estLapTime);
  }

  public getIdealHeadwaySeconds(): number {
    const vEff = this.getEffectiveLoopSpeed();
    const idealDist = TRACK_LENGTH / Math.max(1, this.buses.length);
    return idealDist / vEff;
  }

  private recomputeHeadways(): void {
    if (this.buses.length < 2) return;
    const vEff = this.getEffectiveLoopSpeed();
    const ordered = [...this.buses].sort((a, b) => a.position - b.position);
    const n = ordered.length;

    for (let i = 0; i < n; i++) {
      const bus = ordered[i];
      const front = ordered[(i + 1) % n];
      const back = ordered[(i - 1 + n) % n];

      const dFront = forwardDistance(bus.position, front.position);
      const dBack = forwardDistance(back.position, bus.position);

      bus.headwayFront = dFront / vEff;
      bus.headwayBack = dBack / vEff;
      bus.distanceFrontMeters = Math.round(dFront * 10);
      bus.distanceBackMeters = Math.round(dBack * 10);
    }
  }

  public getMetrics(): SimulationMetrics {
    const idealHeadway = this.getIdealHeadwaySeconds();
    const headways = this.buses.map((b) => b.headwayFront);
    const mean =
      headways.reduce((acc, h) => acc + h, 0) / Math.max(1, headways.length);
    const variance =
      headways.reduce((acc, h) => acc + (h - mean) ** 2, 0) /
      Math.max(1, headways.length);
    const stdDev = Math.sqrt(variance);
    const headwayCv = mean > 0 ? (stdDev / mean) * 100 : 0;

    // Stability score: 100% = zero variance, decreases smoothly as CV rises
    const stabilityScore = Math.max(
      0,
      Math.min(100, Math.round(100 - headwayCv * 0.85))
    );

    // Normalized bunching index: 0% = perfectly spaced, 100% = severe bunching (CV >= 75%)
    const bunchingIndex = Math.min(100, Math.round((headwayCv / 75) * 100));

    const bunchedPairs = this.buses.filter(
      (b) => b.headwayFront < idealHeadway * 0.45
    ).length;

    const totalWaiting = this.stops.reduce(
      (sum, s) => sum + s.waitingPassengers.length,
      0
    );

    // Blend served wait times with currently waiting passengers for responsive real-time metric
    let currentWaitingSum = 0;
    for (const stop of this.stops) {
      for (const p of stop.waitingPassengers) {
        currentWaitingSum += Math.max(0, this.simTime - p.arrivedAt);
      }
    }
    const denom = this.totalServed + totalWaiting;
    const avgWaitTime =
      denom > 0 ? (this.cumulativeWaitSeconds + currentWaitingSum) / denom : 0;

    const activeHolds = this.buses.filter((b) => b.state === "HOLDING").length;
    const jammedBus = this.buses.find((b) => b.jamTimer > 0) ?? null;

    return {
      simTime: this.simTime,
      idealHeadway,
      headwayStdDev: stdDev,
      headwayVariance: variance,
      headwayCv,
      stabilityScore,
      bunchingIndex,
      bunchedPairs,
      totalWaiting,
      totalServed: this.totalServed,
      avgWaitTime,
      activeHolds,
      totalHoldsExecuted: this.totalHoldsExecuted,
      jammedBusId: jammedBus ? jammedBus.id : null,
    };
  }

  private recordHistoryPoint(): void {
    this.lastHistorySampleTime = this.simTime;
    const m = this.getMetrics();
    this.history.push({
      time: m.simTime,
      headwayCv: Number(m.headwayCv.toFixed(1)),
      headwayVariance: Number(m.headwayVariance.toFixed(2)),
      stabilityScore: m.stabilityScore,
      avgWaitTime: Number(m.avgWaitTime.toFixed(1)),
      bunchedPairs: m.bunchedPairs,
      isAiControlEnabled: this.config.isAiControlEnabled,
    });
    // Retain last 60 seconds of history (1 sample / sim second)
    const cutoff = m.simTime - 60;
    while (this.history.length > 65 && this.history[0].time < cutoff) {
      this.history.shift();
    }
  }

  private recordTrajectorySample(): void {
    this.lastTrajectorySampleTime = this.simTime;
    const positions: Record<string, number> = {};
    for (const b of this.buses) {
      positions[b.id] = Number(b.position.toFixed(1));
    }
    this.trajectories.push({
      time: Number(this.simTime.toFixed(2)),
      positions,
    });
    const cutoff = this.simTime - 46;
    while (this.trajectories.length > 96 && this.trajectories[0].time < cutoff) {
      this.trajectories.shift();
    }
  }

  public getAiImpactSummary(): AiImpactSummary {
    const u = this.uncontrolledStats;
    const a = this.aiStats;
    const isReady = u.elapsedSeconds >= 15 && a.elapsedSeconds >= 15;

    const uAvgWait =
      u.boardedCount > 0
        ? u.boardedWaitSum / u.boardedCount
        : u.elapsedSeconds > 0
          ? u.waitSnapshotIntegral / u.elapsedSeconds
          : 0;
    const aAvgWait =
      a.boardedCount > 0
        ? a.boardedWaitSum / a.boardedCount
        : a.elapsedSeconds > 0
          ? a.waitSnapshotIntegral / a.elapsedSeconds
          : 0;

    const uAvgBunched =
      u.elapsedSeconds > 0 ? u.bunchedIntegral / u.elapsedSeconds : 0;
    const aAvgBunched =
      a.elapsedSeconds > 0 ? a.bunchedIntegral / a.elapsedSeconds : 0;

    const waitReductionPct =
      uAvgWait > 0.01 ? ((uAvgWait - aAvgWait) / uAvgWait) * 100 : 0;
    const bunchedReductionPct =
      uAvgBunched > 0.01
        ? ((uAvgBunched - aAvgBunched) / uAvgBunched) * 100
        : 0;

    return {
      uncontrolledSeconds: u.elapsedSeconds,
      aiSeconds: a.elapsedSeconds,
      isReady,
      uncontrolledAvgWait: uAvgWait,
      aiAvgWait: aAvgWait,
      waitReductionPct,
      uncontrolledAvgBunched: uAvgBunched,
      aiAvgBunched: aAvgBunched,
      bunchedReductionPct,
    };
  }

  public getSnapshot(): SimulationSnapshot {
    return {
      stops: this.stops.map((s) => ({
        ...s,
        waitingPassengers: [...s.waitingPassengers],
      })),
      buses: this.buses.map((b) => ({ ...b })),
      bottleneck: { ...this.bottleneck },
      config: { ...this.config },
      metrics: this.getMetrics(),
      history: [...this.history],
      trajectories: [...this.trajectories],
      aiImpact: this.getAiImpactSummary(),
    };
  }
}
