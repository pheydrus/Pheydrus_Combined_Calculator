import { elementNumberMap, elementRelationship } from './charts';
import type { Star } from './types';
import { Element } from './types';

export const getNourishingElement = (curentElement: Element): Element => {
  const index = elementRelationship.indexOf(curentElement);
  return elementRelationship[getCircularIndex(index - 1)];
};

export const getDrainingElement = (curentElement: Element): Element => {
  const index = elementRelationship.indexOf(curentElement);
  return elementRelationship[getCircularIndex(index + 1)];
};

const getCircularIndex = (index: number) => {
  if (index < 0) {
    return (elementRelationship.length + index) % elementRelationship.length;
  }
  return index % elementRelationship.length;
};

export const generateFengShuiTemplate = (starHome: Star, starCurrentYear: Star) => {
  const elHome = elementNumberMap[starHome];
  const nourishHome = getNourishingElement(elHome.element);
  const drainHome = getDrainingElement(elHome.element);

  const elCurrentYear = elementNumberMap[starCurrentYear];
  const nourishCurrentYear = getNourishingElement(elCurrentYear.element);
  const drainCurrentYear = getDrainingElement(elCurrentYear.element);

  let textresponse = getAuspiciousnessLevel(elHome.auspicious, elCurrentYear.auspicious);
  textresponse += `\n\nStars:\n - [HOME] ${starHome} | ${elHome.element} - ${elHome.theme}\n - [YEAR] ${starCurrentYear} | ${elCurrentYear.element} - ${elCurrentYear.theme}.`;
  textresponse += '\n\nIn this area:\n';
  textresponse +=
    '\n' + shouldAddSaltCure(elHome, elCurrentYear, drainHome, drainCurrentYear) + '.';
  textresponse +=
    '\n' +
    reccomendElements(
      elHome,
      nourishHome,
      drainHome,
      elCurrentYear,
      nourishCurrentYear,
      drainCurrentYear
    ) +
    '.';
  return textresponse;
};

export const reccomendElements = (
  elHome: { element: Element; auspicious: boolean },
  nourishHome: Element,
  drainHome: Element,
  elCurrentYear: { element: Element; auspicious: boolean },
  nourishCurrentYear: Element,
  drainCurrentYear: Element
): string => {
  const homeels = [
    elHome.auspicious ? 'add ' + elHome.element : 'remove ' + elHome.element,
    (elHome.auspicious ? 'add ' : 'remove ') + nourishHome,
    (elHome.auspicious ? 'remove ' : 'add ') + drainHome,
  ];
  const currentYearels = [
    elCurrentYear.auspicious ? 'add ' + elCurrentYear.element : 'remove ' + elCurrentYear.element,
    (elCurrentYear.auspicious ? 'add ' : 'remove ') + nourishCurrentYear,
    (elCurrentYear.auspicious ? 'remove ' : 'add ') + drainCurrentYear,
  ];
  const allElements = [...homeels, ...currentYearels];
  const uniqueElements = Array.from(new Set(allElements));

  const textresponse = uniqueElements.map((el) => {
    const currEl = el.split(' ')[1].trim();
    const elExamples = shortElementsExamples[currEl as keyof typeof shortElementsExamples]
      ? ` (${shortElementsExamples[currEl as keyof typeof shortElementsExamples]})`
      : '';

    if (el.includes('remove')) {
      const idx = uniqueElements.findIndex((e) => e === 'add ' + currEl);
      if (idx !== -1) {
        return '\n remove ' + currEl + ' ' + elExamples;
      }
      return '\n ' + el + ' ' + elExamples;
    } else if (el.includes('add')) {
      const idx = uniqueElements.findIndex((e) => e === 'remove ' + currEl);
      if (idx !== -1) {
        return '\n remove ' + currEl + ' ' + elExamples;
      }
      return '\n ' + el + ' ' + elExamples;
    }
    return '\n ' + el + ' ' + elExamples;
  });

  return '\n' + Array.from(new Set(textresponse)).join(' . ');
};

const shouldAddSaltCure = (
  elHome: { element: Element; auspicious: boolean },
  elCurrentYear: { element: Element; auspicious: boolean },
  drainHome: Element,
  drainCurrentYear: Element
): string => {
  if (elHome.auspicious && elCurrentYear.auspicious) {
    return '';
  }
  if (!elHome.auspicious) {
    if (drainHome === Element.water) {
      return 'NO salt cure here.\n';
    }
  }
  if (!elCurrentYear.auspicious) {
    if (drainCurrentYear === Element.water) {
      return 'NO salt cure here.\n';
    }
  }
  if (drainHome === Element.water || drainCurrentYear === Element.water) {
    return 'NO salt cure here.\n';
  }
  return 'ADD a salt cure here.\n';
};

const getAuspiciousnessLevel = (auspiciousness1: boolean, auspiciousness2: boolean): string => {
  if (auspiciousness1 && auspiciousness2) {
    return 'This is one of the best areas of your home.\nAdd astrocartography here for the locations & themes related to the two stars of this corner.';
  } else if (!auspiciousness1 && !auspiciousness2) {
    return 'This is one of the worst areas of your home. Spend less time here.';
  } else {
    return 'This is a mixed area of your home.';
  }
};

export const ElementExamples: Record<string, string> = {
  fire: 'Candles, fireplaces, lamps, lighting (especially bright or warm), incense burners, triangle-shaped decor, triangle motifs in art or textiles, animal prints, red cushions, red rugs, red throws, sun symbols, phoenix imagery, active electronics (TVs, toasters, hairdryers).',
  earth:
    'Clay pottery, ceramic tiles, ceramic bowls, bricks, stone surfaces, marble countertops, crystals (amethyst, citrine, rose quartz), terra-cotta planters, beige or earth-tone rugs, square coffee tables, low wide furniture (ottomans, sideboards), salt lamps.',
  metal:
    'Metal picture frames, metal bowls, stainless steel appliances, silver sculptures, gold sculptures, round mirrors, wind chimes, quartz stones, white stones, metallic art, metallic wallpaper, bells, clocks, tools, white linens, smooth surfaces and finishes.',
  water:
    'Mirrors, glass tables, glass vases, aquariums, fish tanks, water fountains, wavy-patterned fabric, wavy art, navy curtains, navy rugs, ocean artwork, lake imagery, rain imagery, deep blue cushions, abstract or asymmetrical decor forms.',
  wood: 'Wooden tables, chairs, shelves, potted plants, trees, herbs, wicker furniture, rattan furniture, botanical wallpaper, botanical artwork, books, vertical stripes, tall decor pieces, fresh flowers in vases, essential oil diffusers, bamboo blinds.',
};

const shortElementsExamples = {
  fire: 'candles, lighting elements, electronics, triangle, animals.',
  earth: 'clay, pottery, ceramic tiles, stone surfaces, marble, earth colours, salt lamps.',
  metal: 'metal picture frames, metal bowls, steel, silver, gold, wind chimes.',
  water: 'mirrors, glass, water fountains, wavy-patterns, ocean artwork, blue.',
  wood: 'plants, wood, books, vertical stripes, botanical artwork.',
};
