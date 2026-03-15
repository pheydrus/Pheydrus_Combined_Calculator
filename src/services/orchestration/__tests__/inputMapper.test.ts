/**
 * Input Mapper Equivalence Tests
 *
 * Verifies that the combined flow's inputMapper produces identical
 * calculator inputs as the standalone pages construct inline.
 * This is the core "same content" guarantee.
 */

import { describe, it, expect } from 'vitest';
import {
  mapToTransitsInput,
  mapToNatalChartInput,
  mapToLifePathInput,
  mapToRelocationInput,
  mapToAddressNumerologyInput,
  mapAllInputs,
} from '../inputMapper';
import type { FormData, CityData } from '../../../models/form';

const testCity: CityData = {
  id: '5128581',
  name: 'New York',
  country: 'US',
  latitude: 40.7128,
  longitude: -74.006,
  timeZone: 'America/New_York',
};

const testDestination: CityData = {
  id: '2643743',
  name: 'London',
  country: 'GB',
  latitude: 51.5074,
  longitude: -0.1278,
  timeZone: 'Europe/London',
};

const fullFormData: FormData = {
  name: 'Test User',
  dateOfBirth: '1990-05-15',
  timeOfBirth: '14:30',
  birthLocation: testCity,
  currentLocation: testDestination,
  risingSign: 'Leo',
  l1: '7A',
  streetNumber: '123',
  l2: 'Main Street',
  postalCode: '10001',
  homeBuiltYear: '1999',
};

// ============================================================================
// TRANSITS INPUT — matches TransitsPage inline construction
// ============================================================================
describe('Input Mapper: Transits (standalone equivalence)', () => {
  it('maps risingSign from FormData', () => {
    const result = mapToTransitsInput(fullFormData);
    // TransitsPage does: calculateTransits({ risingSign: selectedSign })
    expect(result).toEqual({ risingSign: 'Leo' });
  });

  it('defaults to Aries when risingSign is empty', () => {
    const result = mapToTransitsInput({ ...fullFormData, risingSign: '' });
    expect(result).toEqual({ risingSign: 'Aries' });
  });
});

// ============================================================================
// NATAL CHART INPUT — matches NatalChartPage inline construction
// ============================================================================
describe('Input Mapper: Natal Chart (standalone equivalence)', () => {
  it('produces same input as NatalChartPage inline construction', () => {
    const result = mapToNatalChartInput(fullFormData);

    // NatalChartPage does:
    //   const [year, month, day] = dateOfBirth.split('-').map(Number);
    //   const [hour, minute] = timeOfBirth.split(':').map(Number);
    //   { year, month, day, hour, minute, latitude: birthCity.latitude, ... }
    const [year, month, day] = fullFormData.dateOfBirth.split('-').map(Number);
    const [hour, minute] = fullFormData.timeOfBirth.split(':').map(Number);

    const standaloneInput = {
      year,
      month,
      day,
      hour,
      minute,
      latitude: testCity.latitude,
      longitude: testCity.longitude,
      timeZone: testCity.timeZone,
    };

    expect(result).toEqual(standaloneInput);
  });

  it('throws when birthLocation is null', () => {
    expect(() => mapToNatalChartInput({ ...fullFormData, birthLocation: null })).toThrow(
      'Birth location is required'
    );
  });
});

// ============================================================================
// LIFE PATH INPUT — matches LifePathPage inline construction
// ============================================================================
describe('Input Mapper: Life Path (standalone equivalence)', () => {
  it('produces same input as LifePathPage', () => {
    const result = mapToLifePathInput(fullFormData);
    // LifePathPage does: calculateLifePath({ birthDate: birthday })
    expect(result).toEqual({ birthDate: '1990-05-15' });
  });
});

// ============================================================================
// RELOCATION INPUT — matches RelocationPage inline construction
// ============================================================================
describe('Input Mapper: Relocation (standalone equivalence)', () => {
  it('produces same input as RelocationPage inline construction', () => {
    const result = mapToRelocationInput(fullFormData);

    // RelocationPage does same date/time split + both city coords
    const [year, month, day] = fullFormData.dateOfBirth.split('-').map(Number);
    const [hour, minute] = fullFormData.timeOfBirth.split(':').map(Number);

    const standaloneInput = {
      year,
      month,
      day,
      hour,
      minute,
      birthLatitude: testCity.latitude,
      birthLongitude: testCity.longitude,
      birthTimeZone: testCity.timeZone,
      destinationLatitude: testDestination.latitude,
      destinationLongitude: testDestination.longitude,
    };

    expect(result).toEqual(standaloneInput);
  });

  it('throws when birthLocation is null', () => {
    expect(() => mapToRelocationInput({ ...fullFormData, birthLocation: null })).toThrow();
  });

  it('throws when currentLocation is null', () => {
    expect(() => mapToRelocationInput({ ...fullFormData, currentLocation: null })).toThrow();
  });
});

// ============================================================================
// ADDRESS NUMEROLOGY INPUT — matches NumerologyPage inline construction
// ============================================================================
describe('Input Mapper: Address Numerology (standalone equivalence)', () => {
  it('produces same input as NumerologyPage/AdvancedNumerologyPage', () => {
    const result = mapToAddressNumerologyInput(fullFormData);

    // NumerologyPage does:
    //   calculateAddressNumerology({
    //     unitNumber: formData.unitNumber,
    //     streetNumber: formData.streetNumber,
    //     streetName: formData.streetName,
    //     postalCode: formData.postalCode,
    //     homeYear: formData.homeYear,
    //     birthYear: formData.birthYear,
    //   })
    // The combined flow maps: l1→unitNumber, streetNumber→streetNumber, l2→streetName
    expect(result).toEqual({
      unitNumber: '7A',
      streetNumber: '123',
      streetName: 'Main Street',
      postalCode: '10001',
      homeYear: '1999',
      birthYear: '1990',
    });
  });

  it('extracts birth year from dateOfBirth string', () => {
    const result = mapToAddressNumerologyInput({
      ...fullFormData,
      dateOfBirth: '1988-03-12',
    });
    expect(result.birthYear).toBe('1988');
  });
});

// ============================================================================
// MAP ALL — integration check
// ============================================================================
describe('Input Mapper: mapAllInputs', () => {
  it('returns all 5 input objects', () => {
    const all = mapAllInputs(fullFormData);
    expect(all).toHaveProperty('transits');
    expect(all).toHaveProperty('natalChart');
    expect(all).toHaveProperty('lifePath');
    expect(all).toHaveProperty('relocation');
    expect(all).toHaveProperty('addressNumerology');
  });
});
