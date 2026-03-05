/**
 * Natal Chart Helpers Tests
 *
 * Tests degree-to-zodiac conversion for all 12 sign boundaries.
 */

import { describe, it, expect } from 'vitest';
import {
  degreeToZodiacSign,
  formatDegree,
  getZodiacSign,
} from '../../../services/calculators/natalChartHelpers';

// ============================================================================
// DEGREE TO ZODIAC SIGN — all 12 boundaries
// ============================================================================
describe('degreeToZodiacSign', () => {
  const signBoundaries = [
    { degree: 0, sign: 'Aries', number: 1 },
    { degree: 30, sign: 'Taurus', number: 2 },
    { degree: 60, sign: 'Gemini', number: 3 },
    { degree: 90, sign: 'Cancer', number: 4 },
    { degree: 120, sign: 'Leo', number: 5 },
    { degree: 150, sign: 'Virgo', number: 6 },
    { degree: 180, sign: 'Libra', number: 7 },
    { degree: 210, sign: 'Scorpio', number: 8 },
    { degree: 240, sign: 'Sagittarius', number: 9 },
    { degree: 270, sign: 'Capricorn', number: 10 },
    { degree: 300, sign: 'Aquarius', number: 11 },
    { degree: 330, sign: 'Pisces', number: 12 },
  ];

  for (const { degree, sign, number } of signBoundaries) {
    it(`${degree}° → ${sign} (sign ${number})`, () => {
      const result = degreeToZodiacSign(degree);
      expect(result.sign).toBe(sign);
      expect(result.signNumber).toBe(number);
    });
  }

  it('mid-sign degree has correct normDegree', () => {
    const result = degreeToZodiacSign(45); // 15° Taurus
    expect(result.sign).toBe('Taurus');
    expect(result.normDegree).toBe(15);
  });

  it('359.9° → Pisces', () => {
    const result = degreeToZodiacSign(359.9);
    expect(result.sign).toBe('Pisces');
  });

  it('normalizes negative degrees', () => {
    // -30° → 330° → Pisces
    const result = degreeToZodiacSign(-30);
    expect(result.sign).toBe('Pisces');
  });

  it('normalizes degrees above 360', () => {
    // 390° → 30° → Taurus
    const result = degreeToZodiacSign(390);
    expect(result.sign).toBe('Taurus');
  });
});

// ============================================================================
// FORMAT DEGREE
// ============================================================================
describe('formatDegree', () => {
  it('formats whole degree', () => {
    expect(formatDegree(15)).toBe("15°0'");
  });

  it('formats degree with minutes', () => {
    expect(formatDegree(15.5)).toBe("15°30'");
  });

  it('formats 0 degrees', () => {
    expect(formatDegree(0)).toBe("0°0'");
  });
});

// ============================================================================
// GET ZODIAC SIGN (simplified)
// ============================================================================
describe('getZodiacSign', () => {
  it('0° → Aries', () => {
    expect(getZodiacSign(0)).toBe('Aries');
  });

  it('120° → Leo', () => {
    expect(getZodiacSign(120)).toBe('Leo');
  });

  it('330° → Pisces', () => {
    expect(getZodiacSign(330)).toBe('Pisces');
  });
});
