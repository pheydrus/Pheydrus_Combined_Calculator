/**
 * Astro Houses Utility Tests
 *
 * Tests normalize360, whole sign house assignment, and angle building.
 */

import { describe, it, expect } from 'vitest';
import { normalize360, assignWholeSignHouses, buildAngles, getHouseFromSignIndex } from '../houses';

// ============================================================================
// NORMALIZE360
// ============================================================================
describe('normalize360', () => {
  it('keeps values in range unchanged', () => {
    expect(normalize360(0)).toBe(0);
    expect(normalize360(180)).toBe(180);
    expect(normalize360(359.9)).toBeCloseTo(359.9);
  });

  it('normalizes negative values', () => {
    expect(normalize360(-30)).toBe(330);
    expect(normalize360(-360)).toBeCloseTo(0);
    expect(normalize360(-90)).toBe(270);
  });

  it('normalizes values above 360', () => {
    expect(normalize360(400)).toBe(40);
    expect(normalize360(720)).toBe(0);
    expect(normalize360(450)).toBe(90);
  });
});

// ============================================================================
// ASSIGN WHOLE SIGN HOUSES
// ============================================================================
describe('assignWholeSignHouses', () => {
  it('ASC in Aries (0°), Sun in Taurus (45°) → house 2', () => {
    const result = assignWholeSignHouses(0, [{ key: 'Sun', lon: 45 }]);
    expect(result[0].house).toBe(2);
  });

  it('ASC in Aries (0°), Sun in Aries (15°) → house 1', () => {
    const result = assignWholeSignHouses(0, [{ key: 'Sun', lon: 15 }]);
    expect(result[0].house).toBe(1);
  });

  it('ASC in Leo (120°), Sun in Aries (15°) → house 9', () => {
    // Leo = sign 4, Aries = sign 0. House = (0 - 4 + 12) % 12 + 1 = 9
    const result = assignWholeSignHouses(120, [{ key: 'Sun', lon: 15 }]);
    expect(result[0].house).toBe(9);
  });

  it('ASC in Leo (120°), Sun in Leo (135°) → house 1', () => {
    const result = assignWholeSignHouses(120, [{ key: 'Sun', lon: 135 }]);
    expect(result[0].house).toBe(1);
  });

  it('handles multiple planets', () => {
    const planets = [
      { key: 'Sun', lon: 45 }, // Taurus
      { key: 'Moon', lon: 120 }, // Leo
      { key: 'Mars', lon: 270 }, // Capricorn
    ];
    const result = assignWholeSignHouses(0, planets); // ASC in Aries

    expect(result).toHaveLength(3);
    expect(result[0].house).toBe(2); // Taurus = house 2
    expect(result[1].house).toBe(5); // Leo = house 5
    expect(result[2].house).toBe(10); // Capricorn = house 10
  });

  it('returns signIndex for each planet', () => {
    const result = assignWholeSignHouses(0, [{ key: 'Sun', lon: 45 }]);
    expect(result[0].signIndex).toBe(1); // Taurus = index 1
  });

  it('preserves planet key and lon', () => {
    const result = assignWholeSignHouses(0, [{ key: 'Jupiter', lon: 200 }]);
    expect(result[0].key).toBe('Jupiter');
    expect(result[0].lon).toBe(200);
  });
});

// ============================================================================
// BUILD ANGLES
// ============================================================================
describe('buildAngles', () => {
  it('builds correct angles from ASC and MC', () => {
    const angles = buildAngles(120, 30);
    expect(angles.asc).toBe(120);
    expect(angles.dsc).toBe(300); // 120 + 180
    expect(angles.mc).toBe(30);
    expect(angles.ic).toBe(210); // 30 + 180
  });

  it('normalizes angles that exceed 360', () => {
    const angles = buildAngles(300, 200);
    expect(angles.asc).toBe(300);
    expect(angles.dsc).toBe(120); // 300 + 180 = 480 → 120
    expect(angles.mc).toBe(200);
    expect(angles.ic).toBe(20); // 200 + 180 = 380 → 20
  });

  it('handles 0° ASC', () => {
    const angles = buildAngles(0, 270);
    expect(angles.asc).toBe(0);
    expect(angles.dsc).toBe(180);
    expect(angles.mc).toBe(270);
    expect(angles.ic).toBe(90);
  });
});

// ============================================================================
// GET HOUSE FROM SIGN INDEX
// ============================================================================
describe('getHouseFromSignIndex', () => {
  it('same sign as ASC → house 1', () => {
    expect(getHouseFromSignIndex(0, 0)).toBe(1);
  });

  it('next sign after ASC → house 2', () => {
    expect(getHouseFromSignIndex(1, 0)).toBe(2);
  });

  it('wraps around correctly', () => {
    // ASC in Pisces (11), planet in Aries (0) → house 2
    expect(getHouseFromSignIndex(0, 11)).toBe(2);
  });
});
