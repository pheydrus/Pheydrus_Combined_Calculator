/**
 * Human Design core calculations.
 * Ported from the pyswisseph reference implementation, corrected for accuracy.
 */

import { calcBodyLongitude } from '../astro/swephClient';
import {
  GATE_SEQUENCE,
  CHANNELS,
  ALL_CENTERS,
  type CenterName,
  type HumanDesignType,
  type HumanDesignAuthority,
} from './constants';

// Swiss Ephemeris body IDs (matching swephClient.ts PLANET_IDS)
const BODY_SUN = 0;

// ── Gate / Line ───────────────────────────────────────────────────────────────

export interface GateLine {
  gate: number;
  line: number;
}

/**
 * Convert an ecliptic longitude (0–360) to a Human Design gate + line.
 * Gate 41 starts at 0° Aries; each gate = 5.625°; each line = 0.9375°.
 */
export function longitudeToGateLine(longitude: number): GateLine {
  // +1.875° calibration offset aligns gate 41 to 0° Aries per the HD wheel spec
  const adjusted = (((longitude + 1.875) % 360) + 360) % 360;
  const gateIndex = Math.floor(adjusted / 5.625);
  const gate = GATE_SEQUENCE[gateIndex % 64];
  const remainder = adjusted - gateIndex * 5.625;
  const line = Math.min(Math.floor(remainder / 0.9375) + 1, 6);
  return { gate, line };
}

// ── Design Date ───────────────────────────────────────────────────────────────

/**
 * Find the Julian Day when the Sun was exactly 88° of solar arc before birth.
 * Uses Newton-like iteration converging to < 0.0001° accuracy.
 */
export async function getDesignJulianDay(birthJD: number): Promise<number> {
  const sunAtBirth = await calcBodyLongitude(birthJD, BODY_SUN);
  const targetLon = (((sunAtBirth - 88) % 360) + 360) % 360;

  // Initial estimate: Sun moves ~1°/day → 88 days back
  let jd = birthJD - 88;

  for (let i = 0; i < 50; i++) {
    const sunLon = await calcBodyLongitude(jd, BODY_SUN);
    // Shortest-arc difference
    const diff = ((((targetLon - sunLon + 180) % 360) + 360) % 360) - 180;
    if (Math.abs(diff) < 0.0001) break;
    // Correct by days (Sun ~ 1°/day = 365.25 days/360°)
    jd += (diff / 360) * 365.25;
  }

  return jd;
}

// ── Defined Centers & Channels ────────────────────────────────────────────────

export interface ActiveChannel {
  gates: [number, number];
  centers: [CenterName, CenterName];
  name: string;
}

/**
 * Given all active gates (from personality + design), return the active channels
 * and the set of defined centers.
 */
export function getDefinedCentersAndChannels(allGates: Set<number>): {
  definedCenters: Set<CenterName>;
  activeChannels: ActiveChannel[];
} {
  const definedCenters = new Set<CenterName>();
  const activeChannels: ActiveChannel[] = [];

  for (const [g1, g2, c1, c2, name] of CHANNELS) {
    if (allGates.has(g1) && allGates.has(g2)) {
      definedCenters.add(c1);
      definedCenters.add(c2);
      activeChannels.push({ gates: [g1, g2], centers: [c1, c2], name });
    }
  }

  return { definedCenters, activeChannels };
}

// ── Motor → Throat connectivity ───────────────────────────────────────────────

const MOTOR_CENTERS: ReadonlySet<string> = new Set(['Sacral', 'Solar Plexus', 'Root', 'Ego']);

/**
 * BFS through defined channels to check if any motor center connects to Throat.
 * Handles both direct and indirect connections.
 */
function isMotorConnectedToThroat(allGates: Set<number>, definedCenters: Set<CenterName>): boolean {
  if (!definedCenters.has('Throat')) return false;

  // Build adjacency graph from active channels
  const graph = new Map<string, Set<string>>();

  for (const center of ALL_CENTERS) {
    graph.set(center, new Set());
  }

  for (const [g1, g2, c1, c2] of CHANNELS) {
    if (allGates.has(g1) && allGates.has(g2)) {
      graph.get(c1)!.add(c2);
      graph.get(c2)!.add(c1);
    }
  }

  // BFS from Throat
  const visited = new Set<string>();
  const queue: string[] = ['Throat'];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (MOTOR_CENTERS.has(current)) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const neighbor of graph.get(current) ?? []) {
      if (!visited.has(neighbor)) queue.push(neighbor);
    }
  }

  return false;
}

// ── Type & Authority ──────────────────────────────────────────────────────────

export function getTypeAndAuthority(
  definedCenters: Set<CenterName>,
  allGates: Set<number>
): { type: HumanDesignType; authority: HumanDesignAuthority } {
  const has = (c: CenterName) => definedCenters.has(c);

  // Reflector: no centers defined
  if (definedCenters.size === 0) {
    return { type: 'Reflector', authority: 'Lunar' };
  }

  const motorToThroat = isMotorConnectedToThroat(allGates, definedCenters);
  const hasSacral = has('Sacral');

  let type: HumanDesignType;
  if (hasSacral && motorToThroat) {
    type = 'Manifesting Generator';
  } else if (hasSacral) {
    type = 'Generator';
  } else if (motorToThroat) {
    type = 'Manifestor';
  } else {
    type = 'Projector';
  }

  // Authority (priority order per HD system)
  let authority: HumanDesignAuthority;
  if (has('Solar Plexus')) {
    authority = 'Emotional';
  } else if (has('Sacral')) {
    authority = 'Sacral';
  } else if (has('Spleen')) {
    authority = 'Splenic';
  } else if (has('Ego')) {
    authority = 'Ego';
  } else if (has('G-Center')) {
    authority = 'Self/G';
  } else if (has('Ajna') || has('Head')) {
    authority = 'Mental';
  } else {
    authority = 'Lunar';
  }

  return { type, authority };
}

// ── Profile ───────────────────────────────────────────────────────────────────

/**
 * Profile = Personality Sun line / Design Sun line.
 */
export function getProfile(
  personalityGates: Record<string, GateLine>,
  designGates: Record<string, GateLine>
): string {
  const pLine = personalityGates['Sun']?.line ?? 1;
  const dLine = designGates['Sun']?.line ?? 1;
  return `${pLine}/${dLine}`;
}

// ── South Node helper ─────────────────────────────────────────────────────────

export function southNodeGateLine(northNodeGateLine: GateLine): GateLine {
  // South Node longitude = North Node + 180°
  // We can compute gate/line from the north node's gate position + 32 gates (180°)
  // Simpler: we'll pass the south node longitude directly from the caller.
  // This function is a placeholder for the caller to compute it properly.
  return northNodeGateLine; // overridden in the calculator
}
