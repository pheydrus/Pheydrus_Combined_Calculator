import type { LoShuSquare, Star, YearSquares } from './types';
import { Element } from './types';

export const directions = [
  ['SE', 'S', 'SW'],
  ['E', 'C', 'W'],
  ['NE', 'N', 'NW'],
];

export const loShuYear2024: LoShuSquare = [
  [2, 7, 9],
  [1, 3, 5],
  [6, 8, 4],
];

export const loShuYear2025: LoShuSquare = [
  [1, 6, 8],
  [9, 2, 4],
  [5, 7, 3],
];

export const loShuYear2026: LoShuSquare = [
  [9, 5, 7],
  [8, 1, 3],
  [4, 6, 2],
];

export const currentYear: Record<YearSquares, LoShuSquare> = {
  2024: loShuYear2024,
  2025: loShuYear2025,
  2026: loShuYear2026,
};

export const period9: LoShuSquare = [
  [8, 4, 6],
  [7, 9, 2],
  [3, 5, 1],
];
const period8: LoShuSquare = [
  [7, 3, 5],
  [6, 8, 1],
  [2, 4, 9],
];
const period7: LoShuSquare = [
  [6, 2, 4],
  [5, 7, 9],
  [1, 3, 8],
];

export const loShuSquareByPeriod: LoShuSquare[] = [period9, period8, period7];

export const elementNumberMap: Record<
  Star,
  {
    auspicious: boolean;
    color: string;
    elementIcon: string;
    theme: string;
    element: Element;
  }
> = {
  1: {
    auspicious: true,
    color: 'black',
    elementIcon: '\uD83D\uDCA7',
    theme: 'fame and wealth',
    element: Element.water,
  },
  2: {
    auspicious: false,
    color: 'black',
    elementIcon: '\uD83C\uDF0F',
    theme: 'illness',
    element: Element.earth,
  },
  3: {
    auspicious: false,
    color: 'jade',
    elementIcon: '\uD83E\uDEB5',
    theme: 'quarrels',
    element: Element.wood,
  },
  4: {
    auspicious: true,
    color: 'green',
    elementIcon: '\uD83E\uDEB5',
    theme: 'love, intelligence & education',
    element: Element.wood,
  },
  5: {
    auspicious: false,
    color: 'yellow',
    elementIcon: '\uD83C\uDF0F',
    theme: 'general misfortune',
    element: Element.earth,
  },
  6: {
    auspicious: true,
    color: 'white',
    elementIcon: '\uD83E\uDE99',
    theme: 'wealth & career promotion',
    element: Element.metal,
  },
  7: {
    auspicious: false,
    color: 'red',
    elementIcon: '\uD83E\uDE99',
    theme: 'conflicts & arguments',
    element: Element.metal,
  },
  8: {
    auspicious: true,
    color: 'white',
    elementIcon: '\uD83C\uDF0F',
    theme: 'health & wealth',
    element: Element.earth,
  },
  9: {
    auspicious: true,
    color: 'purple',
    elementIcon: '\uD83D\uDD25',
    theme: 'celebration star, rules all things auspicious',
    element: Element.fire,
  },
};

export const elementRelationship: Element[] = [
  Element.fire,
  Element.earth,
  Element.metal,
  Element.water,
  Element.wood,
];
