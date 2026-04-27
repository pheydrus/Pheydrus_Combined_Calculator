/**
 * Exports for all calculator services
 */

// Transits Calculator
export { calculateTransits, validateTransitsInput } from './transitsCalculator';

// Natal Chart Calculator
export { calculateNatalChart, validateNatalChartInput } from './natalChartCalculator';

export { degreeToZodiacSign, formatDegree, getZodiacSign } from './natalChartHelpers';

// Life Path Calculator
export { calculateLifePath, validateLifePathInput } from './lifePathCalculator';

// Relocation Calculator
export {
  calculateRelocation,
  validateRelocationInput,
  getRelocationSummary,
} from './relocationCalculator';

// Address Numerology Calculator
export {
  calculateAddressNumerology,
  validateAddressNumerologyInput,
  getAddressNumerologySummary,
} from './addressNumerologyCalculator';

// Astrocartography Calculator
export {
  calculateAstrocartography,
  validateAstrocartographyInput,
} from './astrocartographyCalculator';

// Human Design Calculator
export { calculateHumanDesign, validateHumanDesignInput } from './humanDesignCalculator';

// Re-export types
export type {
  TransitsInput,
  TransitsResult,
  NatalChartInput,
  NatalChartResult,
  LifePathInput,
  LifePathResult,
  RelocationInput,
  RelocationResult,
  AddressNumerologyInput,
  AddressNumerologyResult,
  AstrocartographyInput,
  AstrocartographyResult,
  HumanDesignInput,
  HumanDesignResult,
} from '../models/calculators';
