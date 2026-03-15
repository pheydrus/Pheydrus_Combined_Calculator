import { useState } from 'react';
import type {
  AngularDiagnosticResult,
  GradeItem,
  PillarSummary,
  FinalGrade,
} from '../../models/diagnostic';
import { ChevronDownIcon } from '../icons';

interface AngularDiagnosticResultsProps {
  result: AngularDiagnosticResult | undefined;
}

const GRADE_COLORS: Record<
  FinalGrade,
  { bg: string; text: string; border: string; label: string }
> = {
  A: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-400',
    label: 'Excellent',
  },
  B: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-400', label: 'Good' },
  C: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-400',
    label: 'Challenging',
  },
  F: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-400', label: 'Difficult' },
};

// Pillar colours: Structure=orange, Timing=blue, Environment=purple
const PILLAR_COLORS = ['#f97316', '#3b82f6', '#8b5cf6'] as const;

// ─── Pie chart ────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function pieArcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const span = endDeg - startDeg;
  if (span >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }
  const s = polarToCartesian(cx, cy, r, startDeg);
  const e = polarToCartesian(cx, cy, r, endDeg);
  const large = span > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

function FSourcePieChart({ pillars, score }: { pillars: readonly PillarSummary[]; score: number }) {
  const cx = 90,
    cy = 90,
    r = 72;

  if (score === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 180 180" className="w-32 h-32">
          <circle cx={cx} cy={cy} r={r} fill="#10b981" />
          <text x={cx} y={cy - 7} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
            All
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
            A&apos;s
          </text>
        </svg>
        <p className="text-xs text-emerald-700 font-semibold">Zero Pressure Points</p>
      </div>
    );
  }

  // Each pillar's weighted score: F=1pt, C=0.5pt
  const slices = pillars.reduce<
    Array<{ path: string; color: string; name: string; pillarScore: number; pct: number }>
  >((acc, p, i) => {
    const pillarScore = p.fCount + p.cCount * 0.5;
    if (pillarScore === 0) return acc;
    const startAngle = acc.reduce((sum, s) => sum + (s.pillarScore / score) * 360, 0);
    const sweep = (pillarScore / score) * 360;
    acc.push({
      path: pieArcPath(cx, cy, r, startAngle, startAngle + sweep),
      color: PILLAR_COLORS[i],
      name: p.name,
      pillarScore,
      pct: Math.round((pillarScore / score) * 100),
    });
    return acc;
  }, []);

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 180 180" className="w-32 h-32 shrink-0">
        {slices.map((s, i) =>
          s ? <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1.5" /> : null
        )}
      </svg>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#6b6188] uppercase tracking-wide mb-1">
          Unseen Force Factors
        </p>
        {slices.map((s, i) =>
          s ? (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-xs text-[#2d2a3e] font-medium">{s.name}</span>
              <span className="text-xs font-bold text-[#2d2a3e]">{s.pct}%</span>
              <span className="text-xs text-gray-400">
                ({s.pillarScore % 1 === 0 ? s.pillarScore : s.pillarScore.toFixed(1)} pts)
              </span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ─── House wheel ──────────────────────────────────────────────────────────────

const HOUSE_FILL: Record<'F' | 'C' | 'A' | 'Neutral', string> = {
  F: '#ef4444',
  C: '#f59e0b',
  A: '#10b981',
  Neutral: '#f3f4f6',
};

function computeHouseGrades(items: GradeItem[]): Record<number, 'F' | 'C' | 'A' | 'Neutral'> {
  const map: Record<number, Set<string>> = {};
  for (const item of items) {
    if (item.house === undefined) continue;
    if (!map[item.house]) map[item.house] = new Set();
    map[item.house].add(item.grade);
  }
  const result: Record<number, 'F' | 'C' | 'A' | 'Neutral'> = {};
  for (const [h, grades] of Object.entries(map)) {
    const n = Number(h);
    result[n] = grades.has('F') ? 'F' : grades.has('C') ? 'C' : grades.has('A') ? 'A' : 'Neutral';
  }
  return result;
}

function houseSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number
): string {
  const endDeg = startDeg - 30;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const s1 = {
    x: cx + outerR * Math.cos(toRad(startDeg)),
    y: cy + outerR * Math.sin(toRad(startDeg)),
  };
  const e1 = { x: cx + outerR * Math.cos(toRad(endDeg)), y: cy + outerR * Math.sin(toRad(endDeg)) };
  const e2 = { x: cx + innerR * Math.cos(toRad(endDeg)), y: cy + innerR * Math.sin(toRad(endDeg)) };
  const s2 = {
    x: cx + innerR * Math.cos(toRad(startDeg)),
    y: cy + innerR * Math.sin(toRad(startDeg)),
  };
  return `M ${s1.x.toFixed(1)} ${s1.y.toFixed(1)} A ${outerR} ${outerR} 0 0 0 ${e1.x.toFixed(1)} ${e1.y.toFixed(1)} L ${e2.x.toFixed(1)} ${e2.y.toFixed(1)} A ${innerR} ${innerR} 0 0 1 ${s2.x.toFixed(1)} ${s2.y.toFixed(1)} Z`;
}

function HouseWheel({ items, label }: { items: GradeItem[]; label?: string }) {
  const cx = 90,
    cy = 90;
  const outerR = 82,
    innerR = 48,
    labelR = 67;
  const houseGrades = computeHouseGrades(items);

  return (
    <div className="flex flex-col items-center shrink-0">
      {label && (
        <p className="text-xs font-semibold text-[#6b6188] uppercase tracking-wide mb-1">{label}</p>
      )}
      <svg viewBox="0 0 180 180" className="w-32 h-32">
        {Array.from({ length: 12 }, (_, i) => {
          const houseNum = i + 1;
          const startDeg = (180 - i * 30 + 360) % 360;
          const midDeg = startDeg - 15;
          const rad = (midDeg * Math.PI) / 180;
          const grade = houseGrades[houseNum] ?? 'Neutral';
          const lx = cx + labelR * Math.cos(rad);
          const ly = cy + labelR * Math.sin(rad);
          return (
            <g key={houseNum}>
              <path
                d={houseSegmentPath(cx, cy, outerR, innerR, startDeg)}
                fill={HOUSE_FILL[grade]}
                stroke="white"
                strokeWidth="1.5"
              />
              <text
                x={lx.toFixed(1)}
                y={ly.toFixed(1)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={grade === 'Neutral' ? '#9ca3af' : 'white'}
                fontSize="9"
                fontWeight="bold"
              >
                {houseNum}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={innerR - 2} fill="white" />
        <text x={cx - outerR + 6} y={cy - 4} textAnchor="middle" fill="#9ca3af" fontSize="7">
          AC
        </text>
        <text x={cx + outerR - 6} y={cy - 4} textAnchor="middle" fill="#9ca3af" fontSize="7">
          DC
        </text>
      </svg>
      <div className="flex gap-3 text-xs mt-0.5">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> F
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> C
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> A
        </span>
      </div>
    </div>
  );
}

// ─── Grade item helpers ───────────────────────────────────────────────────────

function getGradeItemStyle(grade: GradeItem['grade']): string {
  if (grade === 'F') return 'bg-red-50 border-l-4 border-red-400';
  if (grade === 'C') return 'bg-amber-50 border-l-4 border-amber-400';
  if (grade === 'A') return 'bg-emerald-50 border-l-4 border-emerald-400';
  return 'bg-gray-50 border-l-4 border-gray-300';
}

function getGradeBadge(grade: GradeItem['grade']): string {
  if (grade === 'F') return 'bg-red-100 text-red-700';
  if (grade === 'C') return 'bg-amber-100 text-amber-700';
  if (grade === 'A') return 'bg-emerald-100 text-emerald-700';
  return 'bg-gray-100 text-gray-500';
}

// ─── Pillar section ───────────────────────────────────────────────────────────

function PillarSection({ summary }: { summary: PillarSummary }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasFs = summary.fCount > 0;
  const hasCs = summary.cCount > 0;
  const hasAs = summary.aCount > 0;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white bg-[#2d2a3e] rounded-full w-7 h-7 flex items-center justify-center">
            {summary.pillar}
          </span>
          <div className="text-left">
            <h3 className="text-base font-semibold text-[#2d2a3e]">
              Pillar {summary.pillar}: {summary.name}
            </h3>
            <p className="text-xs text-[#6b6188]">{summary.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasFs && (
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">
              {summary.fCount} F{summary.fCount !== 1 ? "'s" : ''}
            </span>
          )}
          {hasCs && (
            <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded">
              {summary.cCount} C{summary.cCount !== 1 ? "'s" : ''}
            </span>
          )}
          {hasAs && (
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
              {summary.aCount} A{summary.aCount !== 1 ? "'s" : ''}
            </span>
          )}
          <ChevronDownIcon
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-5 py-4 bg-white">
          {summary.items.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No data available for this pillar</p>
          ) : (
            <div className="space-y-2">
              {summary.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-3 rounded px-3 py-2 ${getGradeItemStyle(item.grade)}`}
                >
                  <div className="text-sm text-[#2d2a3e]">
                    <span className="font-semibold">{item.source}</span>
                    <span className="block text-xs text-[#6b6188] mt-0.5">{item.reason}</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded shrink-0 ${getGradeBadge(item.grade)}`}
                  >
                    {item.grade === 'Neutral' ? '—' : item.grade}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AngularDiagnosticResults({ result }: AngularDiagnosticResultsProps) {
  if (!result) return null;

  const gradeStyle = GRADE_COLORS[result.finalGrade];

  return (
    <div className="mb-8">
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Header with final grade */}
        <div className={`px-6 py-5 ${gradeStyle.bg} border-b-2 ${gradeStyle.border}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#9a7d4e]">Angular Diagnostic</h2>
              <p className="text-sm text-[#6b6188] mt-1">
                The Three Pillars Model — Structure, Timing, Environment
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-[#6b6188]">Total F&apos;s</p>
                <p className="text-2xl font-bold text-red-600">{result.totalFs}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6b6188]">Total C&apos;s</p>
                <p className="text-2xl font-bold text-amber-500">{result.totalCs}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6b6188]">Total A&apos;s</p>
                <p className="text-2xl font-bold text-emerald-600">{result.totalAs}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6b6188]">Score</p>
                <p className="text-2xl font-bold text-[#6b6188]">
                  {result.score % 1 === 0 ? result.score : result.score.toFixed(1)}
                </p>
              </div>
              <div
                className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center border-2 ${gradeStyle.border} ${gradeStyle.bg}`}
              >
                <span className={`text-3xl font-black ${gradeStyle.text}`}>
                  {result.finalGrade}
                </span>
                <span className={`text-[10px] font-medium ${gradeStyle.text}`}>
                  {gradeStyle.label}
                </span>
              </div>
            </div>
          </div>

          {/* Pie chart + House wheels */}
          <div className="mt-4 pt-4 border-t border-black/10 flex flex-wrap gap-6 items-start">
            <FSourcePieChart pillars={result.pillars} score={result.score} />
            <div className="flex gap-5 flex-wrap">
              {result.pillars.map((pillar) => (
                <HouseWheel
                  key={pillar.pillar}
                  items={pillar.items}
                  label={`P${pillar.pillar}: ${pillar.name}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pillar sections */}
        <div className="p-6 bg-white space-y-4">
          {result.pillars.map((pillar) => (
            <PillarSection key={pillar.pillar} summary={pillar} />
          ))}
        </div>

        {/* Grade scale reference */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6b6188]">
            <span className="font-medium">Grade Scale:</span>
            <span>A = score &lt; 2</span>
            <span>B = score 2–3.5</span>
            <span>C = score 4–6</span>
            <span>F = score &gt; 6</span>
            <span className="text-gray-400">(F=1pt, C=0.5pt)</span>
            <span className="ml-auto italic">A&apos;s do not offset score</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AngularDiagnosticResults;
