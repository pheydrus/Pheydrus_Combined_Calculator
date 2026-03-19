/**
 * Client Report PDF Template — Dark Edition v2
 * 4-page goal-aware interpretation report.
 *
 * Page 1 — Cover
 * Page 2 — Why This Keeps Happening
 * Page 3 — Pillar Breakdown
 * Page 4 — Cost of Inaction + CTA
 */

import type { ConsolidatedResults } from '../../models';
import type { ClientIntakeData } from '../../models/clientIntake';
import type { PillarSummary, GradeItem } from '../../models/diagnostic';
import type { PlanetaryTransit } from '../../models/calculators';
import {
  detectGoalCategory,
  getLongestMaleficTransit,
  getItemInterpretation,
  formatDuration,
  getTransitEndYear,
  type GoalCategory,
} from './clientInterpretations';

// ── Utilities ─────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] ?? c));
}

function pillarScore(p: PillarSummary): number {
  return p.fCount + p.cCount * 0.5;
}

function pct(val: number, total: number): number {
  return total === 0 ? 0 : Math.round((val / total) * 100);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function apt(cx: number, cy: number, r: number, deg: number): [number, number] {
  return [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))];
}

// ── Design tokens ─────────────────────────────────────────────────────────────

const INTER = "'Inter', Arial, sans-serif";
const CORMORANT = "'Cormorant Garamond', Georgia, serif";

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

// ── Grade badge (dark theme) ──────────────────────────────────────────────────

function gradeBadge(grade: string, endYear?: number | null): string {
  const gc = gradeColor(grade);
  const endText = endYear ? ` &middot; thru ${endYear}` : '';
  return `<span style="display:inline-block;padding:2px 9px;border-radius:2px;font-size:10px;font-weight:700;background:${gc.bg};color:${gc.text};border:1px solid ${gc.border};font-family:${INTER};white-space:nowrap;">${grade}${endText}</span>`;
}

// ── Mirror lines ──────────────────────────────────────────────────────────────

function getMirrorLineHtml(item: { planet?: string; house?: number; section?: string }, goalShort: string): string {
  const prefix = item.section === 'Address' ? 'Env' : '';
  const key = `${prefix}${item.planet ?? ''}-${item.house ?? 0}`;
  const lines: Record<string, string> = {
    'Sun-7':        `Your most powerful connections — romantic or professional — tend to find you. But converting that natural draw into lasting partnership for ${esc(goalShort)} feels like a different skill entirely.`,
    'Saturn-5':     `You build the offer, get excited, draft the posts — and pull back right before you publish. Every time. The same wall appears in romance: you open up just enough, then go quiet — not from lack of feeling, but from fear of being truly seen.`,
    'Uranus-5':     `You've launched toward ${esc(goalShort)} more than once — with real momentum — then watched yourself disappear before it paid off. In relationships, the same pattern: intense connection, then withdrawal before real intimacy takes hold.`,
    'Neptune-5':    `You can see the ${esc(goalShort)} version of your life clearly — and the relationship you want. The gap is in bridging vision to reality: both in business and in love, the fog lifts only when you commit to what's already in front of you.`,
    'Pluto-6':      `Are you stuck in performative busyness — doing work that feels productive but isn't actually moving the needle toward ${esc(goalShort)}?`,
    'Neptune-8':    `Have you felt confused about what to charge — like real money and spiritual purpose can't coexist?`,
    'Uranus-10':    `Does your career feel chaotic — or have you felt a sudden, almost irrational urge to quit your job and burn the whole thing down?`,
    'Saturn-8':     `Has accessing the financial partnerships or investment needed to scale toward ${esc(goalShort)} felt blocked or fear-inducing?`,
    'EnvSaturn-2':  `Since living at your current address, has there been an invisible ceiling on how much you allow yourself to charge or earn?`,
    'EnvUranus-2':  `Does your income feel erratic — breakthrough months followed by drought — while ${esc(goalShort)} stays just out of reach?`,
    'EnvNeptune-2': `Are you chronically undercharging for your work — or genuinely unclear about what to charge?`,
  };
  const text = lines[key];
  if (!text) return '';
  return `<p style="margin:0 0 6px;font-size:12px;font-style:italic;color:#1C1A2E;line-height:1.55;font-family:${CORMORANT};">&ldquo;${text}&rdquo;</p>`;
}

// ── Transmute lines ───────────────────────────────────────────────────────────

function getTransmuteLine(item: { planet?: string; house?: number; section?: string }): string {
  const prefix = item.section === 'Address' ? 'Env' : '';
  const key = `${prefix}${item.planet ?? ''}-${item.house ?? 0}`;
  const lines: Record<string, string> = {
    'Sun-7':        `Your highest alignment comes through partnership — in love and in business. The right relationship is not a distraction from your goal. It is the path to it.`,
    'Saturn-5':     `Once activated, you become the most disciplined, unshakeable builder in your market — and the partner who loves with rare, earned depth. Saturn in H5 blocks both at the same threshold; breaking one breaks both.`,
    'Uranus-5':     `The most innovative, category-defining offer in any market — and the most electric, committed romantic connection, once the fear of staying is transmuted into the courage to remain.`,
    'Neptune-5':    `Once grounded, your visionary capacity becomes your greatest differentiator in business — and in love, your depth of feeling becomes a rare gift rather than a source of confusion.`,
    'Pluto-6':      `Pluto in the 6th, activated, builds the most sustainable work machine — systems that compound instead of drain.`,
    'Neptune-8':    `Pricing rooted in genuine purpose becomes your most magnetic quality.`,
    'Uranus-10':    `You're not meant to build a predictable business. You're meant to build one nobody's seen before. That's what's coming next.`,
    'Saturn-8':     `Once fear is transmuted, Saturn in the 8th gives you the most durable financial architecture of anyone in your field.`,
    'EnvSaturn-2':  `Environmental realignment removes the invisible ceiling — and what was once a block becomes a foundation of genuine financial stability.`,
    'EnvUranus-2':  `Environmental shift converts erratic income into breakthrough cycles — shorter troughs, higher peaks.`,
    'EnvNeptune-2': `Once aligned, your address supports clarity around value — and undercharging becomes a thing of the past.`,
  };
  return lines[key] ?? '';
}

// ── Testimonial card ──────────────────────────────────────────────────────────

function renderTestimonialCard(quote: string, attribution: string): string {
  return `
<!-- REPLACE WITH REAL TESTIMONIAL -->
<div style="background:#FDFBF6;border-left:3px solid #C9A84C;border-radius:4px;padding:18px 22px;margin:14px 0;position:relative;overflow:hidden;">
  <span style="position:absolute;top:-12px;left:8px;font-size:72px;color:#C9A84C;opacity:0.12;font-family:${CORMORANT};line-height:1;pointer-events:none;">&ldquo;</span>
  <p style="margin:0 0 8px;font-size:13px;font-style:italic;color:#7A5A1A;line-height:1.65;font-family:${CORMORANT};position:relative;">${esc(quote)}</p>
  <p style="margin:0;font-size:10px;color:#999;font-family:${INTER};">— ${esc(attribution)}</p>
</div>`;
}

