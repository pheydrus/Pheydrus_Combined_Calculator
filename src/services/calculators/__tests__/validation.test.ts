/**
 * Validation Function Tests
 *
 * Tests all 5 validate*Input() functions with valid, invalid, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  validateTransitsInput,
  validateLifePathInput,
  validateNatalChartInput,
  validateRelocationInput,
  validateAddressNumerologyInput,
} from '../index';

// ============================================================================
// TRANSITS VALIDATION
// ============================================================================
describe('validateTransitsInput', () => {
  it('accepts a valid zodiac sign', () => {
    expect(validateTransitsInput({ risingSign: 'Leo' })).toEqual({ valid: true });
  });

  it('accepts all 12 signs', () => {
    const signs = [
      'Aries',
      'Taurus',
      'Gemini',
      'Cancer',
      'Leo',
      'Virgo',
      'Libra',
      'Scorpio',
      'Sagittarius',
      'Capricorn',
      'Aquarius',
      'Pisces',
    ];
    for (const sign of signs) {
      expect(validateTransitsInput({ risingSign: sign }).valid).toBe(true);
    }
  });

  it('rejects empty string', () => {
    const result = validateTransitsInput({ risingSign: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects invalid sign name', () => {
    const result = validateTransitsInput({ risingSign: 'Ophiuchus' });
    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// LIFE PATH VALIDATION
// ============================================================================
describe('validateLifePathInput', () => {
  it('accepts valid YYYY-MM-DD date', () => {
    expect(validateLifePathInput({ birthDate: '1990-05-15' })).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    const result = validateLifePathInput({ birthDate: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects wrong format MM-DD-YYYY', () => {
    const result = validateLifePathInput({ birthDate: '05-15-1990' });
    expect(result.valid).toBe(false);
  });

  it('rejects future date', () => {
    const result = validateLifePathInput({ birthDate: '2099-01-01' });
    expect(result.valid).toBe(false);
  });
});

// ============================================================================
// NATAL CHART VALIDATION
// ============================================================================
describe('validateNatalChartInput', () => {
  const validInput = {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    latitude: 40.7128,
    longitude: -74.006,
    timeZone: 'America/New_York',
  };

  it('accepts valid input', () => {
    expect(validateNatalChartInput(validInput)).toEqual({ valid: true });
  });

  it('rejects year < 1900', () => {
    expect(validateNatalChartInput({ ...validInput, year: 1800 }).valid).toBe(false);
  });

  it('rejects month > 12', () => {
    expect(validateNatalChartInput({ ...validInput, month: 13 }).valid).toBe(false);
  });

  it('rejects month < 1', () => {
    expect(validateNatalChartInput({ ...validInput, month: 0 }).valid).toBe(false);
  });

  it('rejects hour > 23', () => {
    expect(validateNatalChartInput({ ...validInput, hour: 24 }).valid).toBe(false);
  });

  it('rejects latitude > 90', () => {
    expect(validateNatalChartInput({ ...validInput, latitude: 91 }).valid).toBe(false);
  });

  it('rejects longitude > 180', () => {
    expect(validateNatalChartInput({ ...validInput, longitude: 181 }).valid).toBe(false);
  });

  it('rejects empty timezone', () => {
    expect(validateNatalChartInput({ ...validInput, timeZone: '' }).valid).toBe(false);
  });
});

// ============================================================================
// RELOCATION VALIDATION
// ============================================================================
describe('validateRelocationInput', () => {
  const validInput = {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    birthLatitude: 40.7128,
    birthLongitude: -74.006,
    birthTimeZone: 'America/New_York',
    destinationLatitude: 51.5074,
    destinationLongitude: -0.1278,
  };

  it('accepts valid input', () => {
    expect(validateRelocationInput(validInput)).toEqual({ valid: true });
  });

  it('rejects invalid birth year', () => {
    expect(validateRelocationInput({ ...validInput, year: 1800 }).valid).toBe(false);
  });

  it('rejects invalid birth latitude', () => {
    expect(validateRelocationInput({ ...validInput, birthLatitude: 100 }).valid).toBe(false);
  });

  it('rejects invalid destination longitude', () => {
    expect(validateRelocationInput({ ...validInput, destinationLongitude: 200 }).valid).toBe(false);
  });
});

// ============================================================================
// ADDRESS NUMEROLOGY VALIDATION
// ============================================================================
describe('validateAddressNumerologyInput', () => {
  it('accepts valid input with all fields', () => {
    const result = validateAddressNumerologyInput({
      unitNumber: '7A',
      streetNumber: '123',
      streetName: 'Main St',
      postalCode: '10001',
      homeYear: '1999',
      birthYear: '1990',
    });
    expect(result).toEqual({ valid: true });
  });

  it('rejects missing birthYear', () => {
    const result = validateAddressNumerologyInput({
      unitNumber: '7A',
      birthYear: '',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects birthYear < 1900', () => {
    const result = validateAddressNumerologyInput({
      birthYear: '1800',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects invalid homeYear far in the future', () => {
    const result = validateAddressNumerologyInput({
      birthYear: '1990',
      homeYear: '3000',
    });
    expect(result.valid).toBe(false);
  });

  it('accepts without homeYear (optional)', () => {
    const result = validateAddressNumerologyInput({
      birthYear: '1990',
    });
    expect(result.valid).toBe(true);
  });
});
