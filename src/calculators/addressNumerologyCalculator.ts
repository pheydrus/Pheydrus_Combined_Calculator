/**
 * Address Numerology Calculator Service
 * Calculates address numerology with dynamic levels (matching legacy getLevelsArray)
 * Includes L5 "unconscious combined value" and extended meanings
 * Determines zodiac compatibility between home year and birth year
 */

import type {
  AddressNumerologyInput,
  AddressNumerologyResult,
  NumerologyLevel,
  ZodiacMeaning,
} from '../models/calculators';
import { chaldeanNumerologyCalculator } from '../utils/numerology/chaldean';
import { getChineseZodiac } from '../utils/numerology/chineseZodiac';
import { areZodiacsCompatible } from '../utils/numerology/compatibility';
import {
  NUMEROLOGY_MEANINGS,
  EXTENDED_NUMEROLOGY_MEANINGS,
  CHINESE_ZODIAC_MEANINGS,
} from '../utils/data/constants';

/**
 * Get numerology meaning for a number (basic + extended)
 */
function getFullMeaning(num: number): {
  meaning: string;
  description: string;
  themes: string;
  challenges: string;
  gifts: string;
  reflection: string;
} {
  const basic = NUMEROLOGY_MEANINGS[num] || {
    meaning: 'Unknown',
    description: 'Numerology meaning not found',
  };
  const extended = EXTENDED_NUMEROLOGY_MEANINGS[num] || {
    themes: '',
    challenges: '',
    gifts: '',
    reflection: '',
  };
  return { ...basic, ...extended };
}

/**
 * Get Chinese zodiac meaning
 */
function getZodiacMeaning(zodiac: string): ZodiacMeaning | null {
  const meaning = CHINESE_ZODIAC_MEANINGS[zodiac];
  if (!meaning) return null;
  return {
    name: zodiac,
    themes: meaning.themes,
    challenges: meaning.challenges,
    gifts: meaning.gifts,
    reflection: meaning.reflection,
  };
}

/**
 * Common street suffixes and directionals to strip from street names
 * before calculating numerology. Case-insensitive, matched as whole words.
 * e.g. "Barnes Road" → "Barnes", "Park Avenue South" → "Park"
 */
const STREET_SUFFIXES = new Set([
  // Full names
  'road',
  'street',
  'avenue',
  'court',
  'boulevard',
  'drive',
  'lane',
  'place',
  'way',
  'circle',
  'trail',
  'terrace',
  'crescent',
  'highway',
  'parkway',
  'alley',
  'path',
  'pike',
  'plaza',
  'square',
  'loop',
  'run',
  'crossing',
  'point',
  'ridge',
  'view',
  'pass',
  'bend',
  // Abbreviations
  'rd',
  'st',
  'ave',
  'ct',
  'blvd',
  'dr',
  'ln',
  'pl',
  'cir',
  'trl',
  'ter',
  'cres',
  'hwy',
  'pkwy',
  'aly',
  'sq',
  // Directionals
  'north',
  'south',
  'east',
  'west',
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
  'northeast',
  'northwest',
  'southeast',
  'southwest',
]);

/**
 * Strip street suffixes and directionals from a street name
 * Returns only the meaningful part for numerology calculation
 */
function stripStreetSuffixes(streetName: string): string {
  const words = streetName.trim().split(/\s+/);
  const meaningful = words.filter((w) => !STREET_SUFFIXES.has(w.toLowerCase()));
  return meaningful.length > 0 ? meaningful.join(' ') : streetName;
}

/**
 * Build a numerology level with full meanings
 */
function buildLevel(level: string, value: string, name: string): NumerologyLevel {
  // Strip street suffixes when calculating Street Name numerology
  const calcValue = name === 'Street Name' ? stripStreetSuffixes(value) : value;
  const number = chaldeanNumerologyCalculator([calcValue]);
  const meaning = getFullMeaning(number);

  return {
    level,
    value,
    name,
    number,
    meaning: meaning.meaning,
    description: meaning.description,
    themes: meaning.themes,
    challenges: meaning.challenges,
    gifts: meaning.gifts,
    reflection: meaning.reflection,
  };
}

/**
 * Calculate Address Numerology
 * Uses dynamic level numbering matching legacy getLevelsArray logic:
 * - Push non-empty fields in order: unitNumber, streetNumber, streetName, postalCode
 * - Add "Level" unconscious combined value using legacy priority logic
 * - Chinese zodiac meanings for home and birth years
 *
 * @param input - Address and year inputs
 * @returns AddressNumerologyResult with all levels and compatibility
 */
