/**
 * Client Report PDF Template
 * Generates a 3-page goal-aware interpretation report.
 *
 * Page 1 — The Big Reveal   : pillar % breakdown + pattern timeline
 * Page 2 — Pillar Deep Dive : goal-specific F/C bullet interpretations
 * Page 3 — Next Steps       : placeholder (content TBD)
 */

import type { ConsolidatedResults } from '../../models';
import type { ClientIntakeData } from '../../models/clientIntake';
import type { PillarSummary } from '../../models/diagnostic';
import {
  detectGoalCategory,
  getLongestMaleficTransit,
  getItemInterpretation,
  formatDuration,
  type GoalCategory,
} from './clientInterpretations';

// ── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c
  );
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

// ── Page 1: The Big Reveal ───────────────────────────────────────────────────

function renderPage1(
  results: ConsolidatedResults,
  intake: ClientIntakeData,
  _goal: GoalCategory
): string {
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
    results.calculators.transits?.transits ?? []
  );

  const timelineHtml = longest
    ? `<p style="margin:0 0 6px;">Based on your active malefic transits, if you continue navigating this the same way, the current pattern is positioned to persist for approximately <strong style="color:#dc2626;">${formatDuration(longest.endYear)}</strong>.</p>
       <p style="margin:0;color:#6b7280;">The longest-running active pressure comes from <strong>${esc(longest.planet)}</strong> transiting your House ${longest.house} — a slow-moving outer planet that does not back down quickly. This is not a forecast of doom; it is a map. Knowing the terrain is the first step to navigating it differently.</p>`
    : `<p style="margin:0;color:#6b7280;">No long-running malefic transits were identified in your active Pillar 2 window — the timing pressure you're experiencing may be shorter-cycle and more manageable than it feels.</p>`;

  const zeroMsg =
    total === 0
      ? `<p style="color:#059669;font-style:italic;">Your current energetic configuration shows minimal active pressure — your structural blueprint, timing, and environment are in relative alignment. The obstacles you're navigating may stem more from mindset and behavioral patterns than from energetic headwinds.</p>`
      : '';

  const goalExcerpt =
    intake.desiredOutcome.length > 120
      ? intake.desiredOutcome.slice(0, 120) + '…'
      : intake.desiredOutcome;

  return `
  <!-- PAGE 1: THE BIG REVEAL -->
  <div style="padding:40px 48px; min-height:900px; display:flex; flex-direction:column;">

    <!-- Header -->
    <div style="border-bottom:3px solid ${gc.border}; padding-bottom:20px; margin-bottom:28px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1 style="margin:0 0 4px;font-size:22px;color:#2d2a3e;letter-spacing:-0.5px;">Pheydrus Proprietary 3-Pillar Analysis</h1>
          <p style="margin:0;color:#6b6188;font-size:13px;">${esc(results.userInfo.name)} &nbsp;·&nbsp; Generated ${new Date(results.timestamp).toLocaleDateString()}</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:#6b6188;margin-bottom:4px;">OVERALL GRADE</div>
          <div style="width:56px;height:56px;border:3px solid ${gc.border};border-radius:10px;background:${gc.bg};display:flex;align-items:center;justify-content:center;margin-left:auto;">
            <span style="font-size:28px;font-weight:900;color:${gc.text};">${diagnostic.finalGrade}</span>
          </div>
          <div style="font-size:11px;color:#6b6188;margin-top:4px;">Score: ${diagnostic.score % 1 === 0 ? diagnostic.score : diagnostic.score.toFixed(1)}</div>
        </div>
      </div>
      ${goalExcerpt ? `<div style="margin-top:14px;padding:10px 14px;background:#faf8f5;border-left:3px solid #9a7d4e;border-radius:0 6px 6px 0;font-size:12px;color:#4a4560;"><strong style="color:#9a7d4e;">Your 90-day goal:</strong> ${esc(goalExcerpt)}</div>` : ''}
    </div>

    <!-- Big Reveal -->
    <div style="margin-bottom:32px;">
      <h2 style="font-size:17px;color:#2d2a3e;margin:0 0 8px;border:none;padding:0;letter-spacing:-0.3px;">&#9632;&nbsp; The Big Reveal</h2>
      <p style="margin:0 0 18px;color:#6b7280;font-size:13px;">Here is the breakdown of what is driving the pattern connected to your obstacle of "<em>${esc(intake.obstacle.slice(0, 80))}${intake.obstacle.length > 80 ? '…' : ''}</em>":</p>

      ${zeroMsg}

      ${
        total > 0
          ? `
      <!-- Pillar 1 -->
      <div style="display:flex;gap:12px;margin-bottom:16px;align-items:flex-start;">
        <div style="min-width:52px;padding:6px 0;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#dc2626;line-height:1;">${p1pct}%</div>
          <div style="font-size:9px;color:#9ca3af;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;">Structure</div>
        </div>
        <div style="flex:1;padding-top:4px;">
          <div style="font-size:13px;font-weight:700;color:#2d2a3e;margin-bottom:3px;">Pillar 1 — Your Energetic Blueprint</div>
          <p style="margin:0;font-size:12px;color:#4a4560;line-height:1.6;">This portion of your pattern originates from how you are structurally built — the planetary architecture you were born with. This is the permanent layer of your reality. It does not go away, but it can be mastered. Ignoring it means it operates in your shadow; understanding it gives you leverage.</p>
        </div>
      </div>

      <!-- Pillar 2 -->
      <div style="display:flex;gap:12px;margin-bottom:16px;align-items:flex-start;">
        <div style="min-width:52px;padding:6px 0;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#d97706;line-height:1;">${p2pct}%</div>
          <div style="font-size:9px;color:#9ca3af;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;">Timing</div>
        </div>
        <div style="flex:1;padding-top:4px;">
          <div style="font-size:13px;font-weight:700;color:#2d2a3e;margin-bottom:3px;">Pillar 2 — The Timing Window You Are In</div>
          <p style="margin:0;font-size:12px;color:#4a4560;line-height:1.6;">This is driven by slow-moving outer planets currently transiting through specific areas of your chart. This layer is temporary but powerful while active. Knowing when this window lifts gives you an honest timeline — and removes the unconscious story that "this is just how life is."</p>
        </div>
      </div>

      <!-- Pillar 3 -->
      <div style="display:flex;gap:12px;margin-bottom:0;align-items:flex-start;">
        <div style="min-width:52px;padding:6px 0;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#9a7d4e;line-height:1;">${p3pct}%</div>
          <div style="font-size:9px;color:#9ca3af;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;">Environment</div>
        </div>
        <div style="flex:1;padding-top:4px;">
          <div style="font-size:13px;font-weight:700;color:#2d2a3e;margin-bottom:3px;">Pillar 3 — Your Environmental Energy</div>
          <p style="margin:0;font-size:12px;color:#4a4560;line-height:1.6;">This comes from your current location and home address. Of the three layers, environment is the most immediately actionable — it can be changed. A misaligned environment doesn't cause the pattern, but it amplifies every other pressure point and makes the climb steeper than it needs to be.</p>
        </div>
      </div>
      `
          : ''
      }
    </div>

    <!-- Pattern Timeline -->
    <div style="background:#fef2f2;border:1px solid #f87171;border-radius:10px;padding:18px 20px;margin-top:auto;">
      <h3 style="margin:0 0 10px;font-size:14px;color:#991b1b;letter-spacing:-0.2px;">&#9200;&nbsp; Pattern Timeline</h3>
      ${timelineHtml}
    </div>

  </div>
  `;
}

