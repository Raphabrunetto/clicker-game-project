// client/src/components/theme/themeBands.ts
export type ThemeBand = 'noir' | 'mirage' | 'ascension';

type ThemeBandMeta = {
  id: ThemeBand;
  label: string;
  min: number;
  description: string;
};

export const THEME_BANDS: ThemeBandMeta[] = [
  {
    id: 'noir',
    label: 'Noir Parade',
    min: 0,
    description: 'Base escura com confettis desfocados rodopiando ao fundo.',
  },
  {
    id: 'mirage',
    label: 'Chromatic Mirage',
    min: 10_000,
    description: 'Paleta vibrantemente quente com fitas fluidas e reflexos suaves.',
  },
  {
    id: 'ascension',
    label: 'Ascension Flux',
    min: 50_000,
    description: 'Céu espacial com grade neon e estrelas cintilantes.',
  },
];

export function getThemeBand(amount: number): ThemeBand {
  if (amount >= 50_000) return 'ascension';
  if (amount >= 10_000) return 'mirage';
  return 'noir';
}

