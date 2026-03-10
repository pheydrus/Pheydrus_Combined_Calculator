/**
 * Astrocartography Calculator (v2 Relocation)
 *
 * Inverts the relocation calculator: instead of taking a location as input
 * and returning hits, it takes a birth chart and returns the geographic
 * locations (lines) where each benefic planet (Sun, Moon, Venus, Jupiter)
 * is angular (on ASC, DSC, MC, or IC).
 *
 * Algorithm: for each planet × angle, binary-search geographic longitude
 * at each of 12 sample latitudes to find the exact crossing point.
 * Total ~1,500 getAngles calls → ~3–5 s with a loading spinner.
 */

import type {
  AstrocartographyInput,
  AstrocartographyResult,
  AstrocartographyLine,
  AstrocartographyPoint,
} from '../../models/calculators';
import { getPlanetLongitudes, getAngles, initEphemeris } from '../../utils/astro/swephClient';
import { birthLocalToJulianDay } from '../../utils/astro/time';

// ─── Constants ───────────────────────────────────────────────────────────────

const BENEFIC_PLANETS = ['Sun', 'Moon', 'Venus', 'Jupiter'] as const;

// Latitudes to sample when tracing each line.
// Denser grid improves chances of hitting land vs. open ocean.
// 34° is included to cover the Southern California / Mediterranean band.
// Avoid latitudes above ~58° where Placidus becomes unreliable.
const SEARCH_LATITUDES = [-45, -33, -20, -8, 3, 12, 22, 31, 38, 44, 51, 56];

// Number of binary-search iterations per point (2^15 ≈ 0.01° precision)
const BINARY_SEARCH_ITERATIONS = 15;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shortest angular distance between two ecliptic longitudes [0, 180]. */
function angularDiff(a: number, b: number): number {
  return Math.abs(((a - b + 180 + 360) % 360) - 180);
}

/**
 * For a given (jdUT, lat), binary-search the geographic longitude where
 * `angles[angleKey]` equals `targetLon`.
 *
 * Key property: as geo-longitude increases from −180 to +180, both ASC and MC
 * increase monotonically by ~360° (one full rotation of the sky). This makes
 * binary search reliable.
 */
async function binarySearchLongitude(
  jdUT: number,
  lat: number,
  angleKey: 'asc' | 'mc',
  targetLon: number
): Promise<{ lon: number; orb: number }> {
  // ── Establish the base value at the western edge ──────────────────────────
  const baseAngles = await getAngles(jdUT, lat, -179.9);
  const base = baseAngles[angleKey];

  // ── Normalise target to the same "branch" as base: [base, base + 360) ────
  let target = targetLon;
  while (target < base) target += 360;
  while (target >= base + 360) target -= 360;

  // ── Unwrap helper: convert angle value to [base, base + 360) ─────────────
  const unwrap = (val: number): number => {
    let v = val;
    while (v < base) v += 360;
    return v;
  };

  // ── Binary search in geographic longitude [-179.9, 179.9] ────────────────
  let lo = -179.9;
  let hi = 179.9;

  for (let i = 0; i < BINARY_SEARCH_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const midAngles = await getAngles(jdUT, lat, mid);
    const midVal = unwrap(midAngles[angleKey]);
    if (midVal < target) lo = mid;
    else hi = mid;
  }

  const finalLon = (lo + hi) / 2;
  const finalAngles = await getAngles(jdUT, lat, finalLon);
  const orb = angularDiff(finalAngles[angleKey], targetLon);

  return { lon: Math.round(finalLon * 100) / 100, orb: Math.round(orb * 1000) / 1000 };
}

