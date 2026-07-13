import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Team } from '@/engine/types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export const TEAM_COLOR_VAR: Record<Team, string> = {
  village: 'var(--team-village)',
  werewolf: 'var(--team-werewolf)',
  neutral: 'var(--team-neutral)',
  special: 'var(--team-special)',
}

export const TEAM_BADGE_VARIANT: Record<Team, 'village' | 'werewolf' | 'neutral' | 'special'> = {
  village: 'village',
  werewolf: 'werewolf',
  neutral: 'neutral',
  special: 'special',
}
