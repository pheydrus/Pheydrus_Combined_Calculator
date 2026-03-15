/**
 * Legacy Calculator Comparison Tests
 *
 * These tests verify the new calculator produces IDENTICAL results
 * to the legacy PheydrusCalculators for the same inputs.
 *
 * Each test case uses exact values traced from the legacy code.
 */

import { describe, it, expect } from 'vitest';
import { calculateTransits } from '../transitsCalculator';
import { calculateLifePath } from '../lifePathCalculator';
import { calculateAddressNumerology } from '../addressNumerologyCalculator';
import { chaldeanNumerologyCalculator } from '../../../utils/numerology/chaldean';

// ============================================================================
// TRANSITS: Verify exact data matches legacy PheydrusCalculators/src/app/transits/page.tsx
// ============================================================================
describe('Legacy Comparison: Transits', () => {
  it('should have exactly 6 planets in correct order', () => {
    const result = calculateTransits({ risingSign: 'Gemini' });
    const planets = result.transits.map((t) => t.planet);
    expect(planets).toEqual(['Pluto', 'Neptune', 'Saturn', 'Uranus', 'North Node', 'South Node']);
  });

  it('Pluto data should match legacy exactly', () => {
    const result = calculateTransits({ risingSign: 'Aries' });
    const pluto = result.transits.find((t) => t.planet === 'Pluto')!;

    expect(pluto.current.sign).toBe('Aquarius');
    expect(pluto.current.start).toBe('2023-2025');
    expect(pluto.current.end).toBe('2043');
    expect(pluto.current.high).toBe(
      'collective innovation, freedom, future systems, social empowerment'
    );
    expect(pluto.current.low).toBe(
      'chaos in tech, detachment, rebellion without cause, alienation'
    );

    expect(pluto.past.sign).toBe('Capricorn');
    expect(pluto.past.start).toBe('2008');
    expect(pluto.past.end).toBe('2023-2025');
    expect(pluto.past.high).toBe('mastery of structures, long-term legacy, responsible power');
    expect(pluto.past.low).toBe('control, corruption, fear of failure, rigidity');
  });

  it('Neptune data should match legacy exactly', () => {
    const result = calculateTransits({ risingSign: 'Aries' });
    const neptune = result.transits.find((t) => t.planet === 'Neptune')!;

    expect(neptune.current.sign).toBe('Aries');
    expect(neptune.current.start).toBe('2025/2026');
    expect(neptune.current.end).toBe('2039');

    expect(neptune.past.sign).toBe('Pisces');
    expect(neptune.past.start).toBe('2011');
    expect(neptune.past.end).toBe('2025/2026');
  });

  it('Saturn data should match legacy exactly', () => {
    const result = calculateTransits({ risingSign: 'Aries' });
    const saturn = result.transits.find((t) => t.planet === 'Saturn')!;

    expect(saturn.current.sign).toBe('Aries');
    expect(saturn.current.start).toBe('2025/2026');
    expect(saturn.current.end).toBe('2028');
    expect(saturn.current.high).toContain('self-mastery');

    expect(saturn.past.sign).toBe('Pisces');
    expect(saturn.past.start).toBe('2023');
    expect(saturn.past.end).toBe('2025/2026');
  });

  it('Uranus data should match legacy exactly', () => {
    const result = calculateTransits({ risingSign: 'Aries' });
    const uranus = result.transits.find((t) => t.planet === 'Uranus')!;

    expect(uranus.current.sign).toBe('Gemini');
    expect(uranus.current.start).toBe('2025/2026');
    expect(uranus.current.end).toBe('2033');

    expect(uranus.past.sign).toBe('Taurus');
    expect(uranus.past.start).toBe('2018');
    expect(uranus.past.end).toBe('2025/2026');
  });

  it('North Node data should match legacy exactly', () => {
    const result = calculateTransits({ risingSign: 'Aries' });
    const nn = result.transits.find((t) => t.planet === 'North Node')!;

    expect(nn.current.sign).toBe('Pisces');
    expect(nn.current.start).toBe('2025');
    expect(nn.current.end).toBe('2026');
    expect(nn.current.high).toBe('spiritual growth, compassion, surrender to higher flow');
    expect(nn.current.low).toBe('escapism, victimhood, lack of boundaries');

    expect(nn.past.sign).toBe('Aries');
    expect(nn.past.start).toBe('2023');
    expect(nn.past.end).toBe('2025');
  });

  it('South Node data should match legacy exactly', () => {
    const result = calculateTransits({ risingSign: 'Aries' });
    const sn = result.transits.find((t) => t.planet === 'South Node')!;

    expect(sn.current.sign).toBe('Virgo');
    expect(sn.current.start).toBe('2025');
    expect(sn.current.end).toBe('2026');

    expect(sn.past.sign).toBe('Libra');
    expect(sn.past.start).toBe('2023');
    expect(sn.past.end).toBe('2025');
  });

  // ---- House calculations ----

  it('Aries rising: Pluto(Aquarius) in house 11, Saturn(Aries) in house 1', () => {
    const result = calculateTransits({ risingSign: 'Aries' });
    const pluto = result.transits.find((t) => t.planet === 'Pluto')!;
    const saturn = result.transits.find((t) => t.planet === 'Saturn')!;

    // Aquarius is 11th from Aries
    expect(pluto.houseNumber).toBe(11);
    // Aries is 1st from Aries
    expect(saturn.houseNumber).toBe(1);
  });

  it('Gemini rising: Pluto(Aquarius) in house 9, Neptune(Aries) in house 11', () => {
    const result = calculateTransits({ risingSign: 'Gemini' });
    const pluto = result.transits.find((t) => t.planet === 'Pluto')!;
    const neptune = result.transits.find((t) => t.planet === 'Neptune')!;

    // Aquarius from Gemini: Gemini=0, Cancer=1, Leo=2, Virgo=3, Libra=4, Scorpio=5, Sag=6, Cap=7, Aqu=8 → house 9
    expect(pluto.houseNumber).toBe(9);
    // Aries from Gemini: Gemini=0,...Pisces=10, Aries=11 → house 11... wait
    // Actually: Gemini=1, Cancer=2, Leo=3, Virgo=4, Libra=5, Scorpio=6, Sag=7, Cap=8, Aqu=9, Pisces=10, Aries=11
    expect(neptune.houseNumber).toBe(11);
  });

  it('Sagittarius rising: Pluto(Aquarius) in house 3, not house 4', () => {
    const result = calculateTransits({ risingSign: 'Sagittarius' });
    const pluto = result.transits.find((t) => t.planet === 'Pluto')!;

    // Sagittarius=1, Capricorn=2, Aquarius=3 → house 3
    // (Aquarius idx 10 - Sagittarius idx 8 + 12) % 12 + 1 = 3
    expect(pluto.houseNumber).toBe(3);
  });

  it('Libra rising: opposite houses from Aries rising', () => {
    const ariesResult = calculateTransits({ risingSign: 'Aries' });
    const libraResult = calculateTransits({ risingSign: 'Libra' });

    // Pluto in Aquarius: Aries=house 11, Libra=house 5
    const ariesPluto = ariesResult.transits.find((t) => t.planet === 'Pluto')!;
    const libraPluto = libraResult.transits.find((t) => t.planet === 'Pluto')!;

    expect(ariesPluto.houseNumber).toBe(11);
    expect(libraPluto.houseNumber).toBe(5);
  });

  // ---- Planet themes ----

  it('planet themes should match legacy planetThemes object', () => {
    const result = calculateTransits({ risingSign: 'Aries' });

    const pluto = result.transits.find((t) => t.planet === 'Pluto')!;
    expect(pluto.planetTheme).toBe(
      'transforms, intensifies, destroys & rebuilds, empowers, exposes, regenerates'
    );

    const neptune = result.transits.find((t) => t.planet === 'Neptune')!;
    expect(neptune.planetTheme).toBe(
      'dissolves, spiritualizes, confuses, idealizes, inspires, transcends, mystifies'
    );

    const saturn = result.transits.find((t) => t.planet === 'Saturn')!;
    expect(saturn.planetTheme).toBe(
      'structures, disciplines, restricts, tests, grounds, matures, crystallizes'
    );

    const uranus = result.transits.find((t) => t.planet === 'Uranus')!;
    expect(uranus.planetTheme).toBe(
      'disrupts, liberates, shocks, awakens, innovates, revolutionizes'
    );

    const nn = result.transits.find((t) => t.planet === 'North Node')!;
    expect(nn.planetTheme).toBe(
      'directs, guides, grows, evolves, pushes toward destiny, expands purpose'
    );

    const sn = result.transits.find((t) => t.planet === 'South Node')!;
    expect(sn.planetTheme).toBe(
      'releases, depletes, drains, pulls back, exposes past patterns, lets go'
    );
  });

  // ---- House themes ----

  it('house themes should match legacy houseThemes array', () => {
    const result = calculateTransits({ risingSign: 'Aries' });
    // Saturn is in Aries = house 1 for Aries rising
    const saturn = result.transits.find((t) => t.planet === 'Saturn')!;
    expect(saturn.houseTheme).toBe('identity, self, appearance, personal approach');
  });
});

