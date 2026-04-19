/**
 * ClientResultsPage — Light Edition
 * White background with dark text, golden accents.
 */

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { exportClientReportToPDF } from '../../services/pdfExport';
import { renderHouseWheel } from '../../services/pdfExport/clientReportTemplate';
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

// ── Design tokens ─────────────────────────────────────────────────────────────

const CORMORANT = "'Cormorant Garamond', Georgia, serif";
const INTER = "'Inter', Arial, sans-serif";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pillarScore(p: PillarSummary): number {
  return p.fCount + p.cCount * 0.5;
}

function getPillarLetterGrade(pillar: PillarSummary): string {
  const grades = pillar.items.map((item) => item.grade);
  if (grades.includes('F') || pillar.fCount > 0) return 'F';
  if (grades.includes('C') || pillar.cCount > 0) return 'C';
  return 'A';
}

function isCOrBelow(grade: string): boolean {
  return grade === 'C' || grade === 'F';
}

type ProgramRoute = 'hero' | 'artists-way' | 'business';

type ProgramRecommendation = {
  route: ProgramRoute;
  title: string;
  description: string;
  link: string;
};

const PROGRAM_DETAILS: Record<ProgramRoute, ProgramRecommendation> = {
  hero: {
    route: 'hero',
    title: `Hero's Journey`,
    description:
      "Have you spent years being told you're too much, too difficult, too intense — no matter how much you work on yourself? That's not a personality flaw. That's a Pillar 1 pattern running unchecked. We use a proprietary sequential deconditioning method to decode your exact angular house placements — and turn what's been misread as your weakness into your most powerful asset.",
    link: 'https://pheydrusmetaverse.com/heros-journey/',
  },
  'artists-way': {
    route: 'artists-way',
    title: `Artist's Way`,
    description:
      "Have you done all the inner work and still can't figure out why your outside life won't catch up? Your environment and timing are probably working against everything you've built inside. Through our Feng Shui × Astrocartography method and transit mapping — even if you can't move — we realign your external reality to match who you've already become.",
    link: 'https://pheydrusmetaverse.com/artists-way/#',
  },
  business: {
    route: 'business',
    title: 'Business Growth',
    description:
      "Suddenly feeling the urge to launch, pivot, or make money in a completely new way? That's not restlessness — that's your business houses activated. All 3 pillars are telling you it's time. The question is whether you know how to move with that window — or let it pass.",
    link: 'https://pheydrusmetaverse.com/business-growth/',
  },
};

function getTwoProgramRecommendations(
  p1: PillarSummary,
  p2: PillarSummary,
  p3: PillarSummary,
  allItems: GradeItem[]
): ProgramRecommendation[] {
  const s1 = pillarScore(p1);
  const s2 = pillarScore(p2);
  const s3 = pillarScore(p3);
  const p2Grade = getPillarLetterGrade(p2);
  const p3Grade = getPillarLetterGrade(p3);

  const businessHouses = [2, 6, 8, 10];
  const hasBusinessHouseActivation = allItems.some((item) =>
    businessHouses.includes(item.house ?? 0)
  );
  const isP1Worst = s1 >= s2 && s1 >= s3;
  const isP3Worst = s3 >= s1 && s3 >= s2;
  const primaryRoute: ProgramRoute = isP1Worst
    ? 'hero'
    : isP3Worst
      ? 'artists-way'
      : hasBusinessHouseActivation
        ? 'business'
        : s1 >= s3
          ? 'hero'
          : 'artists-way';

  let secondaryRoute: ProgramRoute;

  if (primaryRoute === 'business') {
    secondaryRoute = isCOrBelow(p2Grade) || isCOrBelow(p3Grade) ? 'artists-way' : 'hero';
  } else if (primaryRoute === 'artists-way') {
    secondaryRoute = hasBusinessHouseActivation ? 'business' : 'hero';
  } else {
    secondaryRoute = hasBusinessHouseActivation ? 'business' : 'artists-way';
  }

  return [PROGRAM_DETAILS[primaryRoute], PROGRAM_DETAILS[secondaryRoute]];
}

const GOAL_LABEL: Record<GoalCategory, string> = {
  career: 'Career & Financial Growth',
  love: 'Love & Relationships',
  general: 'Your Goals',
};

const GOAL_SHORT: Record<GoalCategory, string> = {
  career: 'career & financial growth',
  love: 'love & relationships',
  general: 'your goals',
};

const GRADE_COLOR: Record<string, { border: string; bg: string; text: string }> = {
  A: { border: '#2ecc71', bg: '#F0FFF4', text: '#16a34a' },
  B: { border: '#3b82f6', bg: '#EFF6FF', text: '#1d4ed8' },
  C: { border: '#C9A84C', bg: '#FFFBEB', text: '#92680A' },
  F: { border: '#C0392B', bg: '#FFF5F5', text: '#C0392B' },
};

function gradeColor(g: string) {
  return GRADE_COLOR[g] ?? GRADE_COLOR['F'];
}

/** Mirror line for known planet+house combos */
function getMirrorLine(item: GradeItem, goalShort: string): string | null {
  const prefix = item.section === 'Address' ? 'Env' : '';
  const key = `${prefix}${item.planet ?? ''}-${item.house ?? 0}`;
  const lines: Record<string, string> = {
    'Sun-7': `Your most powerful connections — romantic or professional — tend to find you. But converting that natural draw into lasting partnership for ${goalShort} feels like a different skill entirely.`,
    'Saturn-5': `Does this sound familiar? You build the offer, get excited, draft the content — and then pull back right before you publish. Every time. The same wall appears in romance: you open up just enough, then go quiet — not from lack of feeling, but from fear of being truly seen.`,
    'Uranus-5': `You've probably started building toward ${goalShort} more than once — with real momentum — and then watched yourself abandon it before it could pay off. In relationships, the same cycle: intense connection, then withdrawal before real intimacy takes hold.`,
    'Neptune-5': `You can see the ${goalShort} version of your life clearly — and the relationship you want. The gap is in bridging vision to reality: both in business and in love, the fog lifts only when you commit to what's already in front of you.`,
    'Pluto-6': `Are you stuck in performative busyness — doing work that feels productive but isn't actually moving the needle toward ${goalShort}?`,
    'Neptune-8': `Have you felt confused about your pricing or what you're actually worth charging — making ${goalShort} feel like a moving target?`,
    'Uranus-10': `Does your professional path feel chaotic — like you can't commit to one lane long enough to build real momentum toward ${goalShort}?`,
    'Saturn-8': `Has accessing the financial partnerships or investment needed to scale toward ${goalShort} felt blocked or fear-inducing?`,
    'EnvSaturn-2': `Since living at your current address, has there been an invisible ceiling on how much you allow yourself to charge or earn?`,
    'EnvUranus-2': `Does your income feel erratic — breakthrough months followed by drought — while ${goalShort} stays just out of reach?`,
    'EnvNeptune-2': `Are you chronically undercharging for your work — or genuinely unclear about what to charge?`,
  };
  return lines[key] ?? null;
}

