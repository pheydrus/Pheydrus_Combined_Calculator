/**
 * Client Report PDF Template
 * Generates a 3-page goal-aware interpretation report.
 *
 * Page 1 — The Big Reveal   : speedometer grade + client info + pillar pie chart + pattern timeline
 * Page 2 — Pillar Deep Dive : goal-specific F/C bullet interpretations + house wheel + timeline
 * Page 3 — Next Steps       : placeholder (content TBD)
 */

import type { ConsolidatedResults } from '../../models';
import type { ClientIntakeData } from '../../models/clientIntake';
import type { PillarSummary, GradeItem } from '../../models/diagnostic';
import type { PlanetaryTransit } from '../../models/calculators';
import { PREFERRED_SOLUTION_LABELS } from '../../models/clientIntake';
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

function gradeBadge(grade: string): string {
  const styles: Record<string, string> = {
    F: 'background:#fee2e2;color:#991b1b;border:1px solid #f87171;',
    C: 'background:#fffbeb;color:#92400e;border:1px solid #fbbf24;',
    A: 'background:#d1fae5;color:#065f46;border:1px solid #34d399;',
  };
  const style = styles[grade] ?? 'background:#f3f4f6;color:#6b7280;';
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;${style}">${grade}</span>`;
}

function bulletColor(grade: string): string {
  if (grade === 'F') return '#dc2626';
  if (grade === 'C') return '#d97706';
  if (grade === 'A') return '#059669';
  return '#9ca3af';
}

const GOAL_LABEL: Record<GoalCategory, string> = {
  career: 'Career & Financial Growth',
  love: 'Love & Relationships',
  general: 'Your Goals',
};

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function apt(cx: number, cy: number, r: number, deg: number): [number, number] {
  return [cx + r * Math.cos(toRad(deg)), cy + r * Math.sin(toRad(deg))];
}

// ── SVG: Speedometer gauge ────────────────────────────────────────────────────
// Exported for reuse in the React results page

export function renderSpeedometer(grade: string, score: number): string {
  // Arc: clockwise from 210° to 330°, passing through 270° (top of SVG)
  const cx = 100, cy = 90, r = 66;
  const W = 200, H = 115;

  const zones: Array<{ start: number; end: number; color: string }> = [
    { start: 210, end: 250, color: '#16a34a' }, // green  — A
    { start: 250, end: 280, color: '#2563eb' }, // blue   — B
    { start: 280, end: 305, color: '#d97706' }, // amber  — C
    { start: 305, end: 330, color: '#dc2626' }, // red    — F
  ];

  const gradeAngle: Record<string, number> = { A: 225, B: 260, C: 292, F: 318 };
  const needleAngle = gradeAngle[grade] ?? 318;

  const gradeColor: Record<string, string> = { A: '#059669', B: '#2563eb', C: '#d97706', F: '#dc2626' };
  const gc = gradeColor[grade] ?? '#dc2626';

  function arcSegment(s: number, e: number, color: string, sw: number): string {
    const [x1, y1] = apt(cx, cy, r, s);
    const [x2, y2] = apt(cx, cy, r, e);
    return `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="butt"/>`;
  }

  const [nx, ny] = apt(cx, cy, r - 10, needleAngle);
  const [alx, aly] = apt(cx, cy, r + 15, 207);
  const [flx, fly] = apt(cx, cy, r + 15, 333);

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${arcSegment(210, 330, '#e5e7eb', 12)}
  ${zones.map((z) => arcSegment(z.start, z.end, z.color, 12)).join('\n  ')}
  <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(2)}" y2="${ny.toFixed(2)}" stroke="${gc}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="${cx}" cy="${cy}" r="5" fill="#1f2937"/>
  <circle cx="${cx}" cy="${cy}" r="2.5" fill="white"/>
  <text x="${cx}" y="${cy + 20}" text-anchor="middle" font-size="26" font-weight="900" fill="${gc}" font-family="Arial,sans-serif">${grade}</text>
  <text x="${cx}" y="${cy + 33}" text-anchor="middle" font-size="9" fill="#9ca3af" font-family="Arial,sans-serif">Score: ${score % 1 === 0 ? score : score.toFixed(1)}</text>
  <text x="${alx.toFixed(1)}" y="${aly.toFixed(1)}" text-anchor="middle" font-size="9" fill="#16a34a" font-weight="700" font-family="Arial,sans-serif">A</text>
  <text x="${flx.toFixed(1)}" y="${fly.toFixed(1)}" text-anchor="middle" font-size="9" fill="#dc2626" font-weight="700" font-family="Arial,sans-serif">F</text>