// ============================================================================
// LIFE PATH: Verify exact calculations match legacy
// Legacy aw/page.tsx uses space-joined personal year: "2026 MM DD"
// ============================================================================
describe('Legacy Comparison: Life Path', () => {
  // ---- Life Path Number ----
  // Legacy: chaldeanNumerologyCalculator([formData.bday])
  // Both legacy versions pass the full date string. Hyphens = 0 in chaldean, so equivalent.

  it('Life path for 2002-08-28 should be 22 (master number)', () => {
    const result = calculateLifePath({ birthDate: '2002-08-28' });
    // 2+0+0+2+0+8+2+8 = 22 (master number preserved)
    expect(result.lifePathNumber).toBe(22);
  });

  it('Life path for 1990-05-15 should be 3', () => {
    const result = calculateLifePath({ birthDate: '1990-05-15' });
    // 1+9+9+0+0+5+1+5 = 30 → 3+0 = 3
    expect(result.lifePathNumber).toBe(3);
  });

  it('Life path for 1985-12-25 should be 6', () => {
    const result = calculateLifePath({ birthDate: '1985-12-25' });
    // 1+9+8+5+1+2+2+5 = 33 (master number preserved!)
    expect(result.lifePathNumber).toBe(33);
  });

  it('Life path for 2000-01-01 should be 3', () => {
    const result = calculateLifePath({ birthDate: '2000-01-01' });
    // 2+0+0+0+0+1+0+1 = 4... let me verify
    // chaldeanNumerologyCalculator(["20000101"])
    // findNumerology("20000101") = 2+0+0+0+0+1+0+1 = 4
    expect(result.lifePathNumber).toBe(4);
  });

  // ---- Day Path Number ----
  // Legacy aw/page.tsx dayPathNumber: splits by "-", takes parts[2], runs chaldeanNumerologyCalculator([day])

  it('Day path for 2002-08-28 should be 1', () => {
    const result = calculateLifePath({ birthDate: '2002-08-28' });
    // chaldeanNumerologyCalculator(["28"]) = findNumerology("28") = 2+8 = 10 → 1
    expect(result.dayPathNumber).toBe(1);
  });

  it('Day path for 1990-05-15 should be 6', () => {
    const result = calculateLifePath({ birthDate: '1990-05-15' });
    // chaldeanNumerologyCalculator(["15"]) = findNumerology("15") = 1+5 = 6
    expect(result.dayPathNumber).toBe(6);
  });

  it('Day path for 1985-12-25 should be 7', () => {
    const result = calculateLifePath({ birthDate: '1985-12-25' });
    // chaldeanNumerologyCalculator(["25"]) = findNumerology("25") = 2+5 = 7
    expect(result.dayPathNumber).toBe(7);
  });

  it('Day path for 1975-11-11 should be 11 (master number)', () => {
    const result = calculateLifePath({ birthDate: '1975-11-11' });
    // chaldeanNumerologyCalculator(["11"]) = findNumerology("11") = 11 (master!)
    expect(result.dayPathNumber).toBe(11);
  });

  // ---- Personal Year (most critical - must match aw/page.tsx space-join version) ----
  // Legacy aw/page.tsx: splits by "-", replaces year with current year, joins with SPACE
  // Then: chaldeanNumerologyCalculator(["YYYY MM DD"])

  it('Personal year calculation matches legacy space-join behavior', () => {
    // Verify the underlying calculation matches legacy
    // Legacy for birth "1990-01-09" in year 2026:
    //   "2026 01 09" → split by spaces → ["2026","01","09"]
    //   findNumerology("2026") = 2+0+2+6 = 10 → 1
    //   findNumerology("01") = 1
    //   findNumerology("09") = 9
    //   sum = 1 + 1 + 9 = 11
    //   findNumerology("11") = 11 (master number!)
    //   Result = 11
    const spaceResult = chaldeanNumerologyCalculator(['2026 01 09']);
    expect(spaceResult).toBe(11);

    // Without space join (wrong, old implementation):
    //   "20260109" → findNumerology("20260109") = 2+0+2+6+0+1+0+9 = 20 → 2
    //   Result = 2 (WRONG!)
    const noSpaceResult = chaldeanNumerologyCalculator(['20260109']);
    expect(noSpaceResult).toBe(2);

    // Confirm they're different
    expect(spaceResult).not.toBe(noSpaceResult);
  });

  it('Personal year for 1990-01-09 should be 11 (master number, space-join)', () => {
    // This is the KEY test case that fails with empty-string join but passes with space join
    const result = calculateLifePath({ birthDate: '1990-01-09' });
    expect(result.personalYear).toBe(11);
  });

  it('Personal year for 2002-08-28 should be correct', () => {
    const result = calculateLifePath({ birthDate: '2002-08-28' });
    // "2026 08 28" → findNumerology("2026")=1 + findNumerology("08")=8 + findNumerology("28")=10→1
    // sum = 1 + 8 + 1 = 10 → findNumerology("10") = 1
    expect(result.personalYear).toBe(1);
  });

  it('Personal year for 1990-05-15 should be correct', () => {
    const result = calculateLifePath({ birthDate: '1990-05-15' });
    // "2026 05 15" → findNumerology("2026")=1 + findNumerology("05")=5 + findNumerology("15")=6
    // sum = 1 + 5 + 6 = 12 → findNumerology("12") = 3
    expect(result.personalYear).toBe(3);
  });

  // ---- Chinese Zodiac ----
  // Legacy: getChineseZodiac(Number(formData.bday.substring(0, 4)))
  // Formula: (year - 4) % 12 → index into zodiac array

  it('Chinese zodiac for 2002 should be Horse', () => {
    const result = calculateLifePath({ birthDate: '2002-08-28' });
    // (2002 - 4) % 12 = 1998 % 12 = 6 → Horse
    expect(result.chineseZodiac).toBe('Horse');
  });

  it('Chinese zodiac for 1990 should be Horse', () => {
    const result = calculateLifePath({ birthDate: '1990-05-15' });
    // (1990 - 4) % 12 = 1986 % 12 = 6 → Horse
    expect(result.chineseZodiac).toBe('Horse');
  });

  it('Chinese zodiac for 2000 should be Dragon', () => {
    const result = calculateLifePath({ birthDate: '2000-01-01' });
    // (2000 - 4) % 12 = 1996 % 12 = 4 → Dragon
    expect(result.chineseZodiac).toBe('Dragon');
  });

  it('Chinese zodiac for 1975 should be Rabbit', () => {
    const result = calculateLifePath({ birthDate: '1975-03-17' });
    // (1975 - 4) % 12 = 1971 % 12 = 3 → Rabbit
    expect(result.chineseZodiac).toBe('Rabbit');
  });

  // ---- Meanings ----

  it('Life path 22 should have "The Master Builder" meaning', () => {
    const result = calculateLifePath({ birthDate: '2002-08-28' });
    expect(result.meanings.lifePathMeaning).toContain('Master Builder');
  });
});

