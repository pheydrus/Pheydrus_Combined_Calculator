/**
 * Standalone Word Numerology Calculator page at /numerology/word
 * Calculates Chaldean numerology value for any word or number.
 */

import { useState, useMemo } from 'react';
import { StandalonePageWrapper } from './StandalonePageWrapper';
import { chaldeanNumerologyCalculator } from '../../utils/numerology/chaldean';
import { NUMEROLOGY_MEANINGS } from '../../utils/data/constants';

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e] transition-colors';

const NUMBER_COLORS: Record<number, string> = {
  1: 'bg-red-50 border-red-200 text-red-800',
  2: 'bg-orange-50 border-orange-200 text-orange-800',
  3: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  4: 'bg-green-50 border-green-200 text-green-800',
  5: 'bg-teal-50 border-teal-200 text-teal-800',
  6: 'bg-blue-50 border-blue-200 text-blue-800',
  7: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  8: 'bg-purple-50 border-purple-200 text-purple-800',
  9: 'bg-pink-50 border-pink-200 text-pink-800',
  11: 'bg-amber-50 border-amber-200 text-amber-800',
  22: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  33: 'bg-violet-50 border-violet-200 text-violet-800',
};

export function WordNumerologyPage() {
  const [inputValue, setInputValue] = useState('');

  const result = useMemo(() => {
    if (!inputValue.trim()) return null;
    const number = chaldeanNumerologyCalculator([inputValue.trim()]);
    const meaning = NUMEROLOGY_MEANINGS[number];
    return { number, meaning };
  }, [inputValue]);

  return (
    <StandalonePageWrapper
      title="Word Numerology"
      subtitle="Calculate the Chaldean numerology value of any word or number"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-[#4a4560] mb-2">
            Enter a word or number
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. Hello, 123, your name..."
            className={inputClass}
          />
        </div>

        {result && (
          <div
            className={`p-6 rounded-xl border-2 ${NUMBER_COLORS[result.number] || 'bg-gray-50 border-gray-200 text-gray-800'}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl font-bold">{result.number}</span>
              {result.meaning && (
                <span className="text-lg font-semibold">{result.meaning.meaning}</span>
              )}
            </div>
            <p className="text-sm">
              <span className="font-medium">Input:</span> {inputValue}
            </p>
            {result.meaning && <p className="text-sm mt-2">{result.meaning.description}</p>}
          </div>
        )}
      </div>
    </StandalonePageWrapper>
  );
}
