// client/src/components/theme/StageHUD.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getNextStage, getStageForCurrency } from './progression';
import { cn } from '@/lib/utils';
import { useSfx } from '@/lib/sfx';

export default function StageHUD() {
  const currencyBig = useGameStore((s) => s.currency);
  const currency = Number(currencyBig);

  const stage = useMemo(() => getStageForCurrency(currency), [currency]);
  const nextStage = getNextStage(stage);
  const prevKey = useRef(stage.key);
  const [popped, setPopped] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; dx: number; dy: number; rot: number; color: string }[]>([]);
  const sfx = useSfx();

  useEffect(() => {
    if (prevKey.current !== stage.key) {
      setPopped(true);
      setTimeout(() => setPopped(false), 180);

      // Confetti burst near top center
      const colors = ['#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7'];
      const pieces = Array.from({ length: 18 }).map((_, i) => ({
        id: Date.now() + i,
        dx: Math.round((Math.random() - 0.5) * 220),
        dy: -Math.round(80 + Math.random() * 140),
        rot: Math.round(180 + Math.random() * 360),
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setConfetti(pieces);
      setTimeout(() => setConfetti([]), 1200);

      // Play stage up jingle on every stage change
      sfx.stageUp();

      prevKey.current = stage.key;
    }
  }, [stage.key, sfx]);

  const progress = useMemo(() => {
    if (!nextStage) return 1;
    const range = nextStage.threshold - stage.threshold;
    const pos = Math.max(0, Math.min(range, currency - stage.threshold));
    return range > 0 ? pos / range : 0;
  }, [currency, nextStage, stage.threshold]);


  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[60] -translate-x-1/2 w-[min(92vw,920px)]">
      <div className={cn('relative rounded-xl border border-white/10 bg-black/30 px-4 py-3 shadow-lg backdrop-blur-md', popped && 'anim-pop anim-glow')}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-primary shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
            <div className="text-sm opacity-80">Stage</div>
            <div className="text-base font-semibold">{stage.name}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs opacity-70">
              {nextStage ? `${currency.toLocaleString()} / ${nextStage.threshold.toLocaleString()} coins` : `${currency.toLocaleString()} / MAX`}
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); sfx.toggleMute(); }}
              className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/30 text-sm hover:bg-white/10"
              title={sfx.muted ? 'Ativar som' : 'Silenciar som'}
            >
              {sfx.muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="shimmer-bar h-full w-0 rounded-full"
            style={{ width: `${Math.max(0.02, progress) * 100}%` }}
          />
        </div>

        {/* Confetti overlay */}
        <div className="pointer-events-none absolute inset-0 overflow-visible">
          {confetti.map((p) => (
            <span
              key={p.id}
              className="confetti-piece"
              style={{
                left: '50%',
                top: '0%',
                background: p.color,
                ['--dx' as any]: `${p.dx}px`,
                ['--dy' as any]: `${p.dy}px`,
                ['--rot' as any]: `${p.rot}deg`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