</svg>`;
}

// ── SVG: Donut chart ──────────────────────────────────────────────────────────

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

// ── SVG: House wheel ──────────────────────────────────────────────────────────

export function renderHouseWheel(items: GradeItem[], size = 120): string {
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.44;
  const innerR = size * 0.22;
  const labelR = size * 0.34;

  // Build grade map: F > C > A priority
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
    const startDeg = -90 + i * 30;
    const endDeg = startDeg + 30;
    const grade = houseGrade[h];
    const fill = grade ? (FILL[grade] ?? '#f3f4f6') : '#f3f4f6';
    const stroke = grade ? 'white' : '#e5e7eb';

    const [x1, y1] = apt(cx, cy, outerR, startDeg);
    const [x2, y2] = apt(cx, cy, outerR, endDeg);
    const path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR.toFixed(2)} ${outerR.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

    const midDeg = startDeg + 15;
    const [tx, ty] = apt(cx, cy, labelR, midDeg);
    const fw = grade ? '700' : '400';
    const fc = grade ? '#1f2937' : '#9ca3af';

    segments.push(`<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  <text x="${tx.toFixed(1)}" y="${(ty + 3).toFixed(1)}" text-anchor="middle" font-size="7" fill="${fc}" font-weight="${fw}" font-family="Arial,sans-serif">${h}</text>`);
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

function renderPillarTimeline(
  pillarNum: 1 | 2 | 3,
  pillar2Items: GradeItem[],
  transits: PlanetaryTransit[],
  addressMoveDate: string,
): string {
  const style = `margin-top:12px;padding:8px 12px;background:#f9fafb;border-left:3px solid #9a7d4e;border-radius:0 6px 6px 0;font-size:11px;color:#6b7280;line-height:1.5;`;

  if (pillarNum === 1) {
    return `<div style="${style}"><strong style="color:#9a7d4e;">⏱ Timeline:</strong> Life-long — this is your permanent structural layer. It does not expire, but it can be consciously mastered.</div>`;
  }

  const endYear = getPillar2MaxEndYear(pillar2Items, transits);

  if (pillarNum === 2) {
    if (endYear) {
      const dur = formatDuration(endYear);
      return `<div style="${style}"><strong style="color:#9a7d4e;">⏱ Timeline:</strong> Active <strong style="color:#d97706;">${dur}</strong>. This window will lift — knowing when is half the advantage.</div>`;
    }
    return `<div style="${style}"><strong style="color:#9a7d4e;">⏱ Timeline:</strong> The active timing pressures are relatively short-cycle.</div>`;
  }

  // Pillar 3
  const durText = endYear
    ? `approximately <strong style="color:#d97706;">${formatDuration(endYear)}</strong>, mirroring your active transit window`
    : 'the duration of your active transit window';
  const addressNote =
    addressMoveDate
      ? ` <em>Reflection question: did this pattern intensify around <strong>${esc(addressMoveDate)}</strong> when you moved to your current address?</em>`
      : '';
  return `<div style="${style}"><strong style="color:#9a7d4e;">⏱ Timeline:</strong> Amplifies your active transits for ${durText}.${addressNote}</div>`;
}

// ── Page 1: The Big Reveal ───────────────────────────────────────────────────