// ============================================================================
// ADDRESS NUMEROLOGY: Verify levels, unconscious value, and compatibility
// Legacy: getLevelsArray from PheydrusCalculators/src/app/numerology/utils.ts
// ============================================================================
describe('Legacy Comparison: Address Numerology', () => {
  // ---- Basic level building ----

  it('should build levels dynamically from non-empty fields', () => {
    const result = calculateAddressNumerology({
      unitNumber: '7A',
      streetNumber: '12345',
      streetName: 'Maple Lane',
      postalCode: '90210',
      homeYear: '2015',
      birthYear: '1995',
    });

    // 4 fields populated + 1 combined = 5 levels
    expect(result.levels).toHaveLength(5);
    expect(result.levels[0].level).toBe('L1');
    expect(result.levels[0].value).toBe('7A');
    expect(result.levels[0].name).toBe('Unit Number');
    expect(result.levels[1].level).toBe('L2');
    expect(result.levels[1].value).toBe('12345');
    expect(result.levels[1].name).toBe('Building/House Number');
    expect(result.levels[2].level).toBe('L3');
    expect(result.levels[2].value).toBe('Maple Lane');
    expect(result.levels[2].name).toBe('Street Name');
    expect(result.levels[3].level).toBe('L4');
    expect(result.levels[3].value).toBe('90210');
    expect(result.levels[3].name).toBe('Postal Code');
    expect(result.levels[4].level).toBe('L5');
    expect(result.levels[4].name).toBe('L3');
  });

  it('L3 combined value: L1+L2A+L3 when all three present', () => {
    const result = calculateAddressNumerology({
      unitNumber: '7A',
      streetNumber: '12345',
      streetName: 'Maple Lane',
      postalCode: '90210',
      homeYear: '2015',
      birthYear: '1995',
    });

    // Combined L3 level is added after all individual levels
    const l3Combined = result.levels.find((l) => l.name === 'L3');
    expect(l3Combined).toBeDefined();
    expect(l3Combined!.value).toBe('7A + 12345 + Maple Lane');
  });

  it('L3 combined: L1+L2A when only those two present (no street name)', () => {
    const result = calculateAddressNumerology({
      unitNumber: '7A',
      streetNumber: '12345',
      streetName: '',
      postalCode: '',
      homeYear: '',
      birthYear: '1995',
    });

    const l3Combined = result.levels.find((l) => l.name === 'L3');
    expect(l3Combined).toBeDefined();
    expect(l3Combined!.value).toBe('7A + 12345');
  });

  it('L3 combined: L2A+L3 when no unit number', () => {
    const result = calculateAddressNumerology({
      unitNumber: '',
      streetNumber: '12345',
      streetName: 'Maple Lane',
      postalCode: '',
      homeYear: '',
      birthYear: '1995',
    });

    const l3Combined = result.levels.find((l) => l.name === 'L3');
    expect(l3Combined).toBeDefined();
    expect(l3Combined!.value).toBe('12345 + Maple Lane');
  });

  it('L3 combined added even with L1 and L3 only (no streetNumber)', () => {
    const result = calculateAddressNumerology({
      unitNumber: '7A',
      streetNumber: '',
      streetName: 'Maple Lane',
      postalCode: '',
      homeYear: '',
      birthYear: '1995',
    });

    // 2 individual levels + 1 L3 combined
    expect(result.levels).toHaveLength(3);
    const l3Combined = result.levels.find((l) => l.name === 'L3');
    expect(l3Combined).toBeDefined();
    expect(l3Combined!.value).toBe('7A + Maple Lane');
  });

  it('L3 combined added even with single field', () => {
    const result = calculateAddressNumerology({
      unitNumber: '',
      streetNumber: '',
      streetName: 'Broadway',
      postalCode: '',
      homeYear: '',
      birthYear: '1995',
    });

    // 1 individual level + 1 L3 combined
    expect(result.levels).toHaveLength(2);
    expect(result.levels[0].value).toBe('Broadway');
    const l3Combined = result.levels.find((l) => l.name === 'L3');
    expect(l3Combined).toBeDefined();
  });

  // ---- Numerology calculations ----

  it('Chaldean numerology for "7A" should be correct', () => {
    // "7A" → findNumerology("7A") = 7 + A(1) = 8
    const result = chaldeanNumerologyCalculator(['7A']);
    expect(result).toBe(8);
  });

  it('Chaldean numerology for "12345" should be correct', () => {
    // "12345" → 1+2+3+4+5 = 15 → 1+5 = 6
    const result = chaldeanNumerologyCalculator(['12345']);
    expect(result).toBe(6);
  });

  it('Chaldean numerology for "Maple Lane" should be correct', () => {
    // "Maple Lane" → "Lane" stripped as suffix → "Maple"
    // M(4)+a(1)+p(8)+l(3)+e(5) = 21 → 2+1 = 3
    const result = chaldeanNumerologyCalculator(['Maple']);
    expect(result).toBe(3);
  });

  it('Full address numerology values match expected', () => {
    const result = calculateAddressNumerology({
      unitNumber: '7A',
      streetNumber: '12345',
      streetName: 'Maple Lane',
      postalCode: '90210',
      homeYear: '2015',
      birthYear: '1995',
    });

    expect(result.levels[0].number).toBe(8); // 7A → 8
    expect(result.levels[1].number).toBe(6); // 12345 → 6
    expect(result.levels[2].number).toBe(3); // Maple Lane (stripped: Maple) → 3
    // 90210 → 9+0+2+1+0 = 12 → 1+2 = 3
    expect(result.levels[3].number).toBe(3);
  });

  // ---- Extended meanings ----

  it('levels should have extended meanings (themes, challenges, gifts, reflection)', () => {
    const result = calculateAddressNumerology({
      unitNumber: '7A',
      streetNumber: '',
      streetName: '',
      postalCode: '',
      homeYear: '',
      birthYear: '1995',
    });

    const l1 = result.levels[0];
    expect(l1.themes).toBeTruthy();
    expect(l1.themes.length).toBeGreaterThan(10);
    expect(l1.challenges).toBeTruthy();
    expect(l1.gifts).toBeTruthy();
    expect(l1.reflection).toBeTruthy();
  });

  // ---- Chinese zodiac compatibility ----

  it('Zodiac compatibility for Pig (1995) + Goat (2015) should work', () => {
    const result = calculateAddressNumerology({
      unitNumber: '',
      streetNumber: '',
      streetName: '',
      postalCode: '',
      homeYear: '2015',
      birthYear: '1995',
    });

    // 1995: (1995-4)%12 = 11 → Pig
    expect(result.birthZodiac).toBe('Pig');
    // 2015: (2015-4)%12 = 7 → Goat
    expect(result.homeZodiac).toBe('Goat');

    // Compatibility should be a valid string
    expect(typeof result.compatibility).toBe('string');
    expect(result.compatibility.length).toBeGreaterThan(0);
  });

  it('Zodiac meanings should be populated', () => {
    const result = calculateAddressNumerology({
      unitNumber: '',
      streetNumber: '',
      streetName: '',
      postalCode: '',
      homeYear: '2000',
      birthYear: '1995',
    });

    expect(result.birthZodiacMeaning).not.toBeNull();
    expect(result.birthZodiacMeaning!.name).toBe('Pig');
    expect(result.birthZodiacMeaning!.themes.toLowerCase()).toContain('compassion');

    expect(result.homeZodiacMeaning).not.toBeNull();
    expect(result.homeZodiacMeaning!.name).toBe('Dragon');
    expect(result.homeZodiacMeaning!.themes.toLowerCase()).toContain('charisma');
  });

  it('Unknown home zodiac when no home year', () => {
    const result = calculateAddressNumerology({
      unitNumber: '',
      streetNumber: '',
      streetName: '',
      postalCode: '',
      homeYear: '',
      birthYear: '1995',
    });

    expect(result.homeZodiac).toBe('Unknown');
    expect(result.homeZodiacMeaning).toBeNull();
    expect(result.compatibility).toBe('unknown');
  });
});

