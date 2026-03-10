/**
 * Standalone Astrocartography page at /astrocartography
 *
 * v2 of the Relocation calculator: instead of taking a destination as input,
 * it outputs the geographic lines where each benefic planet (Sun, Moon,
 * Venus, Jupiter) is angular (ASC / DSC / MC / IC).
 */

import { useState } from 'react';
import { StandalonePageWrapper } from './StandalonePageWrapper';
import { calculateAstrocartography } from '../../services/calculators';
import { AstrocartographyResults } from '../../components/results';
import { CityAutocomplete } from '../../components/form/CityAutocomplete';
import type { AstrocartographyResult } from '../../models/calculators';
import type { CityData } from '../../models/form';

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e] transition-colors';
const labelClass = 'block text-sm font-semibold text-[#4a4560] mb-2';

export function AstrocartographyPage() {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [birthCity, setBirthCity] = useState<CityData | null>(null);
  const [result, setResult] = useState<AstrocartographyResult | null>(null);
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

      const res = await calculateAstrocartography({
        year,
        month,
        day,
        hour,
        minute,
        birthTimeZone: birthCity.timeZone,
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
      title="Astrocartography"
      subtitle="Find where in the world your benefic planets are angular"
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
          label="Birth City"
          placeholder="Search for your birth city..."
        />

        <div className="rounded-xl bg-[#f9f6f0] border border-[#e8dcc8] px-4 py-3 text-sm text-[#7a6a50]">
          <span className="font-semibold">Planets shown:</span> Sun · Moon · Venus · Jupiter
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <span className="font-semibold">Angles:</span> ASC · DSC · MC · IC
          <br />
          <span className="text-xs text-[#a08c6e]">
            Checks ~300 major cities worldwide — may take a few seconds.
          </span>
        </div>

        <button
          onClick={handleCalculate}
          disabled={!isReady || isCalculating}
          className="w-full py-3 bg-[#9a7d4e] hover:bg-[#b8944a] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating ? 'Calculating lines…' : 'Find My Astrocartography Lines'}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {result && <AstrocartographyResults result={result} />}
      </div>
    </StandalonePageWrapper>
  );
}
