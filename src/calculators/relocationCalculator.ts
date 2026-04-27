/**
 * Relocation Calculator Service
 * Calculates angular hits and business house activations for relocation astrology
 */

import type {
  RelocationInput,
  RelocationResult,
  AngularHit,
  BusinessHouseActivation,
} from '../models/calculators';
import { getPlanetLongitudes, getAngles, initEphemeris } from '../utils/astro/swephClient';
import { birthLocalToJulianDay } from '../utils/astro/time';
import { assignWholeSignHouses } from '../utils/astro/houses';
import { BUSINESS_HOUSES, classifyPlanet } from '../utils/data/constants';

/**
 * Calculate Relocation
 * Returns angular hits and business house activations
 *
 * @param input - Birth and destination details
 * @returns RelocationResult with angular hits and activations
 */
export async function calculateRelocation(input: RelocationInput): Promise<RelocationResult> {
  console.log('[Relocation Calculator] Input:', input);

  // Initialize Swiss Ephemeris
  await initEphemeris();

  const {
    year,
    month,
    day,
    hour,
    minute,
    birthTimeZone,
    destinationLatitude,
    destinationLongitude,
  } = input;

  console.log(
    `[Relocation] Destination coords: lat=${destinationLatitude}, lon=${destinationLongitude}`
  );

  // Convert birth details to Julian Day
  const jdUT = birthLocalToJulianDay({
    date: `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    timeZone: birthTimeZone,
  });

  // Get planet longitudes (same for both locations - planets don't change)
  const planetLongitudes = await getPlanetLongitudes(jdUT);

  // Get angles for destination location
  const destAngles = await getAngles(jdUT, destinationLatitude, destinationLongitude, 'P');

  // Create planet array with coordinates for whole sign house assignment
  const planetsArray = Object.entries(planetLongitudes).map(([key, lon]) => ({
    key,
    lon,
  }));

  // Assign houses using whole sign system
  const planetsWithHouse = assignWholeSignHouses(destAngles.asc, planetsArray);

  // Detect angular hits using HOUSE-BASED matching (matching legacy exactly)
  // Legacy logic: assigns whole-sign houses to both planets AND angle points,
  // then cross-references: a planet gets an angular hit for each angle in the same house.
  // This is a 30° range (entire sign), NOT a tight orb.
  const angleEntries = [
    { key: 'ASC', lon: ((destAngles.asc % 360) + 360) % 360 },
    { key: 'DSC', lon: (((destAngles.asc + 180) % 360) + 360) % 360 },
    { key: 'MC', lon: ((destAngles.mc % 360) + 360) % 360 },
    { key: 'IC', lon: (((destAngles.mc + 180) % 360) + 360) % 360 },
  ];
  const angleAssignments = assignWholeSignHouses(destAngles.asc, angleEntries);

  const angularHitsWithHouse = planetsWithHouse.flatMap((planet) =>
    angleAssignments
      .filter((angle) => angle.house === planet.house)
      .map((angle) => ({
        key: planet.key,
        angle: angle.key,
        house: planet.house,
        nature: classifyPlanet(planet.key),
      }))
  );

  // Career detection: find the MC house, then mark all hits in that house as career
  const mcHouse = angularHitsWithHouse.find((hit) => hit.angle === 'MC')?.house;

  const angularHits: AngularHit[] = angularHitsWithHouse.map((hit) => ({
    ...hit,
    isCareer: mcHouse !== undefined && hit.house === mcHouse,
  }));

  // Calculate business house activations (houses 2, 6, 10)
  const businessHouseActivations: BusinessHouseActivation[] = planetsWithHouse
    .filter((p) => BUSINESS_HOUSES.includes(p.house))
    .map((p) => ({
      key: p.key,
      house: p.house,
      nature: classifyPlanet(p.key),
    }))
    .filter((a) => a.nature !== 'neutral')
    .sort((a, b) => a.house - b.house || a.key.localeCompare(b.key));

  return {
    angularHits,
    businessHouseActivations,
  };
}

/**
 * Validate relocation input
 */
export function validateRelocationInput(input: RelocationInput): {
  valid: boolean;
  error?: string;
} {
  const {
    year,
    month,
    day,
    hour,
    minute,
    birthLatitude,
    birthLongitude,
    birthTimeZone,
    destinationLatitude,
    destinationLongitude,
  } = input;

  // Validate birth date
  if (!year || year < 1900 || year > new Date().getFullYear()) {
    return { valid: false, error: 'Invalid birth year' };
  }

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid birth month' };
  }

  if (day < 1 || day > 31) {
    return { valid: false, error: 'Invalid birth day' };
  }

  // Validate birth time
  if (hour < 0 || hour > 23) {
    return { valid: false, error: 'Invalid birth hour' };
  }

  if (minute < 0 || minute > 59) {
    return { valid: false, error: 'Invalid birth minute' };
  }

  // Validate birth location
  if (birthLatitude < -90 || birthLatitude > 90) {
    return { valid: false, error: 'Invalid birth latitude' };
  }

  if (birthLongitude < -180 || birthLongitude > 180) {
    return { valid: false, error: 'Invalid birth longitude' };
  }

  // Validate timezone
  if (!birthTimeZone || typeof birthTimeZone !== 'string') {
    return { valid: false, error: 'Valid timezone required' };
  }

  // Validate destination location
  if (destinationLatitude < -90 || destinationLatitude > 90) {
    return { valid: false, error: 'Invalid destination latitude' };
  }

  if (destinationLongitude < -180 || destinationLongitude > 180) {
    return { valid: false, error: 'Invalid destination longitude' };
  }

  return { valid: true };
}

/**
 * Get summary of relocation results
 */
export function getRelocationSummary(result: RelocationResult): string {
  const angularSummary =
    result.angularHits.length > 0
      ? `${result.angularHits.length} angular hit(s)`
      : 'No angular hits';

  const businessSummary =
    result.businessHouseActivations.length > 0
      ? `${result.businessHouseActivations.length} business house activation(s)`
      : 'No business house activations';

  return `${angularSummary} | ${businessSummary}`;
}