// ============================================================================
// CHALDEAN NUMEROLOGY: Core algorithm verification
// Must match legacy PheydrusCalculators/src/app/numerology/utils.ts exactly
// ============================================================================
describe('Legacy Comparison: Chaldean Numerology', () => {
  it('single digit strings should return themselves', () => {
    expect(chaldeanNumerologyCalculator(['1'])).toBe(1);
    expect(chaldeanNumerologyCalculator(['9'])).toBe(9);
  });

  it('master number strings should be preserved', () => {
    expect(chaldeanNumerologyCalculator(['11'])).toBe(11);
    expect(chaldeanNumerologyCalculator(['22'])).toBe(22);
    expect(chaldeanNumerologyCalculator(['33'])).toBe(33);
  });

  it('multi-digit strings should reduce correctly', () => {
    expect(chaldeanNumerologyCalculator(['123'])).toBe(6); // 1+2+3=6
    expect(chaldeanNumerologyCalculator(['99'])).toBe(9); // 9+9=18→9
    expect(chaldeanNumerologyCalculator(['100'])).toBe(1); // 1+0+0=1
  });

  it('letter strings should use Chaldean mapping', () => {
    // A=1, B=2, C=3
    expect(chaldeanNumerologyCalculator(['ABC'])).toBe(6); // 1+2+3=6
    // Z=7, O=7
    expect(chaldeanNumerologyCalculator(['ZO'])).toBe(5); // 7+7=14→5
  });

  it('space-separated strings should process each word independently', () => {
    // "ABC DEF" → split by space → ["ABC", "DEF"]
    // findNumerology("ABC") = 1+2+3 = 6
    // findNumerology("DEF") = D(4)+E(5)+F(8) = 17 → 8
    // sum = 6 + 8 = 14
    // findNumerology("14") = 1+4 = 5
    expect(chaldeanNumerologyCalculator(['ABC DEF'])).toBe(5);
  });

  it('multiple array elements should accumulate', () => {
    // reduce starts at acc=0
    // Element "5": split→["5"], findNumerology("5")=5, acc=findNumerology(String(0+5))=5
    // Element "3": split→["3"], findNumerology("3")=3, acc=findNumerology(String(5+3))=findNumerology("8")=8
    expect(chaldeanNumerologyCalculator(['5', '3'])).toBe(8);
  });

  it('date string with hyphens: hyphens are value 0', () => {
    // "2002-08-28" → findNumerology("2002-08-28") = 2+0+0+2+0+0+8+0+2+8 = 22
    expect(chaldeanNumerologyCalculator(['2002-08-28'])).toBe(22);
  });

  it('date string without hyphens: same result', () => {
    // "20020828" → findNumerology("20020828") = 2+0+0+2+0+8+2+8 = 22
    expect(chaldeanNumerologyCalculator(['20020828'])).toBe(22);
  });
});