// ── SVG: Venn Diagram ─────────────────────────────────────────────────────────

function renderVennDiagram(): string {
  return `<svg width="195" height="185" viewBox="0 0 195 185" xmlns="http://www.w3.org/2000/svg">
  <circle cx="97" cy="66" r="56" fill="#C9A84C" fill-opacity="0.09" stroke="#C9A84C" stroke-width="1.5"/>
  <circle cx="65" cy="124" r="56" fill="#7B5EA7" fill-opacity="0.09" stroke="#9B8EC4" stroke-width="1.5"/>
  <circle cx="129" cy="124" r="56" fill="#2E8B7A" fill-opacity="0.09" stroke="#5BB5A5" stroke-width="1.5"/>
  <text x="97" y="13" text-anchor="middle" font-size="12" fill="#C9A84C" font-family="'Cormorant Garamond',Georgia,serif" font-weight="600">Soul / Karma</text>
  <text x="97" y="25" text-anchor="middle" font-size="8" fill="#555" font-family="Arial,sans-serif">Pillar 1</text>
  <text x="20" y="174" text-anchor="middle" font-size="11" fill="#9B8EC4" font-family="'Cormorant Garamond',Georgia,serif" font-weight="600">Timing</text>
  <text x="20" y="184" text-anchor="middle" font-size="8" fill="#555" font-family="Arial,sans-serif">Pillar 2</text>
  <text x="172" y="174" text-anchor="middle" font-size="11" fill="#5BB5A5" font-family="'Cormorant Garamond',Georgia,serif" font-weight="600">Environment</text>
  <text x="172" y="184" text-anchor="middle" font-size="8" fill="#555" font-family="Arial,sans-serif">Pillar 3</text>
  <text x="97" y="106" text-anchor="middle" font-size="10" fill="#F5F5F0" font-family="'Cormorant Garamond',Georgia,serif" font-style="italic">Full</text>
  <text x="97" y="118" text-anchor="middle" font-size="10" fill="#F5F5F0" font-family="'Cormorant Garamond',Georgia,serif" font-style="italic">Alignment</text>
</svg>`;
}

// ── SVG: Dark house wheel ─────────────────────────────────────────────────────