export function calculateAddressNumerology(input: AddressNumerologyInput): AddressNumerologyResult {
  const { unitNumber, streetNumber, streetName, postalCode, homeYear, birthYear } = input;

  // Validate required fields
  if (!birthYear) {
    throw new Error('Birth year is required');
  }

  const birthYearNum = Number(birthYear);
  const homeYearNum = homeYear ? Number(homeYear) : null;

  // Build levels dynamically (matching legacy getLevelsArray)
  const levelsRaw: Array<{ value: string; name: string }> = [];

  const L1 = unitNumber ? { value: unitNumber, name: 'Unit Number' } : null;
  const L2A = streetNumber ? { value: streetNumber, name: 'Building/House Number' } : null;
  const L3 = streetName ? { value: streetName, name: 'Street Name' } : null;
  const L4 = postalCode ? { value: postalCode, name: 'Postal Code' } : null;

  if (L1?.value) levelsRaw.push(L1);
  if (L2A?.value) levelsRaw.push(L2A);
  if (L3?.value) levelsRaw.push(L3);
  if (L4?.value) levelsRaw.push(L4);

  // Build final levels with dynamic numbering (L1, L2, L3, ...)
  const levels: NumerologyLevel[] = levelsRaw.map((raw, index) =>
    buildLevel(`L${index + 1}`, raw.value, raw.name)
  );

  // Compute L3 — sum of individual chaldean values for Unit + Building + Street Name.
  // Each component is calculated exactly as its individual level is (including suffix stripping for street name).
  // Reduce the sum to a single digit, preserving 11 as a master number.
  const l3CompNums: number[] = [];
  if (L1) l3CompNums.push(chaldeanNumerologyCalculator([L1.value]));
  if (L2A) l3CompNums.push(chaldeanNumerologyCalculator([L2A.value]));
  if (L3) l3CompNums.push(chaldeanNumerologyCalculator([stripStreetSuffixes(L3.value)]));

  if (l3CompNums.length >= 1) {
    let l3Num = l3CompNums.reduce((a, b) => a + b, 0);
    while (l3Num > 9 && l3Num !== 11) {
      let s = 0,
        n = l3Num;
      while (n) {
        s += n % 10;
        n = Math.floor(n / 10);
      }
      l3Num = s;
    }

    const displayValue = [L1, L2A, L3]
      .filter(Boolean)
      .map((c) => c!.value)
      .join(' + ');
    const meaning = getFullMeaning(l3Num);
    levels.push({
      level: `L${levels.length + 1}`,
      value: displayValue,
      name: 'L3',
      number: l3Num,
      meaning: meaning.meaning,
      description: meaning.description,
      themes: meaning.themes,
      challenges: meaning.challenges,
      gifts: meaning.gifts,
      reflection: meaning.reflection,
    });
  }

  // Calculate Chinese Zodiacs
  const homeZodiac = homeYearNum ? getChineseZodiac(homeYearNum) : 'Unknown';
  const birthZodiac = getChineseZodiac(birthYearNum);

  // Get zodiac meanings
  const homeZodiacMeaning = homeZodiac !== 'Unknown' ? getZodiacMeaning(homeZodiac) : null;
  const birthZodiacMeaning = getZodiacMeaning(birthZodiac);

  // Calculate Compatibility
  let compatibility = 'unknown';
  if (homeZodiac !== 'Unknown') {
    compatibility = areZodiacsCompatible(homeZodiac, birthZodiac);
  }

  return {
    levels,
    homeZodiac,
    birthZodiac,
    homeZodiacMeaning,
    birthZodiacMeaning,
    compatibility,
  };
}

/**
 * Validate address numerology input
 */
export function validateAddressNumerologyInput(input: AddressNumerologyInput): {
  valid: boolean;
  error?: string;
} {
  if (!input.birthYear) {
    return { valid: false, error: 'Birth year is required' };
  }

  const birthYear = Number(input.birthYear);
  if (isNaN(birthYear) || birthYear < 1900 || birthYear > new Date().getFullYear()) {
    return { valid: false, error: 'Invalid birth year' };
  }

  if (input.homeYear) {
    const homeYear = Number(input.homeYear);
    if (isNaN(homeYear) || homeYear < 1500 || homeYear > new Date().getFullYear() + 100) {
      return { valid: false, error: 'Invalid home year' };
    }
  }

  return { valid: true };
}

/**
 * Get summary of address numerology
 */
export function getAddressNumerologySummary(result: AddressNumerologyResult): string {
  const levelSummary = result.levels.map((l) => `${l.level}: ${l.number}`).join(', ');
  return `${levelSummary} | ${result.homeZodiac} \u2665 ${result.birthZodiac}: ${result.compatibility}`;
}