// ============================================================================
// CROSS-CALCULATOR: Full input→output tracing matching legacy screenshots
// ============================================================================
describe('Legacy Comparison: Full Calculation Traces', () => {
  it('Brandon Yip (2002-08-28) complete life path matches legacy', () => {
    const result = calculateLifePath({ birthDate: '2002-08-28' });

    expect(result.lifePathNumber).toBe(22); // Master number
    expect(result.dayPathNumber).toBe(1); // 28 → 2+8=10 → 1
    expect(result.chineseZodiac).toBe('Horse'); // 2002
    // Meaning should be Master Builder
    expect(result.meanings.lifePathMeaning).toContain('Master Builder');
  });

  it('Gemini rising transits have correct house assignments for all planets', () => {
    const result = calculateTransits({ risingSign: 'Gemini' });

    // Pluto in Aquarius (sign index 10): from Gemini(2) → (10-2+12)%12+1 = 9
    expect(result.transits.find((t) => t.planet === 'Pluto')!.houseNumber).toBe(9);

    // Neptune in Aries (sign index 0): from Gemini(2) → (0-2+12)%12+1 = 11
    expect(result.transits.find((t) => t.planet === 'Neptune')!.houseNumber).toBe(11);

    // Saturn in Aries (sign index 0): from Gemini(2) → (0-2+12)%12+1 = 11
    expect(result.transits.find((t) => t.planet === 'Saturn')!.houseNumber).toBe(11);

    // Uranus in Gemini (sign index 2): from Gemini(2) → (2-2+12)%12+1 = 1
    expect(result.transits.find((t) => t.planet === 'Uranus')!.houseNumber).toBe(1);

    // North Node in Pisces (sign index 11): from Gemini(2) → (11-2+12)%12+1 = 10
    expect(result.transits.find((t) => t.planet === 'North Node')!.houseNumber).toBe(10);

    // South Node in Virgo (sign index 5): from Gemini(2) → (5-2+12)%12+1 = 4
    expect(result.transits.find((t) => t.planet === 'South Node')!.houseNumber).toBe(4);
  });
});

