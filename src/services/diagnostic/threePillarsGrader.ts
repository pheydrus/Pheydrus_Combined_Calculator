/**
 * Three Pillars Grading Engine
 * Core IP logic — grades a person across Structure, Timing, and Environment.
 *
 * Pure function: no side effects, no async, no Swiss Ephemeris calls.
 * Consumes pre-computed calculator results and produces the diagnostic.
 */

import type {
  NatalChartResult,
  TransitsResult,
  LifePathResult,
  AddressNumerologyResult,
} from '../../models/calculators';
import type {
  AngularDiagnosticResult,
  GradeItem,
  PillarSummary,
  PlanetHouseResult,
  PillarGrade,
  FinalGrade,
} from '../../models/diagnostic';
import {
  PHEYDRUS_ANGULAR_HOUSES,
  PILLAR_1_MALEFICS,
  PILLAR_1_BENEFICS,
  PILLAR_1_SOFT_SPOT_PLANETS,
  PILLAR_1_SOFT_SPOT_HOUSES,
  PILLAR_2_MALEFICS,
  PILLAR_2_PRESSURE_HOUSES,
  PILLAR_3_MALEFICS,
  PILLAR_3_BENEFICS,
  PILLAR_3_SOFT_SPOT_PLANETS,
  PILLAR_3_SOFT_SPOT_HOUSES,
  PILLAR_3_PRESSURE_PLANETS,
  PILLAR_3_PRESSURE_HOUSES,
  LIFE_CYCLE_F_YEARS,
  LIFE_CYCLE_A_YEARS,
  ADDRESS_F_NUMBERS,
  ADDRESS_C_NUMBERS,
  ADDRESS_A_NUMBERS,
  ADDRESS_GRADED_LEVELS,
  computeFinalGrade,
} from '../../utils/data/diagnosticConstants';
import { reduceToSingleDigitOnly } from '../../utils/numerology/chaldean';

export interface GraderInput {
  natalChart: NatalChartResult | null;
  transits: TransitsResult | null;
  lifePath: LifePathResult | null;
  destinationPlanetHouses: PlanetHouseResult[] | null;
  addressNumerology: AddressNumerologyResult | null;
}

// ---------------------------------------------------------------------------
// Pillar 1 — STRUCTURE (Natal Angular)
// ---------------------------------------------------------------------------

