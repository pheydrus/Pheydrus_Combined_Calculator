/**
 * Human Design Calculator Service
 * Calculates a full HD chart (type, authority, profile, centers, channels, gates)
 * using Swiss Ephemeris WASM for accurate planetary positions.
 *
 * Two snapshots are required:
 *   Personality (Conscious) — exact birth datetime
 *   Design (Unconscious)    — ~88° solar arc before birth (≈88 days prior)
 */

import type { HumanDesignInput, HumanDesignResult } from '../../models/calculators';
import { getPlanetLongitudes, initEphemeris } from '../../utils/astro/swephClient';
import { birthLocalToJulianDay, julianDayToUtcDate } from '../../utils/astro/time';
import {
  longitudeToGateLine,
  getDesignJulianDay,
  getDefinedCentersAndChannels,
  getTypeAndAuthority,
  getProfile,
  type GateLine,
} from '../../utils/humanDesign/calculations';
import { ALL_CENTERS, TYPE_INFO } from '../../utils/humanDesign/constants';

// Planets to calculate in HD order (matches pyswisseph reference)
const HD_PLANETS = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
  'True Node', // North Node
] as const;

/**
 * Get gate/line positions for all HD planets at a given Julian Day.
 * Also adds South Node (True Node + 180°).
 */
async function getHDGates(jdUT: number): Promise<Record<string, GateLine>> {
  const lons = await getPlanetLongitudes(jdUT);
  const gates: Record<string, GateLine> = {};

  for (const planet of HD_PLANETS) {
    const lon = lons[planet];
    if (lon !== undefined) {
      gates[planet] = longitudeToGateLine(lon);
    }
  }

  // South Node = True Node + 180°
  const northLon = lons['True Node'];
  if (northLon !== undefined) {
    gates['S.Node'] = longitudeToGateLine((northLon + 180) % 360);
  }

  return gates;
}

/**
 * Calculate a full Human Design chart.
 */
export async function calculateHumanDesign(
  input: HumanDesignInput
): Promise<HumanDesignResult> {
  await initEphemeris();

  const { year, month, day, hour, minute, timeZone } = input;

  const dateStr = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  const birthJD = birthLocalToJulianDay({ date: dateStr, time: timeStr, timeZone });
  const designJD = await getDesignJulianDay(birthJD);

  const [personalityLons, designLons] = await Promise.all([
    getPlanetLongitudes(birthJD),
    getPlanetLongitudes(designJD),
  ]);

  // DEBUG — raw longitudes
  console.log('[HD] personality longitudes:', JSON.stringify(
    Object.fromEntries(Object.entries(personalityLons).filter(([k]) =>
      ['Jupiter','Saturn','Uranus','True Node','Sun'].includes(k)
    ).map(([k, v]) => [k, +v.toFixed(4)]))
  ));
  console.log('[HD] design longitudes:', JSON.stringify(
    Object.fromEntries(Object.entries(designLons).filter(([k]) =>
      ['Sun','Jupiter','Saturn','Uranus','True Node'].includes(k)
    ).map(([k, v]) => [k, +v.toFixed(4)]))
  ));

  const [personalityGates, designGates] = await Promise.all([
    getHDGates(birthJD),
    getHDGates(designJD),
  ]);

  // Collect all active gate numbers (personality + design)
  const allGates = new Set<number>();
  for (const { gate } of Object.values(personalityGates)) allGates.add(gate);
  for (const { gate } of Object.values(designGates)) allGates.add(gate);

  // DEBUG — remove after diagnosis
  console.log('[HD] personality gates:', JSON.stringify(personalityGates));
  console.log('[HD] design gates:', JSON.stringify(designGates));
  console.log('[HD] all active gate numbers:', [...allGates].sort((a, b) => a - b));

  const { definedCenters, activeChannels } = getDefinedCentersAndChannels(allGates);
  const { type, authority } = getTypeAndAuthority(definedCenters, allGates);
  const profile = getProfile(personalityGates, designGates);
  const profileLines = profile.split('/').map(Number) as [number, number];

  const undefinedCenters = ALL_CENTERS.filter((c) => !definedCenters.has(c));

  const designDate = julianDayToUtcDate(designJD).toISOString().slice(0, 10);

  return {
    type,
    strategy: TYPE_INFO[type].strategy,
    authority,
    profile,
    profileLines,
    definedCenters: [...definedCenters],
    undefinedCenters,
    activeChannels,
    personalityGates,
    designGates,
    designDate,
  };
}

/**
 * Validate Human Design input
 */
export function validateHumanDesignInput(input: HumanDesignInput): {
  valid: boolean;
  error?: string;
} {
  const { year, month, day, hour, minute, timeZone } = input;

  if (!year || year < 1900 || year > new Date().getFullYear()) {
    return { valid: false, error: 'Invalid year' };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Month must be 1–12' };
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: 'Invalid day' };
  }
  if (hour < 0 || hour > 23) {
    return { valid: false, error: 'Hour must be 0–23' };
  }
  if (minute < 0 || minute > 59) {
    return { valid: false, error: 'Minute must be 0–59' };
  }
  if (!timeZone || typeof timeZone !== 'string') {
    return { valid: false, error: 'Valid timezone required' };
  }

  return { valid: true };
}
