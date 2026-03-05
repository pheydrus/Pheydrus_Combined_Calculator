/**
 * Feng Shui Charts Data Tests
 *
 * Verifies star-element mappings, element cycle order, and Lo Shu square properties.
 */

import { describe, it, expect } from 'vitest';
import { elementNumberMap, elementRelationship, period9 } from '../charts';
import { Element } from '../types';
import type { Star } from '../types';

// ============================================================================
// ELEMENT NUMBER MAP — star to element/auspicious
// ============================================================================
describe('elementNumberMap', () => {
  it('star 1 = water, auspicious', () => {
    expect(elementNumberMap[1].element).toBe(Element.water);
    expect(elementNumberMap[1].auspicious).toBe(true);
  });

  it('star 2 = earth, inauspicious', () => {
    expect(elementNumberMap[2].element).toBe(Element.earth);
    expect(elementNumberMap[2].auspicious).toBe(false);
  });

  it('star 3 = wood, inauspicious', () => {
    expect(elementNumberMap[3].element).toBe(Element.wood);
    expect(elementNumberMap[3].auspicious).toBe(false);
  });

  it('star 4 = wood, auspicious', () => {
    expect(elementNumberMap[4].element).toBe(Element.wood);
    expect(elementNumberMap[4].auspicious).toBe(true);
  });

  it('star 5 = earth, inauspicious', () => {
    expect(elementNumberMap[5].element).toBe(Element.earth);
    expect(elementNumberMap[5].auspicious).toBe(false);
  });

  it('star 6 = metal, auspicious', () => {
    expect(elementNumberMap[6].element).toBe(Element.metal);
    expect(elementNumberMap[6].auspicious).toBe(true);
  });

  it('star 7 = metal, inauspicious', () => {
    expect(elementNumberMap[7].element).toBe(Element.metal);
    expect(elementNumberMap[7].auspicious).toBe(false);
  });

  it('star 8 = earth, auspicious', () => {
    expect(elementNumberMap[8].element).toBe(Element.earth);
    expect(elementNumberMap[8].auspicious).toBe(true);
  });

  it('star 9 = fire, auspicious', () => {
    expect(elementNumberMap[9].element).toBe(Element.fire);
    expect(elementNumberMap[9].auspicious).toBe(true);
  });

  it('all 9 stars have required properties', () => {
    for (let i = 1; i <= 9; i++) {
      const star = elementNumberMap[i as Star];
      expect(star).toHaveProperty('auspicious');
      expect(star).toHaveProperty('color');
      expect(star).toHaveProperty('elementIcon');
      expect(star).toHaveProperty('theme');
      expect(star).toHaveProperty('element');
    }
  });
});

// ============================================================================
// ELEMENT RELATIONSHIP — productive cycle order
// ============================================================================
describe('elementRelationship', () => {
  it('has exactly 5 elements', () => {
    expect(elementRelationship).toHaveLength(5);
  });

  it('follows the productive cycle: fire → earth → metal → water → wood', () => {
    expect(elementRelationship).toEqual([
      Element.fire,
      Element.earth,
      Element.metal,
      Element.water,
      Element.wood,
    ]);
  });
});

// ============================================================================
// LO SHU SQUARE — magic square properties
// ============================================================================
describe('Lo Shu Square (period9)', () => {
  it('is a 3x3 grid', () => {
    expect(period9).toHaveLength(3);
    for (const row of period9) {
      expect(row).toHaveLength(3);
    }
  });

  it('contains all numbers 1-9 exactly once', () => {
    const flat = period9.flat().sort((a, b) => a - b);
    expect(flat).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('has correct period 9 values', () => {
    // Period 9 Lo Shu: center is 9, specific arrangement for Period 9 (2024-2043)
    expect(period9[1][1]).toBe(9); // center star
    expect(period9).toEqual([
      [8, 4, 6],
      [7, 9, 2],
      [3, 5, 1],
    ]);
  });

  it('all values are valid stars (1-9)', () => {
    for (const row of period9) {
      for (const val of row) {
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(9);
      }
    }
  });
});
