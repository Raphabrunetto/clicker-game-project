// client/src/components/ui/separator.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SeparatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  decorative?: boolean;
}

export function Separator({
  className,
  decorative = true,
  role,
  ...props
}: SeparatorProps) {
  return (
    <div
      role={decorative ? 'none' : role ?? 'separator'}
      aria-orientation="horizontal"
      className={cn(
        'shrink-0 border border-white/5 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60',
        className
      )}
      {...props}
    />
  );
}
