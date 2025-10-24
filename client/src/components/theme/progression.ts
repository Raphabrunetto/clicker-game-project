// client/src/components/theme/progression.ts

export type StageKey =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'emerald'
  | 'sapphire'
  | 'ruby'
  | 'amethyst'
  | 'obsidian'
  | 'neon';

export interface StageDef {
  key: StageKey;
  name: string;
  threshold: number; // currency required to reach this stage
}

// Ordered ascending by threshold
export const STAGES: StageDef[] = [
  { key: 'bronze', name: 'Bronze Beginnings', threshold: 0 },
  { key: 'silver', name: 'Silver Steps', threshold: 100 },
  { key: 'gold', name: 'Golden Groove', threshold: 1_000 },
  { key: 'emerald', name: 'Emerald Energy', threshold: 5_000 },
  { key: 'sapphire', name: 'Sapphire Surge', threshold: 10_000 },
  { key: 'ruby', name: 'Ruby Rush', threshold: 50_000 },
  { key: 'amethyst', name: 'Amethyst Arc', threshold: 100_000 },
  { key: 'obsidian', name: 'Obsidian Overdrive', threshold: 500_000 },
  { key: 'neon', name: 'Neon Nexus', threshold: 1_000_000 },
];

export function getStageForCurrency(amount: number): StageDef {
  // amount is safe as number up to 1e12 here
  let current = STAGES[0];
  for (const s of STAGES) {
    if (amount >= s.threshold) current = s; else break;
  }
  return current;
}

export function getNextStage(current: StageDef): StageDef | null {
  const idx = STAGES.findIndex((s) => s.key === current.key);
  return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
}

