/**
 * ClientResultsPage
 * Client-facing results page — mirrors the 3-page PDF report on-screen.
 * Includes speedometer grade reveal, donut chart, pattern timeline,
 * house wheel per pillar, and timeline per pillar.
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AngularDiagnosticResults } from '../../components/results/AngularDiagnosticResults';
import { exportClientReportToPDF } from '../../services/pdfExport';
import {
  renderSpeedometer,
  renderDonutChart,
  renderHouseWheel,
} from '../../services/pdfExport/clientReportTemplate';
import {
  detectGoalCategory,
  getItemInterpretation,
  getLongestMaleficTransit,
  formatDuration,
  getTransitEndYear,
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function pillarScore(p: PillarSummary): number {
  return p.fCount + p.cCount * 0.5;
}

const GOAL_LABEL: Record<GoalCategory, string> = {
  career: 'Career & Financial Growth',
  love: 'Love & Relationships',
  general: 'Your Goals',
};

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

// ── Inline SVG wrapper ────────────────────────────────────────────────────────

function SvgChart({ svg }: { svg: string }) {
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ── Pillar timeline ───────────────────────────────────────────────────────────

function getPillar2MaxEndYear(pillar2Items: GradeItem[], transits: PlanetaryTransit[]): number | null {
  let max: number | null = null;
  for (const item of pillar2Items) {
    if (!item.planet) continue;
    const y = getTransitEndYear(item.planet, transits);
    if (y !== null && (max === null || y > max)) max = y;
  }
  return max;
}

function getPillar3MaxEndYear(pillar3Items: GradeItem[], transits: PlanetaryTransit[]): number | null {
  let max: number | null = null;
  for (const item of pillar3Items) {
    if (!item.planet) continue;
    const y = getTransitEndYear(item.planet, transits);
    if (y !== null && (max === null || y > max)) max = y;
  }
  return max;
}

function PillarTimeline({
  pillarNum,
  pillar2Items,
  pillar3Items,
  transits,
  addressMoveDate,
}: {
  pillarNum: 1 | 2 | 3;
  pillar2Items: GradeItem[];
  pillar3Items: GradeItem[];
  transits: PlanetaryTransit[];
  addressMoveDate: string;
}) {
  const base = 'mt-3 pl-3 border-l-2 border-[#9a7d4e] text-xs text-gray-500 leading-relaxed';

  if (pillarNum === 1) {
    return (
      <p className={base}>
        <strong className="text-[#9a7d4e]">⏱ Timeline:</strong> Life-long — this is your permanent structural layer. It does not expire, but it can be consciously mastered.
      </p>
    );
  }

  const endYear = pillarNum === 2
    ? getPillar2MaxEndYear(pillar2Items, transits)
    : getPillar3MaxEndYear(pillar3Items, transits);

  if (pillarNum === 2) {
    return (
      <p className={base}>
        <strong className="text-[#9a7d4e]">⏱ Timeline:</strong>{' '}
        {endYear ? (
          <>Active <strong className="text-amber-600">{formatDuration(endYear)}</strong>. This window will lift — knowing when is half the advantage.</>
        ) : (
          'The active timing pressures are relatively short-cycle.'
        )}
      </p>
    );
  }

  // Pillar 3
  const addressNote = addressMoveDate
    ? ` Reflection question: did this pattern intensify around ${addressMoveDate} when you moved to your current address?`
    : '';

  return (
    <p className={base}>
      <strong className="text-[#9a7d4e]">⏱ Timeline:</strong>{' '}
      Amplifies your active transits for{' '}
      {endYear ? (
        <>approximately <strong className="text-amber-600">{formatDuration(endYear)}</strong>, mirroring your active transit window.</>
      ) : (
        'the duration of your active transit window.'
      )}
      {addressNote && <em> {addressNote}</em>}
    </p>
  );
}

// ── Interpretation bullet ─────────────────────────────────────────────────────

function InterpBullet({
  item,
  goal,
  transits,
}: {
  item: GradeItem;
  goal: GoalCategory;
  transits: PlanetaryTransit[];
}) {
  const text = getItemInterpretation(item, goal, transits);
  const borderCls = GRADE_BORDER[item.grade] ?? 'border-l-gray-300';
  const bgCls = GRADE_BG[item.grade] ?? 'bg-gray-50';
  const badgeCls = GRADE_BADGE[item.grade] ?? 'bg-gray-100 text-gray-600 border border-gray-200';
  const label = item.section === 'Address' ? '🏠 Address Energy' : item.source;

  return (
    <div className={`border-l-4 ${borderCls} ${bgCls} rounded-r-lg p-3`}>
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <span className="text-sm font-semibold text-[#2d2a3e]">{label}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeCls}`}>{item.grade}</span>
      </div>
      <p className="text-sm text-[#4a4560] leading-relaxed">{text}</p>
    </div>
  );
}

// ── Pillar deep-dive card ─────────────────────────────────────────────────────

const PILLAR_BADGE_CLS: Record<1 | 2 | 3, string> = {
  1: 'bg-red-100 text-red-800 border border-red-300',
  2: 'bg-amber-100 text-amber-800 border border-amber-300',
  3: 'bg-[#f0ebe0] text-[#78643a] border border-[#c4a96b]',
};

function PillarDeepDiveCard({
  pillar,
  index,
  title,
  subtitle,
  intro,
  goal,
  transits,
  pillar2Items,
  pillar3Items,
  addressMoveDate,
}: {
  pillar: PillarSummary;
  index: 1 | 2 | 3;
  title: string;
  subtitle: string;
  intro: string;
  goal: GoalCategory;
  transits: PlanetaryTransit[];
  pillar2Items: GradeItem[];
  pillar3Items: GradeItem[];
  addressMoveDate: string;
}) {
  const scoringItems = pillar.items.filter(
    (i) => i.grade === 'F' || i.grade === 'C' || i.grade === 'A',
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${PILLAR_BADGE_CLS[index]}`}>
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

      {/* Bullets left, house wheel right */}
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
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
        <div className="flex-shrink-0 text-center hidden sm:block">
          <SvgChart svg={renderHouseWheel(pillar.items)} />
          <p className="text-[10px] text-gray-400 mt-1">House Chart</p>
          <div className="flex items-center justify-center gap-1.5 mt-1 text-[9px] text-gray-400">
            <span className="inline-block w-2 h-2 bg-red-300 rounded-sm" /> F
            <span className="inline-block w-2 h-2 bg-amber-300 rounded-sm ml-1" /> C
            <span className="inline-block w-2 h-2 bg-emerald-300 rounded-sm ml-1" /> A
          </div>
        </div>
      </div>

      <PillarTimeline
        pillarNum={index}
        pillar2Items={pillar2Items}
        pillar3Items={pillar3Items}
        transits={transits}
        addressMoveDate={addressMoveDate}
      />
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
  const [p1, p2, p3] = results.diagnostic!.pillars;

  const s1 = pillarScore(p1), s2 = pillarScore(p2), s3 = pillarScore(p3);
  const total = s1 + s2 + s3;
  const p1pct = total === 0 ? 0 : Math.round((s1 / total) * 100);
  const p2pct = total === 0 ? 0 : Math.round((s2 / total) * 100);
  const p3pct = total === 0 ? 0 : Math.round((s3 / total) * 100);

  const longest = getLongestMaleficTransit(results.diagnostic!.allItems, transits);
  const prefLabel = intake.preferredSolution
    ? (PREFERRED_SOLUTION_LABELS[intake.preferredSolution] ?? intake.preferredSolution)
    : null;

  // ── Calendly CTA eligibility ────────────────────────────────────────────────
  const { finalGrade } = results.diagnostic!;
  const desiredOutcomeWordCount = intake.desiredOutcome.trim().split(/\s+/).filter(Boolean).length;
  const soughtTherapyOrCoaches =
    intake.priorHelp.includes('therapy') || intake.priorHelp.includes('coaches');
  const notMonetizing = intake.currentSituation !== 'monetizing';
  const scoredCOrWorse = finalGrade === 'C' || finalGrade === 'F';
  const showCalendlyCTA =
    desiredOutcomeWordCount > 1 && soughtTherapyOrCoaches && notMonetizing && scoredCOrWorse;

  // Active pillars (have at least one F or C)
  const activePillars: number[] = [];
  if (p1.fCount + p1.cCount > 0) activePillars.push(1);
  if (p2.fCount + p2.cCount > 0) activePillars.push(2);
  if (p3.fCount + p3.cCount > 0) activePillars.push(3);
  const pillarListText =
    activePillars.length === 0
      ? ''
      : activePillars.length === 1
        ? `Pillar ${activePillars[0]}`
        : activePillars.length === 2
          ? `Pillars ${activePillars[0]} and ${activePillars[1]}`
          : `Pillars 1, 2, and 3`;

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
        <div className="text-center">
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
            {intake.obstacle && <IntakRow label="Main obstacle" value={intake.obstacle} />}
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

        {/* Big Reveal: grade + speedometer + intro */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start justify-between mb-5">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#2d2a3e] mb-1">■ The Big Reveal</h2>
              <div className="text-xs text-[#9a7d4e] font-semibold uppercase tracking-wide mb-3">
                Goal focus ({GOAL_LABEL[goal]})
              </div>
              <p className="text-sm text-[#4a4560] leading-relaxed mb-2">
                Here is the breakdown of what is driving the pattern connected to your obstacle of{' '}
                <em>"{intake.obstacle.slice(0, 80)}{intake.obstacle.length > 80 ? '…' : ''}"</em>
              </p>
              <p className="text-sm text-gray-400 italic leading-relaxed">
                Based on thousands of sessions, analysis, and data compiled on Pheydrus students,
                we have discovered life-pattern predictors and how to potentially mitigate them
                with up to 95% accuracy. Please see your analysis below.
              </p>
            </div>
            <div className="flex-shrink-0 text-center">
              <p className="text-[10px] text-[#6b6188] uppercase tracking-widest mb-1">Overall Grade</p>
              <SvgChart svg={renderSpeedometer(results.diagnostic!.finalGrade, results.diagnostic!.score)} />
            </div>
          </div>
        </div>

        {/* Pattern timeline */}
        {longest && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-red-800 mb-1.5">⏰ Pattern Timeline</h3>
            <p className="text-sm text-red-700 leading-relaxed">
              Your active planetary data points to this pattern persisting{' '}
              <strong>{formatDuration(longest.endYear)}</strong> if the current approach
              continues. The primary driver is <strong>{longest.planet}</strong> transiting
              House {longest.house} — a slow-moving outer planet that defines the window you are
              working within.
            </p>
          </div>
        )}

        {/* Donut chart + pillar definitions */}
        {total > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#2d2a3e] mb-4">Pattern Breakdown by Pillar</h2>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Chart */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <SvgChart svg={renderDonutChart(p1pct, p2pct, p3pct)} />
                <div className="flex flex-col gap-1 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-sm" /> Pillar 1 — {p1pct}%</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 bg-amber-400 rounded-sm" /> Pillar 2 — {p2pct}%</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 bg-[#9a7d4e] rounded-sm" /> Pillar 3 — {p3pct}%</span>
                </div>
              </div>

              {/* Definitions */}
              <div className="flex-1 space-y-3">
                {[
                  {
                    num: 1, pct: p1pct, color: 'border-l-red-500', badge: 'bg-red-100 text-red-800',
                    title: 'Structure',
                    text: "Your birth chart's permanent energetic architecture. This layer does not expire — malefic placements here are lifelong structural pressures that can be mastered but not removed.",
                    pathText: 'A combination of 1:1 calls and self-study are well-suited for deconditioning patterns in this pillar.',
                  },
                  {
                    num: 2, pct: p2pct, color: 'border-l-amber-400', badge: 'bg-amber-100 text-amber-800',
                    title: 'Timing',
                    text: 'Slow-moving outer planets currently transiting specific areas of your chart. This layer is temporary but powerful while active — knowing when it lifts gives you an honest timeline.',
                    pathText: 'A combination of 1:1 calls and self-study are well-suited for deconditioning patterns in this pillar.',
                  },
                  {
                    num: 3, pct: p3pct, color: 'border-l-[#9a7d4e]', badge: 'bg-[#f0ebe0] text-[#78643a]',
                    title: 'Environment',
                    text: 'This is Pheydrus\' "secret sauce" — your current location and home address carry an energetic signature that can neutralize or offset the negative effects of both Pillar 1 and Pillar 2 when properly aligned. Of the three layers, Pillar 3 is the most immediately actionable.',
                    pathText: 'A combination of Done-For-You, 1:1 calls, and self-study are suited for reorganizing internal energies and curing external energies.',
                  },
                ].map((d) => (
                  <div key={d.num} className={`border-l-4 ${d.color} bg-gray-50 rounded-r-lg p-3`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${d.badge}`}>
                          P{d.num}
                        </span>
                        <span className="text-sm font-bold text-[#2d2a3e]">{d.title}</span>
                      </div>
                      <span className="text-lg font-black text-gray-700">{d.pct}%</span>
                    </div>
                    <p className="text-xs text-[#4a4560] leading-relaxed mb-1.5">{d.text}</p>
                    {prefLabel && (
                      <p className="text-xs text-[#9a7d4e] italic">
                        Recommended path: {d.pathText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Raw diagnostic report */}
        <AngularDiagnosticResults result={results.diagnostic!} />

        {/* Pillar deep-dive interpretations */}
        <div>
          <h2 className="text-xl font-bold text-[#2d2a3e] mb-1">
            What's Holding Back Your {GOAL_LABEL[goal]}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            A pillar-by-pillar breakdown mapped directly to your stated outcome.
          </p>
          <div className="space-y-4">
            {([
              { pillar: p1, index: 1 as const, title: 'Structure', subtitle: 'Your Energetic Blueprint' },
              { pillar: p2, index: 2 as const, title: 'Timing', subtitle: 'The Window You Are In' },
              { pillar: p3, index: 3 as const, title: 'Environment', subtitle: 'Location & Address' },
            ] as const).map(({ pillar, index, title, subtitle }) => (
              <PillarDeepDiveCard
                key={index}
                pillar={pillar}
                index={index}
                title={title}
                subtitle={subtitle}
                intro={pillarIntros[index]}
                goal={goal}
                transits={transits}
                pillar2Items={p2.items}
                pillar3Items={p3.items}
                addressMoveDate={intake.addressMoveDate}
              />
            ))}
          </div>
        </div>

        {/* Recommendation: Calendly CTA */}
        {showCalendlyCTA && (
          <div className="bg-gradient-to-br from-[#2d2a3e] to-[#1a1828] rounded-2xl shadow-lg p-7 text-white">
            <p className="text-lg font-extrabold uppercase tracking-widest text-[#c4a96b] mb-3">
              Your Recommended Next Step
            </p>
            <h2 className="text-xl font-bold mb-3 leading-snug">
              Your{' '}
              <span className="text-[#c4a96b]">{finalGrade}-grade</span> result
              {activePillars.length > 0 && (
                <> with active pressure in <span className="text-[#c4a96b]">{pillarListText}</span></>
              )}{' '}
              has a clear, documented path through it.
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">
              The Pheydrus team has worked with hundreds of students carrying the exact pattern
              configurations showing in your report. For clients with active pressure across{' '}
              {pillarListText || 'multiple pillars'}, we implement targeted methods that directly
              address each layer — structural, timing, and environmental — through a precision
              process built around your exact chart, transits, and location.
            </p>
            <p className="text-sm text-gray-300 leading-relaxed mb-6">
              This isn't generic coaching. Students who have gone through this process with us
              have moved out of these exact patterns in{' '}
              <strong className="text-white">under 90 days</strong> — not by working harder, but
              by working on the right layer, in the right order, at the right time. Your report
              tells us exactly where to start.
            </p>
            <a
              href="https://calendly.com/pheydrus_strategy/1-1-alignment-strategy-call-clone-1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-7 py-3.5 bg-[#c4a96b] hover:bg-[#d4b97b] text-white font-bold rounded-xl transition-colors text-sm"
            >
              Book Your 1:1 Alignment &amp; Strategy Call →
            </a>
            <p className="text-xs text-gray-500 mt-3">
              Complimentary call · No obligation · Limited spots available
            </p>
          </div>
        )}

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