function renderPage1(results: ConsolidatedResults, intake: ClientIntakeData, goal: GoalCategory): string {
  const { diagnostic } = results;
  if (!diagnostic) return '<p>No diagnostic data available.</p>';

  const [p1, p2, p3] = diagnostic.pillars;
  const s1 = pillarScore(p1);
  const s2 = pillarScore(p2);
  const s3 = pillarScore(p3);
  const total = s1 + s2 + s3;

  const p1pct = pct(s1, total);
  const p2pct = pct(s2, total);
  const p3pct = pct(s3, total);

  const gradeColors: Record<string, { bg: string; border: string; text: string }> = {
    A: { bg: '#ecfdf5', border: '#34d399', text: '#065f46' },
    B: { bg: '#eff6ff', border: '#60a5fa', text: '#1e40af' },
    C: { bg: '#fffbeb', border: '#fbbf24', text: '#92400e' },
    F: { bg: '#fef2f2', border: '#f87171', text: '#991b1b' },
  };
  const gc = gradeColors[diagnostic.finalGrade] ?? gradeColors['F'];

  const longest = getLongestMaleficTransit(
    diagnostic.allItems,
    results.calculators.transits?.transits ?? [],
  );

  const goalExcerpt = intake.desiredOutcome.length > 100
    ? intake.desiredOutcome.slice(0, 100) + '…'
    : intake.desiredOutcome;

  const obstacleExcerpt = intake.obstacle.length > 80
    ? intake.obstacle.slice(0, 80) + '…'
    : intake.obstacle;

  const prefLabel = intake.preferredSolution
    ? (PREFERRED_SOLUTION_LABELS[intake.preferredSolution] ?? intake.preferredSolution)
    : null;

  // Pattern timeline — 2 sentences, short
  const timelineHtml = longest
    ? `<div style="background:#fef2f2;border:1px solid #f87171;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#991b1b;">⏰ Pattern Timeline</p>
        <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">Your active planetary data points to this pattern persisting <strong style="color:#dc2626;">${formatDuration(longest.endYear)}</strong> if the current approach continues. The primary driver is <strong>${esc(longest.planet)}</strong> transiting House ${longest.house} — a slow-moving outer planet that defines the window you are working within.</p>
      </div>`
    : '';

  // Pillar definitions with preferred solution note
  const p3SecretSauce = `This is Pheydrus' "secret sauce" — your current location and home address carry an energetic signature that can neutralize or offset the negative effects of both Pillar 1 and Pillar 2 when properly aligned. Of the three layers, Pillar 3 is the most immediately actionable.`;

  const pillarDefs = [
    {
      pct: p1pct, color: '#ef4444', badge: 'PILLAR 1', label: 'Structure',
      text: `Your birth chart's permanent energetic architecture. This layer does not expire — malefic placements here are lifelong structural pressures that can be mastered but not removed.`,
    },
    {
      pct: p2pct, color: '#f59e0b', badge: 'PILLAR 2', label: 'Timing',
      text: `Slow-moving outer planets currently transiting specific areas of your chart. This layer is temporary but powerful while active — knowing when it lifts gives you an honest timeline for your situation.`,
    },
    {
      pct: p3pct, color: '#9a7d4e', badge: 'PILLAR 3', label: 'Environment',
      text: p3SecretSauce,
    },
  ];

  const zeroMsg = total === 0
    ? `<p style="color:#059669;font-size:12px;font-style:italic;margin:8px 0 0;">Your current energetic configuration shows minimal active pressure — structural, timing, and environmental layers are in relative alignment.</p>`
    : '';

  return `
<!-- PAGE 1: THE BIG REVEAL -->
<div style="padding:36px 44px;min-height:900px;display:flex;flex-direction:column;">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${gc.border};padding-bottom:16px;margin-bottom:18px;">
    <div style="flex:1;padding-right:16px;">
      <h1 style="margin:0 0 3px;font-size:19px;color:#2d2a3e;letter-spacing:-0.5px;font-family:Arial,sans-serif;">Pheydrus Proprietary 3-Pillar Analysis</h1>
      <p style="margin:0 0 8px;color:#6b6188;font-size:12px;font-family:Arial,sans-serif;">${esc(results.userInfo.name)} &nbsp;·&nbsp; ${new Date(results.timestamp).toLocaleDateString()}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:#6b7280;font-family:Arial,sans-serif;">
        ${intake.email ? `<span>✉ ${esc(intake.email)}</span>` : ''}
        ${intake.phone ? `<span>📱 ${esc(intake.phone)}</span>` : ''}
        ${results.userInfo.dateOfBirth ? `<span>🎂 ${esc(results.userInfo.dateOfBirth)}</span>` : ''}
        ${results.userInfo.currentLocation ? `<span>📍 ${esc(results.userInfo.currentLocation)}</span>` : ''}
      </div>
    </div>
    <div style="flex-shrink:0;text-align:center;">
      <div style="font-size:10px;color:#6b6188;margin-bottom:2px;font-family:Arial,sans-serif;letter-spacing:0.5px;text-transform:uppercase;">Overall Grade</div>
      ${renderSpeedometer(diagnostic.finalGrade, diagnostic.score)}
    </div>
  </div>

  ${goalExcerpt ? `<div style="padding:9px 14px;background:#faf8f5;border-left:3px solid #9a7d4e;border-radius:0 6px 6px 0;font-size:12px;color:#4a4560;margin-bottom:18px;font-family:Arial,sans-serif;"><strong style="color:#9a7d4e;">Goal focus (${esc(GOAL_LABEL[goal])}) — 90 days:</strong> ${esc(goalExcerpt)}</div>` : ''}

  <!-- Big Reveal -->
  <div style="margin-bottom:16px;">
    <h2 style="font-size:16px;color:#2d2a3e;margin:0 0 6px;letter-spacing:-0.3px;font-family:Arial,sans-serif;">&#9632;&nbsp; The Big Reveal</h2>
    <p style="margin:0 0 4px;font-size:12px;color:#4a4560;line-height:1.65;font-family:Arial,sans-serif;">Here is the breakdown of what is driving the pattern connected to your obstacle of "<em>${esc(obstacleExcerpt)}</em>."</p>
    <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.65;font-style:italic;font-family:Arial,sans-serif;">Based on thousands of sessions, analysis, and data compiled on Pheydrus students, we have discovered life-pattern predictors and how to potentially mitigate them with up to 95% accuracy. Please see your analysis below.</p>
  </div>

  ${zeroMsg}

  <!-- Pattern Timeline (above pie chart) -->
  ${timelineHtml}

  <!-- Pie chart + pillar definitions -->
  ${total > 0 ? `
  <div style="display:flex;gap:20px;align-items:flex-start;">
    <div style="flex-shrink:0;">
      ${renderDonutChart(p1pct, p2pct, p3pct)}
      <div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;">
        <div style="display:flex;align-items:center;gap:5px;font-size:10px;font-family:Arial,sans-serif;"><span style="width:10px;height:10px;background:#ef4444;border-radius:2px;display:inline-block;"></span><span style="color:#6b7280;">Pillar 1 — ${p1pct}%</span></div>
        <div style="display:flex;align-items:center;gap:5px;font-size:10px;font-family:Arial,sans-serif;"><span style="width:10px;height:10px;background:#f59e0b;border-radius:2px;display:inline-block;"></span><span style="color:#6b7280;">Pillar 2 — ${p2pct}%</span></div>
        <div style="display:flex;align-items:center;gap:5px;font-size:10px;font-family:Arial,sans-serif;"><span style="width:10px;height:10px;background:#9a7d4e;border-radius:2px;display:inline-block;"></span><span style="color:#6b7280;">Pillar 3 — ${p3pct}%</span></div>
      </div>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:12px;">
      ${pillarDefs.map((d) => `
      <div style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;border-left:3px solid ${d.color};background:#fff;">
        <div style="font-size:11px;font-weight:700;color:${d.color};margin-bottom:3px;font-family:Arial,sans-serif;">${d.badge} — ${d.label} <span style="font-size:16px;font-weight:900;float:right;color:${d.color};">${d.pct}%</span></div>
        <p style="margin:0 0 5px;font-size:11px;color:#4a4560;line-height:1.6;font-family:Arial,sans-serif;">${d.text}</p>
        ${prefLabel ? `<p style="margin:0;font-size:10px;color:#9a7d4e;font-style:italic;font-family:Arial,sans-serif;">Recommended path: <strong>${esc(prefLabel)}</strong> is well-suited for deconditioning the patterns in this pillar.</p>` : ''}
      </div>`).join('')}
    </div>
  </div>
  ` : ''}

</div>
`;
}

