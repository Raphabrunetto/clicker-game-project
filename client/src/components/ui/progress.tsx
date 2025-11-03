// client/src/components/ui/progress.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/10',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 flex origin-left rounded-full bg-[linear-gradient(135deg,#34d399,#38bdf8,#6366f1)] shadow-[0_0_20px_rgba(56,189,248,0.45)] transition-[width] duration-500',
            'after:absolute after:inset-0 after:animate-[pulse_2s_ease-in-out_infinite] after:rounded-full after:bg-white/20',
            indicatorClassName
          )}
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
          }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