/** Higher octave / transmute line */
function getTransmuteLine(item: GradeItem): string | null {
  const prefix = item.section === 'Address' ? 'Env' : '';
  const key = `${prefix}${item.planet ?? ''}-${item.house ?? 0}`;
  const lines: Record<string, string> = {
    'Sun-7': `Your highest alignment comes through partnership — in love and in business. The right relationship is not a distraction from your goal. It is the path to it.`,
    'Saturn-5': `Once activated, you become the most disciplined, unshakeable builder in your market — and the partner who loves with rare, earned depth. Saturn in H5 blocks both at the same threshold; breaking one breaks both.`,
    'Uranus-5': `The most innovative, category-defining offer in any market — and the most electric, committed romantic connection, once the fear of staying is transmuted into the courage to remain.`,
    'Neptune-5': `Once grounded, your visionary capacity becomes your greatest differentiator in business — and in love, your depth of feeling becomes a rare gift rather than a source of confusion.`,
    'Pluto-6': `Pluto in the 6th, activated, builds the most sustainable work machine — systems that compound instead of drain.`,
    'Neptune-8': `Pricing rooted in genuine purpose becomes your most magnetic quality.`,
    'Uranus-10': `You're not meant to build a predictable business. You're meant to build one nobody's seen before. That's what's coming next.`,
    'Saturn-8': `Once fear is transmuted, Saturn in the 8th gives you the most durable financial architecture of anyone in your field.`,
    'EnvSaturn-2': `Environmental realignment removes the invisible ceiling — and what was once a block becomes a foundation of genuine financial stability.`,
    'EnvUranus-2': `Environmental shift converts erratic income into breakthrough cycles — shorter troughs, higher peaks.`,
    'EnvNeptune-2': `Once aligned, your address supports clarity around value — and undercharging becomes a thing of the past.`,
  };
  return lines[key] ?? null;
}

// ── SVG wrapper ───────────────────────────────────────────────────────────────

