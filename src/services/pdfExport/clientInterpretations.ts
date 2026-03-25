/**
 * Client Report Interpretations
 * Goal-aware text copy for the 3-pillar client PDF report.
 *
 * F grade  = shadow/unconscious — how this placement actively blocks the goal
 * C grade  = can go either way — conscious vs. unconscious path described
 * Transit items include the remaining duration of the transit
 */

import type { GradeItem } from '../../models/diagnostic';
import type { PlanetaryTransit } from '../../models/calculators';

// ── Goal detection ──────────────────────────────────────────────────────────

export type GoalCategory = 'career' | 'love' | 'general';

const CAREER_KEYWORDS = [
  'money', 'career', 'business', 'income', 'revenue', 'client', 'sale', 'job',
  'wealth', 'financial', 'work', 'launch', 'company', 'startup', 'invest',
  'profit', 'scale', 'brand', 'grow', 'promotion', 'success', 'entrepreneur',
];
const LOVE_KEYWORDS = [
  'love', 'relationship', 'partner', 'marriage', 'date', 'romantic', 'soulmate',
  'boyfriend', 'girlfriend', 'husband', 'wife', 'connection', 'intimacy', 'heart',
  'meet someone', 'find love',
];

export function detectGoalCategory(text: string): GoalCategory {
  const t = text.toLowerCase();
  const c = CAREER_KEYWORDS.filter((k) => t.includes(k)).length;
  const l = LOVE_KEYWORDS.filter((k) => t.includes(k)).length;
  return l > c ? 'love' : 'career';
}

// ── Transit duration helpers ─────────────────────────────────────────────────

function parseEndYear(s: string): number {
  const nums = s
    .replace(/[^\d/]/g, '')
    .split('/')
    .map(Number)
    .filter((n) => n > 2000);
  return nums.length ? Math.max(...nums) : 2030;
}

export function getTransitEndYear(planet: string, transits: PlanetaryTransit[]): number | null {
  const t = transits.find((x) => x.planet === planet);
  return t ? parseEndYear(t.current.end) : null;
}

export function formatDuration(endYear: number): string {
  const rem = endYear - new Date().getFullYear();
  if (rem <= 0) return `through ${endYear}`;
  return `through ${endYear} (~${rem} more year${rem === 1 ? '' : 's'})`;
}

export function getLongestMaleficTransit(
  items: GradeItem[],
  transits: PlanetaryTransit[]
): { planet: string; house: number; endYear: number } | null {
  const fItems = items.filter(
    (i) =>
      i.pillar === 2 &&
      i.section === 'Transit Angular' &&
      i.grade === 'F' &&
      i.planet &&
      i.house
  );
  const cItems = items.filter(
    (i) =>
      i.pillar === 2 &&
      i.section === 'Transit Angular' &&
      i.grade === 'C' &&
      i.planet &&
      i.house
  );
  const pool = fItems.length > 0 ? fItems : cItems;
  let best: { planet: string; house: number; endYear: number } | null = null;
  for (const item of pool) {
    if (!item.planet || !item.house) continue;
    const y = getTransitEndYear(item.planet, transits);
    if (y && (!best || y > best.endYear))
      best = { planet: item.planet, house: item.house, endYear: y };
  }
  return best;
}

// ── F grade interpretation copy (natal, relocation, angular transit) ─────────

