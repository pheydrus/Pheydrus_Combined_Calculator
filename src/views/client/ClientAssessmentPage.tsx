/**
 * ClientAssessmentPage
 * Multi-step intake quiz for the client-facing Pheydrus assessment.
 * Steps:
 *   1 – About You       (name, email, phone, DOB, time of birth)
 *   2 – Your Locations  (birth city, current city)
 *   3 – Your Home       (address details, move-in date)
 *   4 – Your Challenge  (desired outcome, obstacle, pattern year, prior help)
 *   5 – Your Path       (preferred solution, current situation)
 *   6 – Anything Else   (additional notes + review & submit)
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CityAutocomplete } from '../../components/form/CityAutocomplete';
import { runAllCalculators, getErrorSummary } from '../../services/orchestration';
import type { FormData, CityData } from '../../models/form';
import { EMPTY_FORM } from '../../models/form';
import type {
  ClientIntakeData,
  PreferredSolution,
  CurrentSituation,
  PriorHelpOption,
} from '../../models/clientIntake';
import {
  EMPTY_CLIENT_INTAKE,
  PREFERRED_SOLUTION_LABELS,
  CURRENT_SITUATION_LABELS,
  PRIOR_HELP_LABELS,
} from '../../models/clientIntake';

const TOTAL_STEPS = 6;

// ─── Shared style tokens ────────────────────────────────────────────────────
const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e] transition-colors';
const labelClass = 'block text-sm font-semibold text-[#4a4560] mb-2';
const questionClass = 'text-2xl font-bold text-[#2d2a3e] mb-2 leading-snug';
const subClass = 'text-[#6b6188] mb-8 text-sm';

// ─── ProgressBar ────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const pct = Math.round(((step - 1) / (TOTAL_STEPS - 1)) * 100);
  return (
    <div className="mb-10">
      <div className="flex justify-between text-xs text-[#9a7d4e] font-semibold mb-2">
        <span>
          Step {step} of {TOTAL_STEPS}
        </span>
        <span>{pct}% complete</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#9a7d4e] to-[#b8944a] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── RadioCard ───────────────────────────────────────────────────────────────
function RadioCard<T extends string>({
  value,
  label,
  selected,
  onSelect,
}: {
  value: T;
  label: string;
  selected: boolean;
  onSelect: (v: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${
        selected
          ? 'border-[#9a7d4e] bg-[#9a7d4e]/5 text-[#2d2a3e]'
          : 'border-gray-200 bg-white text-[#6b6188] hover:border-[#9a7d4e]/50'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 rounded-full border-2 mr-3 align-middle flex-shrink-0 ${
          selected ? 'border-[#9a7d4e] bg-[#9a7d4e]' : 'border-gray-300 bg-white'
        }`}
      />
      {label}
    </button>
  );
}

// ─── CheckCard (multi-select) ────────────────────────────────────────────────
function CheckCard({
  value,
  label,
  selected,
  onToggle,
}: {
  value: PriorHelpOption;
  label: string;
  selected: boolean;
  onToggle: (v: PriorHelpOption) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${
        selected
          ? 'border-[#9a7d4e] bg-[#9a7d4e]/5 text-[#2d2a3e]'
          : 'border-gray-200 bg-white text-[#6b6188] hover:border-[#9a7d4e]/50'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 rounded border-2 mr-3 align-middle flex-shrink-0 ${
          selected ? 'border-[#9a7d4e] bg-[#9a7d4e]' : 'border-gray-300 bg-white'
        }`}
      />
      {label}
    </button>
  );
}

// ─── NavButtons ──────────────────────────────────────────────────────────────
function NavButtons({
  step,
  onBack,
  onNext,
  onSubmit,
  isLoading,
  canProceed,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  canProceed: boolean;
}) {
  const isLast = step === TOTAL_STEPS;
  return (
    <div className="flex gap-4 mt-10">
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-3 border border-gray-200 text-[#6b6188] font-semibold rounded-xl hover:border-[#9a7d4e] hover:text-[#9a7d4e] transition-colors disabled:opacity-40"
        >
          Back
        </button>
      )}
      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading || !canProceed}
          className="flex-1 px-6 py-3 bg-[#9a7d4e] hover:bg-[#b8944a] disabled:opacity-40 text-white font-bold rounded-xl transition-colors uppercase tracking-wider"
        >
          {isLoading ? 'Generating your report…' : 'Generate My Report'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 px-6 py-3 bg-[#9a7d4e] hover:bg-[#b8944a] disabled:opacity-40 text-white font-bold rounded-xl transition-colors"
        >
          Continue
        </button>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function ClientAssessmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core calculator form data
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  // Additional intake questionnaire data
  const [intake, setIntake] = useState<ClientIntakeData>(EMPTY_CLIENT_INTAKE);

  const setField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setIntakeField = useCallback(
    <K extends keyof ClientIntakeData>(key: K, value: ClientIntakeData[K]) => {
      setIntake((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setLocation = useCallback(
    (key: 'birthLocation' | 'currentLocation', city: CityData | null) => {
      setForm((prev) => ({ ...prev, [key]: city }));
    },
    []
  );

  const togglePriorHelp = useCallback((option: PriorHelpOption) => {
    setIntake((prev) => {
      const current = prev.priorHelp;
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, priorHelp: updated };
    });
  }, []);

  // ── Step validation ────────────────────────────────────────────────────────
  const canProceed = (() => {
    switch (step) {
      case 1:
        return (
          !!form.name &&
          !!intake.email &&
          !!intake.phone &&
          !!form.dateOfBirth &&
          !!form.timeOfBirth
        );
      case 2:
        return !!form.birthLocation && !!form.currentLocation;
      case 3:
        return true;
      case 4:
        return !!intake.desiredOutcome && !!intake.obstacle;
      case 5:
        return !!intake.preferredSolution && !!intake.currentSituation;
      case 6:
        return true;
      default:
        return false;
    }
  })();

  const handleBack = () => setStep((s) => Math.max(1, s - 1));
  const handleNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await runAllCalculators(form);
      if (results.success) {
        navigate('/client/results', { state: { results, intake } });
      } else {
        setError(getErrorSummary(results) || 'Calculation failed');
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  };

  // ── Step renderers ─────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Step 1: About You ────────────────────────────────────────────────
      case 1:
        return (
          <div>
            <p className={questionClass}>Let's start with the basics.</p>
            <p className={subClass}>This information powers your astrological analysis.</p>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>
                  Your name <span className="text-[#9a7d4e]">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="First name is fine"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Email address <span className="text-[#9a7d4e]">*</span>
                </label>
                <input
                  type="email"
                  value={intake.email}
                  onChange={(e) => setIntakeField('email', e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Phone number <span className="text-[#9a7d4e]">*</span>
                </label>
                <input
                  type="tel"
                  value={intake.phone}
                  onChange={(e) => setIntakeField('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Date of birth <span className="text-[#9a7d4e]">*</span>
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setField('dateOfBirth', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Exact time of birth <span className="text-[#9a7d4e]">*</span>
                </label>
                <input
                  type="time"
                  value={form.timeOfBirth}
                  onChange={(e) => setField('timeOfBirth', e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Check your birth certificate for the most accurate result.
                </p>
              </div>
            </div>
          </div>
        );

      // ── Step 2: Locations ────────────────────────────────────────────────
      case 2:
        return (
          <div>
            <p className={questionClass}>Where were you born, and where do you live now?</p>
            <p className={subClass}>
              We use these cities to calculate your natal chart and current transits.
            </p>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>
                  Birth city <span className="text-[#9a7d4e]">*</span>
                </label>
                <CityAutocomplete
                  value={form.birthLocation}
                  onChange={(city) => setLocation('birthLocation', city)}
                  placeholder="Search for your birth city…"
                  label=""
                />
              </div>
              <div>
                <label className={labelClass}>
                  Current city <span className="text-[#9a7d4e]">*</span>
                </label>
                <CityAutocomplete
                  value={form.currentLocation}
                  onChange={(city) => setLocation('currentLocation', city)}
                  placeholder="Search for your current city…"
                  label=""
                />
              </div>
            </div>
          </div>
        );

      // ── Step 3: Home / Address ───────────────────────────────────────────
      case 3:
        return (
          <div>
            <p className={questionClass}>Tell us about your home.</p>
            <p className={subClass}>
              Your address number reveals your environment's energy. All fields are optional.
            </p>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>When did you move to your current address?</label>
                <input
                  type="text"
                  value={intake.addressMoveDate}
                  onChange={(e) => setIntakeField('addressMoveDate', e.target.value)}
                  placeholder="e.g., March 2023"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Unit number</label>
                  <input
                    type="text"
                    value={form.l1}
                    onChange={(e) => setField('l1', e.target.value)}
                    placeholder="e.g., 7A"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Building / house number</label>
                  <input
                    type="text"
                    value={form.streetNumber}
                    onChange={(e) => setField('streetNumber', e.target.value)}
                    placeholder="e.g., 742"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Street name</label>
                <input
                  type="text"
                  value={form.l2}
                  onChange={(e) => setField('l2', e.target.value)}
                  placeholder="e.g., Oak Street"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Postal code</label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setField('postalCode', e.target.value)}
                  placeholder="e.g., 10001"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        );

      // ── Step 4: Challenge ────────────────────────────────────────────────
      case 4:
        return (
          <div>
            <p className={questionClass}>What's holding you back?</p>
            <p className={subClass}>
              Be as specific as possible — this helps us tailor your report.
            </p>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>
                  What is your desired outcome in the next 90 days?{' '}
                  <span className="text-[#9a7d4e]">*</span>
                </label>
                <textarea
                  value={intake.desiredOutcome}
                  onChange={(e) => setIntakeField('desiredOutcome', e.target.value)}
                  placeholder="Describe what success looks like for you in the next 90 days…"
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  What is the main obstacle stopping you? <span className="text-[#9a7d4e]">*</span>
                </label>
                <textarea
                  value={intake.obstacle}
                  onChange={(e) => setIntakeField('obstacle', e.target.value)}
                  placeholder="Be honest — what keeps getting in the way?"
                  rows={3}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  What year did you first notice the recurring pattern connected to your current
                  obstacle?
                </label>
                <input
                  type="text"
                  value={intake.patternYear}
                  onChange={(e) => setIntakeField('patternYear', e.target.value)}
                  placeholder="e.g., 2018"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  What support have you already sought for this challenge?{' '}
                  <span className="text-gray-400 font-normal">(Select all that apply)</span>
                </label>
                <div className="space-y-3">
                  {(Object.entries(PRIOR_HELP_LABELS) as [PriorHelpOption, string][]).map(
                    ([value, label]) => (
                      <CheckCard
                        key={value}
                        value={value}
                        label={label}
                        selected={intake.priorHelp.includes(value)}
                        onToggle={togglePriorHelp}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      // ── Step 5: Path & Situation ─────────────────────────────────────────
      case 5:
        return (
          <div>
            <p className={questionClass}>How do you learn and grow best?</p>
            <p className={subClass}>Select what resonates most with you.</p>
            <div className="space-y-8">
              <div>
                <label className={labelClass}>
                  What solution works best for you? <span className="text-[#9a7d4e]">*</span>
                </label>
                <div className="space-y-3">
                  {(Object.entries(PREFERRED_SOLUTION_LABELS) as [PreferredSolution, string][]).map(
                    ([value, label]) => (
                      <RadioCard
                        key={value}
                        value={value}
                        label={label}
                        selected={intake.preferredSolution === value}
                        onSelect={(v) => setIntakeField('preferredSolution', v)}
                      />
                    )
                  )}
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  What best describes your current situation?{' '}
                  <span className="text-[#9a7d4e]">*</span>
                </label>
                <div className="space-y-3">
                  {(Object.entries(CURRENT_SITUATION_LABELS) as [CurrentSituation, string][]).map(
                    ([value, label]) => (
                      <RadioCard
                        key={value}
                        value={value}
                        label={label}
                        selected={intake.currentSituation === value}
                        onSelect={(v) => setIntakeField('currentSituation', v)}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      // ── Step 6: Final Notes + Summary ────────────────────────────────────
      case 6:
        return (
          <div>
            <p className={questionClass}>Anything else you'd like us to know?</p>
            <p className={subClass}>
              Add any context that might help us give you the most accurate reading.
            </p>
            <div className="space-y-6">
              <textarea
                value={intake.additionalNotes}
                onChange={(e) => setIntakeField('additionalNotes', e.target.value)}
                placeholder="Optional — share anything else on your mind…"
                rows={5}
                className={inputClass}
              />
              {/* Mini summary */}
              <div className="bg-[#f8f6f0] border border-[#e8e0d0] rounded-xl p-5 space-y-2 text-sm">
                <p className="font-bold text-[#2d2a3e] mb-3">Review your details</p>
                <Row label="Name" value={form.name || '—'} />
                <Row label="Email" value={intake.email || '—'} />
                <Row label="Phone" value={intake.phone || '—'} />
                <Row label="Date of birth" value={form.dateOfBirth || '—'} />
                <Row label="Time of birth" value={form.timeOfBirth || '—'} />
                <Row label="Birth city" value={form.birthLocation?.name || '—'} />
                <Row label="Current city" value={form.currentLocation?.name || '—'} />
                <Row label="Moved to address" value={intake.addressMoveDate || '—'} />
                <Row label="Pattern since" value={intake.patternYear || '—'} />
                <Row
                  label="Prior support"
                  value={
                    intake.priorHelp.length > 0
                      ? intake.priorHelp.map((o) => PRIOR_HELP_LABELS[o]).join(', ')
                      : '—'
                  }
                />
                <Row
                  label="Solution preference"
                  value={
                    intake.preferredSolution
                      ? PREFERRED_SOLUTION_LABELS[intake.preferredSolution]
                      : '—'
                  }
                />
                <Row
                  label="Current situation"
                  value={
                    intake.currentSituation
                      ? CURRENT_SITUATION_LABELS[intake.currentSituation]
                      : '—'
                  }
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ebe0] py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Brand header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#2d2a3e] tracking-tight">Pheydrus Assessment</h1>
          <p className="text-[#6b6188] mt-1 text-sm">
            Personalized 3-Pillar Analysis &nbsp;·&nbsp; Quiz takes ~4 min
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <ProgressBar step={step} />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 font-semibold text-sm">{error}</p>
            </div>
          )}

          {renderStep()}

          <NavButtons
            step={step}
            onBack={handleBack}
            onNext={handleNext}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            canProceed={canProceed}
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Your information is private and never shared.
        </p>
      </div>
    </div>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#6b6188] shrink-0">{label}</span>
      <span className="text-[#2d2a3e] font-medium text-right">{value}</span>
    </div>
  );
}

export default ClientAssessmentPage;
