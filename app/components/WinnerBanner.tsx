'use client'

import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import type { Game } from '@/engine/types'
import { playerById } from '@/engine/engine'

export function WinnerBanner({ game }: { game: Game }): React.JSX.Element | null {
  if (!game.winner) return null
  const names = game.winner.playerIds
    .map(id => {
      try {
        return playerById(game, id).name
      } catch {
        return id
      }
    })
    .join(', ')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="p-4 rounded-lg border border-primary bg-surface-lowest flex items-center gap-3"
    >
      <Crown className="w-6 h-6 text-primary shrink-0" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Winner</p>
        <p className="text-lg font-bold text-primary capitalize">{game.winner.team}</p>
        <p className="text-sm text-secondary">{names}</p>
      </div>
    </motion.div>
  )
}