export function renderDarkHouseWheel(items: GradeItem[], size = 108): string {
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.22;
  const labelR = size * 0.34;

  const houseGrade: Record<number, string> = {};
  for (const item of items) {
    if (!item.house) continue;
    const ex = houseGrade[item.house];
    if (!ex || item.grade === 'F' || (item.grade === 'C' && ex === 'A') || (item.grade === 'A' && !ex)) {
      houseGrade[item.house] = item.grade;
    }
  }

  const FILL: Record<string, string> = { F: '#2a0808', C: '#1a1200', A: '#0a1a0a' };
  const STROKE: Record<string, string> = { F: '#C0392B', C: '#C9A84C', A: '#2ecc71' };
  const TCOLOR: Record<string, string> = { F: '#f87171', C: '#C9A84C', A: '#4ade80' };

  const segments: string[] = [];
  for (let i = 0; i < 12; i++) {
    const h = i + 1;
    const startDeg = 180 - i * 30;
    const endDeg = startDeg - 30;
    const grade = houseGrade[h];
    const fill = grade ? (FILL[grade] ?? '#1a1a1a') : '#181818';
    const stroke = grade ? (STROKE[grade] ?? '#2a2a2a') : '#2a2a2a';
    const [x1, y1] = apt(cx, cy, outerR, startDeg);
    const [x2, y2] = apt(cx, cy, outerR, endDeg);
    const path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    const midDeg = startDeg - 15;
    const [tx, ty] = apt(cx, cy, labelR, midDeg);
    const fw = grade ? '700' : '400';
    const fc = grade ? (TCOLOR[grade] ?? '#888') : '#444';
    segments.push(
      `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>` +
      `<text x="${tx.toFixed(1)}" y="${(ty + 3).toFixed(1)}" text-anchor="middle" font-size="7" fill="${fc}" font-weight="${fw}" font-family="Arial,sans-serif">${h}</text>`,
    );
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${segments.join('\n  ')}
  <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${innerR.toFixed(2)}" fill="#111111" stroke="#2a2a2a" stroke-width="1"/>
</svg>`;
}

// ── SVG: Speedometer ─────────────────────────────────────────────────────────
// Exported — also used in the React results page

export function renderSpeedometer(grade: string, score: number): string {
  const cx = 100, cy = 90, r = 66;
  const W = 200, H = 155;

  const zones: Array<{ start: number; end: number; color: string }> = [
    { start: 210, end: 250, color: '#16a34a' },
    { start: 250, end: 280, color: '#2563eb' },
    { start: 280, end: 305, color: '#d97706' },
    { start: 305, end: 330, color: '#dc2626' },
  ];

  const gradeAngle: Record<string, number> = { A: 225, B: 260, C: 292, F: 318 };
  const needleAngle = gradeAngle[grade] ?? 318;
  const gradeColorMap: Record<string, string> = { A: '#059669', B: '#2563eb', C: '#d97706', F: '#dc2626' };
  const gc = gradeColorMap[grade] ?? '#dc2626';

  function arcSeg(s: number, e: number, color: string, sw: number): string {
    const [x1, y1] = apt(cx, cy, r, s);
    const [x2, y2] = apt(cx, cy, r, e);
    return `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="butt"/>`;
  }

  const [nx, ny] = apt(cx, cy, r - 10, needleAngle);
  const [alx, aly] = apt(cx, cy, r + 15, 207);
  const [flx, fly] = apt(cx, cy, r + 15, 333);

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${arcSeg(210, 330, '#e5e7eb', 12)}
  ${zones.map((z) => arcSeg(z.start, z.end, z.color, 12)).join('\n  ')}
  <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(2)}" y2="${ny.toFixed(2)}" stroke="${gc}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="5" fill="#1f2937"/>
  <circle cx="${cx}" cy="${cy}" r="2.5" fill="white"/>
  <text x="${cx}" y="${cy + 38}" text-anchor="middle" font-size="42" font-weight="900" fill="${gc}" font-family="Arial,sans-serif">${grade}</text>
  <text x="${cx}" y="${cy + 58}" text-anchor="middle" font-size="10" fill="#9ca3af" font-family="Arial,sans-serif">Score: ${score % 1 === 0 ? score : score.toFixed(1)}</text>
  <text x="${alx.toFixed(1)}" y="${aly.toFixed(1)}" text-anchor="middle" font-size="9" fill="#16a34a" font-weight="700" font-family="Arial,sans-serif">A</text>
  <text x="${flx.toFixed(1)}" y="${fly.toFixed(1)}" text-anchor="middle" font-size="9" fill="#dc2626" font-weight="700" font-family="Arial,sans-serif">F</text>
</svg>`;
}

// ── SVG: Donut chart ─────────────────────────────────────────────────────────
// Exported — also used in the React results page

export function renderDonutChart(p1: number, p2: number, p3: number): string {
  const total = p1 + p2 + p3;
  const size = 150;
  const cx = size / 2, cy = size / 2;
  const outerR = 62, innerR = 38;

  if (total === 0) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="#e5e7eb"/>
  <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="white"/>
  <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" fill="#9ca3af" font-family="Arial,sans-serif">Clean</text>
</svg>`;
  }

  const segs = [
    { val: p1, color: '#ef4444' },
    { val: p2, color: '#f59e0b' },
    { val: p3, color: '#9a7d4e' },
  ];

  let angle = -90;
  const paths: string[] = [];

  for (const seg of segs) {
    if (seg.val === 0) continue;
    const sweep = (seg.val / total) * 360;
    const end = angle + sweep;
    const [x1, y1] = apt(cx, cy, outerR, angle);
    const [x2, y2] = apt(cx, cy, outerR, end);
    const [xi1, yi1] = apt(cx, cy, innerR, end);
    const [xi2, yi2] = apt(cx, cy, innerR, angle);
    const large = sweep > 180 ? 1 : 0;
    paths.push(`<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR} ${outerR} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${xi1.toFixed(2)} ${yi1.toFixed(2)} A ${innerR} ${innerR} 0 ${large} 0 ${xi2.toFixed(2)} ${yi2.toFixed(2)} Z" fill="${seg.color}" stroke="white" stroke-width="1.5"/>`);
    angle = end;
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${paths.join('\n  ')}
  <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="white"/>
</svg>`;
}

// ── SVG: House wheel (light theme) ───────────────────────────────────────────
// Exported — also used in the React results page

export function renderHouseWheel(items: GradeItem[], size = 120): string {
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.22;
  const labelR = size * 0.34;

  const houseGrade: Record<number, string> = {};
  for (const item of items) {
    if (!item.house) continue;
    const ex = houseGrade[item.house];
    if (!ex || item.grade === 'F' || (item.grade === 'C' && ex === 'A') || (item.grade === 'A' && !ex)) {
      houseGrade[item.house] = item.grade;
    }
  }

  const FILL: Record<string, string> = { F: '#fca5a5', C: '#fcd34d', A: '#6ee7b7' };

  const segments: string[] = [];
  for (let i = 0; i < 12; i++) {
    const h = i + 1;
    const startDeg = 180 - i * 30;
    const endDeg = startDeg - 30;
    const grade = houseGrade[h];
    const fill = grade ? (FILL[grade] ?? '#f3f4f6') : '#f3f4f6';
    const stroke = grade ? 'white' : '#e5e7eb';
    const [x1, y1] = apt(cx, cy, outerR, startDeg);
    const [x2, y2] = apt(cx, cy, outerR, endDeg);
    const path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    const midDeg = startDeg - 15;
    const [tx, ty] = apt(cx, cy, labelR, midDeg);
    const fw = grade ? '700' : '400';
    const fc = grade ? '#1f2937' : '#9ca3af';
    segments.push(
      `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>` +
      `<text x="${tx.toFixed(1)}" y="${(ty + 3).toFixed(1)}" text-anchor="middle" font-size="7" fill="${fc}" font-weight="${fw}" font-family="Arial,sans-serif">${h}</text>`,
    );
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${segments.join('\n  ')}
  <circle cx="${cx}" cy="${cy}" r="${innerR.toFixed(2)}" fill="white" stroke="#d1d5db" stroke-width="1"/>
  <text x="${cx}" y="${(cy + 4).toFixed(1)}" text-anchor="middle" font-size="6.5" fill="#9ca3af" font-family="Arial,sans-serif">Chart</text>
</svg>`;
}

// ── Timeline helpers ──────────────────────────────────────────────────────────

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

function renderPillarTimeline(
  pillarNum: 1 | 2 | 3,
  pillar2Items: GradeItem[],
  pillar3Items: GradeItem[],
  transits: PlanetaryTransit[],
  addressMoveDate: string,
): string {
  const style = `margin-top:12px;padding:8px 12px;background:#FDFBF6;border-left:3px solid #C9A84C;border-radius:0 4px 4px 0;font-size:11px;color:#666;line-height:1.6;font-family:${INTER};`;

  if (pillarNum === 1) {
    return `<div style="${style}"><strong style="color:#C9A84C;">⏱ Timeline:</strong> Life-long — this is your permanent structural layer. It does not expire, but it can be consciously mastered.</div>`;
  }

  const endYear = pillarNum === 2
    ? getPillar2MaxEndYear(pillar2Items, transits)
    : getPillar3MaxEndYear(pillar3Items, transits);

  if (pillarNum === 2) {
    if (endYear) {
      return `<div style="${style}"><strong style="color:#C9A84C;">⏱ Timeline:</strong> Active <strong style="color:#7A5A1A;">${formatDuration(endYear)}</strong>. This window will lift — knowing when is half the advantage.</div>`;
    }
    return `<div style="${style}"><strong style="color:#C9A84C;">⏱ Timeline:</strong> The active timing pressures are relatively short-cycle.</div>`;
  }

  // Pillar 3
  const durText = endYear
    ? `approximately <strong style="color:#7A5A1A;">${formatDuration(endYear)}</strong>, mirroring your active transit window`
    : 'the duration of your active transit window';
  const addressNote = addressMoveDate
    ? ` <em>Did this pattern intensify around <strong style="color:#7A5A1A;">${esc(addressMoveDate)}</strong> when you moved?</em>`
    : '';
  return `<div style="${style}"><strong style="color:#C9A84C;">⏱ Timeline:</strong> Amplifies your active transits for ${durText}.${addressNote}</div>`;
}

// ── Aspect card ───────────────────────────────────────────────────────────────

