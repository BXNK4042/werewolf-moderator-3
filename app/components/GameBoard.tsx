'use client'

import { motion } from 'framer-motion'
import { Moon, Sun, Play, RefreshCw } from 'lucide-react'
import type { Game } from '@/engine/types'
import { Button } from './ui/button'
import { PlayerCard } from './PlayerCard'
import { LogPanel } from './LogPanel'
import { WinnerBanner } from './WinnerBanner'
import { PromptPanel, type Pending } from './PromptPanel'
import { cn } from '@/lib/utils'

export function GameBoard({
  game,
  pending,
  multiSel,
  onPick,
  onToggle,
  onConfirm,
  onSkip,
  onAdvance,
  onNewGame,
}: {
  game: Game
  pending: Pending | null
  multiSel: string[]
  onPick: (id: string) => void
  onToggle: (id: string) => void
  onConfirm: () => void
  onSkip: () => void
  onAdvance: () => void
  onNewGame: () => void
}): React.JSX.Element {
  const isNight = game.phase === 'night' || (game.phase === 'day' && false)
  const advanceLabel =
    game.phase === 'setup'
      ? 'Start Game'
      : game.phase === 'night'
        ? 'Resolve Night'
        : game.phase === 'day'
          ? 'Resolve Day'
          : 'New Game'
  const AdvanceIcon = game.phase === 'night' ? Moon : game.phase === 'day' ? Sun : Play

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-outline-variant max-w-[600px] mx-auto">
        <div className="flex items-center px-page h-touch">
          <h1 className="text-xl font-semibold text-primary">Werewolf Moderator</h1>
        </div>
        <div className="px-page pb-3">
          <div className="flex justify-between items-end pb-1">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-60">
              Current Phase
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-60 capitalize">
              {game.phase === 'ended' ? 'Final' : `Round ${game.round}`}
            </span>
          </div>
          <div className="text-xl font-bold tracking-tight capitalize">
            Round {game.round} · {game.phase}
          </div>
          <div
            className={cn('h-[2px] w-full mt-2 opacity-30')}
            style={{ background: game.phase === 'night' ? 'var(--accent-blue)' : 'var(--team-werewolf)' }}
          />
        </div>
      </header>

      <main className="pt-[140px] px-page pb-32 max-w-[600px] mx-auto min-h-screen">
        {game.phase === 'ended' && (
          <div className="mb-section">
            <WinnerBanner game={game} />
          </div>
        )}

        <section className="mb-section">
          <div className="flex items-center gap-2 mb-element opacity-60">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Players ({game.players.filter(p => p.alive).length}/{game.players.length})
            </span>
            <div className="h-px flex-grow bg-outline-variant" />
          </div>
          <motion.div layout className="space-y-3">
            {game.players.map(p => (
              <PlayerCard key={p.id} player={p} game={game} />
            ))}
          </motion.div>
        </section>

        <LogPanel game={game} />
      </main>

      <PromptPanel
        game={game}
        pending={pending}
        multiSel={multiSel}
        onPick={onPick}
        onToggle={onToggle}
        onConfirm={onConfirm}
        onSkip={onSkip}
      />

      {!pending && game.phase !== 'ended' && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-outline-variant p-4 max-w-[600px] mx-auto">
          <Button onClick={onAdvance} className="w-full h-touch">
            <AdvanceIcon className="w-5 h-5" />
            {advanceLabel}
          </Button>
        </footer>
      )}

      {game.phase === 'ended' && (
        <footer className="fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-outline-variant p-4 max-w-[600px] mx-auto">
          <Button onClick={onNewGame} variant="outline" className="w-full h-touch">
            <RefreshCw className="w-5 h-5" />
            New Game
          </Button>
        </footer>
      )}
    </>
  )
}