const F_INTERP: Record<string, Partial<Record<number, { career: string; love: string }>>> = {
  Pluto: {
    1: {
      career:
        'Pluto in house 1 creates magnetic intensity that triggers immediate respect or immediate challenge — rarely neutral. People sense the power before trust is built. This intensity, untempered, becomes a barrier to leadership. The breakthrough happens when the force becomes deliberate instead of just present.',
      love:
        'Clients with this placement bring overwhelming depth to early connections. The intensity that should attract keeps people at distance until they understand the difference between being triggered and being transformed. Love requires the other person to survive the impact.',
    },
    5: {
      career:
        'Pluto in house 5 destroys creative work at the moment it\'s ready to be seen. The pattern repeats: build, burn, rebuild. The mechanism: transformation fear masked as perfectionism. The breakthrough: finishing and sharing imperfection, not waiting for the next cycle.',
      love:
        'All-or-nothing intensity in relationships. Obsession that burns out in 90 days. The core issue: inability to gradually build intimacy — every connection must transform completely or end. Real partnership requires the capacity to sustain moderate connection over time.',
    },
    7: {
      career:
        'Pluto in house 7 turns partnerships into power struggles. Business collaborations become control battles before they produce results. The core mechanism: inability to trust equal partnership — transformation (of the relationship) feels mandatory. Real collaboration requires shared leadership without dominance.',
      love:
        'Relationships become negotiations about control. The depth clients need requires surrender; they need power. The result: fated connections that transform into exhaustion. Real intimacy requires releasing the need to control the transformation itself.',
    },
    10: {
      career:
        'Pluto in house 10: Powerful professional presence that triggers conflict with authority instead of recognition. Advancement repeats a pattern—reach final round, lose to reputation friction with someone above. The mechanism: unconscious power struggle with authority. Mastery requires directing intensity toward contribution, not dominance.',
      love:
        'Career becomes the primary relationship. Partners are secondary. The person is unable to deprioritize work enough for genuine partnership. Real love requires that career not be the most important transformation in their life.',
    },
  },
    1: {
      career:
        'Saturn in house 1 creates extreme reliability that keeps you at arm\'s length from leadership. Professionalism becomes the barrier. People trust you; they don\'t follow you. The mechanism: emotional distance disguised as competence. Leadership requires people to feel you, not just respect you.',
      love:
        'Vulnerability is withheld across relationships. Self-protection that succeeds in keeping safe also succeeds in keeping lonely. Partners never truly know you. The cost: intimacy requires consistent vulnerability, not strategic sharing.',
    },
    5: {
      career:
        'Saturn in house 5: Creative work is complete but never shown. The work anxiety is solved; the visibility anxiety remains. The mechanism: fear of judgment masquerading as perfectionism. Breakthrough: publishing imperfect work and surviving the judgment.',
      love:
        'Saturn in house 5: Relationships remain hidden or unavailable. The person creates intimacy barriers before partnership can form. Fear of judgment prevents letting anyone see the genuine person. Real connection requires risking visibility.',
    },
    7: {
      career:
        'Saturn in house 7: Partnerships dissolve before they produce results. The pattern: control of the other person or rigid restrictiveness as stakes rise. The mechanism: fear of vulnerability masked as standards. Real partnership requires releasing control to allow collaborative success.',
      love:
        'High standards for partnership create chronic singleness. The person spends years finding reasons they aren\'t quite right. Protecting from disappointment prevents meeting anyone. Real love requires lowering the barriers enough to actually let someone in.',
    },
    10: {
      career:
        'Saturn in house 10: Always prepared but never promoted. Recognition recedes as you approach it. The mechanism: unconscious fear of actual authority creating delay patterns. Mastery requires claiming the position before feeling ready — readiness never arrives at Saturn-10.',
      love:
        'Partners are rewards for achievement, not genuine companions. Achievement energy colonizes the love life. Real intimacy requires surrender and presence, not performance. The relationship becomes another goal to accomplish, which prevents it from becoming real.',
    },
  },
    1: {
      career:
        'Uranus in house 1: Unpredictable presence that reads as unreliable. Brilliant in bursts, inconsistent in execution. The mechanism: the self genuinely changes day to day; people build on consistency. Teams cannot form around someone who isn\'t stable. Reliability requires showing up as the same person.',
      love:
        'Partners cannot locate you. Emotional unavailability masked as freedom. The person changes positions about the relationship constantly. Real partnership requires enough consistency that the other person can actually trust what you feel.',
    },
    5: {
      career:
        'Uranus in house 5: Creative projects launch repeatedly but never sustain past initial momentum. Real interest, real work, real potential — then disappearance. The mechanism: urge to create stronger than urge to finish. Mastery: completing one project before starting the next.',
      love:
        'Uranus in house 5: Relationships ignite and extinguish in cycles. The intensity is real; the staying power isn\'t. Pattern repeats with different people. Real partnership requires resisting the urge to leave at the moment things become steady.',
    },
    7: {
      career:
        'Uranus in house 7: Partnerships collapse at moment of highest stakes. The pattern: pull back when success nears. The mechanism: fear of being locked in disguised as freedom. Mastery: honoring freedom without destroying the shared structure.',
      love:
        'Intense closeness triggers overwhelming need for space. The cycle repeats: connection → suffocation → distance → repeat. Real partnership requires staying through the moments where freedom feels like a requirement to escape.',
    },
    10: {
      career:
        'Uranus in house 10: Stable roles become suffocating urgently. Conventional career paths collapse; unconventional ones thrive. The mechanism: the system is the cage. Traditional advancement feels impossible to sustain. Mastery: building an unconventional structure and staying in it.',
      love:
        'Professional chaos (constant pivots, reinvention, unpredictable income) destabilizes partnerships. Partners want stability; Uranus-10 produces whipsaw. Real love requires either the partner having equal Uranus energy, or the professional chaos needing to stabilize.',
    },
  },
    1: {
      career:
        'Mars in house 1: Directness reads as aggression before trust is built. Sharp presence that creates friction before proof arrives. Three clients, three lost relationships, same cause. The mechanism: force without relationship. Mastery: pacing intensity to match the other person\'s capacity to receive it.',
      love:
        'Initial intensity that compels becomes exhaustion that repels. Relationships start at competition intensity and never shift down. Real partnership requires taking the foot off the accelerator. The person cannot sustain lower-intensity connection.',
    },
    5: {
      career:
        'Mars in house 5: Launch projects in rapid sequence but cannot sustain the slower work it takes to actually close them. Three offers, three incomplete. The mechanism: initial urgency is addictive; execution feels like torture. Mastery: completing one offer before the false urgency of the next appears.',
      love:
        'Relationships combust intensely then become unbearable. Initial excitement at maximum; cannot sustain normal connection. The combustion consumes the oxygen intimacy needs. Real partnership requires the ability to love at lower intensity for longer.',
    },
    7: {
      career:
        'Mars in house 7: Every negotiation ends badly; either too aggressive or completely capitulated. Business partnerships become zero-sum contests. The mechanism: inability to collaborate as equals; competition is the only frame. Mastery: negotiating win-win, not win-lose.',
      love:
        'Arguments become combat. Win or leave; no middle ground. Conflict resolution requires fighting, not conversation. This energy ends relationships with people who genuinely love. Real partnership requires the capacity to disagree without battle.',
    },
    10: {
      career:
        'Mars in house 10: Visibility that creates recognition also creates enemies. Same directness that earns notice also generates formal complaints. The mechanism: force without diplomacy in high-stakes professional moments. Three complaints before VP consideration collapses it. Mastery: visible leadership without generating opposition.',
      love:
        'The person approaches the partner as an achievement goal, not as a person. Career energy colonizes intimacy. Love requires choosing the person daily, not accomplishing them. This placement makes partners feel like objectives rather than companions.',
    },
  },
    1: {
      career:
        'Neptune in house 1: Different identity in every room. The person genuinely doesn\'t know which version is real. The mechanism: perfect adaptation to others\'s expectations creates an authenticity void that people sense. Clients cannot trust a version that exists only for them. Real presence requires showing the same self consistently.',
      love:
        'Partner never meets the actual person—only calibrated versions. The person demonstrates perfect care by being what they think is wanted. This makes genuine connection impossible because the relationship is with an illusion, not a person. Real love requires showing your actual self.',
    },
    5: {
      career:
        'Neptune in house 5: Perfect vision in imagination becomes unrecognizable in execution. The mechanics: vision exists at Neptune altitude; execution requires earth language. Mastery: getting the vision on paper first, imperfectly, before assuming it\'s unspeakable.',
      love:
        'Neptune in house 5: Relationships exist beautifully in fantasy; reality is disappointing. The person projects who they want their partner to be instead of seeing who they are. Real intimacy requires lowering the vision to match the actual person.',
    },
    7: {
      career:
        'Neptune in house 7: Trust without clarity creates partnership disaster. Business partner fraud that the person sensed but couldn\'t name. The mechanism: intuition says no, but inability to demand clarity overrides the signal. Mastery: treating bad feelings as enough reason to have the conversation.',
      love:
        'Falling in love with the person they project, not the person who exists. Discovering at six months that the partner they loved was imagined. Same cycle repeats with different people. Real love requires seeing who the person actually is, not building them from what you need.',
    },
    10: {
      career:
        'Neptune in house 10: Career direction changes in every conversation. Vision is genuinely inspired; clarity never arrives. The mechanism: the person is inspired by possibility, not committed to specificity. The direction shifts before becoming concrete. Mastery: committing to one direction despite the pull toward others.',
      love:
        'Professional dream keeps expanding to delay partnership. Always "about to be ready" but never quite here. The people who might be right move on while the person is perpetually preparing. Real love requires being ready now, not someday when conditions align perfectly.',
    },
  },
    7: {
      career:
        'Sun in house 7: Magnetic presence that attracts clients but cannot close paid agreements. The mechanism: difficulty translating magnetism into money conversations. People want to be near you; they don\'t want to pay you. Mastery: making the money ask as natural as the magnetism.',
      love:
        'Sun in house 7: Magnetic in relationship but the intimacy remains abstract. People are attracted; genuine vulnerability doesn\'t follow. The connection is idealized, not real. Real partnership requires depth that matches the magnetism.',
    },
    8: {
      career:
        'Sun in house 8: Running business at 60% of actual value for years. Every price increase stays in drafts. The mechanism: discomfort with claiming what you\'ve earned. The belief in your worth doesn\'t match your ask. Mastery: charging what clients already know you\'re worth.',
      love:
        'Choosing relationships where you\'re the capable one, then resenting the burden. The worth you don\'t believe in recreates partnerships that confirm the doubt. Real love requires choosing someone who makes you feel capable, not someone you need to fix.',
    },
    12: {
      career:
        'Clients who have this placement often have a hard time being seen or heard. Therefore leaving relationship or business oportunities on the table. Sun in the 12 house is all about your "light" aka talents being kept in the dark.',
      love:
        'One client described always feeling slightly less real in relationships than the person she was with — like she was watching herself participate rather than actually being there. The love she wanted required being fully seen, and being fully seen was the thing she was least able to allow.',
    },
  },
    8: {
      career:
        'Venus in house 8: Accepts unacceptable payment terms. Every contract contains concessions you wouldn\'t advise a friend to make. The mechanism: fear of the relationship rupture overrides worth claims. Value exists; the willingness to claim it doesn\'t. Mastery: valuing the relationship less than your value.',
      love:
        'Relationships go from "maximum I\'ve ever felt" to "I don\'t recognize this" with no middle. All-or-nothing intensity on love\'s timeline. The complexity of real partnership feels like something\'s wrong because it doesn\'t match the intensity peak. Real love requires surviving the dip.',
    },
    8: {
      career:
        'Venus in house 12: Most talented person no one talks about. Capabilities stay private. The mechanism: reluctance to be fully seen, despite the need for recognition. Career stays two promotions behind capability. Mastery: making your work visible enough to match its value.',
      love:
        'Most attractive qualities kept in reserve. Waiting for safety that never comes. Five years in, the moment to share still hasn\'t arrived. The love she could give requires risking visibility. Real intimacy requires showing the most attractive parts, not protecting them.',
    },
  },
};