function gradePillar1(natalChart: NatalChartResult | null): GradeItem[] {
  if (!natalChart) return [];

  const items: GradeItem[] = [];

  for (const planet of natalChart.planets) {
    const name = planet.planet.en;
    const house = planet.house;

    // Skip planets without house data or not in our evaluation set
    if (house === undefined) continue;

    const isMalefic = PILLAR_1_MALEFICS.has(name);
    const isBenefic = PILLAR_1_BENEFICS.has(name);
    if (!isMalefic && !isBenefic) continue;

    const isAngular = PHEYDRUS_ANGULAR_HOUSES.has(house);

    let grade: PillarGrade = 'Neutral';
    let reason: string;

    if (isAngular && isMalefic) {
      grade = 'F';
      reason = `Malefic ${name} in angular house ${house}`;
    } else if (PILLAR_1_SOFT_SPOT_PLANETS.has(name) && PILLAR_1_SOFT_SPOT_HOUSES.has(house)) {
      grade = 'F';
      reason = `${name} placement in house ${house} (8th/12th)`;
    } else if (isAngular && isBenefic) {
      grade = 'A';
      reason = `Benefic ${name} in angular house ${house}`;
    } else {
      reason = `${name} in house ${house} (not angular)`;
    }

    const zodiacSign = planet.zodiac_sign.name.en;
    items.push({
      source: `Natal ${name} in House ${house} (${zodiacSign})`,
      pillar: 1,
      section: 'Natal Angular',
      planet: name,
      house,
      grade,
      reason,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Pillar 2A — TIMING: Transit Angular
// ---------------------------------------------------------------------------

function gradePillar2Transits(transits: TransitsResult | null): GradeItem[] {
  if (!transits) return [];

  const items: GradeItem[] = [];

  for (const transit of transits.transits) {
    const name = transit.planet;
    const house = transit.houseNumber;

    const isMalefic = PILLAR_2_MALEFICS.has(name);
    if (!isMalefic) continue; // Only malefics are graded for transits

    const isAngular = PHEYDRUS_ANGULAR_HOUSES.has(house);
    const isPressure = PILLAR_2_PRESSURE_HOUSES.has(house);

    let grade: PillarGrade = 'Neutral';
    let reason: string;

    if (isAngular) {
      grade = 'F';
      reason = `Malefic transit ${name} in angular house ${house}`;
    } else if (isPressure) {
      grade = 'C';
      reason = `Malefic transit ${name} in pressure house ${house} (2nd/6th/8th/11th)`;
    } else {
      reason = `Transit ${name} in house ${house} (not angular or pressure)`;
    }

    items.push({
      source: `Transit ${name} in House ${house} (${transit.current.sign})`,
      pillar: 2,
      section: 'Transit Angular',
      planet: name,
      house,
      grade,
      reason,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Pillar 2B — TIMING: Life Cycle
// ---------------------------------------------------------------------------

function gradePillar2LifeCycle(lifePath: LifePathResult | null): GradeItem[] {
  if (!lifePath) return [];

  // Reduce master numbers to single digit for grading
  let year = lifePath.personalYear;
  if (year > 9) {
    year = reduceToSingleDigitOnly(year);
  }

  let grade: PillarGrade = 'Neutral';
  let reason: string;

  if (LIFE_CYCLE_F_YEARS.has(year)) {
    grade = 'F';
    reason = `Personal year ${year} is a pressure year`;
  } else if (LIFE_CYCLE_A_YEARS.has(year)) {
    grade = 'A';
    reason = `Personal year ${year} is a supportive year`;
  } else {
    reason = `Personal year ${year} is neutral`;
  }

  return [
    {
      source: `Life Cycle Year ${year}`,
      pillar: 2,
      section: 'Life Cycle',
      grade,
      reason,
    },
  ];
}

// ---------------------------------------------------------------------------
// Pillar 3A — ENVIRONMENT: Relocation Angular
// ---------------------------------------------------------------------------

function gradePillar3Relocation(destinationPlanetHouses: PlanetHouseResult[] | null): GradeItem[] {
  if (!destinationPlanetHouses) return [];

  const items: GradeItem[] = [];

  for (const ph of destinationPlanetHouses) {
    const name = ph.planet;
    const house = ph.house;

    const isMalefic = PILLAR_3_MALEFICS.has(name);
    const isBenefic = PILLAR_3_BENEFICS.has(name);
    if (!isMalefic && !isBenefic) continue;

    const isAngular = PHEYDRUS_ANGULAR_HOUSES.has(house);

    let grade: PillarGrade = 'Neutral';
    let reason: string;

    if (isAngular && isMalefic) {
      grade = 'F';
      reason = `Malefic ${name} in angular house ${house} at current location`;
    } else if (PILLAR_3_SOFT_SPOT_PLANETS.has(name) && PILLAR_3_SOFT_SPOT_HOUSES.has(house)) {
      grade = 'F';
      reason = `${name} in house ${house} at current location (8th/12th)`;
    } else if (PILLAR_3_PRESSURE_PLANETS.has(name) && PILLAR_3_PRESSURE_HOUSES.has(house)) {
      grade = 'C';
      reason = `${name} in pressure house ${house} at current location (2nd/6th/8th/11th)`;
    } else if (isAngular && isBenefic) {
      grade = 'A';
      reason = `Benefic ${name} in angular house ${house} at current location`;
    } else {
      reason = `${name} in house ${house} at current location (not angular)`;
    }

    items.push({
      source: `Env ${name} in House ${house}`,
      pillar: 3,
      section: 'Relocation Angular',
      planet: name,
      house,
      grade,
      reason,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Pillar 3B — ENVIRONMENT: Address
// ---------------------------------------------------------------------------

function gradePillar3Address(addressNumerology: AddressNumerologyResult | null): GradeItem[] {
  if (!addressNumerology) return [];

  const items: GradeItem[] = [];

  for (const levelName of ADDRESS_GRADED_LEVELS) {
    const level = addressNumerology.levels.find((l) => l.name === levelName);
    if (!level) continue;

    // Reduce master numbers to single digit for grading.
    // Exception: 'Level' (combined unit+building+street) preserves 11 as a master number.
    let num = level.number;
    if (num > 9 && !(levelName === 'L3' && num === 11)) {
      num = reduceToSingleDigitOnly(num);
    }

    let grade: PillarGrade = 'Neutral';
    let reason: string;

    if (ADDRESS_F_NUMBERS.has(num)) {
      grade = 'F';
      reason = `${levelName} number ${num} creates pressure`;
    } else if (ADDRESS_C_NUMBERS.has(num)) {
      grade = 'C';
      reason = `${levelName} number ${num} creates mild pressure`;
    } else if (ADDRESS_A_NUMBERS.has(num)) {
      grade = 'A';
      reason = `${levelName} number ${num} is supportive`;
    } else {
      reason = `${levelName} number ${num} is neutral`;
    }

    items.push({
      source: `${levelName}: ${num}`,
      pillar: 3,
      section: 'Address',
      grade,
      reason,
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Main grading function
// ---------------------------------------------------------------------------

function buildPillarSummary(
  pillar: 1 | 2 | 3,
  name: 'Structure' | 'Timing' | 'Environment',
  description: string,
  items: GradeItem[]
): PillarSummary {
  return {
    pillar,
    name,
    description,
    fCount: items.filter((i) => i.grade === 'F').length,
    cCount: items.filter((i) => i.grade === 'C').length,
    aCount: items.filter((i) => i.grade === 'A').length,
    items,
  };
}

export function gradeThreePillars(input: GraderInput): AngularDiagnosticResult {
  // Grade each section
  const p1Items = gradePillar1(input.natalChart);
  const p2aItems = gradePillar2Transits(input.transits);
  const p2bItems = gradePillar2LifeCycle(input.lifePath);
  const p3aItems = gradePillar3Relocation(input.destinationPlanetHouses);
  const p3bItems = gradePillar3Address(input.addressNumerology);

  // Build pillar summaries
  const pillar1 = buildPillarSummary(1, 'Structure', 'What you were born with', p1Items);

  const pillar2 = buildPillarSummary(2, 'Timing', 'What is happening now', [
    ...p2aItems,
    ...p2bItems,
  ]);

  const pillar3 = buildPillarSummary(3, 'Environment', 'Where you are living', [
    ...p3aItems,
    ...p3bItems,
  ]);

  const allItems = [...p1Items, ...p2aItems, ...p2bItems, ...p3aItems, ...p3bItems];
  const totalFs = allItems.filter((i) => i.grade === 'F').length;
  const totalCs = allItems.filter((i) => i.grade === 'C').length;
  const totalAs = allItems.filter((i) => i.grade === 'A').length;
  const score = Math.ceil(Math.max(0, totalFs + totalCs * 0.5 - totalAs * 0.5));
  const finalGrade: FinalGrade = computeFinalGrade(score);

  return {
    pillars: [pillar1, pillar2, pillar3],
    totalFs,
    totalCs,
    totalAs,
    score,
    finalGrade,
    allItems,
  };
}