// ── Page 2: Pillar Deep Dive ─────────────────────────────────────────────────

function renderPillarBullets(
  pillar: PillarSummary,
  goal: GoalCategory,
  transits: ConsolidatedResults['calculators']['transits'],
): string {
  const scoringItems = pillar.items.filter((i) => i.grade === 'F' || i.grade === 'C' || i.grade === 'A');
  if (scoringItems.length === 0) {
    return '<p style="color:#059669;font-size:12px;margin:8px 0 0;font-style:italic;font-family:Arial,sans-serif;">No significant pressure identified in this pillar — this dimension is working in your favor.</p>';
  }

  return scoringItems
    .map((item) => {
      const interp = getItemInterpretation(item, goal, transits?.transits ?? []);
      const color = bulletColor(item.grade);
      const isAddress = item.section === 'Address';
      const label = isAddress ? '&#127968;&nbsp; Address Energy' : `&#9679;&nbsp; ${esc(item.source)}`;
      return `
    <div style="display:flex;gap:10px;margin-bottom:12px;align-items:flex-start;">
      <div style="width:3px;min-height:100%;background:${color};border-radius:2px;margin-top:2px;flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:#2d2a3e;font-family:Arial,sans-serif;">${label}</span>
          ${gradeBadge(item.grade)}
        </div>
        <p style="margin:0;font-size:11.5px;color:#4a4560;line-height:1.65;font-family:Arial,sans-serif;">${esc(interp)}</p>
      </div>
    </div>`;
    })
    .join('');
}

