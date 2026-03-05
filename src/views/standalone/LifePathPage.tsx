/**
 * Standalone Life Path Calculator page at /life-path
 * Reuses calculateLifePath service and LifePathResults component.
 */

import { useState } from 'react';
import { StandalonePageWrapper } from './StandalonePageWrapper';
import { calculateLifePath } from '../../services/calculators';
import { LifePathResults } from '../../components/results';
import type { LifePathResult } from '../../models/calculators';

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e] transition-colors';
const labelClass = 'block text-sm font-semibold text-[#4a4560] mb-2';

export function LifePathPage() {
  const [birthDate, setBirthDate] = useState('');
  const [result, setResult] = useState<LifePathResult | null>(null);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    if (!birthDate) return;
    setError('');
    try {
      const res = calculateLifePath({ birthDate });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
      setResult(null);
    }
  };

  return (
    <StandalonePageWrapper
      title="Life Path Number"
      subtitle="Calculate your life path number, personal year, and Chinese zodiac"
    >
      <div className="space-y-6">
        <div>
          <label className={labelClass}>Date of Birth</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => {
              setBirthDate(e.target.value);
              setResult(null);
            }}
            className={inputClass}
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={!birthDate}
          className="w-full py-3 bg-[#9a7d4e] hover:bg-[#b8944a] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Calculate Life Path
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {result && <LifePathResults result={result} />}
      </div>
    </StandalonePageWrapper>
  );
}