function SvgChart({ svg }: { svg: string }) {
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

// ── Venn diagram ──────────────────────────────────────────────────────────────

function VennDiagram() {
  return (
    <svg width="200" height="188" viewBox="0 0 200 188" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="100"
        cy="68"
        r="58"
        fill="#C9A84C"
        fillOpacity="0.09"
        stroke="#C9A84C"
        strokeWidth="1.5"
      />
      <circle
        cx="67"
        cy="127"
        r="58"
        fill="#7B5EA7"
        fillOpacity="0.09"
        stroke="#9B8EC4"
        strokeWidth="1.5"
      />
      <circle
        cx="133"
        cy="127"
        r="58"
        fill="#2E8B7A"
        fillOpacity="0.09"
        stroke="#5BB5A5"
        strokeWidth="1.5"
      />
      <text
        x="100"
        y="14"
        textAnchor="middle"
        fontSize="13"
        fill="#C9A84C"
        fontFamily="'Cormorant Garamond',Georgia,serif"
        fontWeight="600"
      >
        Soul / Karma
      </text>
      <text
        x="100"
        y="26"
        textAnchor="middle"
        fontSize="9"
        fill="#888"
        fontFamily="Arial,sans-serif"
      >
        Pillar 1
      </text>
      <text
        x="18"
        y="178"
        textAnchor="middle"
        fontSize="12"
        fill="#9B8EC4"
        fontFamily="'Cormorant Garamond',Georgia,serif"
        fontWeight="600"
      >
        Timing
      </text>
      <text
        x="18"
        y="188"
        textAnchor="middle"
        fontSize="9"
        fill="#888"
        fontFamily="Arial,sans-serif"
      >
        Pillar 2
      </text>
      <text
        x="182"
        y="178"
        textAnchor="middle"
        fontSize="12"
        fill="#5BB5A5"
        fontFamily="'Cormorant Garamond',Georgia,serif"
        fontWeight="600"
      >
        Environment
      </text>
      <text
        x="182"
        y="188"
        textAnchor="middle"
        fontSize="9"
        fill="#888"
        fontFamily="Arial,sans-serif"
      >
        Pillar 3
      </text>
      <text
        x="100"
        y="110"
        textAnchor="middle"
        fontSize="11"
        fill="#1C1A2E"
        fontFamily="'Cormorant Garamond',Georgia,serif"
        fontStyle="italic"
      >
        Full
      </text>
      <text
        x="100"
        y="123"
        textAnchor="middle"
        fontSize="11"
        fill="#1C1A2E"
        fontFamily="'Cormorant Garamond',Georgia,serif"
        fontStyle="italic"
      >
        Alignment
      </text>
    </svg>
  );
}

// ── Testimonial card ──────────────────────────────────────────────────────────

function TestimonialCard({ quote, attribution }: { quote: string; attribution: string }) {
  return (
    // REPLACE WITH REAL TESTIMONIAL
    <div
      style={{
        background: '#FFFFFF',
        borderLeft: '3px solid #C9A84C',
        borderRadius: '4px',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #E8E8E8',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-16px',
          left: '10px',
          fontSize: '90px',
          color: '#C9A84C',
          opacity: 0.12,
          fontFamily: CORMORANT,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        "
      </span>
      <p
        style={{
          fontFamily: CORMORANT,
          fontStyle: 'italic',
          color: '#7A5A1A',
          fontSize: '1.05rem',
          lineHeight: 1.65,
          margin: '0 0 10px',
          position: 'relative',
        }}
      >
        {quote}
      </p>
      <p style={{ fontFamily: INTER, color: '#888888', fontSize: '0.8rem', margin: 0 }}>
        — {attribution}
      </p>
    </div>
  );
}

// ── Pillar timeline ───────────────────────────────────────────────────────────

function getPillar2MaxEndYear(
  pillar2Items: GradeItem[],
  transits: PlanetaryTransit[]
): number | null {
  let max: number | null = null;
  for (const item of pillar2Items) {
    if (!item.planet) continue;
    const y = getTransitEndYear(item.planet, transits);
    if (y !== null && (max === null || y > max)) max = y;
  }
  return max;
}

function getPillar3MaxEndYear(
  pillar3Items: GradeItem[],
  transits: PlanetaryTransit[]
): number | null {
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
  const base: CSSProperties = {
    marginTop: '12px',
    paddingLeft: '12px',
    borderLeft: '2px solid #C9A84C',
    fontSize: '0.75rem',
    color: '#666',
    lineHeight: 1.6,
    fontFamily: INTER,
  };

  if (pillarNum === 1) {
    return (
      <p style={base}>
        <strong style={{ color: '#C9A84C' }}>⏱ Timeline:</strong> Life-long — this is your permanent
        structural layer. It does not expire, but it can be consciously mastered.
      </p>
    );
  }

  const endYear =
    pillarNum === 2
      ? getPillar2MaxEndYear(pillar2Items, transits)
      : getPillar3MaxEndYear(pillar3Items, transits);

  if (pillarNum === 2) {
    return (
      <p style={base}>
        <strong style={{ color: '#C9A84C' }}>⏱ Timeline:</strong>{' '}
        {endYear ? (
          <>
            Active <strong style={{ color: '#7A5A1A' }}>{formatDuration(endYear)}</strong>. This
            window will lift — knowing when is half the advantage.
          </>
        ) : (
          'The active timing pressures are relatively short-cycle.'
        )}
      </p>
    );
  }

  const addressNote = addressMoveDate
    ? ` Did this pattern intensify around ${addressMoveDate} when you moved?`
    : '';
  return (
    <p style={base}>
      <strong style={{ color: '#C9A84C' }}>⏱ Timeline:</strong> Amplifies your active transits for{' '}
      {endYear ? (
        <>
          approximately <strong style={{ color: '#7A5A1A' }}>{formatDuration(endYear)}</strong>,
          mirroring your active transit window.
        </>
      ) : (
        'the duration of your active transit window.'
      )}
      {addressNote && <em> {addressNote}</em>}
    </p>
  );
}

// ── Aspect card ───────────────────────────────────────────────────────────────

function AspectCard({
  item,
  goal,
  goalShort,
  goalText,
  transits,
}: {
  item: GradeItem;
  goal: GoalCategory;
  goalShort: string;
  goalText: string;
  transits: PlanetaryTransit[];
}) {
  const gc = gradeColor(item.grade);
  const interp = getItemInterpretation(item, goal, transits, goalText);
  const mirror = getMirrorLine(item, goalShort);
  const transmute = getTransmuteLine(item);
  const label = item.section === 'Address' ? '🏠 Address Energy' : item.source;
  const endYear =
    item.section === 'Transit Angular' || item.section === 'Life Cycle'
      ? getTransitEndYear(item.planet ?? '', transits)
      : null;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderLeft: `3px solid ${gc.border}`,
        borderRadius: '4px',
        padding: '14px 16px',
        marginBottom: '10px',
        border: `1px solid #E8E8E8`,
      }}
    >
      {mirror && (
        <p
          style={{
            fontFamily: CORMORANT,
            fontStyle: 'italic',
            color: '#1C1A2E',
            fontSize: '0.9rem',
            margin: '0 0 8px',
            lineHeight: 1.55,
          }}
        >
          "{mirror}"
        </p>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
          flexWrap: 'wrap' as const,
        }}
      >
        <span style={{ fontFamily: INTER, fontSize: '0.8rem', fontWeight: 700, color: '#1C1A2E' }}>
          {label}
        </span>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '2px',
            fontSize: '10px',
            fontWeight: 700,
            background: gc.bg,
            color: gc.text,
            border: `1px solid ${gc.border}`,
            fontFamily: INTER,
          }}
        >
          {item.grade}
          {endYear ? ` · thru ${endYear}` : ''}
        </span>
      </div>
      <p
        style={{
          fontFamily: INTER,
          fontSize: '0.72rem',
          color: '#666',
          lineHeight: 1.7,
          margin: transmute ? '0 0 8px' : '0',
        }}
      >
        {interp}
      </p>
      {transmute && (
        <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '7px' }}>
          <p
            style={{
              fontFamily: INTER,
              fontSize: '0.72rem',
              fontStyle: 'italic',
              color: '#C9A84C',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            <strong>Higher octave:</strong> {transmute}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Pillar deep-dive card ─────────────────────────────────────────────────────

const PILLAR_BADGE_STYLE: Record<1 | 2 | 3, CSSProperties> = {
  1: { background: '#FFF0F0', color: '#C0392B', border: '1px solid #C0392B' },
  2: { background: '#FFF9E6', color: '#8B6914', border: '1px solid #C9A84C' },
  3: { background: '#FDF5E6', color: '#7A5A1A', border: '1px solid #9a7d4e' },
};

const PILLAR_CALLOUT: Record<1 | 2 | 3, (goal: string, loc: string) => string> = {
  1: (goal) => `Here is how Pillar 1 is specifically blocking your goal of ${goal}:`,
  2: (goal) =>
    `Here is how your current timing window is directly affecting your ability to reach ${goal}:`,
  3: (goal, loc) =>
    `Here is how your current address${loc ? ` in ${loc}` : ''} is interacting with your goal of ${goal}:`,
};

const REPORT_SECTIONS: Array<{ id: string; label: string }> = [
  { id: 'cover', label: 'Overview' },
  { id: 'pattern', label: 'Why This Happens' },
  { id: 'pillars', label: '3-Pillar Breakdown' },
  { id: 'next-steps', label: 'Next Steps' },
  { id: 'actions', label: 'Export & Reset' },
];

function PillarDeepDiveCard({
  pillar,
  index,
  title,
  subtitle,
  goal,
  goalShort,
  goalText,
  location,
  transits,
  pillar2Items,
  pillar3Items,
  addressMoveDate,
}: {
  pillar: PillarSummary;
  index: 1 | 2 | 3;
  title: string;
  subtitle: string;
  goal: GoalCategory;
  goalShort: string;
  goalText: string;
  location: string;
  transits: PlanetaryTransit[];
  pillar2Items: GradeItem[];
  pillar3Items: GradeItem[];
  addressMoveDate: string;
}) {
  const scoringItems = pillar.items.filter(
    (i) => i.grade === 'F' || i.grade === 'C' || i.grade === 'A'
  );
  const callout = PILLAR_CALLOUT[index](goalShort, location);
  const accentColor = index === 1 ? '#C0392B' : index === 2 ? '#C9A84C' : '#9a7d4e';
  const pillarGrade = getPillarLetterGrade(pillar);

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8E8E8',
        borderRadius: '4px',
        padding: '20px 24px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '10px',
          flexWrap: 'wrap' as const,
        }}
      >
        <span
          style={{
            ...PILLAR_BADGE_STYLE[index],
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '2px',
            fontFamily: INTER,
          }}
        >
          PILLAR {index}
        </span>
        <span
          style={{ fontFamily: CORMORANT, fontSize: '1.1rem', fontWeight: 700, color: '#1C1A2E' }}
        >
          {title} — {subtitle}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '1.2rem',
            fontWeight: 900,
            color: accentColor,
            fontFamily: INTER,
          }}
        >
          {pillarGrade}
        </span>
      </div>

      {/* Goal callout */}
      <p
        style={{
          fontFamily: CORMORANT,
          fontStyle: 'italic',
          color: '#7A5A1A',
          fontSize: '0.9rem',
          lineHeight: 1.5,
          padding: '7px 12px',
          background: 'rgba(201,168,76,0.06)',
          borderBottom: '1px solid rgba(201,168,76,0.18)',
          borderRadius: '4px 4px 0 0',
          margin: '0 0 14px',
        }}
      >
        {callout}
      </p>

      {/* Content: house wheel + aspect cards */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, textAlign: 'center', width: '108px' }}>
          <SvgChart svg={renderHouseWheel(pillar.items, 108)} />
          <p style={{ fontSize: '9px', color: '#999', margin: '4px 0 3px', fontFamily: INTER }}>
            {index === 3 ? 'Env Chart' : index === 2 ? 'Transit Chart' : 'House Chart'}
          </p>
          <div style={{ fontSize: '8px', fontFamily: INTER }}>
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                background: '#C0392B',
                borderRadius: '1px',
                verticalAlign: 'middle',
              }}
            />{' '}
            <span style={{ color: '#777' }}>F</span>&nbsp;
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                background: '#C9A84C',
                borderRadius: '1px',
                verticalAlign: 'middle',
              }}
            />{' '}
            <span style={{ color: '#777' }}>C</span>&nbsp;
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                background: '#2ecc71',
                borderRadius: '1px',
                verticalAlign: 'middle',
              }}
            />{' '}
            <span style={{ color: '#777' }}>A</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {scoringItems.length === 0 ? (
            <p
              style={{
                fontSize: '0.8rem',
                color: '#16a34a',
                fontStyle: 'italic',
                fontFamily: INTER,
              }}
            >
              No significant pressure in this pillar — this dimension is working in your favor.
            </p>
          ) : (
            scoringItems.map((item, i) => (
              <AspectCard
                key={i}
                item={item}
                goal={goal}
                goalShort={goalShort}
                goalText={goalText}
                transits={transits}
              />
            ))
          )}
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

// ── Cost of Inaction ──────────────────────────────────────────────────────────