// ── C grade interpretation copy (Pillar 2 pressure-house transits) ────────────

const TRANSIT_C_INTERP: Record<string, Partial<Record<number, (year: number) => string>>> = {
  Pluto: {
    2: (_y) =>
      `A Pheydrus client's income went from $8k to $0 to $35k in a 14-month window — the volatility wasn't random, it was the pattern of something being torn down and rebuilt. This period doesn't reward consistency; it rewards the willingness to burn the old financial structure before the new one is visible.`,
    6: (_y) =>
      `Clients with this transit describe working 10-12 hour days and somehow making less progress than ever. Pluto here doesn't reward more hours — it demands you burn everything that isn't your highest-leverage activity and rebuild from there.`,
    8: (_y) =>
      `A Pheydrus client walked away from a seven-figure joint venture three months before closing because she couldn't stomach the power dynamics in the room. This period forces a reckoning with how you handle shared money and resources — every financial partnership becomes a mirror for the power you're willing to claim.`,
    11: (_y) =>
      `A Pheydrus client described her entire professional network dissolving in an 18-month window — not through conflict, but through people simply moving in directions that no longer included her. The connections that reformed afterward were fewer, deeper, and worth ten times what the broader network had ever produced.`,
  },
  Saturn: {
    2: (_y) =>
      `A Pheydrus client tracked her income for the year and discovered she had worked 40% more hours than the year before and made 20% less. This period creates a ceiling that only breaks when the work becomes more disciplined, not more voluminous — and when rates stop being negotiable.`,
    6: (_y) =>
      `A Pheydrus client described going through an entire year feeling like she was pushing a boulder uphill at work — maximum effort, minimum progress. This period rewards the decision to stop doing everything and build an airtight system around the 20% that actually produces results.`,
    8: (_y) =>
      `A client with this transit turned down a $50k investment offer because the paperwork 'felt off.' Saturn here creates a fear of financial entanglement so strong that it blocks the partnerships that could actually scale your work.`,
    11: (_y) =>
      `A Pheydrus client's most important professional relationship — a mentor who had opened three major opportunities — went completely silent during this period with no explanation. What survives becomes foundational; what falls away was never as solid as it appeared.`,
  },
  Uranus: {
    2: (_y) =>
      `A Pheydrus client made more money in a single month during this period than in the prior six months combined — and then made almost nothing for the next three. The income pattern that conventional advice tries to smooth out is the signal, not the problem. Asymmetric structures work; linear pricing collapses.`,
    6: (_y) =>
      `A Pheydrus client described her most productive year and her most chaotic year being the same year — she did her best work and also missed three deadlines for the first time in her career. This period rewards innovating your entire approach to how you work, not optimizing the system you already have.`,
    8: (_y) =>
      `A Pheydrus client had a business partnership go from signed agreement to complete dissolution in 60 days — the fastest breakdown she'd ever experienced. This period creates volatility in shared financial arrangements that only structures built for flexibility can withstand.`,
    10: (_y) =>
      `Three Pheydrus clients with this transit quit stable jobs in the same 6-month window — none of them planned it. This transit makes conventional career paths feel physically suffocating. The ones who stopped fighting it and built unconventional businesses broke through. The ones who kept trying to 'be normal' stayed stuck.`,
    11: (_y) =>
      `A Pheydrus client described her entire professional peer group reorganizing around her during this period — she lost three key relationships and accidentally became the center of a new community she hadn't tried to build. This period disrupts networks to make room for ones that actually match where you're going.`,
  },
  Neptune: {
    2: (_y) =>
      `A Pheydrus client realized she had been charging the same rate for three years and genuinely couldn't explain why — not market conditions, not strategy. Just an inability to translate what her work was worth into a number she could say out loud. Lifting the fog requires deliberate clarity, not more time.`,
    6: (_y) =>
      `A Pheydrus client described an entire year where she could never tell whether she was doing enough — even on her best days, the work felt unfinished. This period blurs the line between inspired work and productive delay. Clarity comes from naming the difference, not from working harder.`,
    8: (_y) =>
      `A client with this transit had been coaching for two years and still flinched every time someone asked her price. She was consistently charging 60% less than her peers — not because of skill, but because this transit creates a fog between your value and what you're willing to ask for.`,
    11: (_y) =>
      `A Pheydrus client built an online community of 3,000 people during this period and described it as the loneliest professional year of her life. The visibility was real; the genuine connection she was building it for kept receding just out of reach. Shared purpose has to be explicit here, or it becomes projection.`,
  },
};

