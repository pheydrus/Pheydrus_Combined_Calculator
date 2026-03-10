// Base types and interfaces for the calculator application

export interface CalculatorInput {
  id: string;
  name: string;
  value: number | string;
  type: 'number' | 'text' | 'select';
  options?: string[];
  required?: boolean;
}

export interface CalculatorResult {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
}

export interface CalculatorConfig {
  id: string;
  name: string;
  description: string;
  inputs: CalculatorInput[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Re-export all calculator models (Feature 1)
export {
  type TransitsInput,
  type TransitsResult,
  type Placement,
  type PlanetaryTransit,
  type NatalChartInput,
  type NatalChartResult,
  type AstrologyPlanet,
  type AstrologyAspect,
  type AngleAspects,
  type LifePathInput,
  type LifePathResult,
  type RelocationInput,
  type RelocationResult,
  type AngularHit,
  type BusinessHouseActivation,
  type AddressNumerologyInput,
  type AddressNumerologyResult,
  type NumerologyLevel,
  type ZodiacMeaning,
  type UserInfo,
  type CalculatorError,
  type ConsolidatedResults,
  type Angles,
  type PlanetWithHouse,
  type ZodiacSigns,
  type Zodiacs,
  type AstrocartographyInput,
  type AstrocartographyResult,
  type AstrocartographyLine,
  type AstrocartographyPoint,
} from './calculators';

// Re-export form models (Feature 2)
export {
  type FormData,
  type CityData,
  EMPTY_FORM,
  FORM_STORAGE_KEY,
  ZODIAC_SIGNS_OPTIONS,
  extractUserInfo,
  serializeFormData,
  deserializeFormData,
} from './form';

// Re-export client intake models
export {
  type ClientIntakeData,
  type PreferredSolution,
  type CurrentSituation,
  type PriorHelpOption,
  EMPTY_CLIENT_INTAKE,
  PREFERRED_SOLUTION_LABELS,
  CURRENT_SITUATION_LABELS,
  PRIOR_HELP_LABELS,
} from './clientIntake';
