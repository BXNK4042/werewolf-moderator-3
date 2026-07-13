import type { Game, Player, PromptFn, RoleDef, Team } from './types'
import { ROLES } from './roles'

export const livingPlayers = (g: Game) => g.players.filter(p => p.alive)
export const playerById = (g: Game, id: string) =>
  g.players.find(p => p.id === id) ?? fail(`unknown player ${id}`)

export function log(g: Game, text: string, audience?: string[]) {
  g.log.push({ round: g.round, phase: g.phase, text, audience })
}

function fail(msg: string): never {
  throw new Error(msg)
}

export function setupGame(names: string[], roleNames: string[]): Game {
  if (names.length !== roleNames.length) throw new Error('players and roles must match in length')
  const players: Player[] = names.map((name, i) => {
    const role = roleNames[i]
    const def = ROLES[role]
    if (!def) throw new Error(`unknown role: ${role}`)
    return { id: 'p' + i, name, role, team: def.team, alive: true, modifiers: [] }
  })
  return { players, phase: 'setup', round: 0, log: [], nightKills: [] }
}

export async function startGame(g: Game, prompt: PromptFn): Promise<void> {
  g.round = 1
  g.phase = 'setup'
  for (const p of livingPlayers(g)) {
    const def = ROLES[p.role]
    if (def?.firstNight) await def.firstNight(g, p, prompt)
  }
  g.phase = 'night'
}

export async function resolveNight(g: Game, prompt: PromptFn): Promise<void> {
  if (g.phase !== 'night') throw new Error(`resolveNight requires phase=night, got ${g.phase}`)
  g.nightKills = []

  const wolves = livingPlayers(g).filter(p => p.role === 'werewolf')
  if (wolves.length > 0) {
    const targets = livingPlayers(g).filter(p => p.role !== 'werewolf').map(p => p.id)
    if (targets.length > 0) {
      const pick = await prompt('Werewolves: choose a victim', targets, {
        audience: wolves.map(w => w.id),
      })
      if (pick[0]) g.nightKills.push({ id: pick[0], cause: 'werewolves' })
    }
  }

  for (const p of livingPlayers(g)) {
    if (p.role === 'werewolf') continue
    const def = ROLES[p.role]
    if (def?.nightAction) await def.nightAction(g, p, prompt)
  }

  for (const k of [...g.nightKills]) {
    const v = playerById(g, k.id)
    if (!v.alive) continue
    if (v.modifiers.some(m => m.type === 'protected')) {
      log(g, `${v.name} was protected from ${k.cause}.`)
      continue
    }
    const def = ROLES[v.role]
    if (def?.onAttacked?.(g, v) === 'convert') continue
    await kill(g, v.id, k.cause, prompt)
  }

  for (const p of g.players) p.modifiers = p.modifiers.filter(m => m.type !== 'protected')
  g.nightKills = []
  g.phase = 'day'
}

export async function resolveDay(g: Game, prompt: PromptFn): Promise<void> {
  if (g.phase !== 'day') throw new Error(`resolveDay requires phase=day, got ${g.phase}`)

  const choices = [...livingPlayers(g).map(p => p.id), '__skip__']
  const pick = await prompt('Day vote: choose a player to eliminate', choices)
  const target = pick[0]

  if (!target || target === '__skip__') {
    log(g, 'No one was eliminated today.')
  } else {
    const v = playerById(g, target)
    log(g, `${v.name} was voted out.`)
    if (v.role === 'tanner') {
      v.alive = false
      g.winner = { team: 'neutral', playerIds: [v.id] }
      g.phase = 'ended'
      return
    }
    await kill(g, v.id, 'vote', prompt)
  }

  checkWin(g)
  g.phase = g.winner ? 'ended' : 'night'
  if (!g.winner) g.round += 1
}

export function checkWin(g: Game): void {
  if (g.winner) return
  const living = livingPlayers(g)
  const wolves = living.filter(p => p.team === 'werewolf')
  const others = living.filter(p => p.team !== 'werewolf')

  if (wolves.length === 0) {
    declareWinner(g, 'village')
  } else if (wolves.length >= others.length) {
    declareWinner(g, 'werewolf')
  }
}

function declareWinner(g: Game, team: Team): void {
  const living = livingPlayers(g)
  const ids = living.filter(p => p.team === team).map(p => p.id)
  const cupid = living.find(p => p.role === 'cupid')
  if (cupid) {
    const lovers = living.filter(p => p.modifiers.some(m => m.type === 'lover'))
    if (lovers.length === 2 && !ids.includes(cupid.id)) ids.push(cupid.id)
  }
  g.winner = { team, playerIds: ids }
}

async function kill(
  g: Game,
  id: string,
  cause: string,
  prompt: PromptFn,
  chain: Set<string> = new Set(),
): Promise<void> {
  if (chain.has(id)) return
  chain.add(id)
  const v = playerById(g, id)
  if (!v.alive) {
    chain.delete(id)
    return
  }
  v.alive = false
  log(g, `${v.name} (${v.role}) died: ${cause}.`)

  const def = ROLES[v.role]
  if (def?.onDeath) await def.onDeath(g, v, prompt)

  const loverMod = v.modifiers.find(m => m.type === 'lover')
  if (loverMod && loverMod.type === 'lover') {
    const partner = playerById(g, loverMod.with)
    if (partner.alive) {
      log(g, `${partner.name} dies of heartbreak.`)
      await kill(g, partner.id, 'heartbreak', prompt, chain)
    }
  }
  chain.delete(id)
}
