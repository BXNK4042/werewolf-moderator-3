'use client'

import { Lock } from 'lucide-react'
import { useState } from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import type { Game, LogEntry } from '@/engine/types'
import { playerById } from '@/engine/engine'
import { cn } from '@/lib/utils'

export function LogPanel({
  game,
  className,
}: {
  game: Game
  className?: string
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const label = (id: string) => {
    try {
      return playerById(game, id).name
    } catch {
      return id
    }
  }
  const entries = [...game.log].reverse()

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className={cn('mb-section', className)}>
      <div className="flex items-center gap-2 mb-element opacity-60">
        <span className="text-xs font-semibold uppercase tracking-wider">Game Log</span>
        <div className="h-px flex-grow bg-outline-variant" />
        <Collapsible.Trigger asChild>
          <button className="text-secondary hover:text-primary transition-colors">
            <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
          </button>
        </Collapsible.Trigger>
      </div>
      <Collapsible.Content>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {entries.length === 0 && (
            <p className="text-sm text-secondary opacity-60 italic px-1">No events yet.</p>
          )}
          {entries.map((e: LogEntry, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 p-2 rounded-md text-sm',
                e.audience
                  ? 'bg-surface-container text-secondary'
                  : 'text-on-surface-variant',
              )}
            >
              {e.audience && <Lock className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />}
              <p className="leading-snug">
                <span className="font-semibold">R{e.round} {e.phase}</span> · {e.text}
                {e.audience && (
                  <span className="opacity-60"> (private: {e.audience.map(label).join(', ')})</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
