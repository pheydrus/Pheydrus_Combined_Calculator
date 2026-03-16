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
        'A Pheydrus client described walking into rooms where people either immediately respected her or immediately wanted to challenge her — she never got a neutral reaction. The intensity that should have made her a natural leader kept triggering friction before any trust was built.',
      love:
        'One client\'s first three dates consistently ended with the other person saying "you\'re a lot" — and she had no idea what that meant. The depth she brought to every interaction registered as overwhelming before anyone could see that it was actually her greatest gift.',
    },
    5: {
      career:
        'A Pheydrus client spent four months building a course, scrapped it entirely one week before launch, and spent four more months rebuilding from scratch. The creative output was real — the pattern of destroying work just as it was ready to be seen kept repeating.',
      love:
        'One client described every relationship starting at intensity level 10 and burning out within 90 days — she was either completely obsessed or completely done. The all-or-nothing energy that felt like passion kept preventing the slow accumulation of genuine intimacy.',
    },
    7: {
      career:
        'A Pheydrus client\'s most promising business partnership ended in a legal dispute that cost more than the venture ever made. The collaboration that should have doubled her capacity became a battle over control before the first deliverable was complete.',
      love:
        'One client described every serious relationship eventually becoming a negotiation about who was in charge — and neither person was ever willing to fully surrender. The connection that felt fated kept cycling into power dynamics that exhausted both people before real love could take root.',
    },
    10: {
      career:
        'A Pheydrus client reached the final round of a major promotion three times in five years and was passed over each time — usually after a conflict with someone above her. The drive that should have made her rise kept generating reputation friction at the exact moment visibility was highest.',
      love:
        'One client hadn\'t been on a date in two years — not because no one was interested, but because work always came first. The career felt like the real relationship, and every actual partner suffered from a level of deprioritization that people eventually stopped accepting.',
    },
  },
  Saturn: {
    1: {
      career:
        'A Pheydrus client described being the most reliable person on every team she\'d ever been on — and somehow never the one who got called when leadership opportunities opened. The professionalism that should have opened doors kept keeping people at arm\'s length.',
      love:
        'One client hadn\'t told a partner something vulnerable in three consecutive relationships — she called it being private, but every partner eventually said they never really knew her. The self-protection that felt like strength kept creating the exact loneliness it was designed to prevent.',
    },
    5: {
      career:
        '9 out of 10 clients with this configuration have a fully built offer sitting in their notes app that has never been posted. The work is done. The fear of being seen is what stops the publish button.',
      love:
        '9 out of 10 clients with this configuration have a fully built offer sitting in their notes app that has never been posted. The work is done. The fear of being seen is what stops the publish button.',
    },
    7: {
      career:
        'A Pheydrus client signed three business partnership agreements in two years — all three dissolved before the first quarterly review. The pattern wasn\'t bad luck; it was an unconscious pull toward controlling collaborators or becoming the restrictive one herself the moment stakes got real.',
      love:
        'One client described meeting someone promising, spending three months finding reasons they weren\'t quite right, and watching them end up in a serious relationship with someone else six months later. The standard she held for partnership kept protecting her from the very thing she said she wanted.',
    },
    10: {
      career:
        'A Pheydrus client had been "two years from a senior position" for six consecutive years — the goalposts kept moving, the recognition kept being just out of reach. She was the most prepared person in every room and still the last one considered for authority.',
      love:
        'One client\'s partners consistently described the same experience: they felt like a reward for good behavior rather than a genuine companion. The achievement energy that defined her career had fully colonized her love life — and real connection requires surrender, not performance.',
    },
  },
  Uranus: {
    1: {
      career:
        'A Pheydrus client received the same feedback in two consecutive performance reviews: "brilliant in bursts, unreliable in execution." She couldn\'t understand how someone who cared as much as she did kept reading as inconsistent. The version of her that showed up each day genuinely was different — and the people around her couldn\'t build on it.',
      love:
        'One client described three partners in three years saying the exact same thing: "I never know where I stand with you." The freedom she was protecting kept registering as emotional unavailability — and the people who wanted to love her eventually stopped reaching.',
    },
    5: {
      career:
        'One client had launched the same coaching business four separate times over six years — each time with real momentum, real interest, real potential. Each time, she disappeared before the first dollar came in.',
      love:
        'One client had launched the same coaching business four separate times over six years — each time with real momentum, real interest, real potential. Each time, she disappeared before the first dollar came in.',
    },
    7: {
      career:
        'A Pheydrus client\'s most important business collaboration fell apart the week they were about to close their biggest client together. She described it as coming out of nowhere — but the pattern of pulling back just when stakes got real had happened before.',
      love:
        'One client described the same relationship cycle repeating with three different people: intense closeness, then an overwhelming need for space, then a version of the relationship that never quite recovered. The freedom she needed felt like abandonment to the people who were trying to build something lasting with her.',
    },
    10: {
      career:
        'Three Pheydrus clients with this configuration left stable six-figure roles in the same calendar year — none of them by choice. The environments that others found comfortable became progressively suffocating, and the unconventional paths they built afterward were the first ones that actually fit.',
      love:
        'One client described the chaos of her professional life as something her partners never really signed up for — constant pivots, sudden reinventions, unpredictable income. The instability that felt like aliveness to her kept creating conditions where partnership couldn\'t take root.',
    },
  },
  Mars: {
    1: {
      career:
        'A Pheydrus client lost three client relationships in a single quarter — not because of the work, but because her directness in project meetings read as aggression before trust was established. The sharpness that should have made her formidable kept creating friction before the outcomes could prove her right.',
      love:
        'One client\'s last four relationships had all started with the other person describing her as "the most compelling person I\'d ever met" and ended with them describing her as exhausting. The intensity that drew people in kept making sustained closeness feel like a competition.',
    },
    5: {
      career:
        'A Pheydrus client launched three different offers in eight months — each with genuine momentum, each discontinued before the sales page was finished. The urgency that generated energy at the start kept making the slower, more patient work of actually building something impossible to sustain.',
      love:
        'One client described every relationship starting as the most exciting thing that had ever happened to her — and becoming genuinely unbearable within six months. The combustion that felt like chemistry kept burning through the oxygen that real intimacy needs to survive.',
    },
    7: {
      career:
        'A Pheydrus client realized she had never concluded a negotiation feeling good — she either pushed too hard and won badly or capitulated entirely. The competitive energy that made her excellent at her work kept turning business partnerships into contests that someone had to lose.',
      love:
        'One client described knowing within 20 minutes of every argument whether she was going to win or leave — there was no third option. The need to resolve conflict through combat rather than conversation had ended relationships with people who genuinely loved her.',
    },
    10: {
      career:
        'A Pheydrus client was placed on a performance improvement plan two weeks after being told she was on the shortlist for a VP role — the same directness that earned the recognition had also generated three formal complaints in the prior six months. The force that created visibility kept creating enemies in the exact positions that controlled her ceiling.',
      love:
        'One client\'s last partner told her he felt like a goal she was trying to achieve rather than a person she was choosing every day. The achievement orientation that powered her career had made its way into her most intimate relationship — and people want to be loved, not accomplished.',
    },
  },
  Neptune: {
    1: {
      career:
        'A Pheydrus client described showing up differently to every professional meeting depending on who was in the room — and genuinely not knowing which version was actually her. The adaptability that seemed professional kept creating an authenticity gap that the people she most wanted to work with could sense without being able to name.',
      love:
        'One client\'s most recent relationship ended with her partner saying he felt like he\'d never actually met her — that every version she\'d shown him had been calibrated for what she thought he wanted. The care she\'d taken to be what he needed had made genuine connection impossible.',
    },
    5: {
      career:
        'Clients with this configuration consistently describe a business that exists in perfect detail in their imagination — and becomes unrecognizable the moment they try to write the sales page. The vision is real. The execution feels like translating a dream.',
      love:
        'Clients with this configuration consistently describe a business that exists in perfect detail in their imagination — and becomes unrecognizable the moment they try to write the sales page. The vision is real. The execution feels like translating a dream.',
    },
    7: {
      career:
        'A Pheydrus client discovered her business partner had been billing clients under the partnership while routing income to a separate entity — she had had a bad feeling about the arrangement for eight months but couldn\'t bring herself to have the conversation. The trust that should have been the foundation of collaboration had been extended without the clarity that protects it.',
      love:
        'One client described falling in love with the "same person" three separate times — each time with someone different, each time discovering six months in that the person she\'d fallen for had never quite existed. The love she felt was real; the people she felt it for had been built from what she needed rather than what was actually there.',
    },
    10: {
      career:
        'A Pheydrus client had described her professional direction differently in every conversation for three years — and each time she believed it completely. The vision for what she was building was genuinely inspired; the clarity about what it actually was kept shifting before it could become anything concrete.',
      love:
        'One client had been "about to be ready" for a serious relationship for five years. The professional dream kept expanding just enough to require a little more time before partnership felt possible — and the people who might have been right for her moved on while she was still preparing.',
    },
  },
  Sun: {
    7: {
      career:
        'A Pheydrus client with this exact placement had a waitlist of people who wanted to work with her — and still couldn\'t close a single paid client. The magnetism was real. The money conversation felt impossible.',
      love:
        'A Pheydrus client with this exact placement had a waitlist of people who wanted to work with her — and still couldn\'t close a single paid client. The magnetism was real. The money conversation felt impossible.',
    },
    8: {
      career:
        'A Pheydrus client had been running her business at 60% of what her clients told her she was worth for four years. Every time she drafted a price increase, something stopped her from sending it — not circumstance, but a deep, specific discomfort with claiming what she\'d already earned.',
      love:
        'One client described consistently choosing relationships where she was the more capable person — and then resenting being the one who held everything together. The worth she didn\'t fully believe in privately kept recreating partnerships that confirmed the doubt.',
    },
    12: {
      career:
        'A Pheydrus client\'s most important career breakthrough happened in a conversation she almost didn\'t show up for — and her worst setback happened the moment she almost had it all. The visibility that advancement requires kept triggering a pull toward retreat at the exact moment it mattered most.',
      love:
        'One client described always feeling slightly less real in relationships than the person she was with — like she was watching herself participate rather than actually being there. The love she wanted required being fully seen, and being fully seen was the thing she was least able to allow.',
    },
  },
  Venus: {
    8: {
      career:
        'A Pheydrus client reviewed her contracts from the prior two years and realized she had accepted payment terms in every single one that she would have told a colleague were unacceptable. The value she brought was real; the willingness to claim it in writing kept getting overridden by something she couldn\'t fully explain.',
      love:
        'One client described her relationships as always going from "this is the most I\'ve ever felt" to "I don\'t recognize what this became" — with no gradual middle. The depth she brought to love was genuine; the all-or-nothing intensity kept making the actual human complexity of partnership feel like something was wrong.',
    },
    12: {
      career:
        'A Pheydrus client\'s colleagues consistently described her as "the most talented person in the room that no one was talking about." She had been two promotions away from where her work warranted for three years. The capabilities that would have advanced her career stayed private — not from strategy, but from a specific reluctance to be fully seen.',
      love:
        'One client described keeping the most attractive thing about herself — a specific kind of depth and care — in reserve for a moment when it felt safe enough to share. Five years in, she hadn\'t found the moment. The love she was capable of giving was waiting for a safety that she was also preventing.',
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
