/**
 * Helper functions for Natal Chart calculations
 */

import { ZODIAC_SIGNS } from '../utils/data/constants';

/**
 * Convert ecliptic longitude to zodiac sign and degree
 *
 * @param degree - Ecliptic longitude (0-360)
 * @returns Object with sign name, number, and degree within sign
 */
export function degreeToZodiacSign(degree: number): {
  sign: string;
  signNumber: number;
  normDegree: number;
} {
  // Normalize to 0-360 range
  const normalized = ((degree % 360) + 360) % 360;

  // Each sign is 30 degrees
  const signIndex = Math.floor(normalized / 30);
  const normDegree = normalized % 30;

  return {
    sign: ZODIAC_SIGNS[signIndex],
    signNumber: signIndex + 1,
    normDegree,
  };
}

/**
 * Format degree to human-readable format
 * e.g., "15°26'" (15 degrees 26 minutes)
 */
export function formatDegree(degree: number): string {
  const whole = Math.floor(degree);
  const decimal = degree - whole;
  const minutes = Math.round(decimal * 60);

  return `${whole}°${minutes}'`;
}

/**
 * Get zodiac sign from ecliptic longitude (simplified)
 * Returns just the sign name
 */
export function getZodiacSign(degree: number): string {
  const normalized = ((degree % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[signIndex];
}
