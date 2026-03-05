export type LoShuSquare = Star[][];
export type YearSquares = '2024' | '2025' | '2026';
export type Star = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const Element = {
  fire: 'fire',
  earth: 'earth',
  wood: 'wood',
  metal: 'metal',
  water: 'water',
} as const;

export type Element = (typeof Element)[keyof typeof Element];
