/**
 * ClientResultsPage
 * Client-facing results page — shows the Angular Diagnostic report card,
 * goal-aware pillar deep-dive interpretations, and PDF download.
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AngularDiagnosticResults } from '../../components/results/AngularDiagnosticResults';
import { exportClientReportToPDF } from '../../services/pdfExport';
import {
  detectGoalCategory,
  getItemInterpretation,
  getLongestMaleficTransit,
  formatDuration,
  type GoalCategory,
} from '../../services/pdfExport/clientInterpretations';
import type { GradeItem, PillarSummary } from '../../models/diagnostic';
import type { PlanetaryTransit } from '../../models/calculators';
import type { ConsolidatedResults } from '../../models';
import type { ClientIntakeData } from '../../models/clientIntake';
import {
  PREFERRED_SOLUTION_LABELS,
  CURRENT_SITUATION_LABELS,
  PRIOR_HELP_LABELS,
} from '../../models/clientIntake';

// ── Bullet colour helpers ─────────────────────────────────────────────────────

const GRADE_BORDER: Record<string, string> = {
  F: 'border-l-red-500',
  C: 'border-l-amber-500',
  A: 'border-l-emerald-500',
};
const GRADE_BG: Record<string, string> = {
  F: 'bg-red-50',
  C: 'bg-amber-50',
  A: 'bg-emerald-50',
};
const GRADE_BADGE: Record<string, string> = {
  F: 'bg-red-100 text-red-800 border border-red-300',
  C: 'bg-amber-100 text-amber-800 border border-amber-300',
  A: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
};
const GOAL_LABEL: Record<GoalCategory, string> = {
  career: 'Career & Financial Growth',
  love: 'Love & Relationships',
  general: 'Your Goals',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function InterpBullet({ item, goal, transits }: { item: GradeItem; goal: GoalCategory; transits: PlanetaryTransit[] }) {
  const text = getItemInterpretation(item, goal, transits);
  const borderCls = GRADE_BORDER[item.grade] ?? 'border-l-gray-300';
  const bgCls = GRADE_BG[item.grade] ?? 'bg-gray-50';
  const badgeCls = GRADE_BADGE[item.grade] ?? 'bg-gray-100 text-gray-600 border border-gray-200';
  const label = item.section === 'Address' ? '🏠 Address Energy' : item.source;

  return (
    <div className={`border-l-4 ${borderCls} ${bgCls} rounded-r-lg p-4`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-[#2d2a3e]">{label}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeCls}`}>{item.grade}</span>
      </div>
      <p className="text-sm text-[#4a4560] leading-relaxed">{text}</p>
    </div>
  );
}

function PillarDeepDiveCard({
  pillar,
  index,
  title,
  subtitle,
  intro,
  goal,
  transits,
}: {
  pillar: PillarSummary;
  index: 1 | 2 | 3;
  title: string;
  subtitle: string;
  intro: string;
  goal: GoalCategory;
  transits: PlanetaryTransit[];
}) {
  const scoringItems = pillar.items.filter(
    (i) => i.grade === 'F' || i.grade === 'C' || i.grade === 'A',
  );

  const PILLAR_BADGE: Record<1 | 2 | 3, string> = {
    1: 'bg-red-100 text-red-800 border border-red-300',
    2: 'bg-amber-100 text-amber-800 border border-amber-300',
    3: 'bg-[#f0ebe0] text-[#78643a] border border-[#c4a96b]',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${PILLAR_BADGE[index]}`}>
          PILLAR {index}
        </span>
        <span className="text-base font-bold text-[#2d2a3e]">{title}</span>
        <span className="text-xs text-gray-400">— {subtitle}</span>
        {pillar.fCount > 0 && (
          <span className="text-xs font-semibold text-red-600 ml-1">
            {pillar.fCount} F{pillar.fCount !== 1 ? "'s" : ''}
          </span>
        )}
        {pillar.cCount > 0 && (
          <span className="text-xs font-semibold text-amber-600 ml-1">
            {pillar.cCount} C{pillar.cCount !== 1 ? "'s" : ''}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 italic leading-relaxed mb-4">{intro}</p>

      {scoringItems.length === 0 ? (
        <p className="text-sm text-emerald-600 italic">
          No significant pressure identified in this pillar — this dimension is working in your favor.
        </p>
      ) : (
        <div className="space-y-3">
          {scoringItems.map((item, i) => (
            <InterpBullet key={i} item={item} goal={goal} transits={transits} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ClientResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as
    | { results: ConsolidatedResults; intake: ClientIntakeData }
    | null;

  if (!state?.results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ebe0] py-12 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-[#2d2a3e] mb-3">No results found</h2>
          <p className="text-[#6b6188] mb-6">Please complete the assessment first.</p>
          <button
            onClick={() => navigate('/client')}
            className="px-6 py-3 bg-[#9a7d4e] hover:bg-[#b8944a] text-white font-bold rounded-xl transition-colors"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  const { results, intake } = state;
  const [isExporting, setIsExporting] = useState(false);

  const goal = detectGoalCategory(intake.desiredOutcome);
  const transits = results.calculators.transits?.transits ?? [];
  const [p1, p2, p3] = results.diagnostic.pillars;

  const longest = getLongestMaleficTransit(results.diagnostic.allItems, transits);

  const pillarIntros: Record<1 | 2 | 3, string> = {
    1: `These are the energetic signatures encoded in your birth chart — the structural blueprint you came in with. They don't expire, but they can be mastered. What follows are the specific placements creating the most friction for your goal of ${GOAL_LABEL[goal].toLowerCase()}.`,
    2: `These are the slow-moving planetary forces currently transiting your chart — the timing window you are in right now. Each one includes how long it runs, giving you an honest timeline rather than an open-ended question mark.`,
    3: `Your current location and home address are either amplifying or dampening every other pressure in your chart. What follows is how your environmental energy is specifically interacting with your goal.`,
  };

  async function handleExportPDF() {
    setIsExporting(true);
    try {
      await exportClientReportToPDF(results, intake);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ebe0] py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Brand header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-[#2d2a3e]">Your Pheydrus Report</h1>
          <p className="text-[#6b6188] text-sm mt-1">
            Personalized 3-Pillar Analysis for {results.userInfo.name}
          </p>
        </div>

        {/* Intake summary card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#9a7d4e] mb-4">Your Assessment Summary</h2>
          <div className="space-y-3 text-sm">
            {intake.desiredOutcome && (
              <IntakRow label="Desired outcome (90 days)" value={intake.desiredOutcome} />
            )}
            {intake.obstacle && (
              <IntakRow label="Main obstacle" value={intake.obstacle} />
            )}
            {intake.patternYear && (
              <IntakRow label="Pattern noticed since" value={intake.patternYear} />
            )}
            {intake.priorHelp.length > 0 && (
              <IntakRow
                label="Prior support sought"
                value={intake.priorHelp.map((o) => PRIOR_HELP_LABELS[o]).join(', ')}
              />
            )}
            {intake.preferredSolution && (
              <IntakRow
                label="Preferred solution"
                value={PREFERRED_SOLUTION_LABELS[intake.preferredSolution]}
              />
            )}
            {intake.currentSituation && (
              <IntakRow
                label="Current situation"
                value={CURRENT_SITUATION_LABELS[intake.currentSituation]}
              />
            )}
            {intake.addressMoveDate && (
              <IntakRow label="Moved to address" value={intake.addressMoveDate} />
            )}
            {intake.additionalNotes && (
              <IntakRow label="Additional notes" value={intake.additionalNotes} />
            )}
          </div>
        </div>

        {/* 3-Pillar diagnostic report */}
        <AngularDiagnosticResults result={results.diagnostic} />

        {/* Pattern timeline */}
        {longest && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-red-800 mb-2">⏰ Pattern Timeline</h3>
            <p className="text-sm text-red-700 leading-relaxed mb-2">
              Based on your active malefic transits, if you continue navigating this the same way,
              the current pattern is positioned to persist{' '}
              <strong>{formatDuration(longest.endYear)}</strong>.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              The longest-running active pressure comes from{' '}
              <strong>{longest.planet}</strong> transiting your House {longest.house} — a
              slow-moving outer planet that does not back down quickly. This is not a forecast of
              doom; it is a map.
            </p>
          </div>
        )}

        {/* Pillar deep-dive interpretations */}
        <div>
          <h2 className="text-xl font-bold text-[#2d2a3e] mb-1">
            What's Holding Back Your {GOAL_LABEL[goal]}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            A pillar-by-pillar breakdown mapped directly to your stated outcome.
          </p>
          <div className="space-y-4">
            <PillarDeepDiveCard
              pillar={p1}
              index={1}
              title="Structure"
              subtitle="Your Energetic Blueprint"
              intro={pillarIntros[1]}
              goal={goal}
              transits={transits}
            />
            <PillarDeepDiveCard
              pillar={p2}
              index={2}
              title="Timing"
              subtitle="The Window You Are In"
              intro={pillarIntros[2]}
              goal={goal}
              transits={transits}
            />
            <PillarDeepDiveCard
              pillar={p3}
              index={3}
              title="Environment"
              subtitle="Location & Address"
              intro={pillarIntros[3]}
              goal={goal}
              transits={transits}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-6 py-3 bg-[#9a7d4e] hover:bg-[#b8944a] disabled:opacity-60 text-white font-bold rounded-xl transition-colors"
          >
            {isExporting ? 'Generating PDF…' : 'Download Your Report (PDF)'}
          </button>
          <button
            onClick={() => navigate('/client')}
            className="px-6 py-3 border border-gray-200 text-[#6b6188] font-semibold rounded-xl hover:border-[#9a7d4e] hover:text-[#9a7d4e] transition-colors"
          >
            Start New Assessment
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Report generated {new Date(results.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function IntakRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
      <p className="text-[#6b6188] font-medium mb-0.5">{label}</p>
      <p className="text-[#2d2a3e]">{value}</p>
    </div>
  );
}

export default ClientResultsPage;
