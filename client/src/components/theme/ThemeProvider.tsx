// client/src/components/theme/ThemeProvider.tsx
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'clicker:theme';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    defaultTheme === 'dark' ? 'dark' : 'light'
  );
  const [mounted, setMounted] = useState(false);

  const computeResolved = useCallback(
    (mode: ThemeMode): 'light' | 'dark' => {
      if (mode === 'system') {
        if (typeof window !== 'undefined') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
        }
        return 'light';
      }
      return mode;
    },
    []
  );

  const applyThemeClass = useCallback(
    (mode: ThemeMode) => {
      if (typeof document === 'undefined') return;
      const next = computeResolved(mode);
      setResolvedTheme(next);
      const root = document.documentElement;
      if (next === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    },
    [computeResolved]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial = stored ?? defaultTheme;
    setThemeState(initial);
    applyThemeClass(initial);
    setMounted(true);
  }, [defaultTheme, applyThemeClass]);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
    applyThemeClass(theme);
    if (theme !== 'system' || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeClass('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme, mounted, applyThemeClass]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (mode: ThemeMode) => setThemeState(mode),
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return ctx;
}
