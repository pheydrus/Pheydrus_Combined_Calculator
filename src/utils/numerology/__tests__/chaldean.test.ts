/**
 * Chaldean Numerology Tests
 *
 * Tests the core numerology functions: character mapping,
 * master number preservation, and calculator behavior.
 */

import { describe, it, expect } from 'vitest';
import {
  chaldeanNumerologyCalculator,
  getChaldeanValue,
  getChaldeanValueRaw,
  reduceToSingleDigitOnly,
} from '../chaldean';

// ============================================================================
// SINGLE CHARACTER VALUES
// ============================================================================
describe('getChaldeanValue', () => {
  it('A = 1', () => expect(getChaldeanValue('A')).toBe(1));
  it('B = 2', () => expect(getChaldeanValue('B')).toBe(2));
  it('C = 3', () => expect(getChaldeanValue('C')).toBe(3));
  it('D = 4', () => expect(getChaldeanValue('D')).toBe(4));
  it('E = 5', () => expect(getChaldeanValue('E')).toBe(5));
  it('U = 6', () => expect(getChaldeanValue('U')).toBe(6));
  it('O = 7', () => expect(getChaldeanValue('O')).toBe(7));
  it('F = 8', () => expect(getChaldeanValue('F')).toBe(8));
  it('Z = 7', () => expect(getChaldeanValue('Z')).toBe(7));
  it('P = 8', () => expect(getChaldeanValue('P')).toBe(8));

  it('is case-insensitive', () => {
    expect(getChaldeanValue('a')).toBe(1);
    expect(getChaldeanValue('z')).toBe(7);
  });

  it('returns 0 for non-letter characters', () => {
    expect(getChaldeanValue(' ')).toBe(0);
    expect(getChaldeanValue('-')).toBe(0);
    expect(getChaldeanValue('!')).toBe(0);
  });
});

// ============================================================================
// RAW VALUE (no reduction)
// ============================================================================
describe('getChaldeanValueRaw', () => {
  it('sums letter values without reduction', () => {
    // H=5, e=5, l=3, l=3, o=7 → 23
    expect(getChaldeanValueRaw('Hello')).toBe(23);
  });

  it('handles digits directly', () => {
    // 1+2+3 = 6
    expect(getChaldeanValueRaw('123')).toBe(6);
  });

  it('mixes letters and digits', () => {
    // 5(H) + 1 = 6
    expect(getChaldeanValueRaw('H1')).toBe(6);
  });
});

// ============================================================================
// REDUCE TO SINGLE DIGIT ONLY (no master number preservation)
// ============================================================================
describe('reduceToSingleDigitOnly', () => {
  it('single digits stay the same', () => {
    for (let i = 1; i <= 9; i++) {
      expect(reduceToSingleDigitOnly(i)).toBe(i);
    }
  });

  it('reduces 22 to 4 (does NOT preserve master numbers)', () => {
    expect(reduceToSingleDigitOnly(22)).toBe(4);
  });

  it('reduces 11 to 2', () => {
    expect(reduceToSingleDigitOnly(11)).toBe(2);
  });

  it('reduces 33 to 6', () => {
    expect(reduceToSingleDigitOnly(33)).toBe(6);
  });

  it('reduces large numbers', () => {
    // 99 → 18 → 9
    expect(reduceToSingleDigitOnly(99)).toBe(9);
  });
});

// ============================================================================
// MAIN CALCULATOR
// ============================================================================
describe('chaldeanNumerologyCalculator', () => {
  it('calculates "7A" correctly', () => {
    // 7 + A(1) = 8
    expect(chaldeanNumerologyCalculator(['7A'])).toBe(8);
  });

  it('calculates pure number string', () => {
    // "12345": 1+2+3+4+5 = 15 → 1+5 = 6
    expect(chaldeanNumerologyCalculator(['12345'])).toBe(6);
  });

  it('preserves master number 11', () => {
    // "11" as string → preserved as 11
    expect(chaldeanNumerologyCalculator(['11'])).toBe(11);
  });

  it('preserves master number 22', () => {
    expect(chaldeanNumerologyCalculator(['22'])).toBe(22);
  });

  it('preserves master number 33', () => {
    expect(chaldeanNumerologyCalculator(['33'])).toBe(33);
  });

  it('handles space-separated words', () => {
    // "Maple Lane": M(4)+a(1)+p(8)+l(3)+e(5)=21, L(3)+a(1)+n(5)+e(5)=14 → 21+14=35 → 3+5=8
    expect(chaldeanNumerologyCalculator(['Maple Lane'])).toBe(8);
  });

  it('handles multiple array elements', () => {
    const result = chaldeanNumerologyCalculator(['7A', '12345']);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(33);
  });

  it('handles empty array', () => {
    expect(chaldeanNumerologyCalculator([])).toBe(0);
  });
});
