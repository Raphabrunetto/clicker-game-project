// client/src/components/theme/ModeToggle.tsx
'use client';

import * as React from 'react';
import { Check, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ThemeMode, useThemeMode } from './ThemeProvider';

export function ModeToggle() {
  const { setTheme, theme, resolvedTheme } = useThemeMode();
  const items: { label: string; value: ThemeMode }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  const isActive = (value: ThemeMode) => {
    if (value === 'system') return theme === 'system';
    if (theme === 'system') return resolvedTheme === value;
    return theme === value;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              'flex items-center justify-between gap-4',
              isActive(option.value) && 'text-emerald-300'
            )}
          >
            {option.label}
            <Check
              className={cn(
                'h-4 w-4 opacity-0 transition-opacity',
                isActive(option.value) && 'opacity-100'
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