function renderAspectCard(
  item: GradeItem,
  goal: GoalCategory,
  goalShort: string,
  transits: PlanetaryTransit[],
): string {
  const gc = gradeColor(item.grade);
  const interp = getItemInterpretation(item, goal, transits);
  const mirror = getMirrorLineHtml(item, goalShort);
  const transmute = getTransmuteLine(item);
  const isAddress = item.section === 'Address';
  const label = isAddress ? '&#127968; Address Energy' : esc(item.source);

  // For transit items, look up end year
  const endYear = item.section === 'Transit Angular' || item.section === 'Life Cycle'
    ? getTransitEndYear(item.planet ?? '', transits)
    : null;

  return `
<div style="background:#FFFFFF;border-left:3px solid ${gc.border};border-radius:4px;padding:12px 16px;margin-bottom:10px;border:1px solid #E8E8E8;">
  ${mirror}
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
    <span style="font-size:12px;font-weight:700;color:#1C1A2E;font-family:${INTER};">${label}</span>
    ${gradeBadge(item.grade, endYear)}
  </div>
  <p style="margin:0 0 8px;font-size:11px;color:#555;line-height:1.7;font-family:${INTER};">${esc(interp)}</p>
  ${transmute ? `<div style="border-top:1px solid #E0E0E0;padding-top:7px;margin-top:4px;"><p style="margin:0;font-size:11px;font-style:italic;color:#C9A84C;line-height:1.6;font-family:${INTER};"><strong>Higher octave:</strong> ${esc(transmute)}</p></div>` : ''}
</div>`;
}

// ── Pillar block ──────────────────────────────────────────────────────────────

function renderPillarBlock(
  pillar: PillarSummary,
  num: 1 | 2 | 3,
  title: string,
  subtitle: string,
  callout: string,
  goal: GoalCategory,
  goalShort: string,
  pillar2Items: GradeItem[],
  pillar3Items: GradeItem[],
  transits: PlanetaryTransit[],
  addressMoveDate: string,
  accentColor: string,
): string {
  const scoringItems = pillar.items.filter((i) => i.grade === 'F' || i.grade === 'C' || i.grade === 'A');

  const badgeStyle = num === 1
    ? 'background:#FFF0F0;color:#C0392B;border:1px solid #C0392B;'
    : num === 2
      ? 'background:#FFF9E6;color:#8B6914;border:1px solid #C9A84C;'
      : 'background:#FDF5E6;color:#7A5A1A;border:1px solid #9a7d4e;';

  const chartLabel = num === 3 ? 'Env Chart' : num === 2 ? 'Transit Chart' : 'House Chart';

  return `
<div style="margin-bottom:28px;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
    <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:2px;${badgeStyle}font-family:${INTER};">PILLAR ${num}</span>
    <span style="font-size:16px;font-weight:700;color:#1C1A2E;font-family:${CORMORANT};">${title} &mdash; ${subtitle}</span>
    <span style="margin-left:auto;font-size:18px;font-weight:900;color:${accentColor};font-family:${INTER};">
      ${pct(pillarScore(pillar), pillarScore(pillar))}%
    </span>
  </div>

  <p style="margin:0 0 12px;font-size:12px;font-style:italic;color:#7A5A1A;line-height:1.5;padding:7px 12px;background:rgba(201,168,76,0.06);border-bottom:1px solid rgba(201,168,76,0.18);border-radius:4px 4px 0 0;font-family:${CORMORANT};">${callout}</p>

  <div style="display:flex;gap:14px;align-items:flex-start;">
    <div style="flex-shrink:0;text-align:center;width:108px;">
      ${renderHouseWheel(pillar.items, 108)}
      <div style="font-size:9px;color:#999;margin-top:4px;font-family:${INTER};">${chartLabel}</div>
      <div style="font-size:8px;margin-top:3px;font-family:${INTER};">
        <span style="display:inline-block;width:7px;height:7px;background:#C0392B;border-radius:1px;vertical-align:middle;"></span><span style="color:#666;"> F</span>&nbsp;
        <span style="display:inline-block;width:7px;height:7px;background:#C9A84C;border-radius:1px;vertical-align:middle;"></span><span style="color:#666;"> C</span>&nbsp;
        <span style="display:inline-block;width:7px;height:7px;background:#2ecc71;border-radius:1px;vertical-align:middle;"></span><span style="color:#666;"> A</span>
      </div>
    </div>
    <div style="flex:1;">
      ${scoringItems.length === 0
        ? `<p style="font-size:12px;color:#2ecc71;font-style:italic;font-family:${INTER};">No significant pressure in this pillar — this dimension is working in your favor.</p>`
        : scoringItems.map((item) => renderAspectCard(item, goal, goalShort, transits)).join('')
      }
    </div>
  </div>

  ${renderPillarTimeline(num, pillar2Items, pillar3Items, transits, addressMoveDate)}
</div>`;
}

// ── PAGE 1: COVER ─────────────────────────────────────────────────────────────

