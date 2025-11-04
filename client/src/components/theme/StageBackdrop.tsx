// client/src/components/theme/StageBackdrop.tsx
'use client';

import { CSSProperties, Fragment } from 'react';
import { ThemeBand } from './themeBands';
import { cn } from '@/lib/utils';

type StageBackdropProps = {
  band: ThemeBand;
};

type ConfettiPreset = {
  left: number;
  top: number;
  dx: number;
  dy: number;
  delay: number;
  scale: number;
  hue: number;
};

type RibbonPreset = {
  top: string;
  left: string;
  width: string;
  height: string;
  rotate: number;
  gradient: string;
  duration: number;
  delay: number;
  blur?: number;
};

type BubblePreset = {
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

type StarPreset = {
  left: number;
  top: number;
  delay: number;
  scale: number;
};

const NOIR_CONFETTI: ConfettiPreset[] = Array.from({ length: 18 }).map((_, index) => {
  const base = index + 1;
  return {
    left: 6 + ((index * 11) % 88),
    top: 8 + ((index * 17) % 84),
    dx: (index % 2 === 0 ? 1 : -1) * (120 + (index % 5) * 48),
    dy: 160 + (index % 6) * 46,
    delay: -1.2 * (index % 7) - index * 0.08,
    scale: 0.65 + (base % 4) * 0.12,
    hue: 180 + (base * 13) % 120,
  };
});

const MIRAGE_RIBBONS: RibbonPreset[] = [
  {
    top: '12%',
    left: '-18%',
    width: '140%',
    height: '48%',
    rotate: -12,
    gradient: 'linear-gradient(135deg, rgba(252, 165, 165, 0.45), rgba(248, 113, 113, 0.1))',
    duration: 46,
    delay: -10,
    blur: 48,
  },
  {
    top: '58%',
    left: '-12%',
    width: '130%',
    height: '40%',
    rotate: -6,
    gradient: 'linear-gradient(120deg, rgba(251, 191, 36, 0.5), rgba(251, 113, 133, 0.18))',
    duration: 38,
    delay: -4,
    blur: 40,
  },
  {
    top: '24%',
    left: '-5%',
    width: '125%',
    height: '52%',
    rotate: 10,
    gradient: 'linear-gradient(120deg, rgba(129, 140, 248, 0.45), rgba(59, 130, 246, 0.18))',
    duration: 52,
    delay: -18,
    blur: 32,
  },
];

const MIRAGE_BUBBLES: BubblePreset[] = [
  { left: '15%', top: '18%', size: 140, delay: -4, duration: 24, opacity: 0.35 },
  { left: '72%', top: '26%', size: 180, delay: -8, duration: 26, opacity: 0.28 },
  { left: '42%', top: '62%', size: 160, delay: -12, duration: 29, opacity: 0.25 },
  { left: '82%', top: '68%', size: 220, delay: -6, duration: 32, opacity: 0.22 },
];

const ASCENSION_STARS: StarPreset[] = Array.from({ length: 26 }).map((_, index) => ({
  left: (index * 17) % 95,
  top: (index * 23) % 90,
  delay: -0.8 * (index % 7) - index * 0.05,
  scale: 0.6 + (index % 5) * 0.18,
}));

export default function StageBackdrop({ band }: StageBackdropProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'stage-backdrop pointer-events-none absolute inset-0 overflow-hidden',
        `stage-backdrop--${band}`
      )}
    >
      {band === 'noir' && <NoirBackdrop />}
      {band === 'mirage' && <MirageBackdrop />}
      {band === 'ascension' && <AscensionBackdrop />}
    </div>
  );
}

function NoirBackdrop() {
  return (
    <Fragment>
      <div className="stage-noir__base" />
      <div className="stage-noir__vignette" />
      <div className="stage-noir__confetti-layer">
        {NOIR_CONFETTI.map((item, index) => (
          <span
            key={index}
            className="stage-noir__confetti"
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              '--shift-x': `${item.dx}px`,
              '--shift-y': `${item.dy}px`,
              '--twirl': `${item.dx > 0 ? 220 : -220}deg`,
              '--delay': `${item.delay}s`,
              '--scale': item.scale.toFixed(3),
              '--scale-end': (item.scale * 0.85).toFixed(3),
              background: `linear-gradient(135deg, hsla(${item.hue}, 82%, 68%, 0.6), hsla(${item.hue + 24}, 88%, 52%, 0.18))`,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="stage-noir__scanline" />
    </Fragment>
  );
}

function MirageBackdrop() {
  return (
    <Fragment>
      <div className="stage-mirage__base" />
      <div className="stage-mirage__glow" />
      <div className="stage-mirage__ribbons">
        {MIRAGE_RIBBONS.map((ribbon, index) => (
          <span
            key={index}
            className="stage-mirage__ribbon"
            style={{
              top: ribbon.top,
              left: ribbon.left,
              width: ribbon.width,
              height: ribbon.height,
              '--rotate': `${ribbon.rotate}deg`,
              background: ribbon.gradient,
              animationDuration: `${ribbon.duration}s`,
              animationDelay: `${ribbon.delay}s`,
              filter: ribbon.blur ? `blur(${ribbon.blur}px)` : undefined,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="stage-mirage__bubbles">
        {MIRAGE_BUBBLES.map((bubble, index) => (
          <span
            key={index}
            className="stage-mirage__bubble"
            style={{
              left: bubble.left,
              top: bubble.top,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
              opacity: 0,
              '--bubble-opacity': bubble.opacity.toFixed(2),
            } as CSSProperties}
          />
        ))}
      </div>
    </Fragment>
  );
}

function AscensionBackdrop() {
  return (
    <Fragment>
      <div className="stage-ascension__base" />
      <div className="stage-ascension__nebula" />
      <div className="stage-ascension__grid" />
      <div className="stage-ascension__stars">
        {ASCENSION_STARS.map((star, index) => (
          <span
            key={index}
            className="stage-ascension__star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
              '--scale': star.scale.toFixed(3),
              '--scale-hover': (star.scale * 1.25).toFixed(3),
            } as CSSProperties}
          />
        ))}
      </div>
    </Fragment>
  );
}
