/**
 * Planet × House Library
 * Source: "Invisible Forces 1: Planet × Angular House Library" + "Money Houses Library" (Pheydrus Internal)
 *
 * Key format: `${PLANET_UPPERCASE}_${house}_${pillar}`
 * Pillar labels: natal (Pillar 1), transit (Pillar 2), environment (Pillar 3)
 * Houses covered: Angular (1, 4, 7, 10) + Money (2, 6, 8)
 * 10th house uses Angular MC copy (same source for both Angular & Money 10th)
 */

export interface LibraryEntry {
  hurt_or_help: string;
  note: string | null;
  steps: string;
}

export const MALEFIC_PLANETS = new Set(['Mars', 'Saturn', 'Pluto', 'Neptune', 'Uranus']);
export const BENEFIC_PLANETS = new Set(['Sun', 'Moon', 'Venus', 'Jupiter']);

const LIBRARY: Record<string, LibraryEntry> = {

  // ── MARS ─────────────────────────────────────────────────────────────────────

  MARS_1_natal: {
    hurt_or_help: `You come across as aggressive or threatening before you even speak. People feel the intensity first — creating friction in first impressions, pitches, and leadership moments that directly slow your progress.`,
    note: null,
    steps: `Lead with questions before statements in high-stakes situations. Find a physical outlet (training, sport) so the Mars energy doesn't leak into professional interactions.`,
  },
  MARS_1_transit: {
    hurt_or_help: `Mars is live on your ASC right now — reactivity, impulsivity, and aggression are running at full volume. This is a high-risk window for saying the wrong thing at the wrong time.`,
    note: null,
    steps: `Delay confrontational conversations and major decisions by 48-72 hours. Avoid launching anything that requires trust-building right now — wait until this transit passes.`,
  },
  MARS_1_environment: {
    hurt_or_help: `Your current location amplifies Mars on your ASC — placing you in an environment that constantly triggers your reactive side. Power struggles and conflict are the dominant frequency around you.`,
    note: null,
    steps: `If you can't move, redesign your immediate workspace to be calm and minimal as a counter-frequency. Seek out environments where drive is rewarded rather than met with equal aggression.`,
  },

  MARS_7_natal: {
    hurt_or_help: `You attract combative partners, clients, and collaborators. The people you draw in tend to pick fights, create drama, or compete with you — draining the energy you need for forward momentum.`,
    note: null,
    steps: `Vet collaborators and clients carefully before committing. Build in explicit agreements and boundaries at the start of every partnership — Mars on the DSC thrives in undefined relationships.`,
  },
  MARS_7_transit: {
    hurt_or_help: `Conflict in your key relationships is peaking right now. Partnerships that felt stable may suddenly feel combative. This window is actively pulling your attention away from your goal — don't let it.`,
    note: null,
    steps: `Avoid signing new partnership agreements during this transit. Focus energy inward and on solo work until this passes.`,
  },
  MARS_7_environment: {
    hurt_or_help: `Your current location consistently draws combative or competitive people into your 1:1 relationships. The environment is magnetizing the wrong collaborators and clients.`,
    note: null,
    steps: `Be highly selective about new partnerships formed in this location. If possible, initiate key relationships in a different city or context where this environmental influence is weaker.`,
  },

  MARS_10_natal: {
    hurt_or_help: `Your public reputation carries an aggressive or polarizing edge. People in positions of authority may perceive you as threatening rather than capable — creating invisible resistance to career advancement.`,
    note: null,
    steps: `Be deliberate about how you communicate ambition publicly. Let results speak louder than declarations — Mars on the MC benefits from a 'show don't tell' approach.`,
  },
  MARS_10_transit: {
    hurt_or_help: `Your professional reputation is under Mars pressure right now. Impulsive public moves, conflicts with authority figures, or reactive posts could set your career back significantly during this window.`,
    note: null,
    steps: `Go quiet publicly where possible. Do not post reactively or make bold career announcements until this transit clears.`,
  },
  MARS_10_environment: {
    hurt_or_help: `Your current location amplifies the aggressive edge of your public-facing energy — making it harder to be perceived as trustworthy or authoritative in your field.`,
    note: null,
    steps: `Consider which cities or professional environments reward boldness over polish. Your Mars MC energy thrives where disruption is valued — find that context.`,
  },

  MARS_4_natal: {
    hurt_or_help: `Home and family life carry ongoing conflict or instability that bleeds into your focus and productivity. It's hard to build toward a goal when your foundation is constantly activated.`,
    note: null,
    steps: `Create clear physical and energetic separation between your home space and your work space. Invest in making your home environment a place of recovery — not another battleground.`,
  },
  MARS_4_transit: {
    hurt_or_help: `Home life is in conflict mode right now — family tension, living situation instability, or domestic disruption is actively pulling focus from your goal. This window demands immediate attention.`,
    note: null,
    steps: `Address the home situation directly rather than suppressing it. Unresolved Mars IC tension will keep bleeding into your work until it's faced.`,
  },
  MARS_4_environment: {
    hurt_or_help: `Your current home address or living situation carries a combative frequency that makes it hard to rest, recover, or feel stable — all of which are necessary for sustained progress.`,
    note: null,
    steps: `Look at the numerology of your address and the astrocartography of your current city. Small environmental shifts can meaningfully reduce this friction.`,
  },

  MARS_2_natal: {
    hurt_or_help: `You have an impulsive, aggressive relationship with money — spending fast, earning fast, losing fast. Income can be volatile and financial decisions are often reactive rather than strategic. Personal values feel like a battleground.`,
    note: null,
    steps: `Slow down financial decisions by at least 24 hours. Build a rule: no major money move made in an activated emotional state. Mars in the 2nd rewards those who channel the drive into disciplined income-building rather than reactive spending.`,
  },
  MARS_2_transit: {
    hurt_or_help: `Mars is transiting your 2nd right now — impulsive financial decisions and income volatility are peaking. This is a high-risk window for overspending, reactive pricing changes, or financial conflicts. Act on this immediately.`,
    note: null,
    steps: `Freeze non-essential spending during this window. Avoid renegotiating rates, launching new pricing, or making investment decisions until Mars moves on.`,
  },
  MARS_2_environment: {
    hurt_or_help: `Your current location is activating a combative energy around your personal finances — costs may feel higher, income harder to stabilize, and financial competition more intense here than elsewhere.`,
    note: null,
    steps: `This location is asking you to sharpen your financial discipline. Build tighter systems around income and expenses — the environment won't hand you ease, but it will reward those who build strong financial foundations here.`,
  },

  MARS_6_natal: {
    hurt_or_help: `Your daily work environment is prone to conflict, burnout, and high-intensity pressure. You may attract combative colleagues or clients, or push yourself so hard in your work routines that health suffers. The drive is real — but it burns out the engine.`,
    note: null,
    steps: `Build deliberate recovery into your work schedule — Mars in the 6th performs best in high-intensity sprints with real rest between them. Seek work environments that reward drive without punishing your body for it.`,
  },
  MARS_6_transit: {
    hurt_or_help: `Mars is transiting your 6th right now — workplace conflict, health pressure, and burnout risk are elevated. Overworking during this window will cost you more than it gains. This is urgent — protect your health and work boundaries now.`,
    note: null,
    steps: `Cut your task list by 30% during this transit. One focused priority per day. Burnout during a Mars 6th transit can take weeks to recover from — don't let it compound.`,
  },
  MARS_6_environment: {
    hurt_or_help: `Your current location amplifies the combative work energy of Mars in the 6th — the professional environment here is more high-pressure, competitive, and draining than it would be elsewhere.`,
    note: null,
    steps: `This location is calling you to build bulletproof work systems and health routines. The environment is intense — but those who master their daily discipline here build an edge that follows them everywhere.`,
  },

  MARS_8_natal: {
    hurt_or_help: `Shared finances, joint ventures, and investments carry a combative or volatile energy. Partnerships involving money tend toward power struggles, and what you invest in — financially or energetically — can multiply in both directions fast.`,
    note: null,
    steps: `Be extremely discerning about what you put energy and money into — Mars in the 8th multiplies. Invest only in things you'd be willing to fight for long-term. Avoid joint financial ventures with people you don't fully trust.`,
  },
  MARS_8_transit: {
    hurt_or_help: `Mars is transiting your 8th right now — shared finances, debt, and investments are in volatile territory. Financial conflicts with partners, unexpected costs, or impulsive investment decisions are high-risk during this window. Act now.`,
    note: null,
    steps: `Do not enter new financial partnerships, take on debt, or make major investments during this transit. Review existing shared financial arrangements for hidden tension — surface it before Mars forces it.`,
  },
  MARS_8_environment: {
    hurt_or_help: `Your current location activates a combative energy around shared finances and investments. Joint ventures and financial partnerships formed here carry more conflict risk than they would elsewhere.`,
    note: null,
    steps: `This location is raising the stakes on what you invest in. Be discerning — only pour resources into things with a solid foundation. The 8th house multiplies what you put in, and this environment amplifies that effect.`,
  },

  // ── SATURN ───────────────────────────────────────────────────────────────────

  SATURN_1_natal: {
    hurt_or_help: `Saturn on your ASC creates a heavy, serious, or cold first impression that makes it harder to connect quickly. Progress feels slower than it should. BUT — commit to mastering personal authority and Saturn here eventually makes you one of the most respected people in any room.`,
    note: null,
    steps: `Focus on slow, consistent reputation-building rather than quick wins. The payoff for Saturn on the ASC is enormous — but only for those who do the unglamorous work first.`,
  },
  SATURN_1_transit: {
    hurt_or_help: `Saturn is transiting your ASC — a multi-year window of increased responsibility, heaviness, and delayed results. Things will feel harder than they should. Quick wins are not available in this window.`,
    note: null,
    steps: `Use this window to build systems, skills, and habits that will pay off when Saturn moves on. The foundations you lay now will carry you for years — but only if you don't quit.`,
  },
  SATURN_1_environment: {
    hurt_or_help: `Your current location activates Saturn on your ASC — making you feel restricted, underestimated, or blocked in how you show up publicly. The environment is amplifying the heaviness.`,
    note: null,
    steps: `Research locations where your Saturn ASC energy shifts. Astrocartography can identify cities where this placement expresses as authority rather than limitation.`,
  },

  SATURN_7_natal: {
    hurt_or_help: `Partnerships feel like hard work — you attract serious, demanding, or withholding partners. Relationships move slowly and require significant effort. However — the partnerships you build through Saturn DSC tend to be the most durable and growth-producing of your life.`,
    note: null,
    steps: `Stop expecting partnerships to feel easy. Invest in fewer, deeper collaborations rather than many surface-level ones. Vet slowly — commit fully.`,
  },
  SATURN_7_transit: {
    hurt_or_help: `Saturn is transiting your 7th — partnerships and key relationships are being tested or restructured. Collaborations that lack solid foundations may dissolve. Act on this now before it compounds.`,
    note: null,
    steps: `Audit your key relationships and partnerships. Strengthen the ones worth keeping. Let go of the ones that have been draining without producing — Saturn will force this reckoning regardless.`,
  },
  SATURN_7_environment: {
    hurt_or_help: `Your current location makes it consistently harder to attract aligned, supportive partners and collaborators. The environment magnetizes heavy or withholding relational dynamics.`,
    note: null,
    steps: `Be especially intentional about where you meet and vet potential partners. Consider initiating key collaborations outside your current city where this environmental influence is weaker.`,
  },

  SATURN_10_natal: {
    hurt_or_help: `Career progress feels painfully slow. Authority figures may underestimate you or place additional burdens on you. BUT — Saturn on the MC is one of the most powerful long-game placements. Those who commit to mastery here become legends in their field.`,
    note: null,
    steps: `Stop comparing your timeline to others. Identify the one skill or credential that would make you undeniably authoritative in your field — and pursue it relentlessly.`,
  },
  SATURN_10_transit: {
    hurt_or_help: `Saturn is transiting your MC — career feels blocked, thankless, or overwhelming right now. You may feel overlooked or burdened with more responsibility than recognition. This is a critical window — don't waste it.`,
    note: null,
    steps: `Use this window to quietly build expertise and systems. The recognition will come — Saturn rewards builders, not performers. Keep your head down and do the work.`,
  },
  SATURN_10_environment: {
    hurt_or_help: `Your current location amplifies the Saturn MC energy — making career advancement feel slower and more effortful than it should be here.`,
    note: null,
    steps: `Research cities where your professional archetype thrives. Saturn MC often performs better in structured, traditional industries or cities that reward longevity over flash.`,
  },

  SATURN_4_natal: {
    hurt_or_help: `Home and family foundations feel heavy or restrictive — early life may have lacked warmth or stability, creating a baseline sense of scarcity that bleeds into ambition. The lesson is building your own foundation from scratch — those who do become extraordinarily self-sufficient.`,
    note: null,
    steps: `Invest in creating the stable home environment you may not have had. A solid physical foundation directly impacts your ability to build outward. This is not optional — it's structural.`,
  },
  SATURN_4_transit: {
    hurt_or_help: `Saturn is moving through your IC — home life, family dynamics, and emotional security are under pressure. Instability at home is directly impacting your ability to focus and execute. Address this now.`,
    note: null,
    steps: `Stabilize your living situation as your top priority. You cannot build effectively on a shaky foundation — Saturn IC transits demand that you deal with the root before the branches.`,
  },
  SATURN_4_environment: {
    hurt_or_help: `Your current home environment carries a Saturn IC frequency — cold, restrictive, or emotionally heavy. It is harder to rest and recover here than it should be.`,
    note: null,
    steps: `Look at both the numerology of your address and whether this city supports your IC energy. Even small changes to your home's warmth and structure can meaningfully shift this.`,
  },

  SATURN_2_natal: {
    hurt_or_help: `Money comes slowly and requires significant effort — financial abundance feels like it has to be earned twice over. There may be deep-seated scarcity beliefs or a fear of losing what's built. BUT — Saturn here eventually produces some of the most financially disciplined and secure individuals.`,
    note: null,
    steps: `Build your financial foundation methodically — consistent saving, conservative investment, and long-term thinking are your wealth-building path. Saturn in the 2nd rewards patience and penalizes shortcuts.`,
  },
  SATURN_2_transit: {
    hurt_or_help: `Saturn is transiting your 2nd — a multi-year window of financial restriction, delayed income, and forced discipline around money. Things will feel tighter than they should. This is not the time to expect financial breakthroughs.`,
    note: null,
    steps: `Use this window to audit and restructure your finances. Cut what doesn't serve you, build emergency reserves, and develop financial skills you've been putting off. The financial habits built now will support you for decades.`,
  },
  SATURN_2_environment: {
    hurt_or_help: `Your current location is activating Saturn energy in your 2nd house — income may feel harder to build here, and financial restrictions may feel more pronounced than they would elsewhere.`,
    note: null,
    steps: `This location is not a punishment — it's a classroom. The financial discipline you build here will be more solid than what comes easily elsewhere. Upskill, build systems, and trust that the foundation is being laid.`,
  },

  SATURN_6_natal: {
    hurt_or_help: `Daily work feels heavy, demanding, and slow to reward. You may feel chronically overworked without proportionate recognition. Health routines require consistent discipline or they fall apart entirely. BUT — Saturn here produces mastery through repetition. Those who commit to the work become truly excellent.`,
    note: null,
    steps: `Build non-negotiable daily systems — Saturn in the 6th thrives on structure and suffers in chaos. The work feels thankless now, but mastery accumulates. Stay consistent.`,
  },
  SATURN_6_transit: {
    hurt_or_help: `Saturn is transiting your 6th — your work load is heavy, health may need attention, and daily routines feel burdensome right now. This is a multi-year call to build better systems and take your physical wellbeing seriously.`,
    note: null,
    steps: `Use this window to redesign your work systems and establish health routines you can sustain long-term. What you build in daily discipline now will serve you when Saturn moves on.`,
  },
  SATURN_6_environment: {
    hurt_or_help: `Your current location activates Saturn energy in your 6th — the work environment here is demanding, and health and daily routine require more conscious attention than they might elsewhere.`,
    note: null,
    steps: `This location is calling you to master your craft and your daily discipline. The environment won't reward shortcuts — but those who show up consistently and build real expertise here earn it.`,
  },

  SATURN_8_natal: {
    hurt_or_help: `Shared finances, investments, and transformative resources feel restricted or delayed. Joint ventures may carry heavy obligations. Financial multiplication is possible — but Saturn here demands a very solid foundation before the compounding begins.`,
    note: null,
    steps: `Be highly selective about financial partnerships and investments. Saturn in the 8th multiplies through discipline — build slowly, vet thoroughly, and avoid any shared financial arrangement without complete transparency.`,
  },
  SATURN_8_transit: {
    hurt_or_help: `Saturn is transiting your 8th — shared finances, debt, and investment structures are being tested and restructured right now. This is a window to build more solid financial foundations — not to take risks.`,
    note: null,
    steps: `Audit all shared financial arrangements. Restructure any debt that lacks a clear payoff path. Saturn in the 8th transit rewards those who build stronger systems — and penalizes those who avoid the financial reckoning.`,
  },
  SATURN_8_environment: {
    hurt_or_help: `Your current location is activating Saturn energy in your 8th house — investment and shared financial opportunities here require more due diligence, stronger foundations, and longer timelines before they pay off.`,
    note: null,
    steps: `This location is not blocking your financial multiplication — it's raising the bar for what deserves your investment. Be discerning. The opportunities that meet Saturn's standard here will compound significantly.`,
  },

  // ── PLUTO ────────────────────────────────────────────────────────────────────

  PLUTO_1_natal: {
    hurt_or_help: `You come across as intense, threatening, or controlling — even when you're not trying to. People feel destabilized by your presence before trust is established. This creates significant friction in new relationships and public-facing situations.`,
    note: null,
    steps: `Consciously soften your entry into new spaces — make your warmth visible before your power. People need to feel safe with you before they can work with you.`,
  },
  PLUTO_1_transit: {
    hurt_or_help: `Pluto is moving through your ASC right now — your entire identity and public presence is being dismantled and rebuilt. This is one of the most intense transits possible. The old version of how you show up is ending — urgently.`,
    note: null,
    steps: `Do not resist the identity shift — it's happening regardless. Channel this energy into a deliberate personal rebrand rather than clinging to who you were. The destruction is the point.`,
  },
  PLUTO_1_environment: {
    hurt_or_help: `Your current location amplifies the Pluto ASC energy — consistently putting you in situations where you're perceived as a threat or disruptor, making trust-building and collaboration significantly harder.`,
    note: null,
    steps: `Seek environments where intensity and transformation are valued — not feared. Your Pluto ASC energy thrives in high-stakes, high-transformation contexts.`,
  },

  PLUTO_7_natal: {
    hurt_or_help: `Others consistently try to expose, control, or destabilize you through 1:1 relationships. Partners and collaborators may pick fights, overstep boundaries, or attempt power plays. This is a recurring drain on your energy and focus.`,
    note: null,
    steps: `Establish explicit power boundaries in every partnership before they're needed. Pluto DSC attracts people who will test limits — make the limits unmistakably clear from the start.`,
  },
  PLUTO_7_transit: {
    hurt_or_help: `A key relationship or partnership is in Pluto territory right now — power struggles, exposures, or complete dissolution are possible. This is urgent — unaddressed Pluto DSC transits can derail everything else.`,
    note: null,
    steps: `Get ahead of any simmering partnership conflict immediately. Pluto transits force the truth to surface — better to surface it on your terms than to have it explode publicly.`,
  },
  PLUTO_7_environment: {
    hurt_or_help: `Your current location consistently attracts Plutonian energy into your partnerships — power struggles, betrayal dynamics, and controlling collaborators are more common here than they would be elsewhere.`,
    note: null,
    steps: `Be extremely selective about who you partner with in this location. Consider relocating key business or personal partnerships to contexts where this environmental influence is weaker.`,
  },

  PLUTO_10_natal: {
    hurt_or_help: `Your career path involves cycles of complete destruction and rebuilding. Authority figures may perceive you as threatening to existing power structures. BUT — Pluto MC people who embrace the transformation become some of the most powerful forces in their industry.`,
    note: null,
    steps: `Stop trying to fit into existing career structures. Your path is to disrupt and rebuild — lean into that rather than apologizing for it.`,
  },
  PLUTO_10_transit: {
    hurt_or_help: `Pluto is transiting your MC — your public reputation and career direction are being fundamentally dismantled. This may feel like career destruction. It is actually a forced upgrade — but only if you act deliberately.`,
    note: null,
    steps: `Do not fight the career shift — redirect it. Use this window to consciously choose the direction of your rebrand rather than letting the destruction happen to you passively.`,
  },
  PLUTO_10_environment: {
    hurt_or_help: `Your current location amplifies Pluto MC energy — placing you in professional environments where power struggles and reputation battles are more frequent and intense than they need to be.`,
    note: null,
    steps: `Research whether your professional archetype performs better in different cities. Pluto MC thrives in environments that reward disruption — not stability.`,
  },

  PLUTO_4_natal: {
    hurt_or_help: `Deep ancestral or family-level patterns are running in the background — cycles of control, trauma, or upheaval that create an unstable inner foundation. Until these are addressed, they will keep surfacing and derailing outward progress.`,
    note: null,
    steps: `This placement requires real inner work — not surface-level. Shadow work, trauma processing, and ancestral pattern-breaking are not optional here. They are the foundation everything else is built on.`,
  },
  PLUTO_4_transit: {
    hurt_or_help: `Pluto is moving through your IC — home life, family dynamics, and your deepest psychological foundations are being uprooted right now. This is one of the most destabilizing transits possible. Do not ignore it.`,
    note: null,
    steps: `Prioritize emotional and psychological stability above all else during this window. Seek support — this is not the time for solo processing. What gets addressed now determines the next decade of your foundation.`,
  },
  PLUTO_4_environment: {
    hurt_or_help: `Your current home environment carries a Plutonian frequency — intense, transformative, and often destabilizing. It is hard to feel safe or grounded here, which directly impacts your ability to build outward.`,
    note: null,
    steps: `Assess whether your current living situation is adding to your psychological load. Even temporary changes to your home environment can reduce the intensity of this placement.`,
  },

  PLUTO_2_natal: {
    hurt_or_help: `Your relationship with money and self-worth has gone through cycles of complete destruction and rebuilding. Financial identity crises, extreme boom-and-bust patterns, or deep-seated power issues around worth and value are likely. BUT — Pluto here can eventually create extraordinary financial transformation.`,
    note: null,
    steps: `Do the deep inner work on your money beliefs — Pluto in the 2nd won't let surface-level financial fixes hold. The transformation has to go to the root: what you believe you deserve, and why.`,
  },
  PLUTO_2_transit: {
    hurt_or_help: `Pluto is transiting your 2nd — your financial identity and income structures are being fundamentally dismantled right now. What you earn, what you value, and what you believe you're worth are all being forced to transform. Act deliberately.`,
    note: null,
    steps: `Use this window for a complete financial identity audit. What income models no longer fit who you're becoming? What self-worth beliefs are keeping you undercharging? Pluto in the 2nd forces this reckoning — do it consciously.`,
  },
  PLUTO_2_environment: {
    hurt_or_help: `Your current location is activating Pluto energy in your 2nd house — financial structures here are being disrupted and transformed. What you earn and how you earn it is being called to evolve in this environment.`,
    note: null,
    steps: `This location is not destroying your finances — it's forcing them to transform. Lean into the reinvention. The financial identity that emerges from this environment will be far more powerful than the one that went in.`,
  },

  PLUTO_6_natal: {
    hurt_or_help: `Your daily work and service environment carries intense, transformative, and sometimes controlling energy. Power struggles with colleagues, obsessive work patterns, or complete career reinventions are recurring themes.`,
    note: null,
    steps: `Use the Pluto 6th intensity as a tool — not a prison. Channel it into mastering your craft at a deep level. The people who work WITH Pluto in the 6th become exceptionally skilled at what they do.`,
  },
  PLUTO_6_transit: {
    hurt_or_help: `Pluto is transiting your 6th — your daily work structures, health systems, and service model are being fundamentally disrupted right now. What is no longer working in your day-to-day will be forcibly removed. This is urgent.`,
    note: null,
    steps: `Identify what in your daily work or health routine needs to be completely rebuilt — and start that process now rather than waiting for Pluto to force it. The transformation is happening regardless.`,
  },
  PLUTO_6_environment: {
    hurt_or_help: `Your current location is activating Pluto energy in your 6th house — daily work here carries an intensity and transformative pressure that demands you operate at a higher level.`,
    note: null,
    steps: `This location is asking you to master your craft and rebuild your daily systems from the ground up. The pressure is real — but those who rise to it emerge with an edge that follows them everywhere.`,
  },

  PLUTO_8_natal: {
    hurt_or_help: `Shared finances, investments, and transformative resources are prone to extreme cycles — massive gains or devastating losses. The 8th house multiplies what you put in, and Pluto amplifies this dramatically. What you invest in can transform entirely — in both directions.`,
    note: null,
    steps: `Be extremely discerning about every financial partnership, investment, and shared resource. Pluto in the 8th multiplies — which means the quality of what you invest in matters enormously. Due diligence is not optional here.`,
  },
  PLUTO_8_transit: {
    hurt_or_help: `Pluto is transiting your 8th — shared finances and investment structures are in intense transformation territory right now. Financial partnerships may dissolve, debts may surface, or investment structures may need complete rebuilding. Act deliberately.`,
    note: null,
    steps: `Surface any hidden financial conflicts or unspoken partnership tensions now. Pluto 8th transits force financial truth into the open — far better to address it on your terms than to be blindsided.`,
  },
  PLUTO_8_environment: {
    hurt_or_help: `Your current location is activating Pluto energy in your 8th house — investments and shared financial arrangements here are subject to intense transformation. What you put in multiplies — but only if the foundation is solid enough to hold it.`,
    note: null,
    steps: `This location demands exceptional financial discernment. Only invest in — and partner with — things and people that can withstand scrutiny. The transformation available here is extraordinary for those who build on real foundations.`,
  },

  // ── NEPTUNE ──────────────────────────────────────────────────────────────────

  NEPTUNE_1_natal: {
    hurt_or_help: `You come across as unclear, elusive, or hard to pin down — people struggle to understand what you stand for or what you offer. This creates confusion in branding, pitching, and establishing credibility.`,
    note: null,
    steps: `Over-communicate your identity, offer, and values in every professional context. Neptune ASC benefits enormously from clear, repeated, specific positioning — don't assume people see you clearly.`,
  },
  NEPTUNE_1_transit: {
    hurt_or_help: `Neptune is transiting your ASC right now — your sense of self and how you're perceived publicly is dissolving and reforming. Confusion, misdirection, and identity fog are active. Act now before this compounds.`,
    note: null,
    steps: `Avoid making major identity-defining decisions or public pivots during this window. Focus on behind-the-scenes work until clarity returns.`,
  },
  NEPTUNE_1_environment: {
    hurt_or_help: `Your current location amplifies the Neptune ASC blur — making it consistently harder to be seen clearly and taken seriously in this environment.`,
    note: null,
    steps: `Seek cities or professional contexts where your specific gifts are understood. Neptune ASC thrives in creative, spiritual, or artistic environments where ambiguity is a feature, not a flaw.`,
  },

  NEPTUNE_7_natal: {
    hurt_or_help: `You attract unclear, elusive, or deceptive partners and collaborators. Relationships feel magical at first — and then dissolve into confusion or disappointment. This pattern drains time and energy from your actual goals.`,
    note: null,
    steps: `Require clarity and consistency from partners before deepening commitment. Neptune DSC is prone to idealizing collaborators — slow down and verify before you invest.`,
  },
  NEPTUNE_7_transit: {
    hurt_or_help: `A current relationship or partnership is under Neptune influence right now — things may not be as they appear. Deception, confusion, or unrealistic expectations are active. Do not make major partnership commitments during this window.`,
    note: null,
    steps: `Get everything in writing. Ask direct questions and notice if answers feel evasive. This is not the time to trust on faith alone.`,
  },
  NEPTUNE_7_environment: {
    hurt_or_help: `Your current location consistently draws unclear or unreliable partners into your life. The environmental frequency is attracting the wrong collaborators.`,
    note: null,
    steps: `Be especially rigorous in vetting partnerships formed in this location. Consider whether key collaborations initiated elsewhere feel clearer and more grounded.`,
  },

  NEPTUNE_10_natal: {
    hurt_or_help: `Your career path and public identity feel undefined or constantly shifting — making it hard to build a consistent reputation or be taken seriously as an authority in one specific area.`,
    note: null,
    steps: `Choose one lane and commit to it publicly for at least 90 days. Neptune MC benefits from an anchor — a specific, repeatable message that people can attach to your name.`,
  },
  NEPTUNE_10_transit: {
    hurt_or_help: `Neptune is transiting your MC — your career direction is dissolving right now. What felt clear about your professional path may suddenly feel uncertain or meaningless. This is urgent — without direction, momentum dies.`,
    note: null,
    steps: `Do not make major career pivots impulsively during this transit. Use the uncertainty as a signal to go inward and reconnect with your actual values — not your fear.`,
  },
  NEPTUNE_10_environment: {
    hurt_or_help: `Your current location amplifies Neptune MC confusion — making it harder to be perceived as a clear, credible authority in your field here than elsewhere.`,
    note: null,
    steps: `Research cities where your specific professional archetype is understood and valued. Neptune MC often thrives in creative capitals or spiritual hubs where visionary thinking is rewarded.`,
  },

  NEPTUNE_4_natal: {
    hurt_or_help: `Home and family foundations carry a quality of illusion or instability — there may be secrets, addiction, or confusion in the family system that created an unreliable inner foundation. This shows up as difficulty trusting your own instincts.`,
    note: null,
    steps: `Build a home environment that is grounded, structured, and clear — as a direct counter to the Neptune IC fog. Routine, order, and physical stability are your anchors.`,
  },
  NEPTUNE_4_transit: {
    hurt_or_help: `Neptune is moving through your IC — home life and emotional foundations feel unstable or unclear right now. Things at home may not be what they seem. Address this before it erodes your focus.`,
    note: null,
    steps: `Do not make major home or family decisions during this transit without extensive reflection. What feels right emotionally right now may look different once Neptune moves on.`,
  },
  NEPTUNE_4_environment: {
    hurt_or_help: `Your current home environment carries a Neptune IC frequency — dreamy, unstable, or unclear. It is hard to feel truly grounded or safe here, which affects everything built outward from this base.`,
    note: null,
    steps: `Prioritize creating physical order and routine in your home as a grounding mechanism. Consider whether this location is contributing to emotional fog or instability.`,
  },

  NEPTUNE_2_natal: {
    hurt_or_help: `Your relationship with money and material resources is clouded by idealism, confusion, or avoidance. Income may feel unstable or hard to pin down. Financial boundaries are difficult to enforce and money can disappear without clear explanation.`,
    note: null,
    steps: `Create rigid financial systems and tracking — Neptune in the 2nd needs structure imposed from the outside because it doesn't generate it naturally. Automate savings, use clear budgeting tools, and never make financial decisions in an emotionally activated state.`,
  },
  NEPTUNE_2_transit: {
    hurt_or_help: `Neptune is transiting your 2nd — financial clarity is at a low right now. Income sources may feel unclear, financial boundaries are harder to enforce, and deception or confusion around money is possible. Act now to protect your finances.`,
    note: null,
    steps: `Do not make major financial decisions during this transit. Get a second opinion on any significant money move. Audit your accounts and income streams for anything unclear or unaccounted for.`,
  },
  NEPTUNE_2_environment: {
    hurt_or_help: `Your current location is activating Neptune energy in your 2nd house — financial structures here feel less defined, income may be harder to pin down, and money can slip through without clear accounting.`,
    note: null,
    steps: `This location requires you to be more financially rigorous than you naturally are. Build tighter systems, track everything, and be especially wary of financial arrangements that feel vague or inspirational but lack clear terms.`,
  },

  NEPTUNE_6_natal: {
    hurt_or_help: `Daily work routines feel foggy, hard to sustain, or unclear in purpose. You may struggle to distinguish between inspired productivity and productive avoidance. Health sensitivities are likely — especially to environment, substances, or stress.`,
    note: null,
    steps: `Structure your work day with clear, time-bound blocks — Neptune in the 6th dissolves in open-ended schedules. Be honest with yourself about whether you're working or managing the feeling of working.`,
  },
  NEPTUNE_6_transit: {
    hurt_or_help: `Neptune is transiting your 6th — work clarity, daily discipline, and health awareness are all reduced right now. It can feel like you're doing everything but producing little. This is urgent — without structure, this transit drains momentum invisibly.`,
    note: null,
    steps: `Simplify your work focus to one clear deliverable per day. Reduce health inputs that cloud clarity — Neptune 6th transits are particularly sensitive to anything that blurs perception or energy.`,
  },
  NEPTUNE_6_environment: {
    hurt_or_help: `Your current location activates Neptune energy in your 6th house — daily work here may feel less focused, health may require more attention, and professional clarity can be harder to maintain.`,
    note: null,
    steps: `This location is asking you to build exceptionally clear work systems and health practices. The fog is real — but structure is the antidote. Those who build strong daily routines here create a clarity that serves them well beyond this location.`,
  },

  NEPTUNE_8_natal: {
    hurt_or_help: `Shared finances, investments, and joint resources are prone to confusion, deception, or dissolution. What you invest in — financially or energetically — may not be what it appears. The 8th house multiplies, and Neptune can multiply illusion as easily as abundance.`,
    note: null,
    steps: `Require complete financial transparency in every joint venture or investment. Neptune in the 8th is susceptible to financial idealism — verify everything, get everything in writing, and never invest in something you don't fully understand.`,
  },
  NEPTUNE_8_transit: {
    hurt_or_help: `Neptune is transiting your 8th — shared finances and investments are in a fog right now. Financial arrangements may not be what they appear, and what you pour resources into may dissolve unexpectedly. This is a high-risk window for financial deception.`,
    note: null,
    steps: `Pause all new investment commitments and financial partnerships during this transit. Audit existing shared financial arrangements with fresh eyes. Trust your instincts if something feels unclear — Neptune 8th transits hide what needs to be seen.`,
  },
  NEPTUNE_8_environment: {
    hurt_or_help: `Your current location is activating Neptune energy in your 8th house — investments and shared financial arrangements here require exceptional clarity and due diligence. Things may not be what they appear financially in this environment.`,
    note: null,
    steps: `Apply the highest level of financial scrutiny to any investment or partnership formed in this location. The 8th house multiplies — and Neptune can multiply confusion as easily as abundance. Clarity before commitment, every time.`,
  },

  // ── URANUS ───────────────────────────────────────────────────────────────────

  URANUS_1_natal: {
    hurt_or_help: `You come across as erratic, unpredictable, or rebellious — making it hard to build consistent trust with clients, partners, or employers. People never quite know what to expect from you, which creates hesitation.`,
    note: null,
    steps: `Build predictability into your professional interactions deliberately — consistent communication, reliable delivery, and clear expectations. Let your ideas be disruptive, not your behavior.`,
  },
  URANUS_1_transit: {
    hurt_or_help: `Uranus is transiting your ASC right now — sudden identity shifts, unexpected disruptions, and erratic energy are peaking. This is an unstable window for anything requiring consistency or trust. Act on this now.`,
    note: null,
    steps: `Avoid launching new ventures or making bold public moves during this window. Use the disruptive energy for internal reinvention rather than external execution.`,
  },
  URANUS_1_environment: {
    hurt_or_help: `Your current location amplifies Uranus ASC volatility — consistently placing you in unpredictable situations that disrupt your focus and momentum.`,
    note: null,
    steps: `Seek environments that are structured and stable enough to contain your Uranus energy. Your disruptive nature thrives when the container around it is solid.`,
  },

  URANUS_7_natal: {
    hurt_or_help: `You attract unconventional, unpredictable, or suddenly-departing partners and collaborators. Relationships and partnerships have a volatile quality — things can shift or collapse without warning, disrupting your momentum.`,
    note: null,
    steps: `Build your goals around independence rather than partnership dependence. Uranus DSC works best with collaborators who have their own strong orbit — not those who need constant direction.`,
  },
  URANUS_7_transit: {
    hurt_or_help: `A key relationship or partnership is about to shift suddenly — Uranus transits in the 7th bring unexpected breakups, partnership shake-ups, or sudden new alliances. This is urgent — be prepared for abrupt changes.`,
    note: null,
    steps: `Do not make major partnership commitments during this window. Stay flexible and avoid locking yourself into long-term collaborative agreements until Uranus moves on.`,
  },
  URANUS_7_environment: {
    hurt_or_help: `Your current location consistently attracts unstable or unpredictable partners. The environmental frequency is magnetizing the wrong collaborative energy.`,
    note: null,
    steps: `Vet new partners formed in this location with extra scrutiny. Consider whether partnerships initiated in different environments feel more stable and reliable.`,
  },

  URANUS_10_natal: {
    hurt_or_help: `Your career path is unconventional and prone to sudden pivots — making it hard to build a consistent public identity or be taken seriously within traditional structures. Authority figures may find you threatening or unpredictable.`,
    note: null,
    steps: `Own the disruptor identity deliberately rather than apologetically. Position your unconventionality as your brand — but pair it with enough consistency to be trusted.`,
  },
  URANUS_10_transit: {
    hurt_or_help: `Uranus is transiting your MC — your career is in sudden-change territory right now. Job loss, unexpected pivots, or rapid public shifts are possible. This window demands proactive navigation — not passive waiting.`,
    note: null,
    steps: `Get ahead of the change rather than being caught off guard. Identify the career direction you actually want and start moving toward it now — before Uranus forces the move for you.`,
  },
  URANUS_10_environment: {
    hurt_or_help: `Your current location amplifies Uranus MC unpredictability in your professional life — making career momentum harder to sustain here than it would be elsewhere.`,
    note: null,
    steps: `Research cities where innovation and disruption are rewarded professionally. Uranus MC thrives in tech hubs, startup ecosystems, and industries that move fast.`,
  },

  URANUS_4_natal: {
    hurt_or_help: `Home and family life has been consistently unpredictable or unstable — frequent moves, sudden disruptions, or an unconventional upbringing that left you without a reliable inner foundation.`,
    note: null,
    steps: `Create as much home stability as possible — Uranus IC needs a deliberately constructed anchor. Routine, consistent physical space, and grounded daily habits are not optional here.`,
  },
  URANUS_4_transit: {
    hurt_or_help: `Uranus is moving through your IC — sudden home disruptions, unexpected family shake-ups, or forced living situation changes are likely right now. Address your home situation proactively before it derails everything else.`,
    note: null,
    steps: `Secure your living situation as a top priority. Do not sign long-term home commitments during this window — flexibility is your greatest asset right now.`,
  },
  URANUS_4_environment: {
    hurt_or_help: `Your current home environment carries a Uranus IC frequency — unpredictable, unstable, and hard to settle into. It is difficult to feel truly grounded here, which undermines your ability to build outward.`,
    note: null,
    steps: `Prioritize physical stability in your home environment above all else. Consider whether frequent moves or an unsettled living situation is actively costing you focus and momentum.`,
  },

  URANUS_2_natal: {
    hurt_or_help: `Your income and financial identity are unconventional and prone to sudden shifts — feast-or-famine patterns, unexpected windfalls, or abrupt financial disruptions are recurring themes. Traditional employment or income models rarely feel sustainable.`,
    note: null,
    steps: `Embrace unconventional income streams — multiple revenue sources, non-traditional business models, or innovative approaches to monetization. Uranus in the 2nd thrives when you stop trying to earn money the conventional way.`,
  },
  URANUS_2_transit: {
    hurt_or_help: `Uranus is transiting your 2nd — sudden financial changes, unexpected income disruptions, or abrupt shifts in how you earn are active right now. This is urgent — stabilize what you can and stay flexible on the rest.`,
    note: null,
    steps: `Be Uranian with your income approach right now — don't be afraid to switch things up, try unconventional income methods, or pivot your financial model. The breakthrough in this window comes from doing it differently.`,
  },
  URANUS_2_environment: {
    hurt_or_help: `Your current location activates Uranus energy in your 2nd house — income patterns here are more volatile and unconventional than they would be elsewhere.`,
    note: null,
    steps: `This location is calling you to be innovative and flexible with how you earn. Don't force traditional income models here — explore unconventional paths and stay open to sudden financial opportunities that come from unexpected directions.`,
  },

  URANUS_6_natal: {
    hurt_or_help: `Your daily work routines are unconventional, prone to disruption, and resistant to rigid structure. Traditional employment environments tend to feel suffocating. Health can be affected by sudden lifestyle changes or an erratic daily schedule.`,
    note: null,
    steps: `Design a work life that builds in genuine flexibility and autonomy. Uranus in the 6th performs best in freelance, entrepreneurial, or innovation-driven roles — not 9-to-5 structures. Build your routine around what you can actually sustain.`,
  },
  URANUS_6_transit: {
    hurt_or_help: `Uranus is transiting your 6th — sudden work disruptions, unexpected health developments, and abrupt changes to your daily routine are possible right now. This is a window to completely reinvent how you work.`,
    note: null,
    steps: `Be Uranian — don't be afraid to overhaul your entire daily work structure during this transit. The breakthrough comes from doing it radically differently. Try unconventional productivity methods, work environments, or health approaches.`,
  },
  URANUS_6_environment: {
    hurt_or_help: `Your current location activates Uranus energy in your 6th house — the work environment here is unpredictable, and daily routines are harder to maintain consistently.`,
    note: null,
    steps: `This location is asking you to innovate your work approach. Don't try to force conventional work structures here — lean into flexibility, experimentation, and unconventional methods. The breakthroughs in this environment come from those willing to work differently.`,
  },

  URANUS_8_natal: {
    hurt_or_help: `Shared finances, investments, and transformative resources are subject to sudden, unexpected shifts. Financial partnerships can dissolve or transform abruptly. The 8th house multiplies — and Uranus can multiply both breakthroughs and disruptions.`,
    note: null,
    steps: `Be Uranian with your investment strategy — don't be afraid to take unconventional financial paths or explore non-traditional investment models. But stay discerning: the 8th house multiplies what you put in, so only invest in what you genuinely understand.`,
  },
  URANUS_8_transit: {
    hurt_or_help: `Uranus is transiting your 8th — sudden financial disruptions, unexpected investment opportunities, and abrupt changes to shared financial arrangements are active right now. This window favors the bold and flexible.`,
    note: null,
    steps: `Be Uranian — stay open to unconventional financial opportunities and be willing to switch up your investment approach entirely. The breakthrough in this transit comes from those who embrace the unexpected rather than fighting to maintain old financial structures.`,
  },
  URANUS_8_environment: {
    hurt_or_help: `Your current location activates Uranus energy in your 8th house — investment and shared financial opportunities here tend to be unconventional, fast-moving, and subject to sudden change.`,
    note: null,
    steps: `This location rewards financial innovation and the willingness to take unconventional investment paths. Be discerning about what you multiply — but don't be afraid to explore financial models that don't look like what you've done before.`,
  },

  // ── HOUSE 5 — 5th House (Creativity, Romance, Self-Expression, Speculation) ──
  // Pheydrus scores house 5 as angular. Source: Pheydrus 5th·11th·12th House Library.

  MARS_5_natal: {
    hurt_or_help: `Your creative and romantic energy is intense, impulsive, and prone to conflict. Creative projects can start fast and burn out. Romantic connections carry a combative or volatile quality — attraction is fierce but friction follows quickly. Speculative financial moves are high-risk when driven by impulse.`,
    note: null,
    steps: `Channel Mars 5th energy into competitive creative fields — performance, sports, entrepreneurship, or any outlet that rewards bold self-expression. In romance, slow down before committing — what feels electric can become explosive. In speculation, set a loss limit before you enter, not after.`,
  },
  MARS_5_transit: {
    hurt_or_help: `Mars is transiting your 5th — creative impulsivity, romantic conflict, and speculative risk are all elevated right now. Bold creative moves can backfire and romantic tensions can escalate quickly. This is urgent — act with intention, not impulse.`,
    note: null,
    steps: `Make creative decisions with a 24-hour buffer. Avoid starting new romantic pursuits during peak Mars activation — the intensity feels real but may not be sustainable. Do not make speculative financial moves during this window.`,
  },
  MARS_5_environment: {
    hurt_or_help: `Your current location amplifies Mars energy in your 5th — the creative and romantic environment here is intense, competitive, and prone to conflict. Speculative opportunities here carry higher volatility than elsewhere.`,
    note: null,
    steps: `Seek creative environments where your drive is channeled productively rather than met with equal aggression. Be especially discerning about romantic connections formed in this location — the Mars energy here amplifies attraction and conflict in equal measure.`,
  },

  SATURN_5_natal: {
    hurt_or_help: `Creative expression feels restricted, blocked, or overly serious. Playfulness and joy do not come naturally — everything creative becomes a project that must be done right. Romance is delayed, complicated, or comes with heavy responsibility. Speculation feels too risky to attempt. BUT — Saturn in the 5th eventually produces disciplined creative mastery.`,
    note: null,
    steps: `Give yourself permission to be imperfect creatively. Saturn in the 5th needs deliberate practice in play — schedule unstructured creative time with no goal attached. In romance, lower the bar for what counts as enough. Joy is allowed.`,
  },
  SATURN_5_transit: {
    hurt_or_help: `Saturn is transiting your 5th — creative output feels blocked, romance feels complicated or absent, and speculative risk feels unwise. This is a multi-year window calling you to build creative discipline rather than spontaneous expression.`,
    note: null,
    steps: `Use this window to develop your creative craft through consistent structured practice. Do not force romance or speculative financial moves — Saturn in the 5th transit rewards patience and penalizes impulsive self-expression.`,
  },
  SATURN_5_environment: {
    hurt_or_help: `Your current location activates Saturn energy in your 5th — creative expression here requires more effort, romance feels more serious and less playful, and speculative opportunities carry heavier consequences.`,
    note: null,
    steps: `This location is calling you to build real creative discipline. The creative work built under Saturn's pressure here will be more technically excellent than what comes easily elsewhere. Trust the process.`,
  },

  PLUTO_5_natal: {
    hurt_or_help: `Your creative expression and romantic life carry an intense, transformative, and sometimes obsessive quality. Creative projects go through complete reinventions. Romantic connections feel fated — and often end in profound transformation rather than comfortable continuity. Speculative financial moves can be all-or-nothing.`,
    note: null,
    steps: `Embrace the transformative nature of your creativity — Pluto in the 5th doesn't do surface-level. Your most powerful creative work comes from going to the darkest, most honest places. In romance, look for depth over comfort. In speculation, only risk what you can genuinely afford to transform.`,
  },
  PLUTO_5_transit: {
    hurt_or_help: `Pluto is transiting your 5th — your creative identity and romantic life are being fundamentally transformed right now. Creative projects may need to be completely rebuilt. A significant romantic chapter may be ending or beginning. Act deliberately — Pluto in the 5th doesn't do halfway.`,
    note: null,
    steps: `Use this window for a complete creative reinvention. What creative identity are you being called to step into? In romance, be honest about what is truly transforming versus what you are trying to hold onto. Let Pluto do its work.`,
  },
  PLUTO_5_environment: {
    hurt_or_help: `Your current location activates Pluto energy in your 5th — the creative and romantic environment here demands transformation. Creative work here carries an unusual intensity, and romantic connections formed here carry an unusual depth and transformative quality.`,
    note: null,
    steps: `Lean into the depth and intensity this location amplifies creatively. The creative work produced here has the potential to be some of your most powerful — but only if you're willing to go to the uncomfortable places.`,
  },

  NEPTUNE_5_natal: {
    hurt_or_help: `Creative inspiration flows beautifully — but execution and follow-through are difficult. You may idealize romantic partners beyond reality, leading to disappointment when the fantasy meets the person. Speculative financial moves are prone to wishful thinking rather than clear-eyed analysis.`,
    note: null,
    steps: `Build structured creative deadlines to counter Neptune's tendency to dissolve before completion. In romance, slow down and observe the real person — not the ideal you've projected. In speculation, require concrete data before committing.`,
  },
  NEPTUNE_5_transit: {
    hurt_or_help: `Neptune is transiting your 5th — creative inspiration is high but follow-through is low, romantic idealization is peaked, and speculative financial decisions are prone to illusion right now. This is a beautiful creative window but a dangerous one for commitment.`,
    note: null,
    steps: `Use this window for creative inspiration and ideation — not execution. Capture every idea but don't launch until Neptune moves on. Do not make romantic or speculative financial commitments during this transit.`,
  },
  NEPTUNE_5_environment: {
    hurt_or_help: `Your current location activates Neptune energy in your 5th — creative inspiration flows freely here but romantic connections may be idealized, and speculative opportunities may not be as solid as they appear.`,
    note: null,
    steps: `Use this location for creative inspiration and spiritual creative work. Be especially rigorous about vetting romantic connections and speculative financial opportunities formed here — Neptune in the 5th environment makes things look more beautiful than they are.`,
  },

  URANUS_5_natal: {
    hurt_or_help: `Your creative expression is unconventional, unpredictable, and resistant to traditional forms. Romantic connections tend to be unusual, sudden, or non-traditional — and may end as abruptly as they began. Speculative financial moves carry unusual volatility.`,
    note: null,
    steps: `Be Uranian creatively — lean into the unconventional, the experimental, and the genre-defying. Your creative work thrives when it breaks existing molds. In romance, embrace non-traditional connection structures. In speculation, take unconventional paths but set clear limits.`,
  },
  URANUS_5_transit: {
    hurt_or_help: `Uranus is transiting your 5th — sudden creative breakthroughs, unexpected romantic developments, and abrupt speculative opportunities are all active right now. This is a window of exciting but volatile creative and romantic energy.`,
    note: null,
    steps: `Be Uranian — don't be afraid to completely reinvent your creative approach or try an unconventional romantic or financial move. The breakthrough in this window comes from doing it radically differently. Stay flexible and don't lock yourself into any single approach.`,
  },
  URANUS_5_environment: {
    hurt_or_help: `Your current location activates Uranus energy in your 5th — the creative environment here is innovative and unconventional, romantic connections tend to be sudden and non-traditional, and speculative opportunities come from unexpected directions.`,
    note: null,
    steps: `Lean into the creative innovation this location amplifies. Be open to unconventional romantic connections and speculative opportunities that don't look like what you've tried before. Uranus in the 5th environment rewards those willing to do it differently.`,
  },

  SUN_5_natal: {
    hurt_or_help: `You are a natural creative — self-expression, performance, and playful leadership come easily. Romance is vibrant and you attract attention wherever you go. Speculative financial ventures carry a solar confidence that often pays off. This is one of the most joyful and generative placements.`,
    note: `The Sun's need for applause in the 5th can create a dependency on external validation for creative worth. Build an internal creative standard that doesn't require an audience to feel real.`,
    steps: `Invest in creative visibility and performance. Sun in the 5th shines brightest when on full display — content creation, live performance, teaching, or any platform where your authentic self-expression is the product.`,
  },
  SUN_5_transit: {
    hurt_or_help: `Sun is transiting your 5th — a brief but vibrant window of creative confidence, romantic magnetism, and speculative courage. This is your moment to play big creatively.`,
    note: `Sun transits are short — days to weeks. Move now.`,
    steps: `Launch your most expressive creative project, pursue the romantic connection, or make the speculative move you've been considering. The Sun in the 5th transit rewards bold, joyful self-expression — don't hold back.`,
  },
  SUN_5_environment: {
    hurt_or_help: `Your current location activates Sun energy in your 5th — creative confidence, romantic magnetism, and joyful self-expression are amplified here. You feel more alive, more visible, and more creatively potent in this environment.`,
    note: null,
    steps: `Maximize creative output and romantic openness in this location. The environment is amplifying your natural creative leadership — use it to produce your most expressive and visible work.`,
  },

  MOON_5_natal: {
    hurt_or_help: `Your creativity is deeply emotionally driven — your best creative work comes from personal feeling rather than intellectual concept. Romantic connections carry a nurturing, emotionally rich quality. You are drawn to creative work that touches people's hearts.`,
    note: `Moon in the 5th can create emotional fluctuation in creative output — some days inspired, some days completely dry. Build creative routines that accommodate the cycles rather than fighting them.`,
    steps: `Lead with emotional authenticity in all creative work. Moon in the 5th produces the most resonant creative output when it comes from genuine personal feeling — don't filter it for palatability.`,
  },
  MOON_5_transit: {
    hurt_or_help: `Moon is transiting your 5th — a brief window of heightened emotional creativity, romantic warmth, and playful self-expression. Your most personal, heartfelt creative work carries unusual resonance right now.`,
    note: `Moon transits are short — days, not weeks. Move on this now.`,
    steps: `Create from your most emotionally honest place this week. Share the personal creative work you've been holding back. The emotional resonance available right now is unusually high.`,
  },
  MOON_5_environment: {
    hurt_or_help: `Your current location activates Moon energy in your 5th — emotional creativity flows more freely here, romantic connections carry genuine warmth, and your heart-centered creative work resonates more deeply with audiences in this environment.`,
    note: null,
    steps: `Use this location to create your most personal and emotionally honest work. The environment is amplifying the emotional depth of your creative expression — let it show.`,
  },

  VENUS_5_natal: {
    hurt_or_help: `Your creativity is beautiful, charming, and aesthetically gifted. Romantic connections are naturally harmonious and pleasurable. Speculative ventures carry a Venusian grace that tends to attract rather than force returns. This is one of the most naturally delightful creative placements.`,
    note: `Venus in the 5th can prioritize pleasure over persistence — creative projects feel wonderful to start and harder to finish. Build completion rituals that make finishing feel as pleasurable as beginning.`,
    steps: `Invest in the aesthetic quality of your creative work — Venus in the 5th earns recognition through beauty. Make your creative output as visually and sonically beautiful as possible. Let the charm of your work do the selling.`,
  },
  VENUS_5_transit: {
    hurt_or_help: `Venus is transiting your 5th — a window of heightened creative beauty, romantic harmony, and pleasurable self-expression. New romantic connections formed now carry genuine charm. Creative work launched now has unusual aesthetic appeal.`,
    note: `Venus transits are relatively short — a few weeks. Move on it.`,
    steps: `Launch your most beautiful creative work during this window. Pursue romantic connections that feel genuinely harmonious. Venus in the 5th transit rewards those who lead with grace and beauty.`,
  },
  VENUS_5_environment: {
    hurt_or_help: `Your current location activates Venus energy in your 5th — creative work here carries unusual beauty and charm, romantic connections are more harmonious, and speculative opportunities feel pleasurable rather than stressful.`,
    note: null,
    steps: `Invest in your most aesthetically driven creative projects in this location. The environment is amplifying the beauty and charm of your creative expression — use it for your most important creative launches.`,
  },

  JUPITER_5_natal: {
    hurt_or_help: `Your creativity, romantic life, and capacity for joy are expansive and abundant. Creative projects tend to grow beyond their original scope. Romantic connections carry a generous, adventurous quality. Speculative financial ventures have genuine potential for outsized returns — Jupiter in the 5th is one of the luckiest speculative placements.`,
    note: `Jupiter in the 5th can create overcommitment to too many creative projects. Focus the expansive energy into one or two high-conviction creative bets rather than spreading it across everything.`,
    steps: `Think bigger about your creative potential. Jupiter in the 5th is built for large-scale creative expression — don't limit the scope of what you're willing to make or share. In speculation, move on aligned opportunities with real confidence — this placement supports bold creative and financial risk.`,
  },
  JUPITER_5_transit: {
    hurt_or_help: `Jupiter is transiting your 5th — one of the most joyful and creatively expansive windows available. Creative projects grow, romantic connections flourish, and speculative financial moves carry genuine luck.`,
    note: `Jupiter transits last about a year — move early to maximize the full window.`,
    steps: `Make your boldest creative moves during this window. Launch the big project, pursue the romantic connection, take the speculative financial bet you've been considering. Jupiter in the 5th transit rewards those who play big and joyfully.`,
  },
  JUPITER_5_environment: {
    hurt_or_help: `Your current location activates Jupiter energy in your 5th — creative abundance, romantic generosity, and speculative financial luck are all amplified here. This is one of the most enjoyable location placements available.`,
    note: null,
    steps: `Go all in on creative expression, romantic openness, and aligned speculative ventures in this location. Jupiter in the 5th through astrocartography is a genuinely lucky placement for joy, creativity, and financial speculation.`,
  },

  // ── SUN ──────────────────────────────────────────────────────────────────────

  SUN_1_natal: {
    hurt_or_help: `You are a natural leader — you walk into rooms and people notice. Your presence commands attention and inspires confidence. This is one of the strongest placements for personal brand-building, visibility, and establishing authority.`,
    note: `The masculine, solar energy can sometimes come across as dominating — be intentional about creating space for others or it can repel collaboration.`,
    steps: `Step into visible leadership roles deliberately. Your 90-day goal accelerates fastest when you are front and center — not operating from behind the scenes.`,
  },
  SUN_1_transit: {
    hurt_or_help: `Sun is transiting your ASC — a short but potent window of heightened visibility and personal magnetism. This is your moment to be seen.`,
    note: `Sun transits move fast — this window is brief. Use it now.`,
    steps: `Launch, post, pitch, and show up publicly this week. The spotlight is on you — don't waste it by staying quiet.`,
  },
  SUN_1_environment: {
    hurt_or_help: `Your current location activates Sun on your ASC — you are more visible, magnetic, and authoritative here than you would be elsewhere.`,
    note: null,
    steps: `Double down on visibility in this location. Your personal brand and leadership presence are amplified here — use it to its full potential.`,
  },

  SUN_7_natal: {
    hurt_or_help: `You attract strong, magnetic, and leadership-oriented partners and collaborators. The people who show up in your life tend to be driven and capable — they take the lead and you benefit from their energy.`,
    note: `The 'other' tends to be more dominant or masculine in dynamic — this is supportive but can create dependency if you're not careful about maintaining your own agency.`,
    steps: `Actively seek and cultivate partnerships with high-caliber collaborators. Your goal advances fastest when you're aligned with people who are more established or influential than you currently are.`,
  },
  SUN_7_transit: {
    hurt_or_help: `A significant, solar-energy person is entering or activating in your partnership sphere right now. A key collaboration or connection is illuminated during this window.`,
    note: `This transit moves quickly — act on promising connections now rather than waiting.`,
    steps: `Reach out to a mentor, partner, or collaborator you've been hesitating on. This window is amplifying the quality of your 1:1 connections — use it.`,
  },
  SUN_7_environment: {
    hurt_or_help: `Your current location consistently attracts high-caliber, leadership-oriented partners and collaborators into your orbit.`,
    note: null,
    steps: `Say yes to partnership conversations and collaborative opportunities in this location. The environment is magnetizing influential connections — be open and available to them.`,
  },

  SUN_10_natal: {
    hurt_or_help: `You are built for public recognition and professional leadership. Your name and reputation have a natural authority that makes career advancement and visibility come more naturally than average.`,
    note: `The solar energy here can create pressure to always be 'on' publicly — burnout is a real risk if you don't build in recovery.`,
    steps: `Invest in your public presence deliberately — content, speaking, press, visibility. Your 90-day goal accelerates through recognition, not behind-the-scenes effort alone.`,
  },
  SUN_10_transit: {
    hurt_or_help: `Sun is transiting your MC — a brief but powerful window of career visibility and professional recognition. Opportunities to be seen by the right people are amplified right now.`,
    note: `This transit is short — move on it immediately.`,
    steps: `Make your most important career move, pitch, or public announcement this week. The professional spotlight is active — don't let it pass unused.`,
  },
  SUN_10_environment: {
    hurt_or_help: `Your current location amplifies your professional visibility and authority — you are more likely to be recognized and respected in your field here than in other locations.`,
    note: null,
    steps: `Maximize professional visibility in this city. Events, networking, press, and public-facing opportunities are more likely to pay off here than elsewhere.`,
  },

  SUN_4_natal: {
    hurt_or_help: `Your home and family foundation carries a strong, solar energy — a powerful inner foundation that creates stability and driven inner confidence. You carry authority and resilience from the inside out.`,
    note: `The solar IC energy can also create pressure to live up to a strong parental legacy — make sure the goals you're pursuing are yours and not inherited expectations.`,
    steps: `Use your strong inner foundation as fuel. Your ability to recover, self-motivate, and stay grounded is an asset — lean into it when external conditions get difficult.`,
  },
  SUN_4_transit: {
    hurt_or_help: `Sun is transiting your IC — home life, family connections, and your inner emotional world are illuminated and energized right now. A brief but supportive window for grounding and reconnecting with your foundations.`,
    note: `This transit is short — days, not weeks.`,
    steps: `Use this window to strengthen your home environment and reconnect with supportive family or community. A grounded base directly accelerates outward momentum.`,
  },
  SUN_4_environment: {
    hurt_or_help: `Your current home environment carries a supportive, solar IC frequency — warm, stable, and confidence-building. You feel more grounded and motivated here than in other locations.`,
    note: null,
    steps: `Protect this environment. The stability it provides is actively supporting your ability to build outward — don't disrupt it unnecessarily.`,
  },

  SUN_2_natal: {
    hurt_or_help: `Your identity is deeply tied to how you earn and what you value — when your income aligns with your authentic self-expression, you shine. You have a natural confidence around money-making that draws financial opportunity toward you.`,
    note: `The Sun's need to be seen can sometimes lead to overspending on image or status. Make sure financial decisions are driven by values, not validation.`,
    steps: `Prioritize income streams that feel genuinely like you — not what's expected or conventional. Sun in the 2nd earns most powerfully when the work is an authentic extension of identity.`,
  },
  SUN_2_transit: {
    hurt_or_help: `Sun is transiting your 2nd — a brief but powerful window of increased income potential and financial confidence. Opportunities to earn through visibility and self-expression are amplified right now.`,
    note: `Sun transits are short — days to weeks. Move on it immediately.`,
    steps: `Make your most important financial moves, rate increases, or income-generating launches during this window. Your financial magnetism is at its peak — act on it now.`,
  },
  SUN_2_environment: {
    hurt_or_help: `Your current location activates Sun energy in your 2nd house — income opportunities are more visible and accessible here, and your financial confidence is amplified in this environment.`,
    note: null,
    steps: `Maximize income-generating activity in this location. The environment is actively amplifying your earning potential — show up visibly and make your financial moves here.`,
  },

  SUN_6_natal: {
    hurt_or_help: `Your daily work is a genuine source of vitality and identity — when your work aligns with who you are, your energy is exceptional. You are a natural leader in work environments and tend to bring a solar quality to everything you do professionally.`,
    note: `The Sun's need to shine in the 6th can create workaholism — make sure the daily work is sustainable, not just impressive.`,
    steps: `Build a work life that keeps you front and center. You thrive in leadership, mentorship, or any role where your presence and authority in daily work is visible. The more you lead, the more energized you become.`,
  },
  SUN_6_transit: {
    hurt_or_help: `Sun is transiting your 6th — a brief window of heightened productivity, work confidence, and daily vitality. Your ability to lead and excel in your daily work is amplified right now.`,
    note: `Sun transits are short — use it now.`,
    steps: `Front-load your most important work tasks and leadership moments during this window. Your daily output quality and professional presence are at their peak.`,
  },
  SUN_6_environment: {
    hurt_or_help: `Your current location activates Sun energy in your 6th house — daily work here feels more energizing, your professional leadership presence is amplified, and your work output carries more authority.`,
    note: null,
    steps: `Invest fully in your professional craft and daily work in this location. The environment is amplifying your work vitality and leadership quality — use it to build something lasting.`,
  },

  SUN_8_natal: {
    hurt_or_help: `You have a powerful, magnetic energy around shared resources, investments, and transformation. Others are drawn to invest in you or partner with you financially — and what you consciously put into the 8th house has genuine potential to multiply.`,
    note: `The Sun's need for recognition in the 8th can create a desire for visible wealth or status — make sure financial moves are driven by genuine opportunity, not the need to be seen as successful.`,
    steps: `Be intentional about what you invest in — the 8th house multiplies, and Sun here means your authentic energy is the asset. Put yourself into things you genuinely believe in and the multiplication is real.`,
  },
  SUN_8_transit: {
    hurt_or_help: `Sun is transiting your 8th — a brief but potent window of financial opportunity through shared resources, investments, and partnerships. What you consciously put energy into right now has multiplication potential.`,
    note: `Sun transits are short. Move on promising financial opportunities immediately.`,
    steps: `Make your most important investment moves and financial partnership decisions during this window. The 8th house multiplies — and the Sun is amplifying your financial magnetism right now.`,
  },
  SUN_8_environment: {
    hurt_or_help: `Your current location activates Sun energy in your 8th house — investment opportunities, financial partnerships, and shared resource multiplications are more available and more potent here.`,
    note: null,
    steps: `Pursue investment opportunities and financial partnerships in this location with confidence. The environment is amplifying your 8th house multiplication potential — what you put in here, done wisely, tends to grow.`,
  },

  // ── MOON ─────────────────────────────────────────────────────────────────────

  MOON_1_natal: {
    hurt_or_help: `You come across as warm, emotionally intuitive, and deeply relatable. People feel seen and cared for by you — which creates natural trust and likeability that supports relationship-based goals.`,
    note: `Moon on the ASC is nurturing and magnetic — but not assertive. This placement supports connection beautifully but may not drive bold, proactive momentum on its own. Don't mistake being liked for being moved forward.`,
    steps: `Pair your natural warmth with deliberate, proactive outreach. Your likability opens doors — but you still need to knock on them.`,
  },
  MOON_1_transit: {
    hurt_or_help: `Moon is transiting your ASC — a brief window of heightened emotional magnetism and personal warmth. People are more drawn to you than usual right now.`,
    note: `Moon transits are short — days, not weeks. Use this window immediately.`,
    steps: `Show up in person or on camera this week. Your emotional presence and relatability are at their peak — capitalize on it now.`,
  },
  MOON_1_environment: {
    hurt_or_help: `Your current location activates a warm, emotionally resonant quality in how you're perceived — people in this environment respond to you with more openness and trust than in other locations.`,
    note: null,
    steps: `Leverage the relational warmth this location creates. Community-building, networking, and trust-based sales all perform better for you here.`,
  },

  MOON_7_natal: {
    hurt_or_help: `You attract nurturing, emotionally supportive partners and collaborators. Your relationships have a quality of genuine care and mutual support that creates a stable collaborative foundation.`,
    note: `Moon in the 7th is emotionally rich but can trend toward passive — partnerships may feel supportive without being growth-activating. Don't confuse comfort with momentum.`,
    steps: `Seek partners who complement your emotional depth with proactive drive. The best collaborations for you combine your relational warmth with someone else's forward momentum.`,
  },
  MOON_7_transit: {
    hurt_or_help: `Moon is transiting your 7th — a brief window of heightened relational warmth and partnership opportunity. Emotional connections with collaborators and clients are amplified right now.`,
    note: `This window is short. Act on promising partnership conversations immediately.`,
    steps: `Reach out to a potential collaborator or client you've been meaning to connect with. The relational energy is supportive right now — use it.`,
  },
  MOON_7_environment: {
    hurt_or_help: `Your current location consistently draws nurturing, supportive partners into your orbit. The environment is creating a relational foundation that supports your work.`,
    note: `Supportive doesn't always mean growth-activating — make sure your partnerships are also driving you forward, not just making you comfortable.`,
    steps: `Cultivate the supportive partnerships this location is attracting — but stay intentional about whether they're moving your goal forward or just feeling good.`,
  },

  MOON_10_natal: {
    hurt_or_help: `Your public reputation carries a warm, nurturing, and emotionally resonant quality — people feel connected to you publicly in a way that builds loyal audiences and communities.`,
    note: `Moon MC is beloved but not always authoritative. It builds community beautifully — but may need to be paired with more assertive positioning to convert that community into career momentum.`,
    steps: `Lead with your story and emotional authenticity in public-facing content. Your audience grows through feeling — not just information.`,
  },
  MOON_10_transit: {
    hurt_or_help: `Moon is transiting your MC — a brief window of heightened public warmth and community resonance. Content and visibility efforts launched now carry more emotional impact than usual.`,
    note: `This transit is short. Move on it today.`,
    steps: `Post your most personal, emotionally authentic content right now. The public resonance is amplified — this is not the time for polished and distant.`,
  },
  MOON_10_environment: {
    hurt_or_help: `Your current location amplifies the warm, community-building quality of your public presence. You are more beloved and trusted in your professional field here than in other locations.`,
    note: null,
    steps: `Invest in community-building and audience cultivation in this city. Your professional warmth is amplified here — use it to build the loyal base that sustains long-term momentum.`,
  },

  MOON_4_natal: {
    hurt_or_help: `Your home and family foundation is deeply nurturing and emotionally safe — you have a strong inner world and a reliable emotional anchor that supports resilience and recovery.`,
    note: `Strong maternal influence here can be both supportive and potentially limiting — make sure the emotional security of home isn't creating comfort that reduces your drive to build outward.`,
    steps: `Use your strong emotional foundation as a recovery resource — not a retreat. The safety it provides should fuel your outward momentum, not replace it.`,
  },
  MOON_4_transit: {
    hurt_or_help: `Moon is transiting your IC — a brief window of heightened emotional grounding and home warmth. Your inner world feels more settled and supported than usual right now.`,
    note: `This transit is short — days, not weeks.`,
    steps: `Use this window for planning, reflection, and inner work. The emotional clarity available now will sharpen your external decisions in the weeks that follow.`,
  },
  MOON_4_environment: {
    hurt_or_help: `Your current home environment carries a deeply nurturing, emotionally safe frequency — you feel genuinely at home here in a way that supports rest, recovery, and sustained output.`,
    note: null,
    steps: `Protect this home environment deliberately. The emotional safety it provides is a genuine competitive advantage — it allows you to recover faster and build longer.`,
  },

  MOON_2_natal: {
    hurt_or_help: `Your relationship with money is deeply tied to emotional security — when you feel emotionally safe, your income flows. You have a natural instinct for what people emotionally need, which can be a powerful asset in income generation.`,
    note: `Moon in the 2nd can create emotional spending or income fluctuations tied to mood. Build financial systems that are independent of your emotional state — automate what you can.`,
    steps: `Build income streams that feel emotionally resonant and personally meaningful — Moon in the 2nd earns best when the work nourishes you emotionally, not just financially.`,
  },
  MOON_2_transit: {
    hurt_or_help: `Moon is transiting your 2nd — a brief window of heightened financial intuition and emotional connection to money. Trust your gut on financial decisions right now.`,
    note: `Moon transits are short — days, not weeks. Move now.`,
    steps: `Act on financial opportunities that feel genuinely right to you during this window. Your financial instincts are amplified — don't overthink it.`,
  },
  MOON_2_environment: {
    hurt_or_help: `Your current location activates Moon energy in your 2nd house — income opportunities that feel personally meaningful and emotionally resonant are more available here.`,
    note: null,
    steps: `Pursue income opportunities that align with your values and feel genuinely nourishing in this location. The environment is amplifying the emotional resonance of your earning — use it.`,
  },

  MOON_6_natal: {
    hurt_or_help: `Your daily work is a source of emotional nourishment — you bring genuine care and intuitive attunement to your work environment. You excel in service-oriented roles and tend to create emotionally safe spaces for colleagues and clients.`,
    note: `Moon in the 6th can blur work and emotional absorption — make sure you're not carrying others' emotions home. Build clear energetic boundaries between your work and personal life.`,
    steps: `Build a work life centered around service, care, and emotional attunement. Moon in the 6th thrives in healing, teaching, coaching, or any daily work that involves genuinely caring for others.`,
  },
  MOON_6_transit: {
    hurt_or_help: `Moon is transiting your 6th — a brief window of heightened emotional attunement in your daily work. Your care and intuition in professional settings is amplified right now.`,
    note: `Moon transits are short. Use this relational warmth in your work now.`,
    steps: `Show up with full emotional presence in your work this week. Client relationships and service interactions carry unusual warmth and resonance during this window.`,
  },
  MOON_6_environment: {
    hurt_or_help: `Your current location activates Moon energy in your 6th house — daily work here feels more emotionally nourishing, and your care and intuition in professional settings is amplified.`,
    note: null,
    steps: `Invest in the relational and service quality of your work in this location. The environment is amplifying your natural emotional intelligence in daily work — let it show.`,
  },

  MOON_8_natal: {
    hurt_or_help: `You have a deep emotional intelligence around shared resources, intimacy, and transformation. Others feel emotionally safe investing in you or partnering with you — which creates real potential for financial multiplication through trust-based relationships.`,
    note: `Moon in the 8th can create emotional attachment to shared financial outcomes. Make sure financial partnerships have clear agreements that don't depend on the emotional relationship remaining stable.`,
    steps: `Build financial partnerships and investment relationships based on deep emotional trust. Moon in the 8th multiplies through genuine connection — the more real the relationship, the greater the financial potential.`,
  },
  MOON_8_transit: {
    hurt_or_help: `Moon is transiting your 8th — a brief window of heightened emotional attunement around shared finances and investment. Financial partnerships that feel emotionally right carry genuine multiplication potential right now.`,
    note: `Moon transits are short. Act on promising financial partnerships this week.`,
    steps: `Move on shared financial opportunities that feel genuinely aligned during this window. The 8th house multiplies — and the Moon is amplifying the emotional resonance of what you invest in right now.`,
  },
  MOON_8_environment: {
    hurt_or_help: `Your current location activates Moon energy in your 8th house — trust-based financial partnerships and investment opportunities that feel emotionally resonant are more available here.`,
    note: null,
    steps: `Cultivate the trust-based financial relationships this location is attracting. Moon in the 8th multiplies through genuine connection — the deeper the trust, the greater the potential return.`,
  },

  // ── VENUS ────────────────────────────────────────────────────────────────────

  VENUS_1_natal: {
    hurt_or_help: `You are naturally charming, attractive, and easy to like — people are drawn to you instinctively. This creates an enormous advantage in sales, networking, and any goal that requires winning people over quickly.`,
    note: `Venus ASC is magnetic but can be passive — charm opens doors, but Venus energy doesn't always walk through them. Likability alone won't close the deal.`,
    steps: `Use your natural magnetism as the opener — but pair it with direct, specific asks. Don't assume charm will do the work of follow-through.`,
  },
  VENUS_1_transit: {
    hurt_or_help: `Venus is transiting your ASC — a window of heightened personal magnetism, attractiveness, and charm. First impressions are especially powerful right now.`,
    note: `Venus transits are relatively short. Use this window within the next few weeks.`,
    steps: `Schedule your most important pitches, meetings, and first impressions during this window. You are more compelling than usual right now — leverage it.`,
  },
  VENUS_1_environment: {
    hurt_or_help: `Your current location amplifies your natural charm and attractiveness — you are more magnetic and well-received here than in other environments.`,
    note: null,
    steps: `Maximize in-person visibility and first-impression opportunities in this location. Your Venus ASC energy is amplified here — use it for sales, networking, and brand-building.`,
  },

  VENUS_7_natal: {
    hurt_or_help: `You attract beautiful, harmonious, and genuinely supportive partnerships. Your collaborators and key relationships tend to be high-quality, aligned, and mutually beneficial.`,
    note: `Venus DSC creates lovely partnerships — but lovely doesn't always mean growth-activating. Be intentional about ensuring your partnerships are also driving ambition, not just harmony.`,
    steps: `Cultivate the high-quality partnerships this placement attracts — and make sure at least some of them are actively challenging you to grow, not just supporting where you already are.`,
  },
  VENUS_7_transit: {
    hurt_or_help: `Venus is transiting your 7th — a window of heightened partnership quality and relational harmony. New connections formed now carry a particularly aligned and beneficial quality.`,
    note: `Venus transits are relatively short — act on promising connections within the next few weeks.`,
    steps: `Say yes to collaboration conversations and new partnership opportunities during this window. The quality of connections available right now is unusually high.`,
  },
  VENUS_7_environment: {
    hurt_or_help: `Your current location consistently attracts harmonious, high-quality partners and collaborators into your orbit. The environment is magnetizing aligned relationships.`,
    note: null,
    steps: `Stay open and available to new partnership conversations in this location. The relational quality here is working in your favor — don't isolate.`,
  },

  VENUS_10_natal: {
    hurt_or_help: `Your public reputation carries a charming, aesthetically appealing, and harmonious quality — people are drawn to your brand and public presence instinctively. This is a powerful placement for creative fields, beauty industries, and any career that benefits from being liked.`,
    note: `Venus MC is beloved but can lack edge — in competitive fields, charm alone may not establish the authority needed. Pair your Venus energy with concrete proof of expertise.`,
    steps: `Invest in the visual and aesthetic quality of your brand. Your public presence benefits enormously from being beautiful — design, photography, and presentation all matter more for you than average.`,
  },
  VENUS_10_transit: {
    hurt_or_help: `Venus is transiting your MC — a window of heightened professional charm and public appeal. Your brand and public-facing content carry more magnetism than usual right now.`,
    note: `This window is relatively short — move on it within the next few weeks.`,
    steps: `Launch your most visually compelling content or public-facing initiative during this window. The aesthetic and relational quality of your professional presence is amplified right now.`,
  },
  VENUS_10_environment: {
    hurt_or_help: `Your current location amplifies the charm and aesthetic appeal of your professional presence — you are more well-received and liked in your field here than in other locations.`,
    note: null,
    steps: `Focus on building your public brand and professional reputation in this city. The environmental frequency is making you more appealing and magnetic professionally — use it.`,
  },

  VENUS_4_natal: {
    hurt_or_help: `Your home and family foundation is genuinely loving, beautiful, and harmonious — you grew up with a quality of warmth and aesthetic appreciation that creates a stable and creatively rich inner world.`,
    note: `Venus IC is deeply comforting — but too much comfort at home can reduce the hunger needed for outward ambition. Make sure home is a launching pad, not just a retreat.`,
    steps: `Use the stability and beauty of your home environment to fuel creativity and recovery. Let it be the place you return to after bold outward moves — not the reason you avoid making them.`,
  },
  VENUS_4_transit: {
    hurt_or_help: `Venus is transiting your IC — a brief window of heightened home warmth, beauty, and relational harmony in your private life. Your inner world feels especially nourishing right now.`,
    note: `This transit is short — days to weeks.`,
    steps: `Use this window to invest in your home environment and private relationships. The grounded beauty available now will sustain your outward momentum in the weeks ahead.`,
  },
  VENUS_4_environment: {
    hurt_or_help: `Your current home environment carries a Venusian frequency — warm, beautiful, and harmonious. You feel genuinely nourished and creatively inspired here.`,
    note: null,
    steps: `Protect and invest in the beauty of this home environment. The creative and emotional nourishment it provides is directly supporting your ability to build and sustain output.`,
  },

  VENUS_2_natal: {
    hurt_or_help: `You have a natural gift for attracting financial abundance, beautiful resources, and pleasurable experiences. Money tends to flow toward you through charm, aesthetic value, and relationship quality.`,
    note: `Venus in the 2nd can create a tendency toward financial comfort over financial ambition. Make sure the ease of attraction is matched with intentional wealth-building — Venus rewards those who invest what they attract.`,
    steps: `Build income streams that leverage beauty, taste, aesthetic value, or relational charm. Venus in the 2nd earns most powerfully through pleasure-adjacent industries — design, beauty, hospitality, arts, or high-touch service.`,
  },
  VENUS_2_transit: {
    hurt_or_help: `Venus is transiting your 2nd — a window of heightened financial magnetism and income opportunity. Money flows more easily toward you right now and financial negotiations carry unusual charm.`,
    note: `Venus transits are relatively short. Move on financial opportunities within the next few weeks.`,
    steps: `Initiate financial negotiations, rate increases, or new income opportunities during this window. Your financial magnetism is amplified — use it for your most important money conversations.`,
  },
  VENUS_2_environment: {
    hurt_or_help: `Your current location activates Venus energy in your 2nd house — income flows more easily here, and your ability to attract financial opportunity through charm and aesthetic value is amplified.`,
    note: null,
    steps: `Maximize income-generating activity in this location. The environment is making you more financially magnetic — put yourself in front of the right opportunities and let Venus do its work.`,
  },

  VENUS_6_natal: {
    hurt_or_help: `Your daily work environment is harmonious, aesthetically pleasing, and relationally rich. You bring a natural grace and charm to your work that makes clients, colleagues, and collaborators genuinely enjoy working with you.`,
    note: `Venus in the 6th can prioritize harmony over necessary confrontation. Make sure you're addressing work issues directly rather than smoothing them over to keep the peace.`,
    steps: `Build a work life that reflects your aesthetic values and relational strengths. Venus in the 6th thrives in beautiful, harmonious work environments — don't underestimate how much your physical workspace affects your output quality.`,
  },
  VENUS_6_transit: {
    hurt_or_help: `Venus is transiting your 6th — a window of heightened workplace harmony, client charm, and daily work pleasure. Professional relationships feel smoother and more enjoyable than usual right now.`,
    note: `Venus transits are relatively short — a few weeks at most.`,
    steps: `Use this window to strengthen key professional relationships and improve the aesthetic quality of your work environment. The relational warmth available in daily work right now is unusually high.`,
  },
  VENUS_6_environment: {
    hurt_or_help: `Your current location activates Venus energy in your 6th house — daily work here feels more harmonious, professional relationships are warmer, and your charm in work settings is amplified.`,
    note: null,
    steps: `Invest in the relationship quality and aesthetic of your daily work in this location. The environment is making your professional presence more appealing — use it to deepen client and colleague relationships.`,
  },

  VENUS_8_natal: {
    hurt_or_help: `You have a natural gift for attracting beautiful, harmonious shared financial opportunities. Joint ventures, investments, and partnerships formed through genuine connection tend to be lucrative and pleasurable. The 8th house multiplies — and Venus multiplies with grace.`,
    note: `Venus in the 8th can create financial naivety through attraction — beautiful opportunities are not always solid ones. Vet every investment with rigor, even when it feels perfectly aligned.`,
    steps: `Lean into trust-based financial partnerships and aesthetically aligned investments. Venus in the 8th multiplies through genuine relational harmony — the more aligned the partnership, the greater the financial potential.`,
  },
  VENUS_8_transit: {
    hurt_or_help: `Venus is transiting your 8th — a window of heightened financial partnership opportunity and harmonious investment potential. What you invest in through genuine connection right now has real multiplication potential.`,
    note: `Venus transits are relatively short — act on promising opportunities within the next few weeks.`,
    steps: `Move on shared financial opportunities that feel genuinely aligned during this window. Venus in the 8th multiplies through harmony — the more authentic the partnership, the better the return.`,
  },
  VENUS_8_environment: {
    hurt_or_help: `Your current location activates Venus energy in your 8th house — harmonious, trust-based financial partnerships and investment opportunities are more available here than in other locations.`,
    note: null,
    steps: `Cultivate the aligned financial partnerships this location is attracting. The 8th house multiplies — and Venus here means those partnerships carry unusual potential for pleasurable and profitable returns.`,
  },

  // ── JUPITER ──────────────────────────────────────────────────────────────────

  JUPITER_1_natal: {
    hurt_or_help: `You carry an expansive, optimistic, and abundant energy that people feel immediately. Doors open for you more easily than average — people want to help you, include you, and invest in you.`,
    note: `Jupiter ASC can trend toward overconfidence or overcommitment — the abundance of opportunity can lead to scattered focus. More isn't always better.`,
    steps: `Say yes strategically — not to everything. Your natural magnetism will create more opportunities than you can handle. Prioritize ruthlessly and go deep on your highest-leverage moves.`,
  },
  JUPITER_1_transit: {
    hurt_or_help: `Jupiter is transiting your ASC — one of the most expansive and opportunity-rich windows you'll experience. New doors, new connections, and new possibilities are opening right now.`,
    note: `Jupiter transits last about a year — you have time, but don't assume it lasts forever.`,
    steps: `Move boldly on your most important opportunities during this window. Expand your reach, say yes to visibility, and invest in growth — Jupiter rewards those who move with it.`,
  },
  JUPITER_1_environment: {
    hurt_or_help: `Your current location amplifies Jupiter's expansive energy — you encounter more opportunity, more helpful people, and more abundance here than in other locations.`,
    note: null,
    steps: `Maximize your presence and visibility in this location. The environment is actively amplifying your luck and opportunity — show up fully and move on what comes.`,
  },

  JUPITER_7_natal: {
    hurt_or_help: `You attract abundant, generous, and growth-oriented partners and collaborators. The people who show up in your 1:1 relationships tend to be expansive, helpful, and well-connected.`,
    note: `An abundance of helpers and partners can create reliance on others rather than building your own capability. Make sure you're developing alongside your partnerships — not just benefiting from them.`,
    steps: `Actively cultivate the high-quality partnerships this placement attracts — and make sure each collaboration is also developing your own skills and visibility, not just outsourcing your progress.`,
  },
  JUPITER_7_transit: {
    hurt_or_help: `Jupiter is transiting your 7th — a significant window of partnership expansion and abundance. Key collaborations, mentors, or high-value connections are available to you right now.`,
    note: `This window lasts roughly a year — but the best opportunities come to those who move early.`,
    steps: `Actively pursue the partnership or mentor relationship you've been putting off. Jupiter in the 7th rewards those who reach out — not those who wait to be found.`,
  },
  JUPITER_7_environment: {
    hurt_or_help: `Your current location consistently attracts abundant, generous, and growth-oriented partners and collaborators. The environment is magnetizing high-quality connections.`,
    note: null,
    steps: `Stay highly visible and socially engaged in this location. The relational abundance available here is one of your greatest assets — don't retreat into solo work when the environment is actively sending you allies.`,
  },

  JUPITER_10_natal: {
    hurt_or_help: `Your career carries a quality of expansion, opportunity, and public recognition that compounds over time. You are more likely than average to experience significant career breakthroughs, recognition, and professional abundance.`,
    note: `Jupiter MC can create an expectation of ease that leads to underpreparation. Opportunity will come — but you still need to be ready to execute when it arrives.`,
    steps: `Invest in your professional preparation and skill-building now so you're ready when the Jupiter MC doors open. Opportunity without capability is just a missed chance.`,
  },
  JUPITER_10_transit: {
    hurt_or_help: `Jupiter is transiting your MC — one of the most significant career expansion windows possible. Professional recognition, new opportunities, and public visibility are all amplified right now.`,
    note: `This window lasts roughly a year — move on your most important career opportunities now while the amplification is active.`,
    steps: `Launch, pitch, apply, and show up professionally at full capacity during this window. This is one of the best career periods you will experience — treat it accordingly.`,
  },
  JUPITER_10_environment: {
    hurt_or_help: `Your current location amplifies professional expansion and career recognition — you are more likely to experience breakthrough opportunities, helpful industry connections, and public visibility here than elsewhere.`,
    note: null,
    steps: `Go all in on professional visibility and career development in this location. The environmental frequency is actively amplifying your career luck — maximize it.`,
  },

  JUPITER_4_natal: {
    hurt_or_help: `Your home and family foundation carries an abundance of warmth, support, and generous energy — you have a strong, loving inner world that provides deep resilience and confidence as a foundation for outward ambition.`,
    note: `Too much abundance and comfort at the foundation can reduce the urgency needed to build outward. Make sure the safety of your foundation fuels your ambition rather than replacing it.`,
    steps: `Use the emotional abundance of your foundation as fuel — not a destination. The inner security Jupiter IC provides should make you bolder externally, not more comfortable staying put.`,
  },
  JUPITER_4_transit: {
    hurt_or_help: `Jupiter is transiting your IC — a window of expanded home warmth, family abundance, and inner world nourishment. Your private life is in an especially supportive and generous phase right now.`,
    note: `This window lasts roughly a year — plan deliberately within it.`,
    steps: `Use the stability and abundance of this window to plan and prepare your next bold outward move. A nourished inner world is the best launchpad — use it deliberately.`,
  },
  JUPITER_4_environment: {
    hurt_or_help: `Your current home environment carries a Jupiterian frequency — abundant, warm, and expansive. You feel genuinely supported, resourced, and optimistic here in a way that directly fuels outward momentum.`,
    note: null,
    steps: `Protect this home environment deliberately. The abundance and warmth it provides is a genuine advantage — it allows you to take bigger risks externally because your foundation is genuinely secure.`,
  },

  JUPITER_2_natal: {
    hurt_or_help: `You have a natural abundance mindset and an expansive relationship with money. Financial opportunities tend to flow toward you — and your ability to generate income through optimism, generosity, and big-picture thinking is genuine.`,
    note: `Jupiter in the 2nd can create overconfidence around money — the abundance feels so natural that financial discipline can be neglected. Build real systems around what Jupiter attracts.`,
    steps: `Think bigger about your income ceiling. Jupiter in the 2nd is one of the strongest financial abundance placements — the only thing limiting it is the size of the vision you're willing to pursue.`,
  },
  JUPITER_2_transit: {
    hurt_or_help: `Jupiter is transiting your 2nd — one of the most financially expansive windows you'll experience. Income opportunities, financial windfalls, and abundance are all amplified right now.`,
    note: `Jupiter transits last about a year — move early, not late.`,
    steps: `Move boldly on your most important income opportunities during this window. Jupiter in the 2nd rewards those who expand their financial vision — raise your rates, launch your offer, invest in growth.`,
  },
  JUPITER_2_environment: {
    hurt_or_help: `Your current location activates Jupiter energy in your 2nd house — income opportunities are more abundant here, financial luck is amplified, and your earning potential is genuinely higher in this environment.`,
    note: null,
    steps: `This is a powerful earning location for you. Maximize income-generating activity here — Jupiter in the 2nd through astrocartography is one of the most sought-after financial placements.`,
  },

  JUPITER_6_natal: {
    hurt_or_help: `Your daily work is a source of genuine expansion, growth, and abundance. You attract helpful colleagues and clients, your work tends to grow over time, and your daily routines carry an optimistic, generative quality.`,
    note: `Jupiter in the 6th can create overcommitment — saying yes to too much work, too many clients, or too many projects. Build in selective boundaries or the abundance becomes overwhelm.`,
    steps: `Invest in developing your daily work skills and systems — Jupiter in the 6th compounds through consistent, expansive daily practice. The more you put into your craft, the more it returns.`,
  },
  JUPITER_6_transit: {
    hurt_or_help: `Jupiter is transiting your 6th — a window of expanded work opportunity, daily abundance, and professional growth. New clients, better working conditions, and improved daily systems are all available right now.`,
    note: `Jupiter transits last about a year — make the most of the full window.`,
    steps: `Use this window to take on meaningful work expansion and invest in your professional skill set. Jupiter in the 6th rewards deliberate growth — move on opportunities for skill-building and quality client acquisition.`,
  },
  JUPITER_6_environment: {
    hurt_or_help: `Your current location activates Jupiter energy in your 6th house — daily work opportunities are more abundant here, professional growth comes more easily, and your work output carries an expansive quality.`,
    note: null,
    steps: `Invest fully in your professional development and daily work in this location. Jupiter in the 6th through astrocartography attracts quality work opportunities — show up consistently and let the expansion build.`,
  },

  JUPITER_8_natal: {
    hurt_or_help: `The 8th house multiplies what you put in — and with Jupiter here, what you invest in has genuine potential for extraordinary returns. Shared finances, joint ventures, and investments carry an expansive, abundant quality. This is one of the most powerful financial multiplication placements.`,
    note: `Jupiter in the 8th can create overconfidence in investment and shared financial ventures. The multiplication works both ways — vet carefully, invest wisely, and don't let optimism replace due diligence.`,
    steps: `Invest boldly and strategically in aligned opportunities. Jupiter in the 8th is built for financial multiplication — the key is putting resources into things with real foundations. When you do, the compounding is exceptional.`,
  },
  JUPITER_8_transit: {
    hurt_or_help: `Jupiter is transiting your 8th — one of the most powerful financial multiplication windows available. What you invest in right now — financially, energetically, professionally — has genuine potential to compound significantly.`,
    note: `Jupiter transits last about a year — move early to maximize the full window.`,
    steps: `Move boldly on your most aligned investment opportunities during this window. The 8th house multiplies, and Jupiter is amplifying that potential right now. Invest in what you genuinely believe in — and invest with intention.`,
  },
  JUPITER_8_environment: {
    hurt_or_help: `Your current location activates Jupiter energy in your 8th house — investment opportunities and shared financial arrangements here carry exceptional multiplication potential. This is one of the most financially powerful location placements.`,
    note: null,
    steps: `Pursue investment and partnership opportunities in this location with real ambition. Jupiter in the 8th through astrocartography is one of the most sought-after financial abundance placements — what you invest here, done wisely, has genuine potential to multiply extraordinarily.`,
  },

  // ── HOUSE 11 — Community, Networks, Internet, Virality ───────────────────────
  // Source: Pheydrus 5th·11th·12th House Library.

  MARS_11_natal: {
    hurt_or_help: `Your community and network connections carry conflict, competition, or volatility. Group dynamics tend toward power struggles and friendships can feel combative. Online presence may attract aggressive responses or trolling. Building a stable, loyal audience is harder than average.`,
    note: null,
    steps: `Channel Mars 11th energy into communities and networks that reward drive and bold opinions. Your online presence thrives in competitive, high-energy spaces rather than warm collaborative ones. Be deliberate about which groups you invest energy in — Mars in the 11th tends to burn through communities that don't match its intensity.`,
  },
  MARS_11_transit: {
    hurt_or_help: `Mars is transiting your 11th — community conflicts, online friction, and group power struggles are elevated right now. Social media posts are more likely to attract aggressive responses during this window. This is urgent — protect your online presence.`,
    note: null,
    steps: `Go quiet or highly intentional on social media during this window. Avoid group conflicts or community power struggles — Mars in the 11th transit amplifies online friction significantly. Focus energy on 1:1 relationships rather than group dynamics.`,
  },
  MARS_11_environment: {
    hurt_or_help: `Your current location activates Mars energy in your 11th — the community and network environment here is more competitive, combative, and prone to friction than it would be elsewhere.`,
    note: null,
    steps: `Be selective about the communities and networks you invest in within this location. Seek groups that channel competitive energy productively. Your online presence may attract more aggressive responses from this environment — engage strategically, not reactively.`,
  },

  SATURN_11_natal: {
    hurt_or_help: `Building community, audience, and network feels slow and effortful. Friendships and group connections may feel limited or withholding. Online growth is steady but never explosive. BUT — Saturn in the 11th eventually builds the most loyal, durable audiences and networks of any placement.`,
    note: null,
    steps: `Stop expecting rapid community growth or viral moments — that's not your path. Invest instead in the quality and loyalty of a smaller, deeply committed audience. Saturn in the 11th builds slowly and compounds enormously over time.`,
  },
  SATURN_11_transit: {
    hurt_or_help: `Saturn is transiting your 11th — community growth feels restricted, audience building feels thankless, and group connections may be tested or dissolved. This is a multi-year window to build the quality of your network rather than the quantity.`,
    note: null,
    steps: `Use this window to audit your community and network. Let go of groups and connections that don't align with where you're going. Invest deeply in the relationships and audiences that have proven genuine — Saturn in the 11th rewards quality over viral moments.`,
  },
  SATURN_11_environment: {
    hurt_or_help: `Your current location activates Saturn energy in your 11th — community building here is slower, audience growth is more effortful, and network connections require more time and consistency to develop.`,
    note: null,
    steps: `This location is asking you to build genuine community — not a fast following. The audience built through Saturn's discipline here will be among the most loyal you'll ever have. Play the long game.`,
  },

  PLUTO_11_natal: {
    hurt_or_help: `Your community and network connections go through cycles of complete transformation. Groups you invest in deeply may suddenly dissolve or shift. Online presence can attract intense — sometimes obsessive — responses, both positive and negative. Audience dynamics carry power struggle energy.`,
    note: null,
    steps: `Build communities around transformation and depth — Pluto in the 11th attracts the most intensely committed audiences when the content goes to the uncomfortable, honest places. Expect your audience to transform alongside you rather than remain static.`,
  },
  PLUTO_11_transit: {
    hurt_or_help: `Pluto is transiting your 11th — your community, online presence, and network are going through fundamental transformation right now. Groups may dissolve, audience dynamics may shift dramatically, and the nature of your online influence is being rebuilt from the ground up.`,
    note: null,
    steps: `Do not cling to the audience or community identity that Pluto is dismantling. Use this window to deliberately rebuild your network around who you are becoming — not who you were. The influence that emerges will be more powerful.`,
  },
  PLUTO_11_environment: {
    hurt_or_help: `Your current location activates Pluto energy in your 11th — community and network dynamics here are intense, transformative, and prone to sudden power shifts. Your online presence may attract unusually intense responses from this environment.`,
    note: null,
    steps: `Be intentional about the communities you invest in within this location. Pluto in the 11th environment rewards those who build communities around genuine transformation — not surface-level connection.`,
  },

  NEPTUNE_11_natal: {
    hurt_or_help: `Your community and network connections carry a dreamy, idealistic quality — you may attract or be attracted to communities that look aligned but lack real substance. Online presence can be confusing or misread. Audience expectations may be impossible to manage.`,
    note: null,
    steps: `Require consistency and real-world evidence from groups and network connections before investing deeply. Neptune in the 11th idealizes community — vet the reality of groups rather than the inspiration they promise. Build your online presence around one clear, specific message.`,
  },
  NEPTUNE_11_transit: {
    hurt_or_help: `Neptune is transiting your 11th — community connections may be unclear or deceptive right now, online presence may feel misunderstood, and group dynamics may be built on illusion. This is a window where your audience or network may not be what it appears.`,
    note: null,
    steps: `Do not make major community or online investment decisions during this transit. Audit your network for connections that have been unclear or unreliable. Focus on 1:1 relationships with proven alignment rather than group dynamics.`,
  },
  NEPTUNE_11_environment: {
    hurt_or_help: `Your current location activates Neptune energy in your 11th — community connections here may be idealized, online audience responses may be unclear, and network dynamics may lack the substance they appear to have.`,
    note: null,
    steps: `Apply rigorous discernment to communities and online opportunities in this location. Neptune in the 11th environment makes groups look more aligned than they are — verify before investing.`,
  },

  URANUS_11_natal: {
    hurt_or_help: `Your community and network connections are unconventional, unpredictable, and prone to sudden shifts. Friend groups and audience dynamics change rapidly. Online presence can go viral unexpectedly — and fade just as fast. Traditional community-building strategies rarely work for you.`,
    note: null,
    steps: `Be Uranian in your community approach — embrace the unconventional, the disruptive, and the genre-defying in how you build your online presence and network. Your virality comes from breaking norms, not following them. Stay flexible and don't lock community strategies in long-term.`,
  },
  URANUS_11_transit: {
    hurt_or_help: `Uranus is transiting your 11th — sudden changes in your community, unexpected shifts in your online audience, and abrupt network developments are active right now. Viral moments and sudden community growth are both possible — as are sudden losses.`,
    note: null,
    steps: `Be Uranian — don't be afraid to completely reinvent your community approach or online presence during this window. The breakthrough comes from doing it radically differently. Stay flexible, experiment boldly, and don't hold too tightly to existing audience expectations.`,
  },
  URANUS_11_environment: {
    hurt_or_help: `Your current location activates Uranus energy in your 11th — the community and online environment here is innovative, unpredictable, and prone to sudden shifts. Viral moments are more accessible here — as is sudden audience volatility.`,
    note: null,
    steps: `Lean into the unconventional community and online opportunities this location amplifies. Be Uranian in your approach — experiment, innovate, and don't be afraid to try approaches that have never been done before in your space.`,
  },

  SUN_11_natal: {
    hurt_or_help: `You are a natural community leader and audience builder. Your online presence carries genuine authority and warmth — people want to follow, support, and rally around you. Virality comes through authentic leadership and visible self-expression in group contexts.`,
    note: `The Sun's need for recognition in the 11th can create a dependency on audience validation. Build an internal creative and professional standard that doesn't require follower count to feel real.`,
    steps: `Invest in community leadership and online visibility. Sun in the 11th is built for audience-building — show up consistently, lead publicly, and let your authentic presence draw your community toward you.`,
  },
  SUN_11_transit: {
    hurt_or_help: `Sun is transiting your 11th — a brief but powerful window of community visibility, online influence, and audience growth. Your leadership in group contexts is amplified and your online presence carries unusual authority right now.`,
    note: `Sun transits are short — days to weeks. Move now.`,
    steps: `Make your most important community-building moves and online visibility investments this week. The spotlight in your network is on you — don't stay quiet.`,
  },
  SUN_11_environment: {
    hurt_or_help: `Your current location activates Sun energy in your 11th — community leadership, online authority, and audience-building potential are all amplified here. You are more visible and more influential in group contexts in this environment than elsewhere.`,
    note: null,
    steps: `Maximize community engagement and online visibility in this location. The environment is actively amplifying your natural leadership in group contexts — use it to build the audience and network that supports your long-term goals.`,
  },

  MOON_11_natal: {
    hurt_or_help: `Your community connections are emotionally nurturing and deeply loyal. Your online presence carries a warmth that makes audiences feel genuinely seen and cared for — which builds unusual loyalty over time. Community members feel like family.`,
    note: `Moon in the 11th can create emotional over-investment in community dynamics — what your audience thinks can affect your mood more than it should. Build healthy boundaries between your emotional state and community feedback.`,
    steps: `Lead with emotional authenticity and personal story in community-building. Moon in the 11th builds the most emotionally loyal audiences of any placement — but it requires real vulnerability and genuine care, not performance.`,
  },
  MOON_11_transit: {
    hurt_or_help: `Moon is transiting your 11th — a brief window of heightened community warmth, emotional connection with your audience, and genuine group resonance. Your most personal content will land with unusual depth right now.`,
    note: `Moon transits are short — days, not weeks. Move now.`,
    steps: `Share your most emotionally honest content with your community this week. The warmth and connection available in group contexts right now is unusually high — use it to deepen audience loyalty.`,
  },
  MOON_11_environment: {
    hurt_or_help: `Your current location activates Moon energy in your 11th — your community connections here feel more emotionally resonant, your online audience responds with unusual warmth and loyalty, and group dynamics carry a genuinely nurturing quality.`,
    note: null,
    steps: `Invest in emotionally authentic community-building in this location. The environment is amplifying the warmth and loyalty of your audience connections — use it to deepen the relationships that matter most.`,
  },

  VENUS_11_natal: {
    hurt_or_help: `Your community and network connections are naturally harmonious, beautiful, and pleasurable. Your online presence carries a charming, aesthetically pleasing quality that makes people genuinely enjoy following you. Virality tends to come through beauty, charm, and feel-good content.`,
    note: `Venus in the 11th can prioritize harmony over necessary community honesty. Don't smooth over important conversations just to keep the peace — some of your most loyal audience members are there for the truth, not just the beauty.`,
    steps: `Invest in the aesthetic quality and warmth of your online presence. Venus in the 11th attracts audiences through beauty and relational charm — make your community feel like a genuinely pleasurable place to be.`,
  },
  VENUS_11_transit: {
    hurt_or_help: `Venus is transiting your 11th — a window of heightened community charm, online aesthetic appeal, and network harmony. New audience connections formed now carry unusual alignment. Your online presence is more magnetic than usual right now.`,
    note: `Venus transits are relatively short — a few weeks. Move on it.`,
    steps: `Launch your most beautiful and relationally warm community content during this window. Reach out to network connections you've been meaning to deepen. Venus in the 11th transit brings the right people into your orbit.`,
  },
  VENUS_11_environment: {
    hurt_or_help: `Your current location activates Venus energy in your 11th — your online presence here carries unusual charm and beauty, community connections are more harmonious, and your network magnetism is amplified in this environment.`,
    note: null,
    steps: `Invest in community-building and online presence development in this location. The environment is making your online energy more attractive and your network connections more naturally aligned — use it.`,
  },

  JUPITER_11_natal: {
    hurt_or_help: `Your community, network, and online presence are marked by genuine abundance and expansive reach. Audience growth tends to be significant, network connections are generous and well-connected, and viral moments come more naturally here than average. This is one of the strongest online influence placements.`,
    note: `Jupiter in the 11th can create an expectation that growth will always be easy. Build consistent content and community engagement systems so that when Jupiter moves on, the audience remains.`,
    steps: `Think bigger about your online reach and community potential. Jupiter in the 11th is built for large-scale audience building — don't limit the scope of who you're willing to reach. Invest in visibility and community growth with genuine confidence.`,
  },
  JUPITER_11_transit: {
    hurt_or_help: `Jupiter is transiting your 11th — one of the most powerful windows for viral growth, audience expansion, and network abundance. Community connections are flourishing and online influence is amplified significantly right now.`,
    note: `Jupiter transits last about a year — move early to maximize the full window.`,
    steps: `Move boldly on your most important online visibility and community-building initiatives during this window. Jupiter in the 11th transit is one of the best periods for audience growth you will experience — show up fully and let the expansion happen.`,
  },
  JUPITER_11_environment: {
    hurt_or_help: `Your current location activates Jupiter energy in your 11th — online reach, community growth, and network abundance are all amplified here. Viral moments and significant audience expansion are more accessible in this environment than elsewhere.`,
    note: null,
    steps: `Go all in on online visibility and community-building in this location. Jupiter in the 11th through astrocartography is one of the most powerful placements for internet reach and audience growth — the environment is actively working in your favor.`,
  },

  // ── HOUSE 12 — Hidden, Subconscious, Behind the Scenes ───────────────────────
  // 12th house rule: benefics can't fully flex publicly — energy is internalized.
  // Neptune is the exception: at home in the 12th, operates at full strength.
  // Source: Pheydrus 5th·11th·12th House Library.

  MARS_12_natal: {
    hurt_or_help: `Your drive and assertiveness are turned inward — making it difficult to take bold external action. Energy can feel blocked, misdirected, or expressed through passive aggression rather than clear forward momentum. External pushes feel exhausting rather than energizing.`,
    note: null,
    steps: `Find private, structured outlets for the Mars energy — solo training, writing, creative work, or any high-intensity activity done alone. The action available right now is internal. Don't force external boldness — it will backfire. Build in solitude-based productivity systems.`,
  },
  MARS_12_transit: {
    hurt_or_help: `Mars is transiting your 12th — drive and assertiveness are operating below the surface right now. External action feels forced or ineffective. This is a window for behind-the-scenes work, not public momentum. This is urgent — don't fight the inward pull.`,
    note: null,
    steps: `Use this window for deep solo work, research, planning, and private creative output. The energy is real — it's just not meant to be public yet. Build what will be ready to launch when Mars moves into your 1st.`,
  },
  MARS_12_environment: {
    hurt_or_help: `Your current location activates Mars energy in your 12th — your drive and assertiveness are operating more quietly and less effectively in public in this environment. The force that works elsewhere feels muffled here.`,
    note: null,
    steps: `This location is calling you to work behind the scenes rather than leading publicly. Use the environment for deep solo creative or professional work. The output built in private here has more power than you can see from inside it.`,
  },

  SATURN_12_natal: {
    hurt_or_help: `Hidden fears, subconscious limitations, and unresolved karmic patterns create invisible resistance to your progress. The blocks feel inexplicable because they operate below conscious awareness — and conventional productivity approaches can't reach them.`,
    note: null,
    steps: `This placement calls for serious inner work — therapy, shadow work, spiritual practice, or structured solitude. Saturn in the 12th rewards those who do the invisible work. The discipline you build in private becomes your greatest hidden strength over time.`,
  },
  SATURN_12_transit: {
    hurt_or_help: `Saturn is transiting your 12th — a multi-year window of invisible restriction, subconscious pattern clearing, and behind-the-scenes discipline. Progress feels inexplicably slow despite real effort. This is not the time to push harder publicly — it's the time to go deeper privately.`,
    note: null,
    steps: `Use this window for inner work, spiritual practice, and deep private development. Saturn in the 12th transit clears the subconscious blocks that have been running silently for years. What gets addressed here determines the quality of your next Saturn cycle.`,
  },
  SATURN_12_environment: {
    hurt_or_help: `Your current location activates Saturn energy in your 12th — invisible restrictions and subconscious patterns are more pronounced here. Progress feels heavier and more effortful in this environment than it would elsewhere.`,
    note: null,
    steps: `This location is calling you to do the deep inner work. The discipline and self-awareness built through Saturn's pressure in this environment will clear blocks that no amount of external strategy can touch. Go inward.`,
  },

  PLUTO_12_natal: {
    hurt_or_help: `Deep, hidden transformation is an ongoing undercurrent of your life — subconscious power struggles, hidden psychological patterns, and ancestral wounds operate below the surface and quietly shape everything. The transformation is real but rarely visible.`,
    note: null,
    steps: `Engage with shadow work and subconscious pattern clearing as an ongoing practice — not a one-time event. Pluto in the 12th works in the dark. What gets brought into conscious awareness and addressed becomes your most profound source of power. This work is never finished but it is always worth doing.`,
  },
  PLUTO_12_transit: {
    hurt_or_help: `Pluto is transiting your 12th — the deepest subconscious layers of your psychology are being uprooted and transformed right now. Hidden patterns, fears, and power dynamics are being forced to surface. This is one of the most intense inner transformation windows available.`,
    note: null,
    steps: `Do not ignore or suppress what is surfacing. Seek support — a skilled therapist, coach, or spiritual guide — for what Pluto is bringing up right now. This transit clears generational patterns. What gets addressed becomes permanent transformation.`,
  },
  PLUTO_12_environment: {
    hurt_or_help: `Your current location activates Pluto energy in your 12th — hidden psychological transformation is amplified in this environment. Subconscious patterns that might remain dormant elsewhere are being activated and surfaced here.`,
    note: null,
    steps: `This location is a powerful one for deep inner transformation work. Use it for shadow work, spiritual practice, and psychological clearing. The transformation available here is profound — but only for those willing to look at what Pluto is illuminating.`,
  },

  NEPTUNE_12_natal: {
    hurt_or_help: `Neptune is at home in the 12th — this is its natural house. Deep spiritual attunement, creative inspiration, and intuitive flow are available in genuine abundance. Your sensitivity and psychic awareness are extraordinary gifts that operate through solitude and stillness.`,
    note: null,
    steps: `Build deliberate solitude into your daily schedule. Neptune in the 12th is most powerful in meditation, creative flow states, and spiritual practice. Protect the quiet — your greatest insights, creative breakthroughs, and intuitive downloads come when you stop forcing and start listening.`,
  },
  NEPTUNE_12_transit: {
    hurt_or_help: `Neptune is transiting your 12th — a window of deepened spiritual attunement, enhanced creative inspiration, and heightened intuitive access. This is one of the most spiritually rich transit windows available.`,
    note: null,
    steps: `Invest in spiritual practice, creative flow work, and solitude during this window. Neptune in the 12th transit opens access to levels of inspiration and intuition that are genuinely rare. Honor it by creating the conditions for it to speak.`,
  },
  NEPTUNE_12_environment: {
    hurt_or_help: `Your current location activates Neptune energy in your 12th — spiritual attunement, creative inspiration, and intuitive sensitivity are all amplified here. This is a powerful location for inner work, spiritual practice, and deep creative output.`,
    note: null,
    steps: `Use this location for your most spiritually and creatively significant work. Neptune in the 12th through astrocartography is a genuine spiritual power placement — the environment supports depth, inspiration, and transcendent creative output.`,
  },

  URANUS_12_natal: {
    hurt_or_help: `Sudden disruptions and erratic energy operate below the surface — creating unpredictable internal restlessness, hidden anxiety, or unexpected subconscious rebellion against your own plans. The disruption is real but hard to locate because it comes from within.`,
    note: null,
    steps: `Be Uranian in your inner world — allow yourself to think completely differently about your situation without needing to act on it immediately. The breakthrough available in the 12th is a mental and spiritual one first. Radical inner perspective shifts precede the external ones.`,
  },
  URANUS_12_transit: {
    hurt_or_help: `Uranus is transiting your 12th — sudden inner disruptions, unexpected subconscious breakthroughs, and abrupt shifts in your hidden psychological patterns are active right now. The revolution is happening inside before it expresses externally.`,
    note: null,
    steps: `Be Uranian internally — don't be afraid to completely reinvent how you see yourself and your situation during this window. Solitude, meditation, and radical honest self-reflection are the tools for this transit. The external reinvention will come — build its foundation now.`,
  },
  URANUS_12_environment: {
    hurt_or_help: `Your current location activates Uranus energy in your 12th — inner restlessness, subconscious disruption, and unexpected internal shifts are more pronounced here than elsewhere.`,
    note: null,
    steps: `Use this location for deliberate inner innovation. Be Uranian in your spiritual and psychological approach — try completely unconventional methods for inner work, meditation, and self-understanding. The breakthroughs available here are internal first, external second.`,
  },

  SUN_12_natal: {
    hurt_or_help: `Your natural leadership and visibility are muted — the Sun can't shine publicly from the 12th. You may feel overlooked, underestimated, or like your efforts go unseen no matter how hard you work. The solar confidence is there internally — it just doesn't project easily.`,
    note: null,
    steps: `Stop trying to lead from the front — lead from behind the scenes. Your influence is real but operates through private channels, 1:1 relationships, and behind-the-scenes authority. Build your reputation quietly and let results speak louder than visibility.`,
  },
  SUN_12_transit: {
    hurt_or_help: `Sun is transiting your 12th — your visibility and public leadership are operating quietly right now. This is a window for behind-the-scenes work, private strategy, and internal leadership development rather than public momentum.`,
    note: null,
    steps: `Use this window for deep solo work, private relationship-building, and inner leadership development. What you build in private during this transit will be ready to launch publicly when the Sun enters your 1st house.`,
  },
  SUN_12_environment: {
    hurt_or_help: `Your current location activates Sun energy in your 12th — your natural leadership and visibility are quieter here than they would be elsewhere. The solar confidence is present but not publicly amplified in this environment.`,
    note: null,
    steps: `Use this location for private, behind-the-scenes work where your leadership operates through depth rather than visibility. Consider whether a different location might amplify your public solar expression more powerfully.`,
  },

  MOON_12_natal: {
    hurt_or_help: `Deep emotional intuition and psychic sensitivity are your gifts — but they operate privately. You feel everything, often before others do. This is a powerful asset in healing, creative, and spiritual work — but it doesn't translate into visible emotional leadership.`,
    note: null,
    steps: `Stop expecting your emotional intelligence to be recognized publicly — it won't be from the 12th. Channel it into work that happens behind closed doors — healing, writing, private creative work, or any field where deep sensitivity is the product.`,
  },
  MOON_12_transit: {
    hurt_or_help: `Moon is transiting your 12th — emotional sensitivity is heightened but operating internally right now. This is a window for private emotional processing, inner healing, and solitude-based creative work.`,
    note: `Moon transits are short — days, not weeks.`,
    steps: `Honor the inward pull during this window. Use it for journaling, private creative work, emotional processing, and spiritual practice. The insights available in private right now are unusually deep.`,
  },
  MOON_12_environment: {
    hurt_or_help: `Your current location activates Moon energy in your 12th — emotional sensitivity and intuition are heightened here but operating privately. The emotional depth available in this environment is genuine but not publicly visible.`,
    note: null,
    steps: `Use this location for private healing, creative, and spiritual work that draws on your emotional depth. The Moon in the 12th environment supports profound inner work — honor it rather than trying to make it public.`,
  },

  VENUS_12_natal: {
    hurt_or_help: `Charm and relational magnetism are present — but hidden. Connections and financial opportunities often come through private channels, referrals, or behind-the-scenes relationships rather than public visibility. Beauty and grace operate quietly here.`,
    note: null,
    steps: `Don't try to attract through loud public positioning — Venus in the 12th works through intimacy, trust, and private connection. Build deep private relationships and let the attraction happen organically. Your greatest opportunities come through who you know privately, not publicly.`,
  },
  VENUS_12_transit: {
    hurt_or_help: `Venus is transiting your 12th — relational magnetism and charm are operating quietly right now. Connections and opportunities are coming through private channels rather than public visibility.`,
    note: `Venus transits are short — a few weeks.`,
    steps: `Stay open to behind-the-scenes relational and financial opportunities during this window. The right connections are finding you privately — through referrals, existing relationships, and quiet introductions rather than public reach.`,
  },
  VENUS_12_environment: {
    hurt_or_help: `Your current location activates Venus energy in your 12th — charm and relational magnetism are present here but operating quietly. Financial and relational opportunities in this environment tend to come through private channels rather than public visibility.`,
    note: null,
    steps: `Invest in private relationship-building and behind-the-scenes networking in this location. Venus in the 12th environment delivers its gifts quietly — stay open to opportunities that arrive through trust and intimacy rather than visibility.`,
  },

  JUPITER_12_natal: {
    hurt_or_help: `Abundance and luck are present — but operating invisibly. You may receive unexpected help, hidden resources, or behind-the-scenes support that you don't fully see until later. The expansion is real — it just doesn't look like what abundance typically looks like from the outside.`,
    note: null,
    steps: `Trust that support is working in your favor even when you can't see it. Stay open to help from unexpected or private sources. Jupiter in the 12th multiplies through faith, spiritual alignment, and surrender — not hustle and visibility.`,
  },
  JUPITER_12_transit: {
    hurt_or_help: `Jupiter is transiting your 12th — abundance and expansion are operating in hidden, behind-the-scenes ways right now. Unexpected support, quiet opportunities, and spiritual growth are available — but they won't look like typical Jupiter luck from the outside.`,
    note: `Jupiter transits last about a year.`,
    steps: `Stay open and faith-forward during this window. Behind-the-scenes opportunities, unexpected private support, and spiritual expansion are all available — but they require receptivity rather than pushing. Use this window for inner development that will power the next Jupiter cycle.`,
  },
  JUPITER_12_environment: {
    hurt_or_help: `Your current location activates Jupiter energy in your 12th — abundance and expansion are present here but operating quietly and privately. Hidden resources, unexpected support, and behind-the-scenes opportunities are more available in this environment than they appear.`,
    note: null,
    steps: `Stay receptive to private and unexpected opportunities in this location. Jupiter in the 12th environment delivers abundance through faith and surrender — not force. Trust the process and stay open to help arriving from unexpected directions.`,
  },
};

export function getLibraryEntry(
  planet: string | undefined,
  house: number | undefined,
  pillar: 1 | 2 | 3
): LibraryEntry | null {
  if (!planet || !house) return null;
  const pillarLabel = pillar === 1 ? 'natal' : pillar === 2 ? 'transit' : 'environment';
  const key = `${planet.toUpperCase()}_${house}_${pillarLabel}`;
  return LIBRARY[key] ?? null;
}