function renderPage1(results: ConsolidatedResults, intake: ClientIntakeData, goal: GoalCategory): string {
  const { diagnostic } = results;
  if (!diagnostic) return '';

  const [p1, p2, p3] = diagnostic.pillars;
  const s1 = pillarScore(p1), s2 = pillarScore(p2), s3 = pillarScore(p3);
  const total = s1 + s2 + s3;
  const p1pct = pct(s1, total), p2pct = pct(s2, total), p3pct = pct(s3, total);

  const gc = gradeColor(diagnostic.finalGrade);

  const gradeHeadlines: Record<string, [string, string]> = {
    A: ['A means alignment is close —', 'One right move, and you can 10x your life.'],
    B: ["You're doing well —", "'doing well' and 'living fully' are two different things."],
    C: ['A passing grade —', 'but who wants a passing-grade life?'],
    D: ["D means you're one step away from failing —", "and you're probably feeling the pressure."],
    F: ['Rock bottom —', 'but rock bottom has a map out.'],
  };
  const [headH1, headH2] = gradeHeadlines[diagnostic.finalGrade] ?? ['Overall Deconditioning Score', ''];

  const forceCount = (diagnostic.totalFs ?? 0) + (diagnostic.totalCs ?? 0);
  const longest2 = getLongestMaleficTransit(diagnostic.allItems, results.calculators.transits?.transits ?? []);
  const endYr = longest2?.endYear ?? null;
  const yrsLeft = endYr ? endYr - new Date().getFullYear() : null;
  const descLine = endYr && yrsLeft
    ? `Your ${diagnostic.finalGrade} score traces back to ${forceCount} specific force${forceCount !== 1 ? 's' : ''} — all identified below. Left unaddressed, this configuration persists through ${endYr} — ${yrsLeft} more year${yrsLeft !== 1 ? 's' : ''} of a reality that passes, but doesn't 10x.`
    : `Your ${diagnostic.finalGrade} score traces back to ${forceCount} specific force${forceCount !== 1 ? 's' : ''} — all identified below. This configuration does not self-resolve without targeted intervention.`;

  // Pillar grades for breakdown bars
  function pillarGradeFor(p: PillarSummary): string {
    if (p.fCount > 0) return 'F';
    if (p.cCount > 0) return 'C';
    if (p.aCount > 0) return 'A';
    return '';
  }
  const barRows = [
    { label: 'Structure',    sub: 'Pillar 1', ppct: p1pct, color: '#C0392B', grade: pillarGradeFor(p1) },
    { label: 'Timing',       sub: 'Pillar 2', ppct: p2pct, color: '#C9A84C', grade: pillarGradeFor(p2) },
    { label: 'Environment',  sub: 'Pillar 3', ppct: p3pct, color: '#9a7d4e', grade: pillarGradeFor(p3) },
  ];

  return `
<!-- PAGE 1: COVER -->
<div style="background:#F5F1EB;padding:40px 48px;min-height:980px;color:#1C1A2E;">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #E8E8E8;margin-bottom:24px;">
    <div>
      <div style="font-size:22px;font-weight:700;color:#C9A84C;font-family:${CORMORANT};letter-spacing:-0.3px;">Pheydrus</div>
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#999;font-family:${INTER};margin-top:2px;">Proprietary 3-Pillar Analysis</div>
    </div>
    <div style="text-align:right;font-family:${INTER};">
      <div style="font-size:12px;color:#7A5A1A;font-weight:600;">${esc(results.userInfo.name)}</div>
      <div style="font-size:10px;color:#999;margin-top:2px;">${new Date(results.timestamp).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</div>
    </div>
  </div>

  <!-- Hero card: grade circle + headline + dynamic description -->
  <div style="background:#FFFFFF;border:1px solid #E0E0E0;border-radius:4px;padding:20px 24px;display:flex;gap:20px;align-items:flex-start;margin-bottom:20px;">
    <div style="flex-shrink:0;text-align:center;">
      <div style="width:90px;height:90px;border-radius:50%;border:2.5px solid ${gc.border};background:${gc.bg};display:flex;align-items:center;justify-content:center;margin:0 auto;">
        <span style="font-size:48px;font-weight:700;color:${gc.text};font-family:${CORMORANT};line-height:1;">${diagnostic.finalGrade}</span>
      </div>
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#999;margin-top:6px;font-family:${INTER};">Overall Score</div>
      <div style="font-size:12px;font-weight:700;color:${gc.text};font-family:${INTER};">${diagnostic.score % 1 === 0 ? diagnostic.score : diagnostic.score.toFixed(1)} / 100</div>
    </div>
    <div style="flex:1;">
      <div style="font-size:18px;font-weight:700;color:#1C1A2E;font-family:${CORMORANT};margin-bottom:10px;line-height:1.3;">${esc(headH1)} <em style="color:#8B6914;">${esc(headH2)}</em></div>
      <p style="margin:0;font-size:12px;color:#555;line-height:1.75;font-family:${INTER};">${descLine}</p>
    </div>
  </div>

  <!-- Score breakdown: horizontal bars + Venn -->
  <div style="background:#FFFFFF;border:1px solid #E8E8E8;border-radius:4px;padding:18px 22px;margin-bottom:20px;">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#999;font-family:${INTER};margin-bottom:14px;">Your Score Breaks Down As:</div>
    <div style="display:flex;gap:20px;align-items:center;">
      <div style="flex:1;">
        ${barRows.map((r) => {
          const gc2 = gradeColor(r.grade);
          const pill = r.grade ? `<span style="display:inline-block;padding:1px 7px;border-radius:2px;font-size:10px;font-weight:700;background:${gc2.bg};color:${gc2.text};border:1px solid ${gc2.border};font-family:${INTER};">${r.grade}</span>` : '';
          return `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:90px;flex-shrink:0;">
            <div style="font-size:12px;font-weight:700;color:#1C1A2E;font-family:${INTER};">${r.label}</div>
            <div style="font-size:9px;color:#999;font-family:${INTER};">${r.sub}</div>
          </div>
          <div style="flex:1;height:6px;background:#E8E8E8;border-radius:3px;">
            <div style="height:6px;width:${r.ppct}%;background:${r.color};border-radius:3px;"></div>
          </div>
          <div style="width:32px;text-align:right;font-size:12px;font-weight:700;color:${r.color};font-family:${INTER};">${r.ppct}%</div>
          ${pill}
        </div>`;
        }).join('')}
      </div>
      <div style="flex-shrink:0;text-align:center;">
        ${renderVennDiagram()}
        <div style="font-size:9px;color:#999;margin-top:4px;font-family:${INTER};">3 forces &middot; 1 score</div>
      </div>
    </div>
  </div>

  <!-- Goal bar -->
  <div style="border-left:4px solid #C9A84C;background:#FDFBF6;padding:10px 16px;margin-bottom:20px;border-radius:0 4px 4px 0;">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#C9A84C;font-family:${INTER};margin-bottom:4px;">90-Day Goal &middot; ${esc(GOAL_LABEL[goal])}</div>
    <p style="margin:0;font-size:13px;color:#7A5A1A;line-height:1.6;font-family:${CORMORANT};font-style:italic;">${esc(intake.desiredOutcome)}</p>
  </div>

  <!-- Reframe box -->
  <div style="border-left:4px solid #C9A84C;background:#FDFBF6;border-radius:0 4px 4px 0;padding:20px 24px;margin-bottom:20px;">
    <p style="margin:0;font-size:14px;font-style:italic;color:#7A5A1A;line-height:1.75;font-family:${CORMORANT};">If you've tried everything — the mindset work, the strategies, the coaches — and things are going <strong style="font-style:normal;color:#1C1A2E;">well enough</strong> but that one specific thing you want keeps slipping just out of reach… you're not factoring in the unseen forces that <strong style="font-style:normal;color:#1C1A2E;">cannot be intellectually solved.</strong> You've been 10x-capable this entire time. This report maps the forces working against you.</p>
  </div>

  <!-- Malefic box -->
  <div style="background:#FDFAF5;border:1px solid #E8E0C8;border-radius:4px;padding:20px 24px;">
    <div style="font-size:13px;font-weight:700;color:#C9A84C;font-family:${INTER};margin-bottom:10px;">Your score is not a verdict. It's an entry point.</div>
    <p style="margin:0 0 12px;font-size:12px;color:#555;line-height:1.75;font-family:${INTER};">The forces showing up in your report aren't there to make life hard — they're only hard when you don't know how to work with them. Every pressure point carries a higher octave: a transmuted version that becomes your greatest advantage once decoded.</p>
    <div style="border-left:3px solid #C9A84C;padding:8px 14px;">
      <p style="margin:0;font-size:12px;font-style:italic;color:#7A5A1A;line-height:1.7;font-family:${CORMORANT};">"Pluto transiting your 1st house? Stop playing nice. Stop softening your edges. Step fully into your power — that is the higher octave." &mdash; Pheydrus team</p>
    </div>
  </div>

</div>`;
}

