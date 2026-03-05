/**
 * ClientDemoPage
 * Injects hardcoded sample data and redirects to /client/results
 * so the full report UI can be previewed without filling out the form.
 *
 * Access at: /client/demo
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConsolidatedResults } from '../../models';
import type { ClientIntakeData } from '../../models/clientIntake';

// ── Sample intake ─────────────────────────────────────────────────────────────

const DEMO_INTAKE: ClientIntakeData = {
  email: 'alex@example.com',
  phone: '(555) 234-5678',
  addressMoveDate: 'March 2022',
  desiredOutcome:
    'Build my coaching business to $10k/month revenue in the next 90 days and land 5 high-ticket clients',
  obstacle: 'Self-sabotage and inconsistent client outreach — I know what to do but keep stopping myself',
  patternYear: '2019',
  priorHelp: ['therapy', 'coaches'],
  preferredSolution: 'coaching',
  currentSituation: 'freelancer',
  additionalNotes: '',
};

// ── Sample results ────────────────────────────────────────────────────────────

const DEMO_RESULTS: ConsolidatedResults = {
  success: true,
  timestamp: new Date().toISOString(),
  userInfo: {
    name: 'Alex Rivera',
    dateOfBirth: '1991-01-15',
    timeOfBirth: '08:30',
    birthLocation: 'New York, NY',
    currentLocation: 'Los Angeles, CA',
    address: '1234 Sunset Blvd, Los Angeles, CA 90028',
  },
  calculators: {
    transits: {
      risingSign: 'Aquarius',
      transits: [
        {
          planet: 'Pluto',
          planetTheme: 'Transformation & Power',
          houseNumber: 6,
          houseTheme: 'Work & Health',
          pastHouseNumber: 5,
          pastHouseTheme: 'Creativity & Romance',
          current: { sign: 'Aquarius', start: '2023', end: '2043', high: 'Transformation', low: 'Destruction' },
          past: { sign: 'Capricorn', start: '2008', end: '2023', high: 'Mastery', low: 'Control' },
        },
        {
          planet: 'Neptune',
          planetTheme: 'Illusion & Spirituality',
          houseNumber: 8,
          houseTheme: 'Shared Resources & Transformation',
          pastHouseNumber: 7,
          pastHouseTheme: 'Partnership',
          current: { sign: 'Aries', start: '2025', end: '2039', high: 'Inspiration', low: 'Confusion' },
          past: { sign: 'Pisces', start: '2011', end: '2025', high: 'Compassion', low: 'Illusion' },
        },
        {
          planet: 'Uranus',
          planetTheme: 'Disruption & Innovation',
          houseNumber: 10,
          houseTheme: 'Career & Public Reputation',
          pastHouseNumber: 9,
          pastHouseTheme: 'Higher Learning',
          current: { sign: 'Gemini', start: '2025', end: '2033', high: 'Innovation', low: 'Chaos' },
          past: { sign: 'Taurus', start: '2018', end: '2025', high: 'Liberation', low: 'Disruption' },
        },
        {
          planet: 'Saturn',
          planetTheme: 'Discipline & Limitation',
          houseNumber: 8,
          houseTheme: 'Shared Resources & Transformation',
          pastHouseNumber: 7,
          pastHouseTheme: 'Partnership',
          current: { sign: 'Aries', start: '2025', end: '2028', high: 'Discipline', low: 'Restriction' },
          past: { sign: 'Pisces', start: '2023', end: '2025', high: 'Structure', low: 'Limitation' },
        },
      ],
    },
    natalChart: null,
    lifePath: {
      lifePathNumber: 7,
      dayPathNumber: 6,
      personalYear: 2,
      chineseZodiac: 'Goat',
      meanings: {
        lifePathMeaning: 'The Seeker',
        lifePathDescription: 'Deep thinker, analytical, spiritual',
        personalYearMeaning: 'Cooperation & Patience',
        personalYearDescription: 'A year of partnerships and reflection',
      },
    },
    relocation: null,
    addressNumerology: {
      levels: [
        { level: 'L1', value: '1234', name: 'Unit', number: 1, meaning: 'Independence', description: '', themes: '', challenges: '', gifts: '', reflection: '' },
        { level: 'L2', value: '4', name: 'Street Number', number: 4, meaning: 'Structure', description: '', themes: '', challenges: '', gifts: '', reflection: '' },
        { level: 'L3', value: '11', name: 'Address Total', number: 11, meaning: 'Master Number', description: '', themes: '', challenges: '', gifts: '', reflection: '' },
      ],
      homeZodiac: 'Scorpio',
      birthZodiac: 'Capricorn',
      homeZodiacMeaning: null,
      birthZodiacMeaning: null,
      compatibility: 'Moderate',
    },
  },
  diagnostic: {
    pillars: [
      {
        pillar: 1,
        name: 'Structure',
        description: 'What you were born with',
        fCount: 3,
        cCount: 0,
        aCount: 1,
        items: [
          { source: 'Natal Sun in House 7 (Pisces)', pillar: 1, section: 'Natal Angular', planet: 'Sun', house: 7, grade: 'A', reason: 'Benefic Sun in angular house 7' },
          { source: 'Natal Moon in House 3 (Scorpio)', pillar: 1, section: 'Natal Angular', planet: 'Moon', house: 3, grade: 'Neutral', reason: 'Moon in house 3 (not angular)' },
          { source: 'Natal Mars in House 6 (Aquarius)', pillar: 1, section: 'Natal Angular', planet: 'Mars', house: 6, grade: 'Neutral', reason: 'Mars in house 6 (not angular)' },
          { source: 'Natal Jupiter in House 11 (Cancer)', pillar: 1, section: 'Natal Angular', planet: 'Jupiter', house: 11, grade: 'Neutral', reason: 'Jupiter in house 11 (not angular)' },
          { source: 'Natal Venus in House 6 (Aquarius)', pillar: 1, section: 'Natal Angular', planet: 'Venus', house: 6, grade: 'Neutral', reason: 'Venus in house 6 (not angular)' },
          { source: 'Natal Saturn in House 5 (Capricorn)', pillar: 1, section: 'Natal Angular', planet: 'Saturn', house: 5, grade: 'F', reason: 'Malefic Saturn in angular house 5' },
          { source: 'Natal Uranus in House 5 (Capricorn)', pillar: 1, section: 'Natal Angular', planet: 'Uranus', house: 5, grade: 'F', reason: 'Malefic Uranus in angular house 5' },
          { source: 'Natal Neptune in House 5 (Capricorn)', pillar: 1, section: 'Natal Angular', planet: 'Neptune', house: 5, grade: 'F', reason: 'Malefic Neptune in angular house 5' },
          { source: 'Natal Pluto in House 3 (Scorpio)', pillar: 1, section: 'Natal Angular', planet: 'Pluto', house: 3, grade: 'Neutral', reason: 'Pluto in house 3 (not angular)' },
        ],
      },
      {
        pillar: 2,
        name: 'Timing',
        description: 'What is happening now',
        fCount: 1,
        cCount: 3,
        aCount: 0,
        items: [
          { source: 'Transit Pluto in House 6 (Aquarius)', pillar: 2, section: 'Transit Angular', planet: 'Pluto', house: 6, grade: 'C', reason: 'Malefic transit Pluto in pressure house 6 (2nd/6th/8th/11th)' },
          { source: 'Transit Neptune in House 8 (Aries)', pillar: 2, section: 'Transit Angular', planet: 'Neptune', house: 8, grade: 'C', reason: 'Malefic transit Neptune in pressure house 8 (2nd/6th/8th/11th)' },
          { source: 'Transit Saturn in House 8 (Aries)', pillar: 2, section: 'Transit Angular', planet: 'Saturn', house: 8, grade: 'C', reason: 'Malefic transit Saturn in pressure house 8 (2nd/6th/8th/11th)' },
          { source: 'Transit Uranus in House 10 (Gemini)', pillar: 2, section: 'Transit Angular', planet: 'Uranus', house: 10, grade: 'F', reason: 'Malefic transit Uranus in angular house 10' },
          { source: 'Life Cycle Year 2', pillar: 2, section: 'Life Cycle', grade: 'Neutral', reason: 'Personal year 2 is neutral' },
        ],
      },
      {
        pillar: 3,
        name: 'Environment',
        description: 'Where you are living',
        fCount: 0,
        cCount: 0,
        aCount: 1,
        items: [
          { source: 'Env Sun in House 4', pillar: 3, section: 'Relocation Angular', planet: 'Sun', house: 4, grade: 'Neutral', reason: 'Sun in house 4 at current location (not angular)' },
          { source: 'Env Moon in House 12', pillar: 3, section: 'Relocation Angular', planet: 'Moon', house: 12, grade: 'Neutral', reason: 'Moon in house 12 at current location (not angular)' },
          { source: 'Env Venus in House 3', pillar: 3, section: 'Relocation Angular', planet: 'Venus', house: 3, grade: 'Neutral', reason: 'Venus in house 3 at current location (not angular)' },
          { source: 'Env Mars in House 3', pillar: 3, section: 'Relocation Angular', planet: 'Mars', house: 3, grade: 'Neutral', reason: 'Mars in house 3 at current location (not angular)' },
          { source: 'Env Jupiter in House 8', pillar: 3, section: 'Relocation Angular', planet: 'Jupiter', house: 8, grade: 'Neutral', reason: 'Jupiter in house 8 at current location (not angular)' },
          { source: 'Env Saturn in House 2', pillar: 3, section: 'Relocation Angular', planet: 'Saturn', house: 2, grade: 'Neutral', reason: 'Saturn in house 2 at current location (not angular)' },
          { source: 'Env Uranus in House 2', pillar: 3, section: 'Relocation Angular', planet: 'Uranus', house: 2, grade: 'Neutral', reason: 'Uranus in house 2 at current location (not angular)' },
          { source: 'Env Neptune in House 2', pillar: 3, section: 'Relocation Angular', planet: 'Neptune', house: 2, grade: 'Neutral', reason: 'Neptune in house 2 at current location (not angular)' },
          { source: 'Env Pluto in House 12', pillar: 3, section: 'Relocation Angular', planet: 'Pluto', house: 12, grade: 'Neutral', reason: 'Pluto in house 12 at current location (not angular)' },
          { source: 'L3: 11', pillar: 3, section: 'Address', grade: 'A', reason: 'L3 number 11 is supportive' },
        ],
      },
    ],
    totalFs: 4,
    totalCs: 3,
    totalAs: 2,
    score: 5.5,
    finalGrade: 'C',
    allItems: [], // populated below
  },
};

// Flatten allItems from pillars
DEMO_RESULTS.diagnostic!.allItems = DEMO_RESULTS.diagnostic!.pillars.flatMap((p) => p.items);

// ── Page ──────────────────────────────────────────────────────────────────────

export function ClientDemoPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/client/results', {
      state: { results: DEMO_RESULTS, intake: DEMO_INTAKE },
      replace: true,
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] to-[#f0ebe0] flex items-center justify-center">
      <p className="text-[#6b6188] text-sm">Loading demo…</p>
    </div>
  );
}

export default ClientDemoPage;
