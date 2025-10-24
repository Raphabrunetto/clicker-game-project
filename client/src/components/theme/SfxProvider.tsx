// client/src/components/theme/SfxProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { initMutedFromStorage, getSfx } from '@/lib/sfx';

export default function SfxProvider() {
  const bound = useRef(false);

  useEffect(() => {
    initMutedFromStorage();

    const bindOnce = () => {
      if (bound.current) return;
      bound.current = true;
      const sfx = getSfx();
      // Attempt resume on first gesture
      sfx.resume().catch(() => {});
      window.removeEventListener('pointerdown', bindOnce);
      window.removeEventListener('keydown', bindOnce);
    };

    window.addEventListener('pointerdown', bindOnce, { passive: true });
    window.addEventListener('keydown', bindOnce, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', bindOnce);
      window.removeEventListener('keydown', bindOnce);
    };
  }, []);

  return null;
}