function CostOfInaction({ goalShort, endYear }: { goalShort: string; endYear: number | null }) {
  const yearsRemaining = endYear ? endYear - new Date().getFullYear() : null;
  const yearLine = endYear
    ? `Without targeted deconditioning of the specific layers identified above, the data points to ${endYear}.`
    : `Without targeted deconditioning of the specific layers identified above, this pattern does not self-resolve.`;

  return (
    <div
      style={{
        background: '#FFF8F8',
        border: '1px solid #FAEAEA',
        borderRadius: '4px',
        padding: '28px 32px',
      }}
    >
      <h3
        style={{
          fontFamily: CORMORANT,
          color: '#1C1A2E',
          fontSize: '1.6rem',
          fontWeight: 700,
          margin: '0 0 20px',
          lineHeight: 1.3,
        }}
      >
        What Another Year of This Pattern Costs You
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          `Another 12 months of knowing exactly what to do — and watching yourself not do it.`,
          `Another year of income that almost hits ${goalShort}, but resets every time you get close.`,
          `Another year of brilliant ideas living in your drafts folder instead of the marketplace.`,
          `Another year of telling yourself next month will be different.`,
          yearLine,
        ].map((line, i) => (
          <p
            key={i}
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: '#444444',
              lineHeight: 1.7,
              fontFamily: INTER,
              borderLeft: '2px solid #C0392B',
              paddingLeft: '12px',
            }}
          >
            {line}
          </p>
        ))}
        {yearsRemaining !== null && yearsRemaining > 0 && (
          <p
            style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#C0392B',
              fontFamily: INTER,
            }}
          >
            That's {yearsRemaining} more year{yearsRemaining !== 1 ? 's' : ''}.
          </p>
        )}
        <p
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: '#C9A84C',
            fontFamily: INTER,
          }}
        >
          Or — you begin the decondition now.
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ClientResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<string>(REPORT_SECTIONS[0].id);

  const isDemo = new URLSearchParams(location.search).get('demo') === 'true';

  const DEMO_STATE: { results: ConsolidatedResults; intake: ClientIntakeData } = {
    results: {
      success: true,
      timestamp: new Date().toISOString(),
      userInfo: {
        name: 'Sophia Reyes',
        dateOfBirth: '1990-06-15',
        timeOfBirth: '14:30',
        birthLocation: 'Los Angeles, CA',
        currentLocation: 'Austin, TX',
        address: '123 Demo St, Austin, TX',
      },
      calculators: {
        transits: {
          risingSign: 'Libra',
          transits: [
            {
              planet: 'Uranus',
              planetTheme: 'Disruption & Liberation',
              houseNumber: 10,
              houseTheme: 'Career & Public Image',
              pastHouseNumber: 9,
              pastHouseTheme: 'Beliefs & Travel',
              current: {
                sign: 'Taurus',
                start: '2019-01-01',
                end: '2033-12-31',
                high: '',
                low: '',
              },
              past: { sign: 'Aries', start: '2011-01-01', end: '2019-01-01', high: '', low: '' },
            },
            {
              planet: 'Neptune',
              planetTheme: 'Dissolution & Spirituality',
              houseNumber: 8,
              houseTheme: 'Money & Transformation',
              pastHouseNumber: 7,
              pastHouseTheme: 'Partnerships',
              current: {
                sign: 'Pisces',
                start: '2011-01-01',
                end: '2039-12-31',
                high: '',
                low: '',
              },
              past: { sign: 'Aquarius', start: '1998-01-01', end: '2011-01-01', high: '', low: '' },
            },
            {
              planet: 'Saturn',
              planetTheme: 'Structure & Limitation',
              houseNumber: 8,
              houseTheme: 'Money & Transformation',
              pastHouseNumber: 7,
              pastHouseTheme: 'Partnerships',
              current: {
                sign: 'Pisces',
                start: '2023-01-01',
                end: '2028-12-31',
                high: '',
                low: '',
              },
              past: { sign: 'Aquarius', start: '2020-01-01', end: '2023-01-01', high: '', low: '' },
            },
          ],
        },
        natalChart: null,
        lifePath: null,
        relocation: null,
        addressNumerology: null,
      },
      diagnostic: {
        pillars: [
          {
            pillar: 1,
            name: 'Structure',
            description: 'Natal chart angular placements',
            fCount: 5,
            cCount: 3,
            aCount: 0,
            items: [
              {
                source: 'Natal Angular',
                pillar: 1,
                section: 'Natal Angular',
                planet: 'Saturn',
                house: 5,
                grade: 'F',
                reason: 'Saturn in angular house 5',
              },
              {
                source: 'Natal Angular',
                pillar: 1,
                section: 'Natal Angular',
                planet: 'Uranus',
                house: 5,
                grade: 'F',
                reason: 'Uranus in angular house 5',
              },
              {
                source: 'Natal Angular',
                pillar: 1,
                section: 'Natal Angular',
                planet: 'Neptune',
                house: 5,
                grade: 'F',
                reason: 'Neptune in house 5',
              },
              {
                source: 'Natal Angular',
                pillar: 1,
                section: 'Natal Angular',
                planet: 'Pluto',
                house: 8,
                grade: 'F',
                reason: 'Pluto in angular house 8',
              },
              {
                source: 'Natal Angular',
                pillar: 1,
                section: 'Natal Angular',
                planet: 'Chiron',
                house: 1,
                grade: 'F',
                reason: 'Chiron in angular house 1',
              },
              {
                source: 'Natal Angular',
                pillar: 1,
                section: 'Natal Angular',
                planet: 'Mercury',
                house: 6,
                grade: 'C',
                reason: 'Mercury in house 6',
              },
              {
                source: 'Natal Angular',
                pillar: 1,
                section: 'Natal Angular',
                planet: 'Venus',
                house: 8,
                grade: 'C',
                reason: 'Venus in house 8',
              },
              {
                source: 'Natal Angular',
                pillar: 1,
                section: 'Natal Angular',
                planet: 'Mars',
                house: 12,
                grade: 'C',
                reason: 'Mars in house 12',
              },
            ],
          },
          {
            pillar: 2,
            name: 'Timing',
            description: 'Current planetary transits',
            fCount: 0,
            cCount: 1,
            aCount: 2,
            items: [
              {
                source: 'Transit Angular',
                pillar: 2,
                section: 'Transit Angular',
                planet: 'Jupiter',
                house: 11,
                grade: 'A',
                reason: 'Transit Jupiter in angular house 11',
              },
              {
                source: 'Transit Angular',
                pillar: 2,
                section: 'Transit Angular',
                planet: 'Venus',
                house: 9,
                grade: 'A',
                reason: 'Transit Venus in house 9',
              },
              {
                source: 'Transit Angular',
                pillar: 2,
                section: 'Transit Angular',
                planet: 'Mercury',
                house: 3,
                grade: 'C',
                reason: 'Transit Mercury in house 3',
              },
            ],
          },
          {
            pillar: 3,
            name: 'Environment',
            description: 'Relocation chart for current address',
            fCount: 0,
            cCount: 2,
            aCount: 1,
            items: [
              {
                source: 'Relocation Angular',
                pillar: 3,
                section: 'Relocation Angular',
                planet: 'Sun',
                house: 10,
                grade: 'A',
                reason: 'Relocated Sun in house 10',
              },
              {
                source: 'Relocation Angular',
                pillar: 3,
                section: 'Relocation Angular',
                planet: 'Saturn',
                house: 2,
                grade: 'C',
                reason: 'Relocated Saturn in house 2',
              },
              {
                source: 'Relocation Angular',
                pillar: 3,
                section: 'Relocation Angular',
                planet: 'Uranus',
                house: 2,
                grade: 'C',
                reason: 'Relocated Uranus in house 2',
              },
            ],
          },
        ] as [
          import('../../models/diagnostic').PillarSummary,
          import('../../models/diagnostic').PillarSummary,
          import('../../models/diagnostic').PillarSummary,
        ],
        totalFs: 5,
        totalCs: 6,
        totalAs: 3,
        score: 35,
        finalGrade: 'F',
        allItems: [],
      },
    },
    intake: {
      email: 'sophia@example.com',
      phone: '',
      marketingConsent: true,
      addressMoveDate: '2024',
      desiredOutcome: 'Grow my income and financial freedom',
      obstacle: 'Bandwidth and self-doubt',
      patternYear: '2024',
      priorHelp: ['coaches'],
      preferredSolution: 'coaching',
      currentSituation: 'employed',
      additionalNotes: '',
    },
  };

  const searchParams = new URLSearchParams(location.search);
  const reportId = searchParams.get('id');
  const rawState = location.state as {
    results: ConsolidatedResults;
    intake: ClientIntakeData;
  } | null;

  const [fetchedState, setFetchedState] = useState<{
    results: ConsolidatedResults;
    intake: ClientIntakeData;
  } | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId || rawState) return;
    setIsFetching(true);
    fetch(`/api/get-results?id=${encodeURIComponent(reportId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { results: ConsolidatedResults; intake: ClientIntakeData }) =>
        setFetchedState(data)
      )
      .catch(() => setFetchError('Report not found or expired.'))
      .finally(() => setIsFetching(false));
  }, [reportId, rawState]);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setScrollProgress(progress);

      // When scrolled within 40px of the bottom, force-activate the last section
      const atBottom = docHeight > 0 && scrollTop >= docHeight - 40;
      const sections = document.querySelectorAll<HTMLElement>('[data-report-section]');
      let current = REPORT_SECTIONS[0].id;
      sections.forEach((section) => {
        if (scrollTop >= section.offsetTop - 140) current = section.id;
      });
      if (atBottom) current = REPORT_SECTIONS[REPORT_SECTIONS.length - 1].id;
      setActiveSection(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const state = isDemo ? DEMO_STATE : (rawState ?? fetchedState);

  if (isFetching) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F5F1EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ fontFamily: INTER, color: '#6b6188' }}>Loading your report…</p>
      </div>
    );
  }

  if (!state?.results) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#F5F1EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            background: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '4px',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: CORMORANT,
              color: '#1C1A2E',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            No results found
          </h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '24px', fontFamily: INTER }}>
            {fetchError ?? 'Please complete the assessment first.'}
          </p>
          <button
            onClick={() => navigate('/client')}
            style={{
              padding: '12px 28px',
              background: '#C9A84C',
              color: '#1C1A2E',
              fontWeight: 700,
              borderRadius: '2px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: INTER,
            }}
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  const { results, intake } = state;
  const goal = detectGoalCategory(intake.desiredOutcome);
  const goalShort = GOAL_SHORT[goal];
  const clientLocation = results.userInfo.currentLocation || '';
  const transits = results.calculators.transits?.transits ?? [];
  const [p1, p2, p3] = results.diagnostic!.pillars;

  const s1 = pillarScore(p1),
    s2 = pillarScore(p2),
    s3 = pillarScore(p3);
  const total = s1 + s2 + s3;
  const p1pct = total === 0 ? 0 : Math.round((s1 / total) * 100);
  const p2pct = total === 0 ? 0 : Math.round((s2 / total) * 100);
  const p3pct = total === 0 ? 0 : Math.round((s3 / total) * 100);
  const diagnosticItems =
    results.diagnostic!.allItems.length > 0
      ? results.diagnostic!.allItems
      : [...p1.items, ...p2.items, ...p3.items];

  const longest = getLongestMaleficTransit(diagnosticItems, transits);
  const { finalGrade, score } = results.diagnostic!;
  const gc = gradeColor(finalGrade);
  // CTA eligibility (unused — kept for future re-activation)
  // const wordCount = intake.desiredOutcome.trim().split(/\s+/).filter(Boolean).length;
  // const soughtTherapyOrCoaches =
  //   intake.priorHelp.includes('therapy') || intake.priorHelp.includes('coaches');
  // const notMonetizing = intake.currentSituation !== 'monetizing';
  // const scoredCOrWorse = finalGrade === 'C' || finalGrade === 'F';
  // const showCTA = wordCount > 1 && soughtTherapyOrCoaches && notMonetizing && scoredCOrWorse;

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

  const pillarCardProps = (
    pillar: PillarSummary,
    index: 1 | 2 | 3,
    title: string,
    subtitle: string
  ) => ({
    pillar,
    index,
    title,
    subtitle,
    goal,
    goalShort,
    goalText: intake.desiredOutcome,
    location: clientLocation,
    transits,
    pillar2Items: p2.items,
    pillar3Items: p3.items,
    addressMoveDate: intake.addressMoveDate,
  });

  const legendCards = [
    {
      dot: '#C9A84C',
      label: 'SOUL / KARMA — PILLAR 1',
      question: `Have people always called you 'too much' — or felt emotions more intensely, like you were wired differently from birth?`,
      desc: `Your permanent karmic blueprint. Can't be removed — but once decoded, it becomes your greatest asset.`,
    },
    {
      dot: '#9B8EC4',
      label: 'PLANETARY TIMING — PILLAR 2',
      question: `Did life suddenly shift — a separation, unexpected move, sudden urge to quit your job — even when you weren't asking for change?`,
      desc: `Slow-moving planets define your current window. Knowing when it lifts gives you a timeline, not an open question mark.`,
    },
    {
      dot: '#5BB5A5',
      label: 'ENVIRONMENT — PILLAR 3',
      question: `Ever since you moved to your current city, does it feel harder to be yourself — like opportunities now require twice the effort?`,
      desc: `Your address carries a frequency. It amplifies or dampens everything else in your chart — and it's the most immediately actionable layer.`,
    },
  ];

  const endYear = longest?.endYear ?? null;
  const yearsRemaining = endYear ? endYear - new Date().getFullYear() : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F1EB',
        color: '#1C1A2E',
        padding: '40px 16px',
        fontFamily: INTER,
      }}
    >
      <div
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Sticky table of contents + page progress */}
        <div
          style={{
            position: 'sticky',
            top: '12px',
            zIndex: 50,
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            borderRadius: '4px',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#999',
                fontWeight: 700,
              }}
            >
              On this page
            </div>
            <div style={{ fontSize: '11px', color: '#7A5A1A', fontWeight: 700 }}>
              {Math.round(scrollProgress)}%
            </div>
          </div>
          <div
            style={{
              height: '6px',
              borderRadius: '999px',
              background: '#EFE8D6',
              overflow: 'hidden',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${scrollProgress}%`,
                background: 'linear-gradient(90deg, #C9A84C, #9a7d4e)',
                transition: 'width 120ms linear',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
            {REPORT_SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    document
                      .getElementById(section.id)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  aria-current={isActive ? 'location' : undefined}
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    padding: '6px 9px',
                    borderRadius: '2px',
                    border: isActive ? '1px solid #C9A84C' : '1px solid #E0E0E0',
                    color: isActive ? '#7A5A1A' : '#666',
                    background: isActive ? '#FDFBF6' : '#FFFFFF',
                    fontWeight: isActive ? 700 : 600,
                    fontFamily: INTER,
                  }}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 1: COVER ── */}
        <section
          id="cover"
          data-report-section
          style={{
            scrollMarginTop: '120px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid #E8E8E8',
              paddingBottom: '16px',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: CORMORANT,
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#C9A84C',
                }}
              >
                Pheydrus
              </div>
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#999',
                  marginTop: '2px',
                }}
              >
                Proprietary 3-Pillar Analysis
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: '#7A5A1A', fontWeight: 600 }}>
                {results.userInfo.name}
              </div>
              <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                {new Date(results.timestamp).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* Hero card — grade + headline + dynamic description */}
          {(() => {
            const hl: Record<string, [string, string]> = {
              A: ['A means alignment is close.', 'One right move, and you can 10x your life.'],
              B: [
                "You're doing well —",
                "'doing well' and 'living fully' are two different things.",
              ],
              C: ['A passing grade —', 'but who wants a passing-grade life?'],
              D: [
                "D means you're one step away from failing —",
                "and you're probably feeling the pressure.",
              ],
              F: ['Rock bottom —', 'but rock bottom has a map out.'],
            };
            const [h1, h2] = hl[finalGrade] ?? ['Overall Deconditioning Score', ''];
            const forceCount =
              (results.diagnostic!.totalFs ?? 0) + (results.diagnostic!.totalCs ?? 0);
            const descLine =
              endYear && yearsRemaining
                ? `Your ${finalGrade} score traces back to ${forceCount} specific force${forceCount !== 1 ? 's' : ''} — all identified below. Left unaddressed, this configuration persists through ${endYear} — ${yearsRemaining} more year${yearsRemaining !== 1 ? 's' : ''} of a reality that passes, but doesn't 10x.`
                : `Your ${finalGrade} score traces back to ${forceCount} specific force${forceCount !== 1 ? 's' : ''} — all identified below. This configuration does not self-resolve without targeted intervention.`;
            return (
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '4px',
                  padding: '20px 24px',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flexShrink: 0, textAlign: 'center' }}>
                  <div
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      border: `2.5px solid ${gc.border}`,
                      background: gc.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: CORMORANT,
                        fontSize: '3rem',
                        fontWeight: 700,
                        color: gc.text,
                        lineHeight: 1,
                      }}
                    >
                      {finalGrade}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '9px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#999',
                      marginTop: '6px',
                    }}
                  >
                    Overall Score
                  </div>
                  <div
                    style={{ fontSize: '12px', fontWeight: 700, color: gc.text, fontFamily: INTER }}
                  >
                    {score % 1 === 0 ? score : score.toFixed(1)} / 100
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: CORMORANT,
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: '#1C1A2E',
                      marginBottom: '10px',
                      lineHeight: 1.3,
                    }}
                  >
                    {h1} <em style={{ color: '#8B6914' }}>{h2}</em>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#555', lineHeight: 1.75 }}>
                    {descLine}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Score breakdown — horizontal bars + Venn */}
          {total > 0 &&
            (() => {
              const rows = [
                {
                  label: 'Structure',
                  sub: 'Pillar 1',
                  pct: p1pct,
                  color: '#C0392B',
                  grade: getPillarLetterGrade(p1),
                },
                {
                  label: 'Timing',
                  sub: 'Pillar 2',
                  pct: p2pct,
                  color: '#C9A84C',
                  grade: getPillarLetterGrade(p2),
                },
                {
                  label: 'Environment',
                  sub: 'Pillar 3',
                  pct: p3pct,
                  color: '#9a7d4e',
                  grade: getPillarLetterGrade(p3),
                },
              ];
              return (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E8E8E8',
                    borderRadius: '4px',
                    padding: '18px 22px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: '#999',
                      marginBottom: '14px',
                    }}
                  >
                    Your Score Breaks Down As:
                  </div>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {rows.map((r) => {
                        const gc2 = gradeColor(r.grade);
                        return (
                          <div
                            key={r.label}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                          >
                            <div style={{ width: '90px', flexShrink: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  color: '#1C1A2E',
                                  fontFamily: INTER,
                                }}
                              >
                                {r.label}
                              </div>
                              <div style={{ fontSize: '9px', color: '#999' }}>{r.sub}</div>
                            </div>
                            <div
                              style={{
                                flex: 1,
                                height: '6px',
                                background: '#E8E8E8',
                                borderRadius: '3px',
                              }}
                            >
                              <div
                                style={{
                                  height: '6px',
                                  width: `${r.pct}%`,
                                  background: r.color,
                                  borderRadius: '3px',
                                }}
                              />
                            </div>
                            <div
                              style={{
                                width: '32px',
                                textAlign: 'right',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: r.color,
                                fontFamily: INTER,
                              }}
                            >
                              {r.pct}%
                            </div>
                            {r.grade && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '1px 7px',
                                  borderRadius: '2px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  background: gc2.bg,
                                  color: gc2.text,
                                  border: `1px solid ${gc2.border}`,
                                  fontFamily: INTER,
                                }}
                              >
                                {r.grade}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'center' }}>
                      <VennDiagram />
                      <div style={{ fontSize: '9px', color: '#999', marginTop: '4px' }}>
                        3 forces · 1 score
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Goal bar */}
          <div
            style={{
              borderLeft: '4px solid #C9A84C',
              background: '#FDFBF6',
              padding: '10px 16px',
              borderRadius: '0 4px 4px 0',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#C9A84C',
                marginBottom: '4px',
              }}
            >
              90-Day Goal · {GOAL_LABEL[goal]}
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: CORMORANT,
                fontStyle: 'italic',
                color: '#7A5A1A',
                fontSize: '0.95rem',
                lineHeight: 1.6,
              }}
            >
              {intake.desiredOutcome}
            </p>
          </div>

          {/* Reframe block */}
          <div
            style={{
              borderLeft: '4px solid #C9A84C',
              background: '#FDFBF6',
              borderRadius: '0 4px 4px 0',
              padding: '20px 24px',
            }}
          >
            <p
              style={{
                fontFamily: CORMORANT,
                fontStyle: 'italic',
                color: '#7A5A1A',
                fontSize: '1.1rem',
                margin: 0,
                lineHeight: 1.75,
              }}
            >
              If you've tried everything — the mindset work, the strategies, the coaches — and
              things are going{' '}
              <strong style={{ fontStyle: 'normal', color: '#1C1A2E' }}>well enough</strong> but
              that one specific thing you want keeps slipping just out of reach… you're not
              factoring in the unseen forces that{' '}
              <strong style={{ fontStyle: 'normal', color: '#1C1A2E' }}>
                cannot be intellectually solved.
              </strong>{' '}
              You've been 10x-capable this entire time. This report maps the forces working against
              you.
            </p>
          </div>

          {/* Malefic box */}
          <div
            style={{
              background: '#FDFAF5',
              border: '1px solid #E8E0C8',
              borderRadius: '4px',
              padding: '20px 24px',
            }}
          >
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#C9A84C',
                marginBottom: '10px',
                fontFamily: INTER,
              }}
            >
              Your score is not a verdict. It's an entry point.
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: '#555', lineHeight: 1.75 }}>
              The forces showing up in your report aren't there to make life hard — they're only
              hard when you don't know how to work with them. Every pressure point carries a higher
              octave: a transmuted version that becomes your greatest advantage once decoded.
            </p>
            <div style={{ borderLeft: '3px solid #C9A84C', paddingLeft: '14px' }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: CORMORANT,
                  fontStyle: 'italic',
                  color: '#7A5A1A',
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                }}
              >
                "Pluto transiting your 1st house? Stop playing nice. Stop softening your edges. Step
                fully into your power — that is the higher octave." — Pheydrus team
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: WHY THIS KEEPS HAPPENING ── */}

        <section id="pattern" data-report-section style={{ scrollMarginTop: '120px' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E8E8',
              borderRadius: '4px',
              padding: '28px 32px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#999',
                marginBottom: '8px',
              }}
            >
              The Pattern
            </div>
            <h2
              style={{
                fontFamily: CORMORANT,
                fontSize: '2rem',
                fontWeight: 700,
                color: '#1C1A2E',
                margin: '0 0 20px',
                lineHeight: 1.2,
              }}
            >
              Why This Keeps Happening
            </h2>

            {/* Pull quote */}
            <div
              style={{
                borderLeft: '4px solid #C9A84C',
                padding: '12px 20px',
                marginBottom: '20px',
                background: '#FDFBF6',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: CORMORANT,
                  fontStyle: 'italic',
                  color: '#7A5A1A',
                  fontSize: '1rem',
                  lineHeight: 1.7,
                }}
              >
                "It's not normal to wake up every day with that quiet ache — knowing you've done
                everything right. The degree. The career. The inner work. And still feel like you're
                watching everyone else's life click into place while yours stays just out of reach."
              </p>
            </div>

            <p
              style={{
                margin: '0 0 12px',
                fontSize: '0.85rem',
                color: '#444444',
                lineHeight: 1.8,
                fontWeight: 700,
              }}
            >
              You are not broken. You are mid-shift.
            </p>
            <p
              style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#444444', lineHeight: 1.8 }}
            >
              The patterns in this report aren't holding you back — they are the{' '}
              <strong>EXACT conditions that precede a major identity upgrade</strong>. Three
              invisible forces have been pulling against each other... and that friction? That's not
              failure. That's what happens when who you've been can no longer contain who you're
              becoming.
            </p>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#C9A84C',
                lineHeight: 1.6,
              }}
            >
              The new identity is already forming.
            </p>
            <p
              style={{ margin: '0 0 24px', fontSize: '0.85rem', color: '#444444', lineHeight: 1.8 }}
            >
              The question is whether you'll step into it with a map — or stumble into it blind.
            </p>

            {/* Venn + legend */}
            <div
              style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
                marginBottom: '24px',
                flexWrap: 'wrap' as const,
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <VennDiagram />
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {legendCards.map((c) => (
                  <div
                    key={c.label}
                    style={{
                      background: '#FAFAFA',
                      border: '1px solid #E8E8E8',
                      borderRadius: '4px',
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: c.dot,
                          flexShrink: 0,
                          display: 'inline-block',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: '#999',
                        }}
                      >
                        {c.label}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '0 0 5px',
                        fontFamily: CORMORANT,
                        fontStyle: 'italic',
                        color: '#C9A84C',
                        fontSize: '0.9rem',
                        lineHeight: 1.55,
                      }}
                    >
                      {c.question}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#666', lineHeight: 1.6 }}>
                      {c.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline warning */}
            {longest && (
              <div
                style={{
                  background: '#FAFAFA',
                  border: '1px solid #E8E8E8',
                  borderRadius: '4px',
                  padding: '14px 18px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: '#C9A84C',
                    marginBottom: '8px',
                  }}
                >
                  ⚠ Active Pattern Window
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#555555', lineHeight: 1.7 }}>
                  Without intervention, your current configuration is projected to persist{' '}
                  <strong style={{ color: '#C9A84C' }}>
                    through {endYear}
                    {yearsRemaining ? ` — approximately ${yearsRemaining} more years` : ''}
                  </strong>
                  . The primary driver is{' '}
                  <strong style={{ color: '#1C1A2E' }}>
                    {longest.planet} transiting House {longest.house}
                  </strong>
                  , defining the exact window you are in right now. Knowing the window is half the
                  advantage.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION 3: PILLAR BREAKDOWN ── */}

        <section id="pillars" data-report-section style={{ scrollMarginTop: '120px' }}>
          <div>
            <div
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#999',
                marginBottom: '8px',
              }}
            >
              What is Holding Back Your {GOAL_LABEL[goal]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PillarDeepDiveCard
                {...pillarCardProps(p1, 1, 'Structure', 'Your Energetic Blueprint')}
              />
              <TestimonialCard
                quote="e.g. — 'I had the exact same Saturn/House 5 configuration. I'd been building the same offer in my head for two years. Within 60 days of working with the Pheydrus team, I launched, signed 3 clients, and finally felt like my energy matched my output.'"
                attribution="Jordan M., Los Angeles"
              />
              <PillarDeepDiveCard {...pillarCardProps(p2, 2, 'Timing', 'The Window You Are In')} />
              <PillarDeepDiveCard
                {...pillarCardProps(p3, 3, 'Environment', 'Location & Address')}
              />
              <TestimonialCard
                quote="e.g. — 'The environment piece was the one I almost skipped. After my Pillar 3 session I raised my rates by 40% and signed my highest-paying client that same week. The address work is real.'"
                attribution="Priya K., New York"
              />
            </div>
          </div>
        </section>

        {/* ── SECTION 4: COST OF INACTION + CTA ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <CostOfInaction goalShort={goalShort} endYear={longest?.endYear ?? null} />

          <TestimonialCard
            quote="e.g. — 'I came in skeptical. Three years of coaches and nothing had actually shifted. I left my first session with a sequenced 90-day plan that made more sense than anything I'd tried before.'"
            attribution="Marcus T., Chicago"
          />

          {/* Destiny block */}
          <div
            style={{
              background: '#F5FBF5',
              border: '1px solid #C8E6C8',
              borderRadius: '4px',
              padding: '20px 24px',
            }}
          >
            <h3
              style={{
                fontFamily: CORMORANT,
                color: '#C9A84C',
                fontSize: '1.3rem',
                fontWeight: 700,
                margin: '0 0 12px',
              }}
            >
              This is bigger than fixing what's broken.
            </h3>
            <p
              style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#444444', lineHeight: 1.8 }}
            >
              The first is <strong style={{ color: '#7A5A1A' }}>closure</strong>. You were handed a lie: that struggle means growth. It doesn't. It means you've been placed in an energetic grid working against you.
            </p>
            <p
              style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#444444', lineHeight: 1.8 }}
            >
              The second — and more important — is <strong style={{ color: '#7A5A1A' }}>preparation</strong>. That grid is already shifting. And to move with it, you need to attack all three pillars at once — because they don't work in isolation. Your blueprint, your timing, and your environment are always talking to each other. Fix one and ignore the others — and you'll keep hitting the same ceiling in a different room.
            </p>
            <p
              style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#444444', lineHeight: 1.8 }}
            >
              For <strong>Pillar 1</strong> — we use a sequential deconditioning method that goes directly into your energetic blindspots (desires, addictions, dreams, etc). This isn't talk therapy or journaling. A specific, structured process that helps you identify the unconscious karmic patterns running your decisions — and consciously transmute them into your greatest assets.
            </p>
            <p
              style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#444444', lineHeight: 1.8 }}
            >
              For <strong>Pillar 2</strong> — we map your current and upcoming planetary transits so you're never caught off guard again. We show you exactly which seasons to push, which to rest, and how to prepare for the windows that — if you move correctly — will be the most expansive periods of your life.
            </p>
            <p
              style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#444444', lineHeight: 1.8 }}
            >
              For <strong>Pillar 3</strong> — we use our proprietary Feng Shui × Astrocartography × Real Estate Numerology to find the best addresses and places in the world that accelerate your goals. This is different for everyone. And it works even if you can't move yet. There are ways to shift the energetic frequency of your space, and protect yourself against unseen environmental forces that have been holding you back for years.
            </p>
            <div style={{ borderTop: '1px solid #C8E6C8', paddingTop: '14px', marginTop: '4px' }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: CORMORANT,
                  fontStyle: 'italic',
                  color: '#1C1A2E',
                  fontSize: '1.1rem',
                  lineHeight: 1.5,
                }}
              >
                When all three are addressed together — that's when people stop reacting to their lives and start actually getting ahead of them.
              </p>
            </div>
          </div>
        </div>

        {/* ── NEXT STEPS ANCHOR — "What's next is simple" ── */}
        <section
          id="next-steps"
          data-report-section
          style={{
            scrollMarginTop: '120px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Transition bridge */}
          <div
            style={{
              background: '#FDFBF6',
              borderTop: '1px solid #E8E0C8',
              borderBottom: '1px solid #E8E0C8',
              borderRadius: '4px',
              padding: '20px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#9A8650',
                fontWeight: 700,
                fontFamily: INTER,
                marginBottom: '8px',
              }}
            >
              Next Step
            </div>
            <h3
              style={{
                margin: '0 0 8px',
                fontFamily: CORMORANT,
                fontSize: '1.45rem',
                fontWeight: 700,
                color: '#1C1A2E',
              }}
            >
              What's next is simple.
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                color: '#555',
                fontFamily: INTER,
                lineHeight: 1.7,
              }}
            >
              You now have clarity on which forces have been running your life. The next step is working with a team that knows exactly how to shift them — not one at a time, but all three together.
            </p>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: '0.9rem',
                color: '#555',
                fontFamily: INTER,
                lineHeight: 1.7,
              }}
            >
              Hundreds of students around the world have broken these exact patterns through our 3-pillar method. People who couldn't move. People mid-divorce. People who had tried everything and couldn't figure out why nothing was landing. The breakthroughs they'd been chasing for years — unlocked once they had the right map.
            </p>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: '0.9rem',
                color: '#555',
                fontFamily: INTER,
                lineHeight: 1.7,
              }}
            >
              Start with your recommended path below — or book a call and we'll build yours together.
            </p>
          </div>

          {/* PROGRAM RECOMMENDATION + BOOK A CALL OPTIONS */}
          {(() => {
            const recommendations = getTwoProgramRecommendations(p1, p2, p3, diagnosticItems);

            const optionCardStyle: CSSProperties = {
              background: '#FDFBF6',
              border: '1px solid #C9A84C',
              borderRadius: '4px',
              padding: '32px',
            };

            return (
              <>
                <div style={optionCardStyle}>
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      fontWeight: 700,
                      color: '#1d4ed8',
                      marginBottom: '10px',
                      fontFamily: INTER,
                    }}
                  >
                    #1 Option
                  </div>
                  <h2
                    style={{
                      fontFamily: CORMORANT,
                      color: '#1d4ed8',
                      fontSize: '1.7rem',
                      fontWeight: 700,
                      margin: '0 0 16px',
                    }}
                  >
                    Watch These Videos 🎥
                  </h2>

                  <p
                    style={{
                      margin: '0 0 18px',
                      fontSize: '0.88rem',
                      color: '#555',
                      lineHeight: 1.7,
                      fontFamily: INTER,
                    }}
                  >
                    Based on your pillar pattern, these are the two closest paths to start with
                    next.
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: '18px',
                      alignItems: 'stretch',
                      flexWrap: 'wrap' as const,
                    }}
                  >
                    {recommendations.map((recommendation, index) => (
                      <div
                        key={recommendation.route}
                        style={{
                          flex: 1,
                          minWidth: '250px',
                          background: '#FFFFFF',
                          border: '1px solid #D9C78E',
                          borderRadius: '4px',
                          padding: '22px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: '#9A8650',
                            fontWeight: 700,
                            marginBottom: '8px',
                            fontFamily: INTER,
                          }}
                        >
                          Recommendation {index + 1}
                        </div>
                        <h3
                          style={{
                            margin: '0 0 10px',
                            fontFamily: CORMORANT,
                            fontSize: '1.45rem',
                            fontWeight: 700,
                            color: '#1C1A2E',
                          }}
                        >
                          {recommendation.title}
                        </h3>
                        <p
                          style={{
                            margin: '0 0 18px',
                            fontSize: '0.9rem',
                            color: '#444444',
                            lineHeight: 1.75,
                            fontFamily: INTER,
                            flex: 1,
                          }}
                        >
                          {recommendation.description}
                        </p>
                        <a
                          href={recommendation.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            padding: '12px 20px',
                            background: '#C9A84C',
                            color: '#1C1A2E',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            textDecoration: 'none',
                            borderRadius: '2px',
                            fontFamily: INTER,
                            alignSelf: 'flex-start',
                          }}
                        >
                          Watch {recommendation.title} →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={optionCardStyle}>
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      fontWeight: 700,
                      color: '#b91c1c',
                      marginBottom: '10px',
                      fontFamily: INTER,
                    }}
                  >
                    #2 Option
                  </div>
                  <div style={{ maxWidth: '360px', margin: '0 auto 14px' }}>
                    <img
                      src="/option-2-call-visual-v2.png"
                      alt="Pheydrus alignment preview"
                      style={{
                        width: '100%',
                        height: '210px',
                        objectFit: 'cover',
                        objectPosition: 'center 18%',
                        borderRadius: '4px',
                        border: '1px solid #E3D4AA',
                      }}
                    />
                  </div>
                  <h2
                    style={{
                      fontFamily: CORMORANT,
                      color: '#b91c1c',
                      fontSize: '1.7rem',
                      fontWeight: 700,
                      margin: '0 0 6px',
                      textAlign: 'center',
                    }}
                  >
                    OR Book Your Alignment Call
                  </h2>
                  <p
                    style={{
                      color: '#666',
                      fontSize: '0.8rem',
                      margin: '0 0 20px',
                      fontFamily: INTER,
                      textAlign: 'center',
                    }}
                  >
                    30-minute 1:1 with the Pheydrus team
                  </p>
                  <div style={{ maxWidth: '420px', margin: '0 auto 20px', textAlign: 'left' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#7A5A1A', lineHeight: 1.6, fontFamily: INTER }}>→ We map exactly which invisible forces are running your life right now — and build a personalized roadmap to shift all three simultaneously</p>
                    <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#7A5A1A', lineHeight: 1.6, fontFamily: INTER }}>→ We show you what's coming next in your chart — and how to prepare for the identity shift that's already in motion so you're ready when it arrives</p>
                    <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#7A5A1A', lineHeight: 1.6, fontFamily: INTER }}>→ We identify the specific <strong>Pillar 1</strong> deconditioning work, <strong>Pillar 2</strong> transit windows, and <strong>Pillar 3</strong> environmental shifts that will move the needle fastest for YOUR specific situation</p>
                  </div>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: '#7A5A1A',
                      margin: '0 0 20px',
                      lineHeight: 1.6,
                      fontFamily: INTER,
                      textAlign: 'center',
                      fontStyle: 'italic',
                    }}
                  >
                    Hundreds of students have transformed patterns they couldn't crack for years — not because they tried harder, but because they finally had the right map. This call is how you get yours.
                  </p>
                  <a
                    href="https://calendly.com/pheydrus_strategy/1-1-alignment-strategy-call-report"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '15px 24px',
                      background: '#C9A84C',
                      color: '#1C1A2E',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      borderRadius: '2px',
                      fontFamily: INTER,
                      maxWidth: '420px',
                      margin: '0 auto 12px',
                      textAlign: 'center',
                    }}
                  >
                    BOOK YOUR ALIGNMENT CALL →
                  </a>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      color: '#999',
                      fontFamily: INTER,
                      textAlign: 'center',
                    }}
                  >
                    Complimentary · No obligation · Limited availability this cycle
                  </p>
                </div>
              </>
            );
          })()}
        </section>

        {/* Action buttons */}
        <section id="actions" data-report-section style={{ scrollMarginTop: '120px' }}>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap' as const,
            }}
          >
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              style={{
                padding: '12px 28px',
                background: '#C9A84C',
                color: '#1C1A2E',
                fontWeight: 700,
                borderRadius: '2px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: INTER,
                opacity: isExporting ? 0.6 : 1,
              }}
            >
              {isExporting ? 'Generating PDF…' : 'Download Your Report (PDF)'}
            </button>
            <button
              onClick={() => navigate('/client')}
              style={{
                padding: '12px 28px',
                background: 'transparent',
                color: '#666',
                fontWeight: 600,
                borderRadius: '2px',
                border: '1px solid #E0E0E0',
                cursor: 'pointer',
                fontFamily: INTER,
              }}
            >
              Start New Assessment
            </button>
          </div>

          <p
            style={{
              textAlign: 'center',
              fontSize: '10px',
              color: '#BBBBBB',
              paddingBottom: '24px',
              fontFamily: INTER,
            }}
          >
            Report generated {new Date(results.timestamp).toLocaleString()}
          </p>
        </section>
      </div>
    </div>
  );
}

export default ClientResultsPage;
