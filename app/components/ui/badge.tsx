import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase',
  {
    variants: {
      variant: {
        default: 'bg-surface-highest text-secondary',
        outline: 'border border-outline-variant text-secondary',
        village: 'bg-team-village/10 text-team-village',
        werewolf: 'bg-team-werewolf/10 text-team-werewolf',
        neutral: 'bg-team-neutral/10 text-team-neutral',
        special: 'bg-team-special/10 text-team-special',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
