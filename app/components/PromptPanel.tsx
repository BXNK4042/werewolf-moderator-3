'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { PromptFn } from '@/engine/types'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

type Pending = {
  text: string
  choices: string[]
  opts?: { multi?: boolean; audience?: string[] }
  resolve: (ids: string[]) => void
}

export type { Pending }

export function PromptPanel({
  game,
  pending,
  multiSel,
  onPick,
  onToggle,
  onConfirm,
  onSkip,
}: {
  game: { players: { id: string; name: string }[] }
  pending: Pending | null
  multiSel: string[]
  onPick: (id: string) => void
  onToggle: (id: string) => void
  onConfirm: () => void
  onSkip: () => void
}): React.JSX.Element | null {
  const label = (id: string) =>
    id === '__skip__' ? '(skip)' : game.players.find(p => p.id === id)?.name ?? id

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-outline-variant rounded-t-xl shadow-lg max-w-[600px] mx-auto"
        >
          <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto my-3" />
          <div className="px-page pb-8 max-h-[70vh] overflow-y-auto">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-primary leading-tight">{pending.text}</h2>
              <p className="text-sm text-secondary mt-1">
                for:{' '}
                <span className="font-semibold text-primary">
                  {pending.opts?.audience?.map(label).join(', ') ?? 'all'}
                </span>
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {pending.opts?.multi ? (
                <MultiChoices
                  choices={pending.choices.filter(c => c !== '__skip__')}
                  selected={multiSel}
                  onToggle={onToggle}
                  label={label}
                />
              ) : (
                <SingleChoices
                  choices={pending.choices.filter(c => c !== '__skip__')}
                  onPick={onPick}
                  label={label}
                />
              )}
            </div>

            <div className="flex flex-col items-center gap-3">
              {pending.opts?.multi && (
                <Button
                  onClick={onConfirm}
                  disabled={multiSel.length !== 2}
                  className="w-full h-touch"
                >
                  Confirm ({multiSel.length}/2)
                </Button>
              )}
              <button
                onClick={onSkip}
                className="text-secondary opacity-60 hover:opacity-100 text-xs font-semibold uppercase tracking-widest transition-opacity"
              >
                Skip
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SingleChoices({
  choices,
  onPick,
  label,
}: {
  choices: string[]
  onPick: (id: string) => void
  label: (id: string) => string
}): React.JSX.Element {
  return (
    <>
      {choices.map(id => (
        <button
          key={id}
          onClick={() => onPick(id)}
          className="w-full flex items-center justify-between p-4 border border-outline-variant rounded-lg hover:bg-surface-container active:scale-[0.99] transition-all text-left group"
        >
          <span className="text-base text-primary">{label(id)}</span>
          <div className="w-6 h-6 border-2 border-outline-variant rounded-full group-active:border-primary flex items-center justify-center transition-colors">
            <div className="w-3 h-3 bg-primary rounded-full opacity-0 group-active:opacity-100 transition-opacity" />
          </div>
        </button>
      ))}
    </>
  )
}

function MultiChoices({
  choices,
  selected,
  onToggle,
  label,
}: {
  choices: string[]
  selected: string[]
  onToggle: (id: string) => void
  label: (id: string) => string
}): React.JSX.Element {
  return (
    <>
      {choices.map(id => {
        const checked = selected.includes(id)
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className={cn(
              'w-full flex items-center justify-between p-4 border rounded-lg transition-all text-left',
              checked ? 'border-primary bg-surface-container' : 'border-outline-variant hover:bg-surface-container',
            )}
          >
            <span className="text-base text-primary">{label(id)}</span>
            <div
              className={cn(
                'w-6 h-6 border-2 rounded flex items-center justify-center transition-colors',
                checked ? 'border-primary bg-primary' : 'border-outline-variant',
              )}
            >
              {checked && <X className="w-4 h-4 text-primary-foreground rotate-45" />}
            </div>
          </button>
        )
      })}
    </>
  )
}
