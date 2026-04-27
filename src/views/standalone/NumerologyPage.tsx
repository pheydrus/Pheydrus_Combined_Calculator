/**
 * Standalone Address Numerology page at /numerology
 * Combines address numerology (L1-L4) and life path in one page.
 * Reuses calculateAddressNumerology and calculateLifePath services.
 */

import { useState } from 'react';
import { StandalonePageWrapper } from './StandalonePageWrapper';
import { calculateAddressNumerology, calculateLifePath } from '../../calculators';
import { AddressNumerologyResults, LifePathResults } from '../../components/results';
import type { AddressNumerologyResult, LifePathResult } from '../../models/calculators';

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e] transition-colors';
const labelClass = 'block text-sm font-semibold text-[#4a4560] mb-2';

interface NumerologyFormData {
  unitNumber: string;
  streetName: string;
  postalCode: string;
  homeYear: string;
  birthYear: string;
  birthday: string;
}

export function NumerologyPage() {
  const [formData, setFormData] = useState<NumerologyFormData>({
    unitNumber: '',
    streetName: '',
    postalCode: '',
    homeYear: '',
    birthYear: '',
    birthday: '',
  });
  const [addressResult, setAddressResult] = useState<AddressNumerologyResult | null>(null);
  const [lifePathResult, setLifePathResult] = useState<LifePathResult | null>(null);
  const [error, setError] = useState('');

  const handleChange = (field: keyof NumerologyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCalculateAddress = () => {
    setError('');
    try {
      const res = calculateAddressNumerology({
        unitNumber: formData.unitNumber,
        streetNumber: '',
        streetName: formData.streetName,
        postalCode: formData.postalCode,
        homeYear: formData.homeYear,
        birthYear: formData.birthYear,
      });
      setAddressResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
      setAddressResult(null);
    }
  };

  const handleCalculateLifePath = () => {
    if (!formData.birthday) return;
    setError('');
    try {
      const res = calculateLifePath({ birthDate: formData.birthday });
      setLifePathResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Calculation failed');
      setLifePathResult(null);
    }
  };

  const hasAddressInput =
    formData.unitNumber || formData.streetName || formData.postalCode || formData.birthYear;

  return (
    <StandalonePageWrapper
      title="Numerology Calculator"
      subtitle="Calculate life path numbers, personal year, and address numerology"
    >
      <div className="space-y-8">
        {/* Address Numerology Section */}
        <section>
          <h2 className="text-lg font-bold text-[#2d2a3e] mb-1">Address Numerology</h2>
          <p className="text-sm text-[#6b6188] mb-4">
            Addresses vary between countries & cities, so some fields may be empty — that&apos;s ok!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>L1 (Unit Number)</label>
              <input
                type="text"
                value={formData.unitNumber}
                onChange={(e) => handleChange('unitNumber', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>L2 (Street Name)</label>
              <input
                type="text"
                value={formData.streetName}
                onChange={(e) => handleChange('streetName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Postal Code</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="e.g. 2000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Home Built Year</label>
              <input
                type="text"
                value={formData.homeYear}
                onChange={(e) => handleChange('homeYear', e.target.value)}
                placeholder="e.g. 1999"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Your Birth Year</label>
              <input
                type="text"
                value={formData.birthYear}
                onChange={(e) => handleChange('birthYear', e.target.value)}
                placeholder="e.g. 1996"
                className={inputClass}
              />
            </div>
          </div>

          <button
            onClick={handleCalculateAddress}
            disabled={!hasAddressInput}
            className="w-full mt-4 py-3 bg-[#9a7d4e] hover:bg-[#b8944a] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Calculate Address Numerology
          </button>

          {addressResult && (
            <div className="mt-6">
              <AddressNumerologyResults result={addressResult} />
            </div>
          )}
        </section>

        <hr className="border-gray-200" />

        {/* Life Path Section */}
        <section>
          <h2 className="text-lg font-bold text-[#2d2a3e] mb-4">Life Path</h2>

          <div>
            <label className={labelClass}>Birthday</label>
            <input
              type="date"
              value={formData.birthday}
              onChange={(e) => handleChange('birthday', e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            onClick={handleCalculateLifePath}
            disabled={!formData.birthday}
            className="w-full mt-4 py-3 bg-[#9a7d4e] hover:bg-[#b8944a] text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Calculate Life Path
          </button>

          {lifePathResult && (
            <div className="mt-6">
              <LifePathResults result={lifePathResult} />
            </div>
          )}
        </section>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </StandalonePageWrapper>
  );
}