/** Maps approximate lat/lon to a human-readable geographic region. */
function getGeographicRegion(lat: number, lon: number): string {
  // Antarctica
  if (lat < -55) return 'Antarctica / Southern Ocean';

  // Americas
  if (lon >= -170 && lon <= -35) {
    if (lat >= 60) return 'Arctic Canada / Alaska';
    if (lat >= 25) return 'North America';
    if (lat >= 8) return 'Central America / Caribbean';
    if (lat >= -20) return 'Northern South America';
    return 'Southern South America';
  }

  // Europe & Africa
  if (lon > -35 && lon <= 20) {
    if (lat >= 55) return 'Northern Europe';
    if (lat >= 35) return 'Western Europe';
    if (lat >= 20) return 'North Africa / Mediterranean';
    if (lat >= 0) return 'West Africa';
    if (lat >= -25) return 'Central / Southern Africa';
    return 'Southern Africa';
  }

  // Middle East & East Africa
  if (lon > 20 && lon <= 55) {
    if (lat >= 55) return 'Russia';
    if (lat >= 28) return 'Middle East';
    if (lat >= 0) return 'East Africa';
    return 'Southern Africa / Indian Ocean';
  }

  // South & Southeast Asia + Indian Ocean
  if (lon > 55 && lon <= 100) {
    if (lat >= 50) return 'Central Asia / Russia';
    if (lat >= 20) return 'South Asia';
    if (lat >= -5) return 'Southeast Asia';
    return 'Indian Ocean';
  }

  // East Asia & Pacific
  if (lon > 100 && lon <= 145) {
    if (lat >= 50) return 'East Asia (North)';
    if (lat >= 20) return 'East Asia';
    if (lat >= -5) return 'Southeast Asia';
    if (lat >= -45) return 'Australia';
    return 'Southern Pacific';
  }

  // Pacific & Oceania
  if (lat >= 40) return 'Northern Pacific';
  if (lat >= -5) return 'Pacific Ocean / Oceania';
  return 'Southern Pacific';
}

/**
 * Reverse geocode a lat/lon to "City, State, Country" using BigDataCloud's
 * free client-side API (no key required).
 * Returns null when the coordinate is in open water (no countryName),
 * so callers can skip ocean points entirely.
 */
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Open ocean / unclaimed water — BigDataCloud returns no countryName
    if (!data.countryName) return null;

    // Walk the administrative hierarchy for the most specific place name.
    // adminLevel 8 = city/town, 7 = borough, 6 = county, 5 = district, 4 = state region
    const admins: { adminLevel: number; name: string }[] =
      data.localityInfo?.administrative ?? [];
    admins.sort((a, b) => b.adminLevel - a.adminLevel); // most specific first
    const specificPlace =
      data.city ||
      data.locality ||
      admins.find((a) => a.adminLevel >= 8)?.name ||
      admins.find((a) => a.adminLevel >= 6)?.name ||
      admins.find((a) => a.adminLevel >= 4)?.name;

    const parts = [specificPlace, data.principalSubdivision, data.countryName].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Calculate astrocartography lines for the four benefic planets.
 *
 * Returns one AstrocartographyLine per planet × angle (up to 16 lines),
 * each containing sampled geographic points along that line.
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

  // Planet longitudes are time-only (don't change with location)
  const planetLongitudes = await getPlanetLongitudes(jdUT);

  const lines: AstrocartographyLine[] = [];

  for (const planet of BENEFIC_PLANETS) {
    const planetLon = planetLongitudes[planet];
    if (typeof planetLon !== 'number') continue;

    // Each angle maps to a search key + adjusted target longitude:
    //   ASC: find where asc  = planetLon
    //   DSC: find where asc  = (planetLon + 180) % 360  (since dsc = asc + 180)
    //   MC:  find where mc   = planetLon
    //   IC:  find where mc   = (planetLon + 180) % 360  (since ic  = mc  + 180)
    const angleConfigs: {
      angle: 'ASC' | 'DSC' | 'MC' | 'IC';
      searchKey: 'asc' | 'mc';
      target: number;
    }[] = [
      { angle: 'ASC', searchKey: 'asc', target: planetLon },
      { angle: 'DSC', searchKey: 'asc', target: (planetLon + 180) % 360 },
      { angle: 'MC', searchKey: 'mc', target: planetLon },
      { angle: 'IC', searchKey: 'mc', target: (planetLon + 180) % 360 },
    ];

    for (const { angle, searchKey, target } of angleConfigs) {
      const points: AstrocartographyPoint[] = [];

      for (const lat of SEARCH_LATITUDES) {
        try {
          const { lon, orb } = await binarySearchLongitude(jdUT, lat, searchKey, target);
          const locationName = await reverseGeocode(lat, lon);
          if (!locationName) continue; // skip open ocean / water points
          const region = getGeographicRegion(lat, lon);
          points.push({
            latitude: lat,
            longitude: lon,
            orb,
            region,
            locationName,
          });
        } catch {
          // Skip latitudes where the ephemeris fails (e.g. polar Placidus issues)
        }
      }

      if (points.length > 0) {
        lines.push({ planet, angle, points });
      }
    }
  }

  return { lines };
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
