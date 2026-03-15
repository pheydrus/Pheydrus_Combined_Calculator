/**
 * UnifiedInputForm Component
 * Main form that collects inputs for all 5 calculators
 */

import { FormSection } from './FormSection';
import { CityAutocomplete } from './CityAutocomplete';
import { useFormState } from '../../hooks/useFormState';
import { useFormValidation } from '../../hooks/useFormValidation';
import type { FormData } from '../../models/form';

interface UnifiedInputFormProps {
  onSubmit: (formData: FormData) => void;
  isLoading?: boolean;
}

export function UnifiedInputForm({ onSubmit, isLoading = false }: UnifiedInputFormProps) {
  const { formData, setField, setLocation, resetForm, isLoading: isLoadingForm } = useFormState();
  const { errors, validate } = useFormValidation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate(formData)) {
      onSubmit(formData);
    }
  };

  const loading = isLoading || isLoadingForm;

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e]';
  const inputErrorClass =
    'w-full px-3 py-2 border border-red-400 rounded-lg bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e]';
  const labelClass = 'block text-sm font-medium text-[#4a4560] mb-1';

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Personal Info Section */}
      <FormSection title="Personal Information">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Date of Birth <span className="text-[#9a7d4e]">*</span>
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setField('dateOfBirth', e.target.value)}
              className={errors.dateOfBirth ? inputErrorClass : inputClass}
            />
            {errors.dateOfBirth && (
              <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Time of Birth <span className="text-[#9a7d4e]">*</span>
            </label>
            <input
              type="time"
              value={formData.timeOfBirth}
              onChange={(e) => setField('timeOfBirth', e.target.value)}
              className={errors.timeOfBirth ? inputErrorClass : inputClass}
            />
            {errors.timeOfBirth && (
              <p className="text-red-500 text-sm mt-1">{errors.timeOfBirth}</p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Location Section */}
      <FormSection title="Location">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Birth City <span className="text-[#9a7d4e]">*</span>
            </label>
            <CityAutocomplete
              value={formData.birthLocation}
              onChange={(city) => setLocation('birthLocation', city)}
              placeholder="Search for birth city..."
              label=""
              error={errors.birthLocation}
            />
          </div>

          <div>
            <label className={labelClass}>
              Current City <span className="text-[#9a7d4e]">*</span>
            </label>
            <CityAutocomplete
              value={formData.currentLocation}
              onChange={(city) => setLocation('currentLocation', city)}
              placeholder="Search for current city..."
              label=""
              error={errors.currentLocation}
            />
          </div>
        </div>
      </FormSection>

      {/* Address Numerology Section */}
      <FormSection title="Address Numerology">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              Unit Number <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.l1}
              onChange={(e) => setField('l1', e.target.value)}
              placeholder="e.g., 7A, Unit 202"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Building/House Number <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.streetNumber}
              onChange={(e) => setField('streetNumber', e.target.value)}
              placeholder="e.g., 742"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Street Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.l2}
              onChange={(e) => setField('l2', e.target.value)}
              placeholder="e.g., Oak Street, 5th Avenue"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Postal Code <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setField('postalCode', e.target.value)}
              placeholder="e.g., 10001"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Home Built Year <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.homeBuiltYear}
              onChange={(e) => setField('homeBuiltYear', e.target.value)}
              placeholder="e.g., 1990"
              maxLength={4}
              className={errors.homeBuiltYear ? inputErrorClass : inputClass}
            />
            {errors.homeBuiltYear && (
              <p className="text-red-500 text-sm mt-1">{errors.homeBuiltYear}</p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Form Actions */}
      <div className="flex gap-4 mb-6">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-[#9a7d4e] hover:bg-[#b8944a] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors uppercase tracking-wider"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>

        <button
          type="button"
          onClick={resetForm}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 hover:border-[#9a7d4e] hover:text-[#9a7d4e] disabled:opacity-50 text-[#6b6188] font-semibold rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Required fields note */}
      <p className="text-sm text-gray-400">
        <span className="text-[#9a7d4e]">*</span> Required fields
      </p>
    </form>
  );
}