// ── Page 2: Pillar Deep Dive ─────────────────────────────────────────────────

function renderPillarBullets(
  pillar: PillarSummary,
  goal: GoalCategory,
  transits: ConsolidatedResults['calculators']['transits']
): string {
  const scoringItems = pillar.items.filter(
    (i) => i.grade === 'F' || i.grade === 'C' || i.grade === 'A'
  );
  if (scoringItems.length === 0) {
    return '<p style="color:#059669;font-size:12px;margin:8px 0 0;font-style:italic;">No significant pressure identified in this pillar — this dimension is working in your favor.</p>';
  }

  return scoringItems
    .map((item) => {
      const interp = getItemInterpretation(item, goal, transits?.transits ?? []);
      const color = bulletColor(item.grade);
      const isAddress = item.section === 'Address';
      const label = isAddress
        ? `&#127968;&nbsp; Address Energy`
        : `&#9679;&nbsp; ${esc(item.source)}`;
      return `
    <div style="display:flex;gap:10px;margin-bottom:14px;align-items:flex-start;">
      <div style="width:3px;min-height:100%;background:${color};border-radius:2px;margin-top:2px;flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:700;color:#2d2a3e;">${label}</span>
          ${gradeBadge(item.grade)}
        </div>
        <p style="margin:0;font-size:12px;color:#4a4560;line-height:1.65;">${esc(interp)}</p>
      </div>
    </div>`;
    })
    .join('');
}

