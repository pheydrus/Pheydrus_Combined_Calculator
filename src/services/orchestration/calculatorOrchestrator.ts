/**
 * Calculator Orchestrator
 * Natal chart runs first so its risingSign feeds the transits calculator.
 */

import type { FormData, ConsolidatedResults, CalculatorError, TransitsInput } from '../../models';
import {
  calculateTransits,
  calculateNatalChart,
  validateNatalChartInput,
  calculateLifePath,
  validateLifePathInput,
  calculateRelocation,
  validateRelocationInput,
  calculateAddressNumerology,
  validateAddressNumerologyInput,
} from '../../calculators';
import {
  mapToNatalChartInput,
  mapToLifePathInput,
  mapToRelocationInput,
  mapToAddressNumerologyInput,
} from './inputMapper';
import { consolidateResults, createErrorResult } from './resultConsolidator';
import { runAngularDiagnostic } from '../diagnostic';

const ORCHESTRATOR_TIMEOUT = 10000; // 10 seconds

/**
 * Run all 5 calculators.
 * Natal chart runs first so its risingSign can feed the transits calculator.
 */
export async function runAllCalculators(formData: FormData): Promise<ConsolidatedResults> {
  try {
    // Map inputs
    const natalChartInput = mapToNatalChartInput(formData);
    const lifePathInput = mapToLifePathInput(formData);
    const relocationInput = mapToRelocationInput(formData);
    const addressNumerologyInput = mapToAddressNumerologyInput(formData);

    // Validate non-transits inputs upfront
    const validations = [
      { result: validateNatalChartInput(natalChartInput), name: 'natalChart' },
      { result: validateLifePathInput(lifePathInput), name: 'lifePath' },
      { result: validateRelocationInput(relocationInput), name: 'relocation' },
      { result: validateAddressNumerologyInput(addressNumerologyInput), name: 'addressNumerology' },
    ];

    const validationErrors = validations
      .filter((v) => !v.result.valid)
      .map((v) => ({
        calculatorName: v.name,
        errorMessage: v.result.error || 'Validation failed',
      })) as CalculatorError[];

    if (validationErrors.length > 0) {
      return consolidateResults(formData, null, null, null, null, null, validationErrors);
    }

    // Step 1: Run natal chart first to obtain the rising sign
    const natalChartResult = await Promise.race([
      calculateNatalChart(natalChartInput),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Calculator timeout: exceeded 10 seconds')),
          ORCHESTRATOR_TIMEOUT
        )
      ),
    ]);

    // Step 2: Use natal chart's rising sign for transits, run all remaining in parallel
    const transitsInput: TransitsInput = { risingSign: natalChartResult.risingSign };

    const [transitsResult, lifePathResult, relocationResult, addressNumerologyResult] =
      await Promise.race([
        Promise.all([
          calculateTransits(transitsInput),
          calculateLifePath(lifePathInput),
          calculateRelocation(relocationInput),
          calculateAddressNumerology(addressNumerologyInput),
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Calculator timeout: exceeded 10 seconds')),
            ORCHESTRATOR_TIMEOUT
          )
        ),
      ]);

    const consolidated = consolidateResults(
      formData,
      transitsResult,
      natalChartResult,
      lifePathResult,
      relocationResult,
      addressNumerologyResult
    );

    // Run Angular Diagnostic after all calculators complete
    try {
      const diagnostic = await runAngularDiagnostic(consolidated, formData);
      consolidated.diagnostic = diagnostic;
    } catch (e) {
      console.warn('Angular diagnostic failed:', e);
    }

    return consolidated;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    return createErrorResult(formData, err);
  }
}

/**
 * Get human-readable error summary
 */
export function getErrorSummary(results: ConsolidatedResults): string {
  if (results.success) return '';

  if (results.errors && results.errors.length > 0) {
    return results.errors.map((e) => `${e.calculatorName}: ${e.errorMessage}`).join('\n');
  }

  return 'Unknown error occurred';
}
