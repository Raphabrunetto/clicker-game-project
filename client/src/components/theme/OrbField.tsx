// client/src/components/theme/OrbField.tsx
'use client';

import { cn } from '@/lib/utils';

const ORB_CONFIG = [
  { size: 240, duration: 28, blur: 80, opacity: 0.45 },
  { size: 320, duration: 36, blur: 120, opacity: 0.35 },
  { size: 180, duration: 22, blur: 60, opacity: 0.55 },
  { size: 280, duration: 32, blur: 90, opacity: 0.4 },
  { size: 200, duration: 26, blur: 70, opacity: 0.5 },
  { size: 260, duration: 34, blur: 110, opacity: 0.38 },
];

export default function OrbField() {
  return (
    <div aria-hidden className="orb-field pointer-events-none absolute inset-0 overflow-hidden">
      {ORB_CONFIG.map((orb, index) => {
        const left = 15 + (index * 13) % 70;
        const top = 10 + (index * 17) % 70;
        const delay = index * -4;
        return (
          <span
            key={index}
            className={cn(
              'orb',
              index % 2 === 0 ? 'orb--emerald' : 'orb--violet',
              index % 3 === 0 && 'orb--amber'
            )}
            style={{
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              left: `${left}%`,
              top: `${top}%`,
              filter: `blur(${orb.blur}px)`,
              opacity: orb.opacity,
              animationDuration: `${orb.duration}s, ${orb.duration * 1.6}s`,
              animationDelay: `${delay}s, ${delay / 2}s`,
            }}
          />
        );
      })}
    </div>
  );
}