function renderPage2(results: ConsolidatedResults, intake: ClientIntakeData, goal: GoalCategory): string {
  const { diagnostic } = results;
  if (!diagnostic) return '';

  const [p1, p2, p3] = diagnostic.pillars;
  const transits = results.calculators.transits?.transits ?? [];

  const pillarIntros: Record<1 | 2 | 3, string> = {
    1: `These are the energetic signatures encoded in your birth chart — the structural blueprint you came in with. They don't expire, but they can be mastered. What follows are the specific placements creating the most friction for your goal of ${GOAL_LABEL[goal].toLowerCase()}.`,
    2: `These are the slow-moving planetary forces currently transiting your chart — the timing window you are in right now. Each one includes how long it runs, giving you an honest timeline rather than an open-ended question mark.`,
    3: `Your current location and home address are either amplifying or dampening every other pressure in your chart. What follows is how your environmental energy is specifically interacting with your goal.`,
  };

  const pillarStyles: Record<1 | 2 | 3, { badge: string; accent: string }> = {
    1: { badge: 'background:#fee2e2;color:#991b1b;border:1px solid #f87171;', accent: '#f87171' },
    2: { badge: 'background:#fffbeb;color:#92400e;border:1px solid #fbbf24;', accent: '#fbbf24' },
    3: { badge: 'background:#f0ebe0;color:#78643a;border:1px solid #c4a96b;', accent: '#c4a96b' },
  };

  function renderPillarSection(pillar: PillarSummary, num: 1 | 2 | 3, title: string, subtitle: string): string {
    const ps = pillarStyles[num];
    return `
    <div style="margin-bottom:24px;padding:16px 18px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
        <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;${ps.badge}font-family:Arial,sans-serif;">PILLAR ${num}</span>
        <span style="font-size:13px;font-weight:700;color:#2d2a3e;font-family:Arial,sans-serif;">${title} — ${subtitle}</span>
        ${pillar.fCount > 0 ? `<span style="font-size:11px;color:#dc2626;font-weight:600;font-family:Arial,sans-serif;">${pillar.fCount} F${pillar.fCount !== 1 ? "'s" : ''}</span>` : ''}
        ${pillar.cCount > 0 ? `<span style="font-size:11px;color:#d97706;font-weight:600;font-family:Arial,sans-serif;">${pillar.cCount} C${pillar.cCount !== 1 ? "'s" : ''}</span>` : ''}
      </div>
      <p style="margin:0 0 12px;font-size:11px;color:#6b7280;font-style:italic;line-height:1.6;font-family:Arial,sans-serif;">${pillarIntros[num]}</p>

      <!-- Content: bullets left, house wheel right -->
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <div style="flex:1;">
          ${renderPillarBullets(pillar, goal, results.calculators.transits)}
        </div>
        <div style="flex-shrink:0;text-align:center;width:120px;">
          ${renderHouseWheel(pillar.items)}
          <div style="font-size:9px;color:#9ca3af;margin-top:4px;font-family:Arial,sans-serif;">House Chart</div>
          <div style="font-size:8px;margin-top:3px;font-family:Arial,sans-serif;">
            <span style="display:inline-block;width:8px;height:8px;background:#fca5a5;border-radius:1px;vertical-align:middle;"></span><span style="color:#6b7280;"> F</span>&nbsp;
            <span style="display:inline-block;width:8px;height:8px;background:#fcd34d;border-radius:1px;vertical-align:middle;"></span><span style="color:#6b7280;"> C</span>&nbsp;
            <span style="display:inline-block;width:8px;height:8px;background:#6ee7b7;border-radius:1px;vertical-align:middle;"></span><span style="color:#6b7280;"> A</span>
          </div>
        </div>
      </div>

      ${renderPillarTimeline(num, p2.items, transits, intake.addressMoveDate)}
    </div>`;
  }

  return `
<!-- PAGE 2: PILLAR DEEP DIVE -->
<div style="padding:36px 44px;">
  <h2 style="font-size:17px;color:#2d2a3e;margin:0 0 3px;letter-spacing:-0.4px;font-family:Arial,sans-serif;">What is Holding Back Your ${esc(GOAL_LABEL[goal])}</h2>
  <p style="margin:0 0 22px;color:#6b7280;font-size:11px;font-family:Arial,sans-serif;">A pillar-by-pillar breakdown mapped directly to your stated outcome.</p>

  ${renderPillarSection(p1, 1, 'Structure', 'Your Energetic Blueprint')}
  ${renderPillarSection(p2, 2, 'Timing', 'The Window You Are In')}
  ${renderPillarSection(p3, 3, 'Environment', 'Location & Address')}
</div>
`;
}

