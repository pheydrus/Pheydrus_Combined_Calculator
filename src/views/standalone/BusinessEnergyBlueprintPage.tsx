/**
 * Standalone Human Design Chart calculator at /pheydrus-HD
 */

import { useState } from 'react';
import { StandalonePageWrapper } from './StandalonePageWrapper';
import {
  calculateHumanDesign,
  validateHumanDesignInput,
} from '../../calculators/humanDesignCalculator';
import { HumanDesignResults } from '../../components/results/HumanDesignResults';
import { CityAutocomplete } from '../../components/form/CityAutocomplete';
import type { HumanDesignResult } from '../../models/calculators';
import type { CityData } from '../../models/form';

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e] transition-colors';
const labelClass = 'block text-sm font-semibold text-[#4a4560] mb-2';

export function BusinessEnergyBlueprintPage() {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [birthCity, setBirthCity] = useState<CityData | null>(null);
  const [result, setResult] = useState<HumanDesignResult | null>(null);
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

      const input = { year, month, day, hour, minute, timeZone: birthCity.timeZone };
      const validation = validateHumanDesignInput(input);

      if (!validation.valid) {
        setError(validation.error ?? 'Invalid input');
        return;
      }

      const res = await calculateHumanDesign(input);
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
      title="Human Design Chart"
      subtitle="Discover your Human Design type, authority, and profile."
    >
      <div className="space-y-6">
        {/* Intro callout */}
        <div className="bg-gradient-to-r from-[#9a7d4e]/10 to-[#4a4560]/10 rounded-xl border border-[#9a7d4e]/20 p-4">
          <p className="text-sm text-[#4a4560] leading-relaxed">
            Human Design combines the I-Ching, Kabbalah, chakra system, and quantum physics to map
            your unique energetic blueprint. Enter your exact birth data below.
          </p>
        </div>

        {/* Input fields */}
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
            <label className={labelClass}>
              Time of Birth
              <span className="font-normal text-[#9b95ad] ml-1">(exact time matters)</span>
            </label>
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
          {isCalculating ? 'Calculating your chart...' : 'Generate My Human Design Chart'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {result && <HumanDesignResults result={result} />}
      </div>
    </StandalonePageWrapper>
  );
}