// ── PAGE 2: WHY THIS KEEPS HAPPENING ─────────────────────────────────────────

function renderPage2(results: ConsolidatedResults, _intake: ClientIntakeData, __goal: GoalCategory): string {
  const longest = getLongestMaleficTransit(
    results.diagnostic!.allItems,
    results.calculators.transits?.transits ?? [],
  );
  const endYear = longest?.endYear ?? null;
  const yearsRemaining = endYear ? endYear - new Date().getFullYear() : null;

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

  return `
<!-- PAGE 2: WHY THIS KEEPS HAPPENING -->
<div style="background:#F5F1EB;padding:40px 48px;min-height:980px;color:#1C1A2E;">

  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:#999;font-family:${INTER};margin-bottom:8px;">The Pattern</div>
  <h2 style="margin:0 0 24px;font-size:34px;font-weight:700;color:#1C1A2E;font-family:${CORMORANT};line-height:1.2;letter-spacing:-0.5px;">Why This Keeps Happening</h2>

  <!-- Pull quote -->
  <div style="border-left:4px solid #C9A84C;padding:12px 20px;margin-bottom:24px;background:#FDFBF6;">
    <p style="margin:0;font-size:14px;font-style:italic;color:#7A5A1A;line-height:1.7;font-family:${CORMORANT};">"It's not normal to wake up every day with that quiet ache — knowing you've done everything right. The degree. The career. The inner work. And still feel like you're watching everyone else's life click into place while yours stays just out of reach."</p>
  </div>

  <!-- Body -->
  <p style="margin:0 0 14px;font-size:13px;color:#444;line-height:1.8;font-family:${INTER};">You are not behind. You are not broken. What you're experiencing is the friction of three invisible forces pulling against each other simultaneously. When these forces are misaligned, it doesn't matter how hard you work — life feels like pushing through water.</p>
  <p style="margin:0 0 14px;font-size:14px;font-weight:700;color:#C9A84C;line-height:1.6;font-family:${INTER};">When all three align — everything changes. Not gradually. Suddenly.</p>
  <p style="margin:0 0 28px;font-size:13px;color:#444;line-height:1.8;font-family:${INTER};">The right people appear. The income shifts. The version of you that you've been reaching for starts to feel like the version of you that simply is. This is what Pheydrus clients describe — not motivation, not mindset — but a fundamental unlocking of what was always already there.</p>

  <!-- Venn + Legend -->
  <div style="display:flex;gap:20px;align-items:flex-start;margin-bottom:28px;">
    <div style="flex-shrink:0;">
      ${renderVennDiagram()}
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:10px;">
      ${legendCards.map((c) => `
      <div style="background:#FFFFFF;border:1px solid #E8E8E8;border-radius:4px;padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="width:8px;height:8px;border-radius:50%;background:${c.dot};flex-shrink:0;display:inline-block;"></span>
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#999;font-family:${INTER};">${c.label}</span>
        </div>
        <p style="margin:0 0 5px;font-size:13px;font-style:italic;color:#C9A84C;line-height:1.55;font-family:${CORMORANT};">${esc(c.question)}</p>
        <p style="margin:0;font-size:11px;color:#666;line-height:1.6;font-family:${INTER};">${c.desc}</p>
      </div>`).join('')}
    </div>
  </div>

  <!-- Timeline warning -->
  <div style="background:#FFFFFF;border:1px solid #E8E8E8;border-radius:4px;padding:14px 18px;margin-bottom:16px;">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#C9A84C;font-family:${INTER};margin-bottom:8px;">&#9888; Active Pattern Window</div>
    <p style="margin:0;font-size:12px;color:#555;line-height:1.7;font-family:${INTER};">Without intervention, your current configuration is projected to persist ${endYear ? `<strong style="color:#C9A84C;">through ${endYear} — approximately ${yearsRemaining} more years</strong>` : '<strong style="color:#C9A84C;">for several more years</strong>'}. The primary driver is <strong style="color:#1C1A2E;">${longest ? esc(longest.planet) + ' transiting House ' + longest.house : 'the dominant outer planet transit'}</strong>, defining the exact window you are in right now. Knowing the window is half the advantage.</p>
  </div>

  <!-- Destiny bridge -->
  <div style="background:#F5FBF5;border:1px solid #C8E6C8;border-radius:4px;padding:16px 20px;">
    <p style="margin:0;font-size:13px;font-style:italic;color:#7A5A1A;line-height:1.75;font-family:${CORMORANT};">The patterns identified in this report aren't just about what's been holding you back. They are the exact conditions that <strong style="font-style:normal;color:#C9A84C;">precede a major identity shift</strong>. You are closer to the breakthrough than you are to the beginning. The question is whether you'll have a map when it arrives.</p>
  </div>

</div>`;
}

// ── PAGE 3: PILLAR BREAKDOWN ──────────────────────────────────────────────────