// ── C grade interpretation copy (Pillar 3 relocation pressure-house) ─────────

const RELOCATION_C_INTERP: Record<string, Partial<Record<number, (goal: GoalCategory) => string>>> = {
  Saturn: {
    2: (_goal) =>
      `A client who moved to her current address noticed her income plateau within 3 months — even though she was working harder than ever before. This address rewards builders who show up with extreme consistency. It punishes those who charge inconsistently or avoid financial conversations.`,
    6: (_goal) =>
      `A Pheydrus client described her current city as the place where she works the hardest and sees the least return — and she had been telling herself that for four years. This address rewards the decision to stop optimizing effort and start eliminating everything that isn't producing clear, direct results.`,
    8: (_goal) =>
      `A Pheydrus client turned down a co-founder offer at this address because she couldn't get comfortable with the financial structure — even though the opportunity was exactly what she'd been looking for. This address creates friction around shared money that only resolves when agreements are made completely explicit and trust is built in writing, not just in good faith.`,
    11: (_goal) =>
      `A Pheydrus client described her professional network at her current address as the smallest it had been in a decade — not from conflict, just from a gradual pulling back from communities that no longer felt worth the energy. This address concentrates connection toward depth; what's real becomes very real, and what isn't stops pretending.`,
  },
  Uranus: {
    2: (_goal) =>
      `Clients at addresses with this configuration describe the same income pattern: a $8k month, then a $1k month, then $6k, then $500. The breakthroughs are real — but so is the volatility. Unconventional income structures (retainers, packages, asymmetric pricing) stabilize everything. Traditional pricing models collapse.`,
    6: (_goal) =>
      `A Pheydrus client described her most innovative client work and her most chaotic work schedule both happening since she moved to this address. This location amplifies the unconventional — the systems that work for everyone else won't work here, but systems designed around how she actually thinks produce results she couldn't replicate anywhere else.`,
    8: (_goal) =>
      `A Pheydrus client had two financial partnerships dissolve unexpectedly in the two years after moving to this address — both with people she had worked with before, without incident, elsewhere. This address introduces volatility into shared financial arrangements that only structures built for flexibility can withstand.`,
    11: (_goal) =>
      `A Pheydrus client's professional community at this address had completely reorganized twice in three years — the people who seemed central to her network at move-in were mostly gone. This address accelerates how fast communities evolve; the disorientation lifts when she realizes the ones who stayed are the only ones that matter.`,
  },
  Neptune: {
    2: (_goal) =>
      `One client raised her rates 40% within 30 days of her Pillar 3 session and signed her highest-paying client that same week. Neptune in the financial house at your address creates a fog around self-worth and money — it's the most immediately fixable layer in this entire report.`,
    6: (_goal) =>
      `A Pheydrus client described her work at this address as simultaneously more inspired and more undisciplined than anywhere she'd ever lived — she had her best ideas and missed more deadlines. This address requires building separate containers for vision and execution, because they stop regulating each other naturally here.`,
    8: (_goal) =>
      `A Pheydrus client discovered after two years at this address that a financial partnership she'd trusted completely had terms she'd never fully read — and she had signed them. This address creates a fog around shared money that requires the most rigorous paper trail and explicit agreements she has ever demanded from anyone.`,
    11: (_goal) =>
      `A Pheydrus client built a following of thousands at this address and described it as the most professionally isolated period of her life. The community existed; the genuine mutual investment she was building it for kept being replaced by people who wanted to receive without reciprocating. Shared purpose has to be explicit here, or it becomes projection.`,
  },
  Pluto: {
    2: (_goal) =>
      `A Pheydrus client described her income at this address as either transforming completely or threatening to collapse — there was no flat year. This address concentrates financial intensity until the old relationship with money is burned down and a new one is built deliberately in its place.`,
    6: (_goal) =>
      `A Pheydrus client described her work environment at this address as one where she either produced the best work of her career or hit walls that felt immovable — sometimes in the same week. This address amplifies the gap between high-leverage activity and everything else, and it will keep intensifying until that gap is finally closed.`,
    8: (_goal) =>
      `A Pheydrus client walked away from the most significant financial partnership of her career two years after moving to this address — she described it as a power struggle neither person could win. This address forces a reckoning with how control operates in shared financial structures, and it doesn't relent until the pattern is genuinely resolved.`,
    11: (_goal) =>
      `A Pheydrus client's most important professional community completely reorganized around her at this address — the people she had built with were gradually replaced by people operating at a different level. The loss was real. So was what replaced it. This address transforms networks at the root, not the surface.`,
  },
};

