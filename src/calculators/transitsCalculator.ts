/**
 * Transits Calculator Service
 * Calculates planetary transits based on rising sign
 * Preserves exact data from legacy implementation
 */

import type {
  TransitsInput,
  TransitsResult,
  PlanetaryTransit,
  Placement,
} from '../models/calculators';
import { HOUSE_THEMES, PLANET_THEMES, ZODIAC_SIGNS } from '../utils/data/constants';

/**
 * Transit placement data for 6 major planets/nodes
 * Static data: Pluto, Neptune, Saturn, Uranus, North Node, South Node
 * Data matches legacy PheydrusCalculators exactly (2026 correct positions)
 */
const PLANET_TRANSITS_DATA: Array<{
  planet: string;
  past: Placement;
  current: Placement;
}> = [
  {
    planet: 'Pluto',
    past: {
      sign: 'Capricorn',
      start: '2008',
      end: '2023-2025',
      high: 'mastery of structures, long-term legacy, responsible power',
      low: 'control, corruption, fear of failure, rigidity',
    },
    current: {
      sign: 'Aquarius',
      start: '2023-2025',
      end: '2043',
      high: 'collective innovation, freedom, future systems, social empowerment',
      low: 'chaos in tech, detachment, rebellion without cause, alienation',
    },
  },
  {
    planet: 'Neptune',
    past: {
      sign: 'Pisces',
      start: '2011',
      end: '2025/2026',
      high: 'compassion, spiritual awakening, creativity, unity consciousness',
      low: 'escapism, confusion, victimhood, illusions',
    },
    current: {
      sign: 'Aries',
      start: '2025/2026',
      end: '2039',
      high: 'courageous vision, spiritual self-leadership, innovation, risk taking',
      low: 'self-delusion, ego-driven martyrdom, blurred identity, blurred boundaries, confused masculinity',
    },
  },
  {
    planet: 'Saturn',
    past: {
      sign: 'Pisces',
      start: '2023',
      end: '2025/2026',
      high: 'spiritual discipline, boundaries in compassion, practical creativity',
      low: 'avoidance, self-pity, blurred limits, victim mindset',
    },
    current: {
      sign: 'Aries',
      start: '2025/2026',
      end: '2028',
      high: 'self-mastery, courage to take responsibility, disciplined leadership, risk taking',
      low: 'impatience, aggression, fear of failure, ego rigidity',
    },
  },
  {
    planet: 'Uranus',
    past: {
      sign: 'Taurus',
      start: '2018',
      end: '2025/2026',
      high: 'innovative resources, sustainable values, embodied freedom',
      low: 'financial chaos, stubborn resistance, insecurity',
    },
    current: {
      sign: 'Gemini',
      start: '2025/2026',
      end: '2033',
      high: 'breakthroughs in communication, learning, tech, networks',
      low: 'scattered attention, shallow rebellion, information chaos',
    },
  },
  {
    planet: 'North Node',
    past: {
      sign: 'Aries',
      start: '2023',
      end: '2025',
      high: 'independence, courage, pioneering destiny, risk taking',
      low: 'selfishness, recklessness, conflict',
    },
    current: {
      sign: 'Pisces',
      start: '2025',
      end: '2026',
      high: 'spiritual growth, compassion, surrender to higher flow',
      low: 'escapism, victimhood, lack of boundaries',
    },
  },
  {
    planet: 'South Node',
    past: {
      sign: 'Libra',
      start: '2023',
      end: '2025',
      high: 'harmony, fairness, relationship wisdom',
      low: 'people-pleasing, indecision, dependency',
    },
    current: {
      sign: 'Virgo',
      start: '2025',
      end: '2026',
      high: 'discernment, service, practical wisdom',
      low: 'over-analysis, perfectionism, burnout',
    },
  },
];

/**
 * Get houses based on rising sign
 * Rotates zodiac signs so rising sign becomes house 1
 *
 * @param risingSign - Rising sign name
 * @returns Array of houses with zodiac signs
 */
function getHouses(risingSign: string): Array<{ house: number; sign: string; theme: string }> {
  const signs = Array.from(ZODIAC_SIGNS) as string[];
  const idx = signs.indexOf(risingSign);

  if (idx === -1) {
    return [];
  }

  // Rotate so rising sign is at index 0
  const rotated = [...signs.slice(idx), ...signs.slice(0, idx)];

  return rotated.map((sign, i) => ({
    house: i + 1,
    sign,
    theme: HOUSE_THEMES[i],
  }));
}

/**
 * Get the house number for a specific zodiac sign given a rising sign.
 *
 * @param sign - Zodiac sign name (e.g. 'Aquarius')
 * @param risingSign - Rising sign name (e.g. 'Sagittarius')
 * @returns House number (1-12)
 */
function getHouseForSign(sign: string, risingSign: string): number {
  const houses = getHouses(risingSign);
  const house = houses.find((h) => h.sign === sign);
  return house ? house.house : 1;
}

/**
 * Calculate Transits
 * Returns current and past transits for all planets
 *
 * @param input - Rising sign
 * @returns TransitsResult with all planetary transits
 */
export function calculateTransits(input: TransitsInput): TransitsResult {
  const { risingSign } = input;

  if (!risingSign || !(ZODIAC_SIGNS as readonly string[]).includes(risingSign)) {
    throw new Error(`Invalid rising sign: ${risingSign}`);
  }

  const transits: PlanetaryTransit[] = PLANET_TRANSITS_DATA.map((planetData) => {
    const houseNumber = getHouseForSign(planetData.current.sign, risingSign as string);
    const houseTheme = HOUSE_THEMES[houseNumber - 1];
    const pastHouseNumber = getHouseForSign(planetData.past.sign, risingSign as string);
    const pastHouseTheme = HOUSE_THEMES[pastHouseNumber - 1];
    const planetTheme = PLANET_THEMES[planetData.planet] || '';

    return {
      planet: planetData.planet,
      planetTheme,
      current: planetData.current,
      past: planetData.past,
      houseNumber,
      houseTheme,
      pastHouseNumber,
      pastHouseTheme,
    };
  });

  return {
    risingSign,
    transits,
  };
}

/**
 * Validate transit input
 */
export function validateTransitsInput(input: TransitsInput): { valid: boolean; error?: string } {
  if (!input.risingSign) {
    return { valid: false, error: 'Rising sign is required' };
  }

  if (!(ZODIAC_SIGNS as readonly string[]).includes(input.risingSign)) {
    return { valid: false, error: `Invalid rising sign: ${input.risingSign}` };
  }

  return { valid: true };
}
