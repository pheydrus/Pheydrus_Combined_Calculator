/**
 * Standalone Transits Calculator page at /transits
 * Reuses calculateTransits service and TransitsResults component.
 */

import { useState } from 'react';
import { StandalonePageWrapper } from './StandalonePageWrapper';
import { calculateTransits } from '../../services/calculators';
import { TransitsResults } from '../../components/results';
import { ZODIAC_SIGNS_OPTIONS } from '../../models/form';
import type { TransitsResult } from '../../models/calculators';

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e] transition-colors';

export function TransitsPage() {
  const [risingSign, setRisingSign] = useState('');
  const [result, setResult] = useState<TransitsResult | null>(null);

  const handleCalculate = () => {
    if (!risingSign) return;
    const res = calculateTransits({ risingSign });
    setResult(res);
  };

  return (
    <StandalonePageWrapper
      title="Transit Calculator"
      subtitle="Track planetary transits through your houses by rising sign"
    >
      <div className="space-y-6">
        {/* Help link */}
        <p className="text-sm text-[#6b6188]">
          Don&apos;t know your rising sign?{' '}
          <a
            href="https://horoscopes.astro-seek.com/ascendant-rising-sign-calculator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#9a7d4e] underline"
          >
            Find it here
          </a>
        </p>

        {/* Rising sign selector */}
        <div>
          <label className="block text-sm font-semibold text-[#4a4560] mb-2">Rising Sign</label>
          <select
            value={risingSign}
            onChange={(e) => {
              setRisingSign(e.target.value);
              setResult(null);
            }}
            className={inputClass}
          >
            <option value="">-- Select your rising sign --</option>
            {ZODIAC_SIGNS_OPTIONS.map((sign) => (
              <option key={sign} value={sign}>
                {sign}
              </option>
            ))}
          </select>
        </div>

        {/* Calculate button */}
        <button
          onClick={handleCalculate}
          disabled={!risingSign}
          className="w-full py-3 bg-[#9a7d4e] hover:bg-[#b8944a] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Calculate Transits
        </button>

        {/* Results */}
        {result && <TransitsResults result={result} />}
      </div>
    </StandalonePageWrapper>
  );
}
