/**
 * Diagnostic Test
 * Single test case to debug what's actually happening
 */

import { describe, it, expect } from 'vitest';
import type { FormData, CityData } from '../../models/form';
import { runAllCalculators } from '../../services/orchestration/calculatorOrchestrator';

describe('Diagnostic - Single Test Case', () => {
  it('should show detailed error information', async () => {
    const newYork: CityData = {
      id: '5128581',
      name: 'New York',
      country: 'United States',
      latitude: 40.7128,
      longitude: -74.006,
      timeZone: 'America/New_York',
      admin1: 'New York',
    };

    const london: CityData = {
      id: '2643743',
      name: 'London',
      country: 'United Kingdom',
      latitude: 51.5074,
      longitude: -0.1278,
      timeZone: 'Europe/London',
      admin1: 'England',
    };

    const testFormData: FormData = {
      name: 'Test User',
      dateOfBirth: '1980-01-15',
      timeOfBirth: '08:00',
      birthLocation: newYork,
      currentLocation: london,
      risingSign: 'Aries',
      l1: '100',
      streetNumber: '',
      l2: 'Test Street',
      postalCode: '10000',
      homeBuiltYear: '1950',
    };

    console.log('\n=== DIAGNOSTIC TEST ===');
    console.log('Input FormData:', JSON.stringify(testFormData, null, 2));

    const results = await runAllCalculators(testFormData);

    console.log('\n=== RESULTS ===');
    console.log('Success:', results.success);
    console.log('Timestamp:', results.timestamp);
    console.log('Errors:', results.errors);

    if (results.calculators) {
      console.log('\n=== CALCULATOR RESULTS ===');
      console.log('Transits:', results.calculators.transits ? 'OK' : 'Missing');
      console.log('Natal Chart:', results.calculators.natalChart ? 'OK' : 'Missing');
      console.log('Life Path:', results.calculators.lifePath ? 'OK' : 'Missing');
      console.log('Relocation:', results.calculators.relocation ? 'OK' : 'Missing');
      console.log('Address Numerology:', results.calculators.addressNumerology ? 'OK' : 'Missing');
    }

    // Print full results for inspection
    console.log('\n=== FULL RESULTS ===');
    console.log(JSON.stringify(results, null, 2));

    expect(results).toBeDefined();
  });
});
