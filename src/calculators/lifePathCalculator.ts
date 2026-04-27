/**
 * Life Path Calculator Service
 * Calculates life path number, personal year number, and Chinese zodiac
 * Based on birth date only
 */

import type { LifePathInput, LifePathResult } from '../models/calculators';
import { chaldeanNumerologyCalculator } from '../utils/numerology/chaldean';
import { getChineseZodiac } from '../utils/numerology/chineseZodiac';
import { NUMEROLOGY_MEANINGS } from '../utils/data/constants';

/**
 * Parse date string and extract year, month, day
 */
function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  return {
    year: Number(yearStr),
    month: Number(monthStr),
    day: Number(dayStr),
  };
}

/**
 * Calculate Life Path Number
 * Uses Chaldean numerology on the full birthdate
 *
 * @param birthDate - Date in YYYY-MM-DD format
 * @returns Life path number (1-9, 11, 22, 33)
 */
function calculateLifePathNumber(birthDate: string): number {
  const result = chaldeanNumerologyCalculator([birthDate.replace(/-/g, '')]);
  return result;
}

/**
 * Calculate Personal Year Number
 * Uses Chaldean numerology with current year + month + day
 * PRESERVES master numbers (11, 22, 33) - matches legacy aw/page.tsx exactly
 *
 * Legacy logic (aw/page.tsx): joins with SPACE so each component is processed
 * as a separate word, preserving master numbers within individual date parts.
 * e.g., "2026 01 09" → findNumerology("2026")=1 + findNumerology("01")=1 + findNumerology("09")=9 = 11 (master!)
 *
 * @param birthDate - Birth date in YYYY-MM-DD format
 * @returns Personal year number (1-9, 11, 22, 33)
 */
function calculatePersonalYearNumber(birthDate: string): number {
  const currentYear = new Date().getFullYear();
  const parts = birthDate.split('-');
  parts[0] = currentYear.toString(); // Replace year with current year
  // Join with space to match legacy aw/page.tsx personaYearNumber()
  // Each date component is processed as a separate word by chaldeanNumerologyCalculator
  const formattedDate = parts.join(' ');
  const result = chaldeanNumerologyCalculator([formattedDate]);
  return result;
}

/**
 * Calculate Day Path Number
 * Uses Chaldean numerology on the birth day only
 *
 * @param birthDate - Date in YYYY-MM-DD format
 * @returns Day path number (1-9, 11, 22, 33)
 */
function calculateDayPathNumber(birthDate: string): number {
  const day = birthDate.split('-')[2]; // "DD"
  return chaldeanNumerologyCalculator([day]);
}

/**
 * Get numerology meaning for a number
 */
function getNumerologyMeaning(num: number): { meaning: string; description: string } {
  return (
    NUMEROLOGY_MEANINGS[num] || {
      meaning: 'Unknown',
      description: 'Numerology meaning not found',
    }
  );
}

/**
 * Calculate Life Path
 * Returns life path number, personal year, Chinese zodiac, and their meanings
 *
 * @param input - Birth date
 * @returns LifePathResult with all calculated values
 */
export function calculateLifePath(input: LifePathInput): LifePathResult {
  const { birthDate } = input;

  // Validate date format
  if (!birthDate || !birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }

  // Check date is not in future
  const birth = new Date(birthDate);
  if (birth > new Date()) {
    throw new Error('Birth date cannot be in the future');
  }

  // Parse date
  const { year } = parseDate(birthDate);

  // Calculate all values
  const lifePathNumber = calculateLifePathNumber(birthDate);
  const dayPathNumber = calculateDayPathNumber(birthDate);
  const personalYear = calculatePersonalYearNumber(birthDate);
  const chineseZodiac = getChineseZodiac(year);

  // Get meanings
  const lifePathMeaning = getNumerologyMeaning(lifePathNumber);
  const personalYearMeaning = getNumerologyMeaning(personalYear);

  return {
    lifePathNumber,
    dayPathNumber,
    personalYear,
    chineseZodiac,
    meanings: {
      lifePathMeaning: lifePathMeaning.meaning,
      lifePathDescription: lifePathMeaning.description,
      personalYearMeaning: personalYearMeaning.meaning,
      personalYearDescription: personalYearMeaning.description,
    },
  };
}

/**
 * Validate life path input
 */
export function validateLifePathInput(input: LifePathInput): {
  valid: boolean;
  error?: string;
} {
  if (!input.birthDate) {
    return { valid: false, error: 'Birth date is required' };
  }

  if (!input.birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { valid: false, error: 'Invalid date format. Expected YYYY-MM-DD' };
  }

  const birth = new Date(input.birthDate);
  if (isNaN(birth.getTime())) {
    return { valid: false, error: 'Invalid birth date' };
  }

  if (birth > new Date()) {
    return { valid: false, error: 'Birth date cannot be in the future' };
  }

  return { valid: true };
}