// ── Page 3: Next Steps ────────────────────────────────────────────────────────

function renderPage3(results: ConsolidatedResults, intake: ClientIntakeData): string {
  return `
<!-- PAGE 3: NEXT STEPS -->
<div style="padding:36px 44px;min-height:900px;display:flex;flex-direction:column;">
  <h2 style="font-size:17px;color:#2d2a3e;margin:0 0 3px;letter-spacing:-0.4px;font-family:Arial,sans-serif;">Your Next Steps</h2>
  <p style="margin:0 0 24px;color:#6b7280;font-size:11px;font-family:Arial,sans-serif;">Personalized guidance based on your 3-pillar assessment.</p>

  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#faf8f5;border-radius:12px;border:2px dashed #d4b896;padding:40px;text-align:center;">
    <div style="font-size:36px;margin-bottom:16px;">&#9733;</div>
    <p style="font-size:15px;font-weight:700;color:#2d2a3e;margin:0 0 8px;font-family:Arial,sans-serif;">Your personalized next-step plan will appear here.</p>
    <p style="font-size:12px;color:#6b7280;margin:0;max-width:320px;line-height:1.6;font-family:Arial,sans-serif;">This section is being prepared specifically for you based on your goals, your obstacle, and the pattern your 3-pillar analysis reveals.</p>
  </div>

  <div style="margin-top:auto;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-family:Arial,sans-serif;">
    <p style="margin:0;font-size:10px;color:#9ca3af;">Pheydrus Proprietary Analysis &nbsp;·&nbsp; Confidential</p>
    <p style="margin:0;font-size:10px;color:#9ca3af;">${esc(results.userInfo.name)} &nbsp;·&nbsp; ${new Date(results.timestamp).toLocaleDateString()}</p>
  </div>

  <div style="margin-top:14px;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:10px;color:#6b7280;font-family:Arial,sans-serif;">
    <strong style="color:#4a4560;">Assessment context:</strong>
    <span style="margin-left:8px;">Preferred format: <strong>${intake.preferredSolution ? esc(PREFERRED_SOLUTION_LABELS[intake.preferredSolution] ?? intake.preferredSolution) : '—'}</strong></span>
    <span style="margin-left:10px;">Situation: <strong>${intake.currentSituation || '—'}</strong></span>
    ${intake.patternYear ? `<span style="margin-left:10px;">Pattern since: <strong>${esc(intake.patternYear)}</strong></span>` : ''}
    ${intake.priorHelp.length > 0 ? `<span style="margin-left:10px;">Prior help: <strong>${esc(intake.priorHelp.join(', '))}</strong></span>` : ''}
  </div>
</div>
`;
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
  <title>Pheydrus Report — ${esc(results.userInfo.name)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.5;
      color: #1f2937;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    h1, h2, h3 { font-weight: 700; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
  <div class="page-break">
    ${renderPage1(results, intake, goal)}
  </div>
  <div class="page-break">
    ${renderPage2(results, intake, goal)}
  </div>
  <div>
    ${renderPage3(results, intake)}
  </div>
</body>
</html>
  `.trim();
}

export function generateClientReportFilename(results: ConsolidatedResults): string {
  const date = new Date(results.timestamp).toISOString().split('T')[0];
  const name = results.userInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
  return `Pheydrus_Client_Report_${name}_${date}.pdf`;
}
