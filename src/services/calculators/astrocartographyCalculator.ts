/**
 * Astrocartography Calculator (v2 Relocation)
 *
 * City-centric approach: for each city in the MAJOR_CITIES list, compute the
 * orb of each benefic planet (Sun, Moon, Venus, Jupiter) on each angle
 * (ASC, DSC, MC, IC). Return cities within the orb threshold sorted by
 * smallest orb — giving "top locations where Sun is on ASC by < 5°" etc.
 *
 * ~300 getAngles calls total (one per city), no reverse-geocoding needed.
 */

import type {
  AstrocartographyInput,
  AstrocartographyResult,
  AstrocartographyLine,
  AstrocartographyPoint,
} from '../../models/calculators';
import { getPlanetLongitudes, getAngles, initEphemeris } from '../../utils/astro/swephClient';
import { birthLocalToJulianDay } from '../../utils/astro/time';
import { MAJOR_CITIES } from '../../utils/data/majorCities';
import type { Angles } from '../../utils/astro/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const BENEFIC_PLANETS = ['Sun', 'Moon', 'Venus', 'Jupiter'] as const;
const MALEFIC_PLANETS = ['Mars', 'Saturn', 'Neptune', 'Pluto'] as const;

/** Default orb threshold in degrees. */
const DEFAULT_ORB = 9;

/** Max cities to return per planet × angle combination. */
const MAX_RESULTS_PER_LINE = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shortest angular distance between two ecliptic longitudes (0–180°). */
function angularDiff(a: number, b: number): number {
  return Math.abs(((a - b + 180 + 360) % 360) - 180);
}

/** Extract the angle value from an Angles object by key. */
function getAngleValue(angles: Angles, key: 'ASC' | 'DSC' | 'MC' | 'IC'): number {
  switch (key) {
    case 'ASC': return angles.asc;
    case 'DSC': return angles.dsc;
    case 'MC':  return angles.mc;
    case 'IC':  return angles.ic;
  }
}

/** Rough geographic region label for display fallback. */
function getGeographicRegion(lat: number, lon: number): string {
  if (lon >= -170 && lon <= -35) {
    if (lat >= 25) return 'North America';
    if (lat >= 8) return 'Central America / Caribbean';
    return 'South America';
  }
  if (lon > -35 && lon <= 20) {
    if (lat >= 35) return 'Europe';
    return 'Africa';
  }
  if (lon > 20 && lon <= 55) {
    if (lat >= 28) return 'Middle East';
    return 'Africa';
  }
  if (lon > 55 && lon <= 100) {
    if (lat >= 20) return 'South Asia';
    return 'Southeast Asia';
  }
  if (lon > 100 && lon <= 145) {
    if (lat >= 20) return 'East Asia';
    if (lat >= -5) return 'Southeast Asia';
    return 'Australia';
  }
  return 'Pacific';
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * For each benefic planet × angle, find the cities (from MAJOR_CITIES) where
 * the planet is within DEFAULT_ORB degrees of that angle. Returns them sorted
 * by orb (smallest first), up to MAX_RESULTS_PER_LINE per combination.
 */
export async function calculateAstrocartography(
  input: AstrocartographyInput
): Promise<AstrocartographyResult> {
  await initEphemeris();

  const { year, month, day, hour, minute, birthTimeZone } = input;

  const jdUT = birthLocalToJulianDay({
    date: `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    timeZone: birthTimeZone,
  });

  // Planet longitudes are fixed for the birth moment (location-independent)
  const planetLongitudes = await getPlanetLongitudes(jdUT);

  // Accumulator: planet → angle → sorted hits
  type Hit = { orb: number; point: AstrocartographyPoint };
  const hitMap: Record<string, Record<string, Hit[]>> = {};
  for (const planet of [...BENEFIC_PLANETS, ...MALEFIC_PLANETS]) {
    hitMap[planet] = { ASC: [], DSC: [], MC: [], IC: [] };
  }

  // One getAngles call per city — compute all planet × angle orbs in one shot
  for (const city of MAJOR_CITIES) {
    let angles: Angles;
    try {
      angles = await getAngles(jdUT, city.lat, city.lon);
    } catch {
      continue; // skip if ephemeris fails for this location
    }

    for (const planet of [...BENEFIC_PLANETS, ...MALEFIC_PLANETS]) {
      const planetLon = planetLongitudes[planet];
      if (typeof planetLon !== 'number') continue;

      for (const angleKey of ['ASC', 'DSC', 'MC', 'IC'] as const) {
        const angleVal = getAngleValue(angles, angleKey);
        const orb = angularDiff(angleVal, planetLon);

        if (orb <= DEFAULT_ORB) {
          hitMap[planet][angleKey].push({
            orb,
            point: {
              latitude: city.lat,
              longitude: city.lon,
              orb: Math.round(orb * 100) / 100,
              region: getGeographicRegion(city.lat, city.lon),
              locationName: city.name,
            },
          });
        }
      }
    }
  }

  // Build benefic lines sorted by orb
  const lines: AstrocartographyLine[] = [];
  for (const planet of BENEFIC_PLANETS) {
    for (const angleKey of ['ASC', 'DSC', 'MC', 'IC'] as const) {
      const hits = hitMap[planet][angleKey];
      if (hits.length === 0) continue;
      hits.sort((a, b) => a.orb - b.orb);
      lines.push({ planet, angle: angleKey, points: hits.slice(0, MAX_RESULTS_PER_LINE).map((h) => h.point) });
    }
  }

  // Build malefic (warning) lines sorted by orb
  const warningLines: AstrocartographyLine[] = [];
  for (const planet of MALEFIC_PLANETS) {
    for (const angleKey of ['ASC', 'DSC', 'MC', 'IC'] as const) {
      const hits = hitMap[planet][angleKey];
      if (hits.length === 0) continue;
      hits.sort((a, b) => a.orb - b.orb);
      warningLines.push({ planet, angle: angleKey, points: hits.slice(0, MAX_RESULTS_PER_LINE).map((h) => h.point) });
    }
  }

  return { lines, warningLines };
}

/**
 * Validate astrocartography input
 */
export function validateAstrocartographyInput(input: AstrocartographyInput): {
  valid: boolean;
  error?: string;
} {
  const { year, month, day, hour, minute, birthTimeZone } = input;

  if (!year || year < 1900 || year > new Date().getFullYear())
    return { valid: false, error: 'Invalid birth year' };
  if (month < 1 || month > 12) return { valid: false, error: 'Invalid birth month' };
  if (day < 1 || day > 31) return { valid: false, error: 'Invalid birth day' };
  if (hour < 0 || hour > 23) return { valid: false, error: 'Invalid birth hour' };
  if (minute < 0 || minute > 59) return { valid: false, error: 'Invalid birth minute' };
  if (!birthTimeZone || typeof birthTimeZone !== 'string')
    return { valid: false, error: 'Valid timezone required' };

  return { valid: true };
}