function renderPage3(results: ConsolidatedResults, intake: ClientIntakeData, goal: GoalCategory): string {
  const { diagnostic } = results;
  if (!diagnostic) return '';

  const [p1, p2, p3] = diagnostic.pillars;
  const s1 = pillarScore(p1), s2 = pillarScore(p2), s3 = pillarScore(p3);
  const total = s1 + s2 + s3;
  const transits = results.calculators.transits?.transits ?? [];
  const goalShort = GOAL_SHORT[goal];
  const clientLocation = results.userInfo.currentLocation || '';

  const p1pct = pct(s1, total);
  const p2pct = pct(s2, total);
  const p3pct = pct(s3, total);

  // Build pillar percentage display into the render call
  function withPct(p: PillarSummary, basePct: number): PillarSummary & { _pct: number } {
    return Object.assign(Object.create(Object.getPrototypeOf(p)), p, { _pct: basePct }) as PillarSummary & { _pct: number };
  }
  const p1x = withPct(p1, p1pct);
  const p2x = withPct(p2, p2pct);
  const p3x = withPct(p3, p3pct);

  // Inline pillar block to inject correct pct
  function block(
    pillar: PillarSummary,
    num: 1 | 2 | 3,
    title: string,
    subtitle: string,
    callout: string,
    pillarPct: number,
    accent: string,
  ): string {
    const scoringItems = pillar.items.filter((i) => i.grade === 'F' || i.grade === 'C' || i.grade === 'A');
    const badgeSty = num === 1
      ? 'background:#FFF0F0;color:#C0392B;border:1px solid #C0392B;'
      : num === 2
        ? 'background:#FFF9E6;color:#8B6914;border:1px solid #C9A84C;'
        : 'background:#FDF5E6;color:#7A5A1A;border:1px solid #9a7d4e;';
    const chartLabel = num === 3 ? 'Env Chart' : num === 2 ? 'Transit Chart' : 'House Chart';

    return `
<div style="margin-bottom:28px;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
    <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:2px;${badgeSty}font-family:${INTER};">PILLAR ${num}</span>
    <span style="font-size:16px;font-weight:700;color:#1C1A2E;font-family:${CORMORANT};">${title} &mdash; ${subtitle}</span>
    <span style="margin-left:auto;font-size:18px;font-weight:900;color:${accent};font-family:${INTER};">${pillarPct}%</span>
  </div>
  <p style="margin:0 0 12px;font-size:12px;font-style:italic;color:#7A5A1A;line-height:1.5;padding:7px 12px;background:rgba(201,168,76,0.06);border-bottom:1px solid rgba(201,168,76,0.18);border-radius:4px 4px 0 0;font-family:${CORMORANT};">${callout}</p>
  <div style="display:flex;gap:14px;align-items:flex-start;">
    <div style="flex-shrink:0;text-align:center;width:108px;">
      ${renderHouseWheel(pillar.items, 108)}
      <div style="font-size:9px;color:#999;margin-top:4px;font-family:${INTER};">${chartLabel}</div>
      <div style="font-size:8px;margin-top:3px;font-family:${INTER};">
        <span style="display:inline-block;width:7px;height:7px;background:#fca5a5;border-radius:1px;vertical-align:middle;"></span><span style="color:#666;"> F</span>&nbsp;
        <span style="display:inline-block;width:7px;height:7px;background:#fcd34d;border-radius:1px;vertical-align:middle;"></span><span style="color:#666;"> C</span>&nbsp;
        <span style="display:inline-block;width:7px;height:7px;background:#6ee7b7;border-radius:1px;vertical-align:middle;"></span><span style="color:#666;"> A</span>
      </div>
    </div>
    <div style="flex:1;">
      ${scoringItems.length === 0
        ? `<p style="font-size:12px;color:#16a34a;font-style:italic;font-family:${INTER};">No significant pressure in this pillar — this dimension is working in your favor.</p>`
        : scoringItems.map((item) => renderAspectCard(item, goal, goalShort, transits)).join('')
      }
    </div>
  </div>
  ${renderPillarTimeline(num, p2.items, p3.items, transits, intake.addressMoveDate)}
</div>`;
  }

  // Suppress unused variable warnings
  void p1x; void p2x; void p3x;
  void renderPillarBlock;

  return `
<!-- PAGE 3: PILLAR BREAKDOWN -->
<div style="background:#F5F1EB;padding:40px 48px;color:#1C1A2E;">

  <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:#999;font-family:${INTER};margin-bottom:8px;">What is Holding Back Your ${esc(GOAL_LABEL[goal])}</div>

  ${block(p1, 1, 'Structure', 'Your Energetic Blueprint',
    `Here is how Pillar 1 is specifically blocking your goal of ${esc(goalShort)}:`,
    p1pct, '#C0392B'
  )}

  <!-- Upgrade 7: Testimonial after Pillar 1 -->
  ${renderTestimonialCard(
    "[TESTIMONIAL] e.g. — 'I had the exact same Saturn/House 5 configuration. I'd been building the same offer in my head for two years. Within 60 days of working with the Pheydrus team, I launched, signed 3 clients, and finally felt like my energy matched my output.'",
    'Jordan M., Los Angeles'
  )}

  ${block(p2, 2, 'Timing', 'The Window You Are In',
    `Here is how your current timing window is directly affecting your ability to reach ${esc(goalShort)}:`,
    p2pct, '#C9A84C'
  )}

  ${block(p3, 3, 'Environment', 'Location & Address',
    `Here is how your current address${clientLocation ? ` in ${esc(clientLocation)}` : ''} is interacting with your goal of ${esc(goalShort)}:`,
    p3pct, '#9a7d4e'
  )}

  <!-- Upgrade 7: Testimonial after Pillar 3 -->
  ${renderTestimonialCard(
    "[TESTIMONIAL] e.g. — 'The environment piece was the one I almost skipped. After my Pillar 3 session I raised my rates by 40% and signed my highest-paying client that same week. The address work is real.'",
    'Priya K., New York'
  )}

</div>`;
}

// ── PAGE 4: COST OF INACTION + CTA ───────────────────────────────────────────

