import type { AstrocartographyResult, AstrocartographyLine } from '../../models';
import { ResultSection } from './ResultSection';

interface AstrocartographyResultsProps {
  result: AstrocartographyResult | null;
}

const PLANET_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Sun: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Moon: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
  Venus: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  Jupiter: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
};

const ANGLE_LABEL: Record<string, string> = {
  ASC: 'Ascendant (ASC)',
  DSC: 'Descendant (DSC)',
  MC: 'Midheaven (MC)',
  IC: 'Imum Coeli (IC)',
};

const ANGLE_DESC: Record<string, string> = {
  ASC: 'Identity & how others see you',
  DSC: 'Partnerships & open enemies',
  MC: 'Career, status & public image',
  IC: 'Home, roots & private life',
};


function PlanetSection({ line }: { line: AstrocartographyLine }) {
  const colors = PLANET_COLORS[line.planet] ?? {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-slate-200',
  };

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${colors.text}`}>
          {ANGLE_LABEL[line.angle] ?? line.angle}
        </span>
        <span className="text-xs text-gray-400">{ANGLE_DESC[line.angle]}</span>
      </div>
      <ul className="space-y-1">
        {line.points.map((pt, i) => (
          <li key={i} className="flex items-center justify-between text-xs gap-2">
            <span className="text-[#2d2a3e] font-medium">{pt.locationName}</span>
            <span className="text-gray-400 font-mono shrink-0">{pt.orb.toFixed(1)}° orb</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AstrocartographyResults({ result }: AstrocartographyResultsProps) {
  if (!result) {
    return (
      <ResultSection title="Astrocartography Lines" defaultOpen={true}>
        <p className="text-gray-400">No results yet</p>
      </ResultSection>
    );
  }

  if (result.lines.length === 0) {
    return (
      <ResultSection title="Astrocartography Lines" defaultOpen={true}>
        <p className="text-gray-400 text-center py-4">No lines found</p>
      </ResultSection>
    );
  }

  // Group lines by planet
  const byPlanet: Record<string, AstrocartographyLine[]> = {};
  for (const line of result.lines) {
    if (!byPlanet[line.planet]) byPlanet[line.planet] = [];
    byPlanet[line.planet].push(line);
  }

  return (
    <ResultSection title="Astrocartography Lines" defaultOpen={true}>
      <p className="text-sm text-gray-400 mb-5">
        Cities within 5° orb where each benefic planet is angular. Sorted by tightest orb.
      </p>

      <div className="space-y-6">
        {Object.entries(byPlanet).map(([planet, lines]) => {
          const colors = PLANET_COLORS[planet] ?? {
            bg: 'bg-slate-50',
            text: 'text-slate-800',
            border: 'border-slate-200',
          };
          return (
            <div key={planet}>
              <h3 className={`text-base font-bold mb-3 ${colors.text}`}>{planet}</h3>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <PlanetSection key={i} line={line} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ResultSection>
  );
}

export default AstrocartographyResults;