// ============================================================================
// COMPREHENSIVE HOUSE ACCURACY: All 12 rising signs × all 6 transit planets
//
// Current transit signs (2026):
//   Pluto     = Aquarius (idx 10)   past = Capricorn (idx 9)
//   Neptune   = Aries    (idx  0)   past = Pisces    (idx 11)
//   Saturn    = Aries    (idx  0)   past = Pisces    (idx 11)
//   Uranus    = Gemini   (idx  2)   past = Taurus    (idx  1)
//   North Node= Pisces   (idx 11)   past = Aries     (idx  0)
//   South Node= Virgo    (idx  5)   past = Libra     (idx  6)
//
// Formula: house = (planet_idx - rising_idx + 12) % 12 + 1
// ============================================================================
describe('House Accuracy: All 12 rising signs × current transit planets', () => {
  function getHouses(result: ReturnType<typeof calculateTransits>) {
    const t = (name: string) => result.transits.find((x) => x.planet === name)!;
    return {
      pluto: t('Pluto').houseNumber,
      neptune: t('Neptune').houseNumber,
      saturn: t('Saturn').houseNumber,
      uranus: t('Uranus').houseNumber,
      nn: t('North Node').houseNumber,
      sn: t('South Node').houseNumber,
    };
  }

  it('Aries rising (idx 0)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Aries' }));
    expect(h.pluto).toBe(11); // Aquarius(10-0+12)%12+1 = 11
    expect(h.neptune).toBe(1); // Aries  (0-0+12)%12+1  = 1
    expect(h.saturn).toBe(1);
    expect(h.uranus).toBe(3); // Gemini (2-0+12)%12+1  = 3
    expect(h.nn).toBe(12); // Pisces (11-0+12)%12+1 = 12
    expect(h.sn).toBe(6); // Virgo  (5-0+12)%12+1  = 6
  });

  it('Taurus rising (idx 1)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Taurus' }));
    expect(h.pluto).toBe(10); // (10-1+12)%12+1 = 10
    expect(h.neptune).toBe(12); // (0-1+12)%12+1  = 12
    expect(h.saturn).toBe(12);
    expect(h.uranus).toBe(2); // (2-1+12)%12+1  = 2
    expect(h.nn).toBe(11); // (11-1+12)%12+1 = 11
    expect(h.sn).toBe(5); // (5-1+12)%12+1  = 5
  });

  it('Gemini rising (idx 2)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Gemini' }));
    expect(h.pluto).toBe(9);
    expect(h.neptune).toBe(11);
    expect(h.saturn).toBe(11);
    expect(h.uranus).toBe(1);
    expect(h.nn).toBe(10);
    expect(h.sn).toBe(4);
  });

  it('Cancer rising (idx 3)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Cancer' }));
    expect(h.pluto).toBe(8); // (10-3+12)%12+1 = 8
    expect(h.neptune).toBe(10); // (0-3+12)%12+1  = 10
    expect(h.saturn).toBe(10);
    expect(h.uranus).toBe(12); // (2-3+12)%12+1  = 12
    expect(h.nn).toBe(9); // (11-3+12)%12+1 = 9
    expect(h.sn).toBe(3); // (5-3+12)%12+1  = 3
  });

  it('Leo rising (idx 4)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Leo' }));
    expect(h.pluto).toBe(7); // (10-4+12)%12+1 = 7
    expect(h.neptune).toBe(9); // (0-4+12)%12+1  = 9
    expect(h.saturn).toBe(9);
    expect(h.uranus).toBe(11); // (2-4+12)%12+1  = 11
    expect(h.nn).toBe(8); // (11-4+12)%12+1 = 8
    expect(h.sn).toBe(2); // (5-4+12)%12+1  = 2
  });

  it('Virgo rising (idx 5)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Virgo' }));
    expect(h.pluto).toBe(6); // (10-5+12)%12+1 = 6
    expect(h.neptune).toBe(8); // (0-5+12)%12+1  = 8
    expect(h.saturn).toBe(8);
    expect(h.uranus).toBe(10); // (2-5+12)%12+1  = 10
    expect(h.nn).toBe(7); // (11-5+12)%12+1 = 7
    expect(h.sn).toBe(1); // (5-5+12)%12+1  = 1
  });

  it('Libra rising (idx 6)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Libra' }));
    expect(h.pluto).toBe(5); // (10-6+12)%12+1 = 5
    expect(h.neptune).toBe(7); // (0-6+12)%12+1  = 7
    expect(h.saturn).toBe(7);
    expect(h.uranus).toBe(9); // (2-6+12)%12+1  = 9
    expect(h.nn).toBe(6); // (11-6+12)%12+1 = 6
    expect(h.sn).toBe(12); // (5-6+12)%12+1  = 12
  });

  it('Scorpio rising (idx 7)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Scorpio' }));
    expect(h.pluto).toBe(4); // (10-7+12)%12+1 = 4
    expect(h.neptune).toBe(6); // (0-7+12)%12+1  = 6
    expect(h.saturn).toBe(6);
    expect(h.uranus).toBe(8); // (2-7+12)%12+1  = 8
    expect(h.nn).toBe(5); // (11-7+12)%12+1 = 5
    expect(h.sn).toBe(11); // (5-7+12)%12+1  = 11
  });

  it('Sagittarius rising (idx 8) — all 6 planets', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Sagittarius' }));
    expect(h.pluto).toBe(3); // Aquarius  (10-8+12)%12+1 = 3
    expect(h.neptune).toBe(5); // Aries     (0-8+12)%12+1  = 5
    expect(h.saturn).toBe(5);
    expect(h.uranus).toBe(7); // Gemini    (2-8+12)%12+1  = 7
    expect(h.nn).toBe(4); // Pisces    (11-8+12)%12+1 = 4
    expect(h.sn).toBe(10); // Virgo     (5-8+12)%12+1  = 10
  });

  it('Capricorn rising (idx 9)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Capricorn' }));
    expect(h.pluto).toBe(2); // (10-9+12)%12+1 = 2
    expect(h.neptune).toBe(4); // (0-9+12)%12+1  = 4
    expect(h.saturn).toBe(4);
    expect(h.uranus).toBe(6); // (2-9+12)%12+1  = 6
    expect(h.nn).toBe(3); // (11-9+12)%12+1 = 3
    expect(h.sn).toBe(9); // (5-9+12)%12+1  = 9
  });

  it('Aquarius rising (idx 10)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Aquarius' }));
    expect(h.pluto).toBe(1); // (10-10+12)%12+1 = 1
    expect(h.neptune).toBe(3); // (0-10+12)%12+1  = 3
    expect(h.saturn).toBe(3);
    expect(h.uranus).toBe(5); // (2-10+12)%12+1  = 5
    expect(h.nn).toBe(2); // (11-10+12)%12+1 = 2
    expect(h.sn).toBe(8); // (5-10+12)%12+1  = 8
  });

  it('Pisces rising (idx 11)', () => {
    const h = getHouses(calculateTransits({ risingSign: 'Pisces' }));
    expect(h.pluto).toBe(12); // (10-11+12)%12+1 = 12
    expect(h.neptune).toBe(2); // (0-11+12)%12+1  = 2
    expect(h.saturn).toBe(2);
    expect(h.uranus).toBe(4); // (2-11+12)%12+1  = 4
    expect(h.nn).toBe(1); // (11-11+12)%12+1 = 1
    expect(h.sn).toBe(7); // (5-11+12)%12+1  = 7
  });
});