function renderPage4(results: ConsolidatedResults, intake: ClientIntakeData): string {
  const { finalGrade, pillars } = results.diagnostic!;
  const [p1, p2, p3] = pillars;
  const goal = detectGoalCategory(intake.desiredOutcome);
  const goalShort = GOAL_SHORT[goal];

  // CTA eligibility
  const wordCount = intake.desiredOutcome.trim().split(/\s+/).filter(Boolean).length;
  const soughtTherapyOrCoaches = intake.priorHelp.includes('therapy') || intake.priorHelp.includes('coaches');
  const notMonetizing = intake.currentSituation !== 'monetizing';
  const scoredCOrWorse = finalGrade === 'C' || finalGrade === 'F';
  const showCTA = wordCount > 1 && soughtTherapyOrCoaches && notMonetizing && scoredCOrWorse;

  // Active pillars for CTA copy
  const activePillars: number[] = [];
  if (p1.fCount + p1.cCount > 0) activePillars.push(1);
  if (p2.fCount + p2.cCount > 0) activePillars.push(2);
  if (p3.fCount + p3.cCount > 0) activePillars.push(3);

  // Longest transit
  const longest = getLongestMaleficTransit(
    results.diagnostic!.allItems,
    results.calculators.transits?.transits ?? [],
  );
  const endYear = longest?.endYear ?? null;
  const yearsRemaining = endYear ? endYear - new Date().getFullYear() : null;

  const yearLine = endYear
    ? `Without targeted deconditioning of the specific layers identified above, the data points to <strong>${endYear}</strong>.`
    : `Without targeted deconditioning of the specific layers identified above, this pattern does not self-resolve.`;

  // Suppress unused
  void activePillars;
  void showCTA;

  return `
<!-- PAGE 4: COST OF INACTION + DESTINY + CTA -->
<div style="background:#F5F1EB;padding:40px 48px;color:#1C1A2E;">

  <!-- Cost of Inaction -->
  <div style="background:#FFF5F5;border:1px solid #FAEAEA;border-radius:4px;padding:24px 28px;margin-bottom:20px;">
    <h3 style="margin:0 0 18px;font-size:22px;font-weight:700;color:#1C1A2E;font-family:${CORMORANT};line-height:1.3;">What Another Year of This Pattern Costs You</h3>
    ${[
      `Another 12 months of knowing exactly what to do — and watching yourself not do it.`,
      `Another year of income that almost hits ${esc(goalShort)}, but resets every time you get close.`,
      `Another year of brilliant ideas living in your drafts folder instead of the marketplace.`,
      `Another year of telling yourself next month will be different.`,
    ].map((line) => `<p style="margin:0 0 10px;font-size:13px;color:#555;line-height:1.7;font-family:${INTER};border-left:2px solid #C0392B;padding-left:12px;">${line}</p>`).join('')}
    <p style="margin:8px 0 6px;font-size:12px;color:#888;line-height:1.7;font-family:${INTER};">${yearLine}</p>
    ${yearsRemaining !== null && yearsRemaining > 0
      ? `<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#C0392B;font-family:${INTER};">That's ${yearsRemaining} more year${yearsRemaining !== 1 ? 's' : ''}.</p>`
      : ''}
    <p style="margin:0;font-size:15px;font-weight:700;color:#C9A84C;font-family:${INTER};">Or — you begin the decondition now.</p>
  </div>

  <!-- Testimonial after Cost of Inaction -->
  ${renderTestimonialCard(
    "[TESTIMONIAL] e.g. — 'I came in skeptical. Three years of coaches and nothing had actually shifted. I left my first session with a sequenced 90-day plan that made more sense than anything I'd tried before.'",
    'Marcus T., Chicago'
  )}

  <!-- Destiny block -->
  <div style="background:#F5FBF5;border:1px solid #C8E6C8;border-radius:4px;padding:20px 24px;margin-bottom:20px;">
    <h3 style="margin:0 0 14px;font-size:20px;font-weight:700;color:#C9A84C;font-family:${CORMORANT};">This is bigger than fixing what's broken.</h3>
    <p style="margin:0 0 10px;font-size:13px;color:#444;line-height:1.8;font-family:${INTER};">Understanding these pillars serves two purposes.</p>
    <p style="margin:0 0 10px;font-size:13px;color:#444;line-height:1.8;font-family:${INTER};">The first is <strong style="color:#1C1A2E;">closure</strong>. The painful patterns, the blocked seasons, the years of almost — they weren't your fault. They were forces you didn't have a map for. You were not failing. You were navigating blind.</p>
    <p style="margin:0 0 10px;font-size:13px;color:#444;line-height:1.8;font-family:${INTER};">The second purpose — and this is the more important one — is <strong style="color:#1C1A2E;">preparation</strong>.</p>
    <p style="margin:0 0 14px;font-size:13px;color:#444;line-height:1.8;font-family:${INTER};">Something is shifting. Your chart doesn't lie. The same forces that created the friction are now creating the conditions for the biggest expansion of your life. A new identity is forming. New opportunities are already in motion.</p>
    <div style="border-top:1px solid #C8E6C8;padding-top:14px;margin-top:4px;">
      <p style="margin:0;font-size:18px;font-style:italic;color:#1C1A2E;line-height:1.5;font-family:${CORMORANT};">The question is whether you'll have a map when it arrives. <span style="font-style:normal;font-weight:700;color:#C9A84C;">This call is how you get ready.</span></p>
    </div>
  </div>

  <!-- CTA box -->
  <div style="background:#FDFBF6;border:1px solid #C9A84C;border-radius:4px;padding:28px 32px;text-align:center;">
    <h3 style="margin:0 0 6px;font-size:21px;font-weight:700;color:#C9A84C;font-family:${CORMORANT};">Your Next Step: Alignment Strategy Call</h3>
    <p style="margin:0 0 18px;font-size:12px;color:#888;font-family:${INTER};">30-minute 1:1 with the Pheydrus team</p>

    <div style="text-align:left;max-width:420px;margin:0 auto 18px;">
      ${[
        `Map how to decondition the unseen forces shaping your reality and unlock the parts of you and your environment that can actually 10x your life`,
        `Prepare for the identity shift that's already in motion — and make sure you're ready when it arrives`,
        `Determine whether Artist's Way is your aligned next chapter`,
      ].map((b) => `<p style="margin:0 0 8px;font-size:12px;color:#7A5A1A;line-height:1.6;font-family:${INTER};">&rarr; ${b}</p>`).join('')}
    </div>

    <p style="margin:0 0 18px;font-size:14px;font-style:italic;color:#7A5A1A;font-family:${CORMORANT};line-height:1.6;">This will be the beginning of your true alignment journey.</p>

    <a href="https://calendly.com/pheydrus_strategy/1-1-alignment-strategy-call-clone-1"
       style="display:block;width:100%;max-width:420px;margin:0 auto 12px;padding:15px 24px;background:#C9A84C;color:#1C1A2E;font-weight:700;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;border-radius:2px;text-align:center;box-sizing:border-box;font-family:${INTER};">
      BOOK YOUR ALIGNMENT CALL &rarr;
    </a>
    <p style="margin:0;font-size:11px;color:#999;font-family:${INTER};">Complimentary &nbsp;&middot;&nbsp; No obligation &nbsp;&middot;&nbsp; Limited availability this cycle</p>
  </div>

  <!-- Footer -->
  <div style="margin-top:28px;padding-top:16px;border-top:1px solid #E8E8E8;display:flex;justify-content:space-between;align-items:center;font-family:${INTER};">
    <p style="margin:0;font-size:10px;color:#999;">Pheydrus Proprietary Analysis &nbsp;&middot;&nbsp; Confidential</p>
    <p style="margin:0;font-size:10px;color:#999;">${esc(results.userInfo.name)} &nbsp;&middot;&nbsp; ${new Date(results.timestamp).toLocaleDateString()}</p>
  </div>

</div>`;
}

// ── Full template ─────────────────────────────────────────────────────────────

export function generateClientReportTemplate(
  results: ConsolidatedResults,
  intake: ClientIntakeData,
): string {
  const goal = detectGoalCategory(intake.desiredOutcome);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pheydrus Report &mdash; ${esc(results.userInfo.name)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      margin: 0; padding: 0;
      background: #F5F1EB;
      color: #1C1A2E;
    }
    .page-break { page-break-after: always; break-after: page; }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body { font-size: 90%; }
      .page-break { page-break-after: always; }
      a { color: #1C1A2E !important; }
    }
  </style>
</head>
<body>
  <div class="page-break">${renderPage1(results, intake, goal)}</div>
  <div class="page-break">${renderPage2(results, intake, goal)}</div>
  <div class="page-break">${renderPage3(results, intake, goal)}</div>
  <div>${renderPage4(results, intake)}</div>
</body>
</html>`.trim();
}

export function generateClientReportFilename(results: ConsolidatedResults): string {
  const date = new Date(results.timestamp).toISOString().split('T')[0];
  const name = results.userInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
  return `Pheydrus_Client_Report_${name}_${date}.pdf`;
}
