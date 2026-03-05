/**
 * Feng Shui Utility Tests
 *
 * Tests element nourishing/draining cycle, template generation,
 * salt cure logic, and element recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  getNourishingElement,
  getDrainingElement,
  generateFengShuiTemplate,
  reccomendElements,
  ElementExamples,
} from '../utils';
import { Element } from '../types';
import { elementNumberMap } from '../charts';

// ============================================================================
// ELEMENT CYCLE: Nourishing (productive cycle)
// fire <- wood <- water <- metal <- earth <- fire
// ============================================================================
describe('getNourishingElement', () => {
  it('wood nourishes fire', () => {
    expect(getNourishingElement(Element.fire)).toBe(Element.wood);
  });

  it('fire nourishes earth', () => {
    expect(getNourishingElement(Element.earth)).toBe(Element.fire);
  });

  it('earth nourishes metal', () => {
    expect(getNourishingElement(Element.metal)).toBe(Element.earth);
  });

  it('metal nourishes water', () => {
    expect(getNourishingElement(Element.water)).toBe(Element.metal);
  });

  it('water nourishes wood', () => {
    expect(getNourishingElement(Element.wood)).toBe(Element.water);
  });
});

// ============================================================================
// ELEMENT CYCLE: Draining (exhaustive cycle)
// fire -> earth -> metal -> water -> wood -> fire
// ============================================================================
describe('getDrainingElement', () => {
  it('fire drains into earth', () => {
    expect(getDrainingElement(Element.fire)).toBe(Element.earth);
  });

  it('earth drains into metal', () => {
    expect(getDrainingElement(Element.earth)).toBe(Element.metal);
  });

  it('metal drains into water', () => {
    expect(getDrainingElement(Element.metal)).toBe(Element.water);
  });

  it('water drains into wood', () => {
    expect(getDrainingElement(Element.water)).toBe(Element.wood);
  });

  it('wood drains into fire', () => {
    expect(getDrainingElement(Element.wood)).toBe(Element.fire);
  });
});

// ============================================================================
// TEMPLATE GENERATION
// ============================================================================
describe('generateFengShuiTemplate', () => {
  it('both auspicious stars → "best areas"', () => {
    // Star 9 (fire, auspicious) + Star 1 (water, auspicious)
    const result = generateFengShuiTemplate(9, 1);
    expect(result).toContain('best areas');
  });

  it('both inauspicious stars → "worst areas"', () => {
    // Star 5 (earth, inauspicious) + Star 2 (earth, inauspicious)
    const result = generateFengShuiTemplate(5, 2);
    expect(result).toContain('worst areas');
  });

  it('mixed auspiciousness → "mixed area"', () => {
    // Star 9 (auspicious) + Star 5 (inauspicious)
    const result = generateFengShuiTemplate(9, 5);
    expect(result).toContain('mixed area');
  });

  it('includes star numbers and elements in output', () => {
    const result = generateFengShuiTemplate(9, 1);
    expect(result).toContain('9');
    expect(result).toContain('1');
    expect(result).toContain('fire');
    expect(result).toContain('water');
  });

  it('includes HOME and YEAR labels', () => {
    const result = generateFengShuiTemplate(8, 4);
    expect(result).toContain('[HOME]');
    expect(result).toContain('[YEAR]');
  });
});

// ============================================================================
// SALT CURE LOGIC
// ============================================================================
describe('generateFengShuiTemplate - salt cure logic', () => {
  it('no salt cure when drain element is water (inauspicious home)', () => {
    // Star 3 = wood (inauspicious), drain of wood = fire. But let's find one where drain = water.
    // Element cycle: metal drains to water. Star 7 = metal (inauspicious)
    const result = generateFengShuiTemplate(7, 1);
    expect(result).toContain('NO salt cure');
  });

  it('add salt cure when no water drain involved and at least one inauspicious', () => {
    // Star 5 = earth (inauspicious), drain = metal (not water)
    // Star 3 = wood (inauspicious), drain = fire (not water)
    const result = generateFengShuiTemplate(5, 3);
    expect(result).toContain('ADD a salt cure');
  });
});

// ============================================================================
// ELEMENT RECOMMENDATIONS
// ============================================================================
describe('reccomendElements', () => {
  it('recommends adding elements for auspicious stars', () => {
    const elHome = elementNumberMap[9]; // fire, auspicious
    const nourishHome = getNourishingElement(elHome.element);
    const drainHome = getDrainingElement(elHome.element);
    const elYear = elementNumberMap[1]; // water, auspicious
    const nourishYear = getNourishingElement(elYear.element);
    const drainYear = getDrainingElement(elYear.element);

    const result = reccomendElements(
      elHome,
      nourishHome,
      drainHome,
      elYear,
      nourishYear,
      drainYear
    );
    expect(result).toContain('add');
  });

  it('recommends removing elements for inauspicious stars', () => {
    const elHome = elementNumberMap[5]; // earth, inauspicious
    const nourishHome = getNourishingElement(elHome.element);
    const drainHome = getDrainingElement(elHome.element);
    const elYear = elementNumberMap[2]; // earth, inauspicious
    const nourishYear = getNourishingElement(elYear.element);
    const drainYear = getDrainingElement(elYear.element);

    const result = reccomendElements(
      elHome,
      nourishHome,
      drainHome,
      elYear,
      nourishYear,
      drainYear
    );
    expect(result).toContain('remove');
  });
});

// ============================================================================
// ELEMENT EXAMPLES
// ============================================================================
describe('ElementExamples', () => {
  it('has entries for all 5 elements', () => {
    expect(ElementExamples).toHaveProperty('fire');
    expect(ElementExamples).toHaveProperty('earth');
    expect(ElementExamples).toHaveProperty('metal');
    expect(ElementExamples).toHaveProperty('water');
    expect(ElementExamples).toHaveProperty('wood');
  });

  it('each entry is a non-empty string', () => {
    for (const key of ['fire', 'earth', 'metal', 'water', 'wood']) {
      expect(typeof ElementExamples[key]).toBe('string');
      expect(ElementExamples[key].length).toBeGreaterThan(0);
    }
  });
});
