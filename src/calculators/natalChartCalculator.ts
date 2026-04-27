/**
 * Natal Chart Calculator Service
 * Calculates planetary positions, aspects, angle aspects, and rising sign using Swiss Ephemeris
 */

import type {
  NatalChartInput,
  NatalChartResult,
  AstrologyPlanet,
  AstrologyAspect,
  AngleAspects,
} from '../models/calculators';
import { getPlanetLongitudes, getAngles, initEphemeris } from '../utils/astro/swephClient';
import { birthLocalToJulianDay } from '../utils/astro/time';
import { assignWholeSignHouses } from '../utils/astro/houses';
import { degreeToZodiacSign } from './natalChartHelpers';
import { ASPECTS } from '../utils/data/constants';

const ANGLE_NAMES = ['Ascendant', 'Descendant', 'MC', 'IC'];

/**
 * Find rising sign from planets
 */
function findRisingSign(planets: AstrologyPlanet[]): string {
  const ascendant = planets.find((p) => p.planet.en === 'Ascendant');
  if (!ascendant) return 'Aries';
  return ascendant.zodiac_sign.name.en;
}

/**
 * Calculate angular distance between two longitudes (0-180)
 */
function angularDistance(deg1: number, deg2: number): number {
  const diff = Math.abs(deg1 - deg2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Find aspect between two points
 */
function findAspect(deg1: number, deg2: number): { name: string; angle: number } | null {
  const distance = angularDistance(deg1, deg2);
  for (const aspect of ASPECTS) {
    if (Math.abs(distance - aspect.angle) <= aspect.orb) {
      return { name: aspect.name, angle: aspect.angle };
    }
  }
  return null;
}

/**
 * Calculate planet-to-planet aspects (excluding angles)
 */
function calculatePlanetAspects(planets: AstrologyPlanet[]): AstrologyAspect[] {
  const aspects: AstrologyAspect[] = [];
  const planetLoopArray = planets.filter((p) => !ANGLE_NAMES.includes(p.planet.en));

  for (let i = 0; i < planetLoopArray.length; i++) {
    for (let j = i + 1; j < planetLoopArray.length; j++) {
      const aspect = findAspect(planetLoopArray[i].fullDegree, planetLoopArray[j].fullDegree);
      if (aspect) {
        aspects.push({
          planet_1: { en: planetLoopArray[i].planet.en },
          planet_2: { en: planetLoopArray[j].planet.en },
          aspect: { en: aspect.name },
        });
      }
    }
  }

  return aspects;
}

/**
 * Calculate angle aspects (ASC/DSC/MC/IC conjunctions with planets)
 * Legacy only displays Conjunction aspects with angles:
 *   getAspectsByPlanet(aspects, "IC", "Conjunction")
 * So we only include Conjunctions here to match.
 */
function calculateAngleAspects(planets: AstrologyPlanet[]): AngleAspects {
  const angles = planets.filter((p) => ANGLE_NAMES.includes(p.planet.en));
  const bodies = planets.filter((p) => !ANGLE_NAMES.includes(p.planet.en));

  const result: AngleAspects = { asc: [], dsc: [], mc: [], ic: [] };

  for (const angle of angles) {
    for (const body of bodies) {
      const aspect = findAspect(angle.fullDegree, body.fullDegree);
      // Only include Conjunction aspects (matching legacy display)
      if (aspect && aspect.name === 'Conjunction') {
        const aspectEntry: AstrologyAspect = {
          planet_1: { en: angle.planet.en },
          planet_2: { en: body.planet.en },
          aspect: { en: aspect.name },
        };

        switch (angle.planet.en) {
          case 'Ascendant':
            result.asc.push(aspectEntry);
            break;
          case 'Descendant':
            result.dsc.push(aspectEntry);
            break;
          case 'MC':
            result.mc.push(aspectEntry);
            break;
          case 'IC':
            result.ic.push(aspectEntry);
            break;
        }
      }
    }
  }

  return result;
}

/**
 * Map planet longitude to AstrologyPlanet format
 */
function createAstrologyPlanet(
  planetName: string,
  lon: number,
  isRetro: boolean = false
): AstrologyPlanet {
  const zodiacInfo = degreeToZodiacSign(lon);
  return {
    planet: { en: planetName },
    fullDegree: lon,
    normDegree: zodiacInfo.normDegree,
    isRetro: isRetro ? 'True' : 'False',
    zodiac_sign: {
      number: zodiacInfo.signNumber,
      name: { en: zodiacInfo.sign },
    },
  };
}

/**
 * Calculate Natal Chart
 * Returns planets with houses, aspects, angle aspects, and rising sign
 */
export async function calculateNatalChart(input: NatalChartInput): Promise<NatalChartResult> {
  await initEphemeris();

  const { year, month, day, hour, minute, latitude, longitude, timeZone } = input;

  const jdUT = birthLocalToJulianDay({
    date: `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    timeZone,
  });

  const planetLons = await getPlanetLongitudes(jdUT);
  const angles = await getAngles(jdUT, latitude, longitude, 'P');

  // Build planets array
  const planets: AstrologyPlanet[] = [];

  // Planet order: Ascendant first, then planets (including asteroids), then other angles
  const planetOrder = [
    'Ascendant',
    'Sun',
    'Moon',
    'Mars',
    'Mercury',
    'Jupiter',
    'Venus',
    'Saturn',
    'Uranus',
    'Neptune',
    'Pluto',
    'Mean Node',
    'True Node',
    'Lilith',
    'Chiron',
    'Ceres',
    'Pallas',
    'Juno',
    'Vesta',
    'Descendant',
    'MC',
    'IC',
  ];

  for (const planetName of planetOrder) {
    let lon = 0;
    let found = false;

    if (planetName === 'Ascendant') {
      lon = angles.asc;
      found = true;
    } else if (planetName === 'Descendant') {
      lon = angles.dsc;
      found = true;
    } else if (planetName === 'MC') {
      lon = angles.mc;
      found = true;
    } else if (planetName === 'IC') {
      lon = angles.ic;
      found = true;
    } else if (planetLons[planetName] !== undefined) {
      lon = planetLons[planetName];
      found = true;
    }

    if (found) {
      planets.push(createAstrologyPlanet(planetName, lon, false));
    }
  }

  // Assign whole sign houses to each planet
  const ascLon = angles.asc;
  const planetsForHouse = planets.map((p) => ({ key: p.planet.en, lon: p.fullDegree }));
  const planetsWithHouse = assignWholeSignHouses(ascLon, planetsForHouse);

  // Merge house numbers back into planets
  for (const planet of planets) {
    const match = planetsWithHouse.find((p) => p.key === planet.planet.en);
    if (match) {
      planet.house = match.house;
    }
  }

  // Calculate planet-to-planet aspects (excluding angles)
  const aspects = calculatePlanetAspects(planets);

  // Calculate angle aspects grouped by ASC/DSC/MC/IC
  const angleAspects = calculateAngleAspects(planets);

  const risingSign = findRisingSign(planets);

  return {
    planets,
    aspects,
    angleAspects,
    risingSign,
  };
}

/**
 * Validate natal chart input
 */
export function validateNatalChartInput(input: NatalChartInput): {
  valid: boolean;
  error?: string;
} {
  const { year, month, day, hour, minute, latitude, longitude, timeZone } = input;

  if (!year || year < 1900 || year > new Date().getFullYear()) {
    return { valid: false, error: 'Invalid year' };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Month must be 1-12' };
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: 'Invalid day' };
  }
  if (hour < 0 || hour > 23) {
    return { valid: false, error: 'Hour must be 0-23' };
  }
  if (minute < 0 || minute > 59) {
    return { valid: false, error: 'Minute must be 0-59' };
  }
  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: 'Latitude must be -90 to 90' };
  }
  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: 'Longitude must be -180 to 180' };
  }
  if (!timeZone || typeof timeZone !== 'string') {
    return { valid: false, error: 'Valid timezone required' };
  }

  return { valid: true };
}