// ── Address interpretation ────────────────────────────────────────────────────

const ADDRESS_THEMES: Partial<Record<number, string>> = {
  1: 'independence, initiation, and self-leadership',
  2: 'cooperation, partnership, and emotional harmony',
  3: 'creative expression, social energy, and scattered focus',
  4: 'structure, discipline, and foundational stability',
  5: 'freedom, change, and restless expansion',
  6: 'responsibility, care, and family obligation',
  7: 'reflection, analysis, and inner mastery',
  8: 'material power, ambition, and financial intensity',
  9: 'completion, release, and universal service',
  11: 'spiritual illumination, heightened intuition, and inspired vision',
};

export function getAddressInterpretation(item: GradeItem, goal: GoalCategory): string {
  const numMatch = item.source.match(/:\s*(\d+)/);
  const num = numMatch ? parseInt(numMatch[1]) : null;
  const theme = num !== null ? (ADDRESS_THEMES[num] ?? 'neutral energy') : 'neutral energy';
  const gw = goal === 'love' ? 'relationship goals' : 'career and financial goals';

  if (item.grade === 'F') {
    if (num === 3) return `Your address vibrates at 3 — scattered creative energy that dissipates the focused momentum your ${gw} require. This environment tends to amplify social distraction and creative overwhelm rather than producing the goal-oriented action you need right now.`;
    if (num === 6) return `Your address vibrates at 6 — a heavy responsibility and family-service energy that persistently pulls your attention toward others' needs. This environment actively works against the self-focused drive that advancing your ${gw} requires.`;
    if (num === 8) return `Your address vibrates at 8 — intense material pressure and power dynamics that create a constant undercurrent of financial stress and striving. The 8 environment demands you prove your worthiness for abundance at every turn, creating an exhausting context for pursuing your ${gw}.`;
    if (num === 9) return `Your address vibrates at 9 — a completion and dissolution energy that subtly works against building and sustaining. For someone working toward ${gw}, a 9 address creates an environment that encourages release over accumulation, endings over new beginnings.`;
    return `Your address number ${num ?? '—'} (${theme}) is creating environmental friction that directly affects your ${gw}. The numerological pressure here works against the stable, forward-moving energy you need.`;
  }

  if (item.grade === 'C') {
    if (num === 1) return `Your address vibrates at 1 — the number of independence and self-initiation. For ${gw}, this environment can either reinforce isolation (going it alone when collaboration would accelerate your path) or serve as the perfect launchpad for bold new moves. The 1 amplifies individual will — the question is whether that will is directed consciously.`;
    if (num === 4) return `Your address vibrates at 4 — structure, limitation, and foundational work. This creates a disciplined environment that either locks you into rigid, limiting patterns or provides the stable foundation from which to build something lasting. The 4 rewards those who show up consistently and do the unsexy work.`;
    if (num === 5) return `Your address vibrates at 5 — freedom, change, and restless movement. The 5 address either scatters your focus through constant change and stimulation, or provides the dynamic environment that keeps your creative energy alive for your ${gw}. The 5 amplifies whatever frequency you bring to it.`;
    return `Your address number ${num ?? '—'} (${theme}) creates a neutral-to-challenging environment for your ${gw}. Whether it supports or hinders depends on how consciously you engage with the themes it carries.`;
  }

  if (item.grade === 'A') {
    if (num === 2) return `Your address vibrates at 2 — a cooperative, harmonious frequency that creates natural ease in your environment. This is one of the most favorable address energies for your ${gw}, facilitating the collaboration, emotional balance, and sustained effort that long-term success requires.`;
    if (num === 7) return `Your address vibrates at 7 — a reflective, analytical frequency that supports deep inner work, strategic clarity, and genuine mastery. The 7 environment is excellent for the focused thinking and inner refinement that advancing your ${gw} requires.`;
    if (num === 11) return `Your address vibrates at 11 — the master number of spiritual illumination and heightened intuition. This is an exceptionally supportive address frequency for your ${gw}, providing the inspired clarity and intuitive guidance needed to navigate toward your highest outcomes.`;
    return `Your address number ${num ?? '—'} (${theme}) creates a genuinely supportive environment for your ${gw}. The energy here works in your favor.`;
  }

  return `Your address (${theme}) has a neutral environmental impact relative to your ${gw}.`;
}

