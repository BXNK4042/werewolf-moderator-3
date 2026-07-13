import type { Game } from './types'

// ponytail: localStorage only — engine core stays pure; this is the only DOM-touching file.
const KEY = 'werewolf-game'

export function saveGame(g: Game): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(g))
}

export function loadGame(): Game | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as Game) : null
}

export function clearGame(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(KEY)
}
