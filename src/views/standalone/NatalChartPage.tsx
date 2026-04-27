/**
 * Standalone Natal Chart Calculator page at /astro
 * Reuses calculateNatalChart service and NatalChartResults component.
 */

import { useState } from 'react';
import { StandalonePageWrapper } from './StandalonePageWrapper';
import { calculateNatalChart } from '../../calculators';
import { NatalChartResults } from '../../components/results';
import { CityAutocomplete } from '../../components/form/CityAutocomplete';
import type { NatalChartResult } from '../../models/calculators';
import type { CityData } from '../../models/form';

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e] transition-colors';
const labelClass = 'block text-sm font-semibold text-[#4a4560] mb-2';

export function NatalChartPage() {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [birthCity, setBirthCity] = useState<CityData | null>(null);
  const [result, setResult] = useState<NatalChartResult | null>(null);
  const [error, setError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!dateOfBirth || !timeOfBirth || !birthCity) return;

    setError('');
    setIsCalculating(true);
    setResult(null);

    try {
      const [year, month, day] = dateOfBirth.split('-').map(Number);
      const [hour, minute] = timeOfBirth.split(':').map(Number);

      const res = await calculateNatalChart({
        year,
        month,
        day,
        hour,
        minute,
        latitude: birthCity.latitude,
        longitude: birthCity.longitude,
        timeZone: birthCity.timeZone,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
    } finally {
      setIsCalculating(false);
    }
  };

  const isReady = dateOfBirth && timeOfBirth && birthCity;

  return (
    <StandalonePageWrapper
      title="Astrology Natal Chart"
      subtitle="Generate a detailed natal chart with planet positions and aspects"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Time of Birth (24h)</label>
            <input
              type="time"
              value={timeOfBirth}
              onChange={(e) => setTimeOfBirth(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <CityAutocomplete
          value={birthCity}
          onChange={setBirthCity}
          label="Place of Birth"
          placeholder="Search for your birth city..."
        />

        <button
          onClick={handleCalculate}
          disabled={!isReady || isCalculating}
          className="w-full py-3 bg-[#9a7d4e] hover:bg-[#b8944a] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating ? 'Calculating...' : 'Generate Natal Chart'}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {result && <NatalChartResults result={result} />}
      </div>
    </StandalonePageWrapper>
  );
}