// ── Life Cycle interpretation ─────────────────────────────────────────────────

export function getLifeCycleInterpretation(item: GradeItem): string {
  if (item.grade === 'F') {
    return `Your current personal year carries a heavy numerological charge — a cycle associated with pressure, intensity, and karmic reckoning. This is a year where the universe tends to surface what needs to be faced rather than supporting what you're trying to build. Pushing hard against this cycle tends to amplify resistance; moving through what it's forcing you to confront is how you generate real forward motion.`;
  }
  if (item.grade === 'A') {
    return `Your current personal year is a highly supportive numerological cycle — associated with positive movement, change, and the manifestation of long-held intentions. The energetic conditions this year actively work in your favor.`;
  }
  return `Your current personal year carries a neutral numerological charge — neither actively supportive nor creating significant resistance. The direction is yours to set.`;
}

// ── Fallback copy (for combos not in the lookup) ─────────────────────────────

const PLANET_BRIEF: Record<string, string> = {
  Pluto: 'power and transformation',
  Saturn: 'restriction and delay',
  Uranus: 'disruption and instability',
  Mars: 'aggression and impulsivity',
  Neptune: 'confusion and illusion',
};
const HOUSE_BRIEF: Partial<Record<number, string>> = {
  1: 'identity and self-presentation',
  2: 'income and financial security',
  5: 'romance and creative expression',
  6: 'work, daily productivity, and money',
  7: 'committed relationships and marriage',
  8: 'shared resources, money, and transformation',
  10: 'career, money, reputation, and public standing',
  11: 'networks, goals, and community',
};

