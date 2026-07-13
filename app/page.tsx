'use client'

import { useEffect, useState } from 'react'
import { setupGame, startGame, resolveNight, resolveDay } from '@/engine/engine'
import { loadGame, saveGame, clearGame } from '@/engine/store'
import type { Game, PromptFn } from '@/engine/types'
import { SetupForm } from './components/SetupForm'
import { GameBoard } from './components/GameBoard'
import type { Pending } from './components/PromptPanel'

export default function Page() {
  const [game, setGame] = useState<Game | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [multiSel, setMultiSel] = useState<string[]>([])
  const [rows, setRows] = useState<{ name: string; role: string }[]>([
    { name: '', role: 'villager' },
    { name: '', role: 'werewolf' },
  ])
  const [error, setError] = useState('')

  // ponytail: pending prompt is NOT persisted — reload mid-prompt orphans the Promise;
  // recovery is "New Game". Serializing the resolve callback isn't worth it for MVP.
  useEffect(() => {
    const g = loadGame()
    if (g) setGame(g)
  }, [])

  useEffect(() => {
    if (game) saveGame(game)
  }, [game])

  async function advance(): Promise<void> {
    if (!game) return
    try {
      if (game.phase === 'setup') await startGame(game, makePrompt())
      else if (game.phase === 'night') await resolveNight(game, makePrompt())
      else if (game.phase === 'day') await resolveDay(game, makePrompt())
    } catch (e) {
      setError(String(e))
      setPending(null)
    }
    setGame({ ...game })
  }

  function makePrompt(): PromptFn {
    return async (text, choices, opts) => {
      setGame(g => (g ? { ...g } : g))
      return new Promise<string[]>(resolve => {
        setPending({ text, choices, opts, resolve })
      })
    }
  }

  function updateRow(i: number, patch: Partial<{ name: string; role: string }>): void {
    setRows(rs => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }
  function addRow(): void {
    setRows(rs => [...rs, { name: '', role: 'villager' }])
  }
  function removeRow(i: number): void {
    setRows(rs => rs.filter((_, idx) => idx !== i))
  }

  function startSetup(): void {
    const ns = rows.map(r => r.name.trim())
    if (ns.length === 0) {
      setError('add at least one player')
      return
    }
    if (ns.some(n => !n)) {
      setError('every row needs a name')
      return
    }
    setError('')
    setGame(setupGame(ns, rows.map(r => r.role)))
  }

  function pick(id: string): void {
    if (!pending) return
    pending.resolve([id])
    setPending(null)
  }
  function toggleMulti(id: string): void {
    setMultiSel(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
  }
  function confirmMulti(): void {
    if (!pending) return
    pending.resolve(multiSel)
    setMultiSel([])
    setPending(null)
  }
  function skip(): void {
    if (!pending) return
    pending.resolve([])
    setPending(null)
  }
  function newGame(): void {
    clearGame()
    setGame(null)
    setPending(null)
    setMultiSel([])
    setError('')
    setRows([
      { name: '', role: 'villager' },
      { name: '', role: 'werewolf' },
    ])
  }

  if (!game) {
    return (
      <main className="pt-touch px-page pb-32 max-w-[600px] mx-auto min-h-screen">
        <header className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-outline-variant max-w-[600px] mx-auto">
          <div className="flex items-center px-page h-touch">
            <h1 className="text-xl font-semibold text-primary">Werewolf Moderator</h1>
          </div>
        </header>
        <SetupForm
          rows={rows}
          error={error}
          onUpdate={updateRow}
          onAdd={addRow}
          onRemove={removeRow}
          onStart={startSetup}
        />
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline-variant p-4 max-w-[600px] mx-auto">
          <button
            onClick={startSetup}
            className="w-full h-touch bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            Start Game
          </button>
        </footer>
      </main>
    )
  }

  return (
    <GameBoard
      game={game}
      pending={pending}
      multiSel={multiSel}
      onPick={pick}
      onToggle={toggleMulti}
      onConfirm={confirmMulti}
      onSkip={skip}
      onAdvance={advance}
      onNewGame={newGame}
    />
  )
}
