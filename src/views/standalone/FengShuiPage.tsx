/**
 * Standalone Feng Shui Flying Star Calculator page at /feng-shui
 * Full port from PheydrusCalculators with Pheydrus light theme styling.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StandalonePageWrapper } from './StandalonePageWrapper';
import {
  currentYear,
  directions,
  elementNumberMap,
  loShuSquareByPeriod,
  period9,
} from '../../utils/fengshui/charts';
import { crystals, starThemes } from '../../utils/fengshui/constants';
import type { Star, YearSquares } from '../../utils/fengshui/types';
import { Element } from '../../utils/fengshui/types';
import {
  ElementExamples,
  generateFengShuiTemplate,
  getNourishingElement,
  getDrainingElement,
} from '../../utils/fengshui/utils';

const periods = ['period 9 (2024-2043)', 'period 8 (2004-2023)', 'period 7 (1984-2003)', 'custom'];

const defaultLoShuSquare: Star[][] = [
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1],
];
const defaultText: string[][] = [
  ['', '', ''],
  ['', '', ''],
  ['', '', ''],
];

// ── Shared style tokens ─────────────────────────────────────────────────────
const sectionClass = 'bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4';
const btnClass =
  'border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-medium text-[#2d2a3e] transition-colors';
const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-[#2d2a3e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40 focus:border-[#9a7d4e] transition-colors';

// ── CurrentElement sub-component ─────────────────────────────────────────────

function ColouredElement({ isAuspicious, element }: { isAuspicious: boolean; element: string }) {
  const borderColor =
    element === Element.fire
      ? 'border-yellow-200'
      : element === Element.earth
        ? 'border-orange-200'
        : element === Element.wood
          ? 'border-green-200'
          : element === Element.metal
            ? 'border-gray-300'
            : element === Element.water
              ? 'border-blue-200'
              : 'border-gray-200';

  return (
    <p className={`text-xs rounded-md p-1 m-auto text-[#2d2a3e] font-bold border ${borderColor}`}>
      {isAuspicious ? '--' : '++'} {element}
    </p>
  );
}

function CurrentElementDisplay({
  star,
  chart,
  goal,
}: {
  star: Star;
  chart: string;
  goal: boolean;
}) {
  const el = elementNumberMap[star];
  const nourish = getNourishingElement(el.element);
  const drain = getDrainingElement(el.element);

  const borderLeftColor =
    el.color === 'black'
      ? 'border-gray-400'
      : el.color === 'jade'
        ? 'border-green-400'
        : el.color === 'green'
          ? 'border-green-400'
          : el.color === 'yellow'
            ? 'border-yellow-400'
            : el.color === 'white'
              ? 'border-gray-200'
              : el.color === 'red'
                ? 'border-red-400'
                : el.color === 'purple'
                  ? 'border-purple-400'
                  : 'border-gray-200';

  return (
    <div className="flex flex-col">
      <p
        className={`uppercase font-light text-xs text-gray-400 p-0.5 rounded-lg ${
          goal ? 'font-medium text-[#2d2a3e] px-2 mr-auto bg-gray-200' : ''
        } ${!el.auspicious ? 'font-medium text-[#2d2a3e] bg-white px-2 mr-auto' : ''}`}
      >
        {goal && '\uD83C\uDFAF'} {!el.auspicious && '\u2757'} {chart}
      </p>
      <div
        className={`text-xs lg:p-4 rounded-md bg-opacity-20 grid grid-flow-col md:grid-cols-3 border-l-4 ${borderLeftColor}`}
      >
        <p className="px-1 flex text-gray-400 text-xs">
          {el.auspicious ? '\u2B50' : '\u2757'} {star} {el.elementIcon} {el.element} {el.color}
        </p>
        <ColouredElement element={nourish} isAuspicious={!el.auspicious} />
        <ColouredElement element={drain} isAuspicious={el.auspicious} />
      </div>
    </div>
  );
}

// ── Reference sections ───────────────────────────────────────────────────────

function ElementExampleBlock() {
  const elements = [
    { icon: 'Fire', key: 'fire' },
    { icon: 'Earth', key: 'earth' },
    { icon: 'Metal', key: 'metal' },
    { icon: 'Water', key: 'water' },
    { icon: 'Wood', key: 'wood' },
  ] as const;

  return (
    <div className={sectionClass}>
      <h2 className="text-lg font-bold text-[#2d2a3e]">Element Item Examples</h2>
      <div className="space-y-3">
        {elements.map(({ icon, key }) => (
          <div key={key}>
            <p className="font-bold text-[#4a4560] capitalize">{icon}</p>
            <p className="text-sm text-[#6b6188]">{ElementExamples[key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarThemesBlock() {
  return (
    <div className={sectionClass}>
      <h2 className="text-lg font-bold text-[#2d2a3e]">Star Themes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {starThemes.map((theme) => (
          <div key={theme.starId} className="pb-2">
            <p className="font-bold text-sm text-[#4a4560]">{theme.starId}</p>
            <ul className="list-disc pl-4">
              {theme.themes.map((t) => (
                <li className="text-sm text-[#6b6188]" key={t}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function CrystalsBlock() {
  return (
    <div className={sectionClass}>
      <h2 className="text-lg font-bold text-[#2d2a3e]">Crystals</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {crystals.map((c) => (
          <div key={c.element}>
            <p className="font-bold text-sm text-[#4a4560]">{c.element}</p>
            <p className="text-sm text-[#6b6188]">{c.examples.join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CuresBlock() {
  return (
    <div className={sectionClass}>
      <h2 className="text-lg font-bold text-[#2d2a3e]">Feng Shui Cures (Expert Notes)</h2>
      <div className="space-y-4 text-sm leading-relaxed">
        <div>
          <p className="font-bold text-[#4a4560]">Salt cure (for stubborn sha qi)</p>
          <p className="text-[#6b6188]">
            Use a glass or ceramic jar. Add one cup coarse sea salt, place six clean metal coins on
            top (imperial side up if available), then fill with water to just below the rim. Set the
            jar on a ceramic saucer in the afflicted sector, undisturbed. Do not cap it.
          </p>
          <p className="text-xs text-[#9a7d4e] mt-1">
            <a
              href="https://www.youtube.com/watch?v=l1y7KL-VPc0"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Salt cure tutorial (YouTube)
            </a>
          </p>
        </div>
        <div>
          <p className="font-bold text-[#4a4560]">Water element cure</p>
          <p className="text-[#6b6188]">
            Place mirrors, glass, actual water e.g. water bottle/jug of water. Water or ocean
            imagery. Blue items or fluid shapes.
          </p>
        </div>
        <div>
          <p className="font-bold text-[#4a4560]">Metal cure</p>
          <p className="text-[#6b6188]">
            Favor dense, heavy metal: solid brass, iron, or steel weights; a substantial bell or
            singing bowl; or a compact metal statue (no sharp edges). One anchored piece is stronger
            than many trinkets.
          </p>
        </div>
        <div>
          <p className="font-bold text-[#4a4560]">Fire cure</p>
          <p className="text-[#6b6188]">
            Lots of candles, a large light, or heat source is ideal. Lots of yellow/red/purple
            colours or triangular shapes.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Feng Shui Page ──────────────────────────────────────────────────────

export function FengShuiPage() {
  const [homeChart, setHomeChart] = useState<Star[][]>(defaultLoShuSquare);
  const [clientName, setClientName] = useState('');
  const [error, setError] = useState(false);
  const [customPeriod, setCustomPeriod] = useState(true);

  const [showPeriod, setShowPeriod] = useState(false);
  const [showYear, setShowYear] = useState(true);
  const [showHomePeriod, setShowHomePeriod] = useState(true);
  const [goals, setGoals] = useState<boolean[]>(Array(9).fill(false));
  const [currentYearSquare, setCurrentYearSquare] = useState<YearSquares>('2026');
  const [defaultValues, setDefaultValues] = useState<string[][]>(
    defaultText.map((row) => [...row])
  );

  const generateDefaultText = () => {
    const dv = defaultValues.map((row) => [...row]);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        dv[i][j] = generateFengShuiTemplate(homeChart[i][j], currentYear[currentYearSquare][i][j]);
      }
    }
    setDefaultValues(dv);
  };

  const onChangeGoals = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    const newGoals = [...goals];
    newGoals[index] = !newGoals[index];
    setGoals(newGoals);
  };

  const onChangeChartValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [i, j] = e.target.id.split(' ');
    const newChart = homeChart.map((row) => [...row]);
    newChart[parseInt(i)][parseInt(j)] = parseInt(e.target.value) as Star;
    setHomeChart(newChart);
  };

  const onSelectPeriod = (e: React.ChangeEvent<HTMLInputElement>) => {
    const periodIndex = e.target.value;
    if (periodIndex === 'periodIndex3') {
      setHomeChart(defaultLoShuSquare);
      setCustomPeriod(true);
    } else {
      setCustomPeriod(false);
      const period = parseInt(periodIndex.slice(-1));
      setHomeChart(loShuSquareByPeriod[period]);
    }
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  };

  return (
    <StandalonePageWrapper
      title="Flying Star Feng Shui"
      subtitle="Analyze your home's flying star chart with period and year comparisons"
    >
      <div className="space-y-8">
        {/* Intro */}
        <div className={sectionClass}>
          <h2 className="text-lg font-bold text-[#2d2a3e]">How to use this tool</h2>
          <div className="text-sm text-[#6b6188] space-y-2">
            <p>
              <strong>What is this page?</strong> This page compares your home&apos;s flying star
              chart with the current period and year charts.
            </p>
            <p>
              <strong>What you need:</strong> Your move-in date/period, your flying star chart, and
              optionally your floor plan.
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Select the year and period for your home</li>
              <li>Enter your home&apos;s flying star chart (or select a period preset)</li>
              <li>Mark your goals from the 9 stars</li>
              <li>Click &quot;Set default values&quot; to generate recommendations</li>
              <li>Customize notes for each area</li>
            </ol>
          </div>
        </div>

        {/* Client Name & Goals */}
        <div className={sectionClass}>
          <div>
            <label htmlFor="clientName" className="block text-sm font-semibold text-[#4a4560] mb-2">
              Client Name
            </label>
            <input
              type="text"
              id="clientName"
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                setError(false);
              }}
              className={inputClass}
              placeholder="Enter client name"
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">
                Please enter the client name before saving.
              </p>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-[#4a4560] mb-2">What are your goals?</p>
            <div className="grid grid-cols-3 gap-2">
              {Array.from(Array(9).keys()).map((_, index) => (
                <label
                  key={index}
                  className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    value={index + 1}
                    className="rounded"
                    onChange={onChangeGoals}
                  />
                  <span className="text-[#4a4560]">
                    ({index + 1}) {!elementNumberMap[(index + 1) as Star].auspicious && 'reduce '}
                    {elementNumberMap[(index + 1) as Star].theme}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Year & Period Selection */}
        <div className={sectionClass}>
          <h2 className="text-lg font-bold text-[#2d2a3e]">Flying Star Charts - Your Home</h2>

          <div>
            <p className="text-sm font-semibold text-[#4a4560] mb-2">
              What year do you want to create a chart for?
            </p>
            <div className="flex gap-3">
              {(Object.keys(currentYear) as YearSquares[]).map((year) => (
                <label
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg cursor-pointer text-sm"
                  key={year}
                >
                  <input
                    type="radio"
                    name="year"
                    value={year}
                    onChange={(e) => setCurrentYearSquare(e.target.value as YearSquares)}
                    defaultChecked={currentYearSquare === year}
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#4a4560] mb-2 pt-4">
              When did you move into your home?
            </p>
            <div className="flex flex-wrap gap-2">
              {periods.map((period, i) => (
                <label
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg cursor-pointer text-sm"
                  key={period}
                >
                  <input
                    type="radio"
                    name="periodIndex"
                    value={'periodIndex' + i}
                    onChange={onSelectPeriod}
                    defaultChecked={i === 3}
                  />
                  <span>{period}</span>
                </label>
              ))}
            </div>
          </div>

          {customPeriod && (
            <div>
              <p className="text-sm font-semibold text-[#4a4560] mb-2 pt-4">
                Add the period chart for your home
              </p>
              <div className="grid grid-cols-3 gap-1 w-fit">
                {directions.map((row, i) =>
                  row.map((cell, j) => (
                    <label className="relative" key={cell}>
                      <span className="absolute text-gray-400 text-xs pl-1 pt-1">{cell}</span>
                      <input
                        id={i + ' ' + j}
                        type="number"
                        min={1}
                        max={9}
                        onChange={onChangeChartValue}
                        className="text-center text-xl w-16 h-16 text-[#2d2a3e] rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#9a7d4e]/40"
                      />
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Chart Display */}
        <div className={sectionClass}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-[#2d2a3e]">Your Chart</h2>
            <button className={btnClass} onClick={generateDefaultText}>
              Set default values
            </button>
          </div>
          <p className="text-sm text-[#6b6188]">
            Here is the chart for your home move-in period and selected year.
          </p>

          <div className="flex flex-wrap gap-2">
            <button className={btnClass} onClick={() => setShowYear(!showYear)}>
              {showYear ? 'Hide' : 'Show'} current year ({currentYearSquare})
            </button>
            <button className={btnClass} onClick={() => setShowPeriod(!showPeriod)}>
              {showPeriod ? 'Hide' : 'Show'} current period (9)
            </button>
            <button className={btnClass} onClick={() => setShowHomePeriod(!showHomePeriod)}>
              {showHomePeriod ? 'Hide' : 'Show'} home chart
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {period9.map((row, i) =>
              row.map((_, j) => (
                <div key={`${i}-${j}`} className="p-4 space-y-3 border border-gray-200 rounded-lg">
                  <div className="flex gap-2 items-center">
                    <span className="text-lg font-bold text-[#2d2a3e]">{directions[i][j]}</span>
                    <input className={inputClass} type="text" placeholder="room name" />
                  </div>

                  {showPeriod && (
                    <CurrentElementDisplay
                      goal={goals[period9[i][j]]}
                      chart="current period (9)"
                      star={period9[i][j]}
                    />
                  )}
                  {showYear && (
                    <CurrentElementDisplay
                      goal={goals[currentYear[currentYearSquare][i][j]]}
                      chart={`current year ${currentYearSquare}`}
                      star={currentYear[currentYearSquare][i][j]}
                    />
                  )}
                  {showHomePeriod && (
                    <CurrentElementDisplay
                      goal={goals[homeChart[i][j]]}
                      chart="home"
                      star={homeChart[i][j]}
                    />
                  )}

                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    placeholder="notes"
                    value={defaultValues[i][j]}
                    onInput={handleTextareaInput}
                    onChange={(e) => {
                      const newValues = defaultValues.map((r) => [...r]);
                      newValues[i][j] = e.target.value;
                      setDefaultValues(newValues);
                    }}
                    style={{ overflow: 'hidden' }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reference Sections */}
        <ElementExampleBlock />
        <StarThemesBlock />
        <CrystalsBlock />
        <CuresBlock />

        {/* Link to Numerology */}
        <div className={sectionClass}>
          <p className="text-sm text-[#6b6188]">
            Want to add numerology to your analysis?{' '}
            <Link to="/numerology/aw" className="text-[#9a7d4e] underline font-medium">
              Open Advanced Numerology
            </Link>
          </p>
        </div>

        {/* Print / Save */}
        <div className={sectionClass}>
          <p className="text-sm text-[#6b6188]">
            When you&apos;re happy with your design, print as a PDF.
          </p>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-[#9a7d4e] hover:bg-[#b8944a] text-white font-bold rounded-xl transition-colors"
          >
            Save Design (Print)
          </button>
        </div>
      </div>
    </StandalonePageWrapper>
  );
}