function renderPage2(
  results: ConsolidatedResults,
  _intake: ClientIntakeData,
  goal: GoalCategory
): string {
  const { diagnostic } = results;
  if (!diagnostic) return '';

  const [p1, p2, p3] = diagnostic.pillars;

  const pillarIntros: Record<1 | 2 | 3, string> = {
    1: `These are the energetic signatures encoded in your birth chart — the structural blueprint you came in with. They don't expire, but they can be mastered. What follows are the specific placements creating the most friction for your goal of ${GOAL_LABEL[goal].toLowerCase()}.`,
    2: `These are the slow-moving planetary forces currently transiting your chart — the timing window you are in right now. Each one includes how long it runs, giving you an honest timeline rather than an open-ended question mark.`,
    3: `Your current location and home address are either amplifying or dampening every other pressure in your chart. What follows is how your environmental energy is specifically interacting with your goal.`,
  };

  return `
  <!-- PAGE 2: PILLAR DEEP DIVE -->
  <div style="padding:40px 48px;">

    <h2 style="font-size:18px;color:#2d2a3e;margin:0 0 4px;border:none;padding:0;letter-spacing:-0.4px;">What is Holding Back Your ${esc(GOAL_LABEL[goal])}</h2>
    <p style="margin:0 0 28px;color:#6b7280;font-size:12px;">A pillar-by-pillar breakdown mapped directly to your stated outcome.</p>

    <!-- Pillar 1 -->
    <div style="margin-bottom:28px;padding:18px 20px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <span style="background:#fee2e2;color:#991b1b;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;border:1px solid #f87171;">PILLAR 1</span>
        <span style="font-size:14px;font-weight:700;color:#2d2a3e;">Structure — Your Energetic Blueprint</span>
        ${p1.fCount > 0 ? `<span style="font-size:11px;color:#dc2626;font-weight:600;">${p1.fCount} F${p1.fCount !== 1 ? "'s" : ''}</span>` : ''}
        ${p1.cCount > 0 ? `<span style="font-size:11px;color:#d97706;font-weight:600;">${p1.cCount} C${p1.cCount !== 1 ? "'s" : ''}</span>` : ''}
      </div>
      <p style="margin:0 0 14px;font-size:12px;color:#6b7280;font-style:italic;line-height:1.6;">${pillarIntros[1]}</p>
      ${renderPillarBullets(p1, goal, results.calculators.transits)}
    </div>

    <!-- Pillar 2 -->
    <div style="margin-bottom:28px;padding:18px 20px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
        <span style="background:#fffbeb;color:#92400e;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;border:1px solid #fbbf24;">PILLAR 2</span>
        <span style="font-size:14px;font-weight:700;color:#2d2a3e;">Timing — The Window You Are In</span>
        ${p2.fCount > 0 ? `<span style="font-size:11px;color:#dc2626;font-weight:600;">${p2.fCount} F${p2.fCount !== 1 ? "'s" : ''}</span>` : ''}
        ${p2.cCount > 0 ? `<span style="font-size:11px;color:#d97706;font-weight:600;">${p2.cCount} C${p2.cCount !== 1 ? "'s" : ''}</span>` : ''}
      </div>
      <p style="margin:0 0 14px;font-size:12px;color:#6b7280;font-style:italic;line-height:1.6;">${pillarIntros[2]}</p>
      ${renderPillarBullets(p2, goal, results.calculators.transits)}
    </div>

    <!-- Pillar 3 -->
    <div style="margin-bottom:0;padding:18px 20px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
        <span style="background:#f0ebe0;color:#78643a;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;border:1px solid #c4a96b;">PILLAR 3</span>
        <span style="font-size:14px;font-weight:700;color:#2d2a3e;">Environment — Location & Address</span>
        ${p3.fCount > 0 ? `<span style="font-size:11px;color:#dc2626;font-weight:600;">${p3.fCount} F${p3.fCount !== 1 ? "'s" : ''}</span>` : ''}
        ${p3.cCount > 0 ? `<span style="font-size:11px;color:#d97706;font-weight:600;">${p3.cCount} C${p3.cCount !== 1 ? "'s" : ''}</span>` : ''}
      </div>
      <p style="margin:0 0 14px;font-size:12px;color:#6b7280;font-style:italic;line-height:1.6;">${pillarIntros[3]}</p>
      ${renderPillarBullets(p3, goal, results.calculators.transits)}
    </div>

  </div>
  `;
}