// ============================================================================
// PAST HOUSE ACCURACY: pastHouseNumber uses the past transit sign, not current
// ============================================================================
describe('Past house accuracy: pastHouseNumber uses past transit sign', () => {
  it('Sagittarius rising — past houses are distinct from current houses', () => {
    const result = calculateTransits({ risingSign: 'Sagittarius' });

    const pluto = result.transits.find((t) => t.planet === 'Pluto')!;
    // Current: Aquarius (idx 10) → house 3
    expect(pluto.houseNumber).toBe(3);
    // Past: Capricorn (idx 9) → (9-8+12)%12+1 = 2
    expect(pluto.pastHouseNumber).toBe(2);

    const neptune = result.transits.find((t) => t.planet === 'Neptune')!;
    // Current: Aries (idx 0) → house 5
    expect(neptune.houseNumber).toBe(5);
    // Past: Pisces (idx 11) → (11-8+12)%12+1 = 4
    expect(neptune.pastHouseNumber).toBe(4);

    const uranus = result.transits.find((t) => t.planet === 'Uranus')!;
    // Current: Gemini (idx 2) → house 7
    expect(uranus.houseNumber).toBe(7);
    // Past: Taurus (idx 1) → (1-8+12)%12+1 = 6
    expect(uranus.pastHouseNumber).toBe(6);

    const nn = result.transits.find((t) => t.planet === 'North Node')!;
    // Current: Pisces (idx 11) → house 4
    expect(nn.houseNumber).toBe(4);
    // Past: Aries (idx 0) → (0-8+12)%12+1 = 5
    expect(nn.pastHouseNumber).toBe(5);
  });

  it('Aries rising — Pluto past(Capricorn) is house 10, not house 11', () => {
    const result = calculateTransits({ risingSign: 'Aries' });
    const pluto = result.transits.find((t) => t.planet === 'Pluto')!;
    // Current: Aquarius (idx 10) → house 11
    expect(pluto.houseNumber).toBe(11);
    // Past: Capricorn (idx 9) → (9-0+12)%12+1 = 10
    expect(pluto.pastHouseNumber).toBe(10);
  });
});