function fallbackF(planet: string, house: number, goal: GoalCategory): string {
  const pt = PLANET_BRIEF[planet] ?? 'challenging planetary energy';
  const ht = HOUSE_BRIEF[house] ?? `house ${house}`;
  const g = goal === 'love' ? 'love and relationship goals' : 'career and financial goals';
  return `${planet}'s energy of ${pt} in your ${ht} house creates persistent pressure on your ${g}. Until this energy is consciously mastered, it acts as a recurring drag on the progress you're working toward.`;
}

function fallbackC(planet: string, house: number, goal: GoalCategory, dur: string): string {
  const pt = PLANET_BRIEF[planet] ?? 'challenging planetary energy';
  const ht = HOUSE_BRIEF[house] ?? `house ${house}`;
  const g = goal === 'love' ? 'love and relationship goals' : 'career and financial goals';
  return `${planet}'s ${pt} energy is in your ${ht} house${dur ? ` ${dur}` : ''} — a pressure that can go either way for your ${g}. Shadow path: self-sabotage in this area that confirms the pattern. Conscious path: channeling ${planet}'s energy at its highest expression to break through the very limitation it represents.`;
}

// ── Main interpretation dispatcher ───────────────────────────────────────────

export function getItemInterpretation(
  item: GradeItem,
  goal: GoalCategory,
  transits: PlanetaryTransit[]
): string {
  if (item.section === 'Address') return getAddressInterpretation(item, goal);
  if (item.section === 'Life Cycle') return getLifeCycleInterpretation(item);

  const { planet, house, grade, pillar } = item;
  if (!planet || !house) return item.reason;

  const endYear = pillar === 2 ? getTransitEndYear(planet, transits) : null;
  const durStr = endYear ? formatDuration(endYear) : '';

  // C grade from Pillar 2 pressure houses
  if (pillar === 2 && grade === 'C') {
    const fn = TRANSIT_C_INTERP[planet]?.[house];
    if (fn && endYear) return fn(endYear);
    return fallbackC(planet, house, goal, durStr);
  }

  // C grade from Pillar 3 relocation pressure houses
  if (pillar === 3 && grade === 'C') {
    const fn = RELOCATION_C_INTERP[planet]?.[house];
    if (fn) return fn(goal);
    return fallbackC(planet, house, goal, '');
  }

  // F grade (natal, relocation, or transit-angular)
  if (grade === 'F') {
    const interp = F_INTERP[planet]?.[house];
    const text = interp ? (goal === 'love' ? interp.love : interp.career) : fallbackF(planet, house, goal);
    return endYear ? `${text} This transit runs ${durStr}.` : text;
  }

  return item.reason;
}