// ── Page 3: Next Steps (placeholder) ────────────────────────────────────────

function renderPage3(results: ConsolidatedResults, intake: ClientIntakeData): string {
  return `
  <!-- PAGE 3: NEXT STEPS -->
  <div style="padding:40px 48px;min-height:900px;display:flex;flex-direction:column;">

    <h2 style="font-size:18px;color:#2d2a3e;margin:0 0 4px;border:none;padding:0;letter-spacing:-0.4px;">Your Next Steps</h2>
    <p style="margin:0 0 28px;color:#6b7280;font-size:12px;">Personalized guidance based on your 3-pillar assessment.</p>

    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#faf8f5;border-radius:12px;border:2px dashed #d4b896;padding:40px;text-align:center;">
      <div style="font-size:36px;margin-bottom:16px;">&#9733;</div>
      <p style="font-size:15px;font-weight:700;color:#2d2a3e;margin:0 0 8px;">Your personalized next-step plan will appear here.</p>
      <p style="font-size:13px;color:#6b7280;margin:0;max-width:320px;line-height:1.6;">This section is being prepared specifically for you based on your goals, your obstacle, and the pattern your 3-pillar analysis reveals.</p>
    </div>

    <!-- Footer -->
    <div style="margin-top:auto;padding-top:24px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">Pheydrus Proprietary Analysis &nbsp;·&nbsp; Confidential</p>
      <p style="margin:0;font-size:11px;color:#9ca3af;">${esc(results.userInfo.name)} &nbsp;·&nbsp; ${new Date(results.timestamp).toLocaleDateString()}</p>
    </div>

    <!-- Intake snapshot for advisor reference -->
    <div style="margin-top:16px;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:11px;color:#6b7280;">
      <strong style="color:#4a4560;">Assessment context:</strong>
      <span style="margin-left:8px;">Goal category: <strong>${intake.preferredSolution ? (intake.preferredSolution === 'coaching' ? '1:1 Done For You Calls' : intake.preferredSolution) : '—'}</strong></span>
      <span style="margin-left:12px;">Situation: <strong>${intake.currentSituation || '—'}</strong></span>
      ${intake.patternYear ? `<span style="margin-left:12px;">Pattern since: <strong>${esc(intake.patternYear)}</strong></span>` : ''}
    </div>

  </div>
  `;
}

// ── Full template ────────────────────────────────────────────────────────────

export function generateClientReportTemplate(
  results: ConsolidatedResults,
  intake: ClientIntakeData
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
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
