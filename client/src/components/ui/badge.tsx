// client/src/components/ui/badge.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/90 text-primary-foreground shadow',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border/60 bg-transparent text-foreground/80 shadow-[0_0_8px_rgba(255,255,255,0.12)]',
        glow: 'border-transparent bg-gradient-to-r from-emerald-500/80 via-sky-500/80 to-indigo-500/80 text-white shadow-[0_0_18px_rgba(59,130,246,0.35)]',
        subtle: 'border-white/10 bg-white/5 text-white/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
