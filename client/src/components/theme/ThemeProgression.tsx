// client/src/components/theme/ThemeProgression.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getStageForCurrency, StageDef } from './progression';

/**
 * Applies a `[data-tier]` attribute to the document body according to currency.
 * Also triggers a brief transition class when the tier changes.
 */
export default function ThemeProgression() {
  const currencyBig = useGameStore((s) => s.currency);
  const currency = Number(currencyBig); // safe in our ranges
  const prevTier = useRef<string | null>(null);

  useEffect(() => {
    const stage: StageDef = getStageForCurrency(currency);
    const body = document.body;
    const currentTier = stage.key;

    // Apply data attribute and utility class
    body.dataset.tier = currentTier;
    body.classList.add(`tier-${currentTier}`);

    // Remove all other tier-* classes to avoid specificity issues
    for (const cls of Array.from(body.classList)) {
      if (cls.startsWith('tier-') && cls !== `tier-${currentTier}`) {
        body.classList.remove(cls);
      }
    }

    // Trigger small burst animation when tier changes
    if (prevTier.current && prevTier.current !== currentTier) {
      body.classList.add('tier-burst');
      window.setTimeout(() => body.classList.remove('tier-burst'), 800);
    }
    prevTier.current = currentTier;

  }, [currency]);

  return null;
}
