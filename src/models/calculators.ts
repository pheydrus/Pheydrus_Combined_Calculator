/**
 * Pheydrus Combined Calculator - Core Data Models
 * Defines all calculator input/output types and consolidated result structure
 * Preserves exact data structures from legacy calculators
 */

// ============================================================================
// TRANSITS CALCULATOR
// ============================================================================

export interface TransitsInput {
  risingSign: string;
}

export interface Placement {
  sign: string;
  start: string;
  end: string;
  high: string;
  low: string;
}

export interface PlanetaryTransit {
  planet: string;
  planetTheme: string;
  current: Placement;
  past: Placement;
  houseNumber: number;
  houseTheme: string;
  pastHouseNumber: number;
  pastHouseTheme: string;
}

export interface TransitsResult {
  risingSign: string;
  transits: PlanetaryTransit[];
}

// ============================================================================
// NATAL CHART CALCULATOR
// ============================================================================

export interface NatalChartInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  seconds?: number;
  latitude: number;
  longitude: number;
  timeZone: string;
}

export interface AstrologyPlanet {
  planet: {
    en: string;
  };
  fullDegree: number;
  normDegree: number;
  isRetro: 'True' | 'False' | 'true' | 'false';
  zodiac_sign: {
    number: number;
    name: {
      en: string;
    };
  };
  house?: number;
}

export interface AstrologyAspect {
  planet_1: {
    en: string;
  };
  planet_2: {
    en: string;
  };
  aspect: {
    en: string;
  };
}

export interface AngleAspects {
  asc: AstrologyAspect[];
  dsc: AstrologyAspect[];
  mc: AstrologyAspect[];
  ic: AstrologyAspect[];
}

export interface NatalChartResult {
  planets: AstrologyPlanet[];
  aspects: AstrologyAspect[];
  angleAspects: AngleAspects;
  risingSign: string;
}

// ============================================================================
// LIFE PATH CALCULATOR
// ============================================================================

export interface LifePathInput {
  birthDate: string; // YYYY-MM-DD
}

export interface LifePathResult {
  lifePathNumber: number;
  dayPathNumber: number;
  personalYear: number;
  chineseZodiac: string;
  meanings: {
    lifePathMeaning: string;
    lifePathDescription: string;
    personalYearMeaning: string;
    personalYearDescription: string;
  };
}

// ============================================================================
// RELOCATION CALCULATOR
// ============================================================================

export interface RelocationInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  birthLatitude: number;
  birthLongitude: number;
  birthTimeZone: string;
  destinationLatitude: number;
  destinationLongitude: number;
}

export interface AngularHit {
  key: string;
  angle: string;
  house: number;
  nature: 'benefic' | 'malefic' | 'neutral';
  isCareer: boolean;
}

export interface BusinessHouseActivation {
  key: string;
  house: number;
  nature: 'benefic' | 'malefic' | 'neutral';
}

export interface RelocationResult {
  angularHits: AngularHit[];
  businessHouseActivations: BusinessHouseActivation[];
}

// ============================================================================
// ADDRESS NUMEROLOGY CALCULATOR
// ============================================================================

export interface AddressNumerologyInput {
  unitNumber: string; // L1
  streetNumber: string; // Building/House Number
  streetName: string; // Street Name
  postalCode: string; // Postal Code
  homeYear: string; // YYYY
  birthYear: string; // YYYY
}

export interface NumerologyLevel {
  level: string; // "L1", "L2", etc. (dynamic numbering)
  value: string;
  name: string;
  number: number;
  meaning: string;
  description: string;
  themes: string;
  challenges: string;
  gifts: string;
  reflection: string;
}

export interface ZodiacMeaning {
  name: string;
  themes: string;
  challenges: string;
  gifts: string;
  reflection: string;
}

export interface AddressNumerologyResult {
  levels: NumerologyLevel[];
  homeZodiac: string;
  birthZodiac: string;
  homeZodiacMeaning: ZodiacMeaning | null;
  birthZodiacMeaning: ZodiacMeaning | null;
  compatibility: string;
}

// ============================================================================
// ANGULAR DIAGNOSTIC
// ============================================================================

export type { AngularDiagnosticResult } from './diagnostic';

// ============================================================================
// CONSOLIDATED ORCHESTRATOR OUTPUT
// ============================================================================

export interface UserInfo {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  birthLocation: string;
  currentLocation: string;
  address?: string;
}

export interface CalculatorError {
  calculatorName: string;
  errorMessage: string;
}

export interface ConsolidatedResults {
  success: boolean;
  timestamp: string;
  userInfo: UserInfo;
  calculators: {
    transits: TransitsResult | null;
    natalChart: NatalChartResult | null;
    lifePath: LifePathResult | null;
    relocation: RelocationResult | null;
    addressNumerology: AddressNumerologyResult | null;
  };
  diagnostic?: import('./diagnostic').AngularDiagnosticResult;
  errors?: CalculatorError[];
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface Angles {
  asc: number;
  dsc: number;
  mc: number;
  ic: number;
}

export interface PlanetWithHouse {
  key: string;
  lon: number;
  signIndex: number;
  house: number;
}

export type ZodiacSigns =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export type Zodiacs =
  | 'Rat'
  | 'Ox'
  | 'Tiger'
  | 'Rabbit'
  | 'Dragon'
  | 'Snake'
  | 'Horse'
  | 'Goat'
  | 'Monkey'
  | 'Rooster'
  | 'Dog'
  | 'Pig';

// ============================================================================
// ASTROCARTOGRAPHY CALCULATOR
// ============================================================================

export interface AstrocartographyInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  birthTimeZone: string;
}

export interface AstrocartographyPoint {
  latitude: number;
  longitude: number;
  orb: number;
  region: string;
  locationName: string; // "City, State, Country" from reverse geocoding
}

export interface AstrocartographyLine {
  planet: string;
  angle: 'ASC' | 'DSC' | 'MC' | 'IC';
  points: AstrocartographyPoint[];
}

export interface AstrocartographyResult {
  lines: AstrocartographyLine[];
  warningLines: AstrocartographyLine[];
}
