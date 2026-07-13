import type { Game, Player, PromptFn, RoleDef, Team } from './types'
import { livingPlayers, log, playerById } from './engine'

const villageWin = (g: Game) => livingPlayers(g).every(p => p.team !== 'werewolf')
const wolfWin = (g: Game) => {
  const wolves = livingPlayers(g).filter(p => p.team === 'werewolf').length
  return wolves > 0 && wolves >= livingPlayers(g).length - wolves
}

export const ROLES: Record<string, RoleDef> = {
  villager: {
    team: 'village',
    winCheck: villageWin,
  },

  werewolf: {
    team: 'werewolf',
    winCheck: wolfWin,
  },

  seer: {
    team: 'village',
    async nightAction(g, p, prompt) {
      const targets = livingPlayers(g).filter(x => x.id !== p.id).map(x => x.id)
      const pick = await prompt('Seer: investigate whom?', targets, { audience: [p.id] })
      if (!pick[0]) return
      const t = playerById(g, pick[0])
      const sees =
        t.team === 'werewolf'
          ? t.role === 'werewolf'
            ? 'a Werewolf'
            : `a ${t.role} (wolf-team)`
          : t.team === 'village'
            ? 'on the Village team'
            : `on the ${t.team} team`
      log(g, `Seer: ${t.name} is ${sees}.`, [p.id])
    },
    winCheck: villageWin,
  },

  bodyguard: {
    team: 'village',
    async nightAction(g, p, prompt) {
      const targets = livingPlayers(g).map(x => x.id)
      const pick = await prompt('Bodyguard: protect whom?', targets, { audience: [p.id] })
      if (pick[0]) {
        playerById(g, pick[0]).modifiers.push({ type: 'protected' })
        log(g, `Bodyguard protected ${playerById(g, pick[0]).name}.`, [p.id])
      }
    },
    winCheck: villageWin,
  },

  hunter: {
    team: 'village',
    async onDeath(g, v, prompt) {
      const targets = livingPlayers(g).map(x => x.id)
      const pick = await prompt(`Hunter ${v.name}: shoot whom? (skip to refrain)`, targets, { audience: [v.id] })
      if (pick[0]) {
        const t = playerById(g, pick[0])
        log(g, `Hunter ${v.name} shot ${t.name}.`)
        t.alive = false
      }
    },
    winCheck: villageWin,
  },

  witch: {
    team: 'village',
    async nightAction(g, p, prompt) {
      const usedHeal = p.modifiers.some(m => m.type === 'usedHeal')
      const usedPoison = p.modifiers.some(m => m.type === 'usedPoison')
      const victim = g.nightKills[0]

      if (victim && !usedHeal) {
        const v = playerById(g, victim.id)
        const ans = await prompt(
          `Witch: heal ${v.name}? (pick to heal, skip to decline)`,
          [v.id],
          { audience: [p.id] },
        )
        if (ans[0]) {
          g.nightKills = g.nightKills.filter(k => k.id !== v.id)
          p.modifiers.push({ type: 'usedHeal' })
          log(g, `Witch healed ${v.name}.`, [p.id])
        }
      }

      if (!usedPoison) {
        const targets = livingPlayers(g).filter(x => x.id !== p.id).map(x => x.id)
        const ans = await prompt('Witch: poison whom? (skip to decline)', targets, { audience: [p.id] })
        if (ans[0]) {
          g.nightKills.push({ id: ans[0], cause: 'witch-poison' })
          p.modifiers.push({ type: 'usedPoison' })
          log(g, `Witch poisoned ${playerById(g, ans[0]).name}.`, [p.id])
        }
      }
    },
    winCheck: villageWin,
  },

  mason: {
    team: 'village',
    async firstNight(g, p) {
      const others = livingPlayers(g).filter(x => x.role === 'mason' && x.id !== p.id)
      if (others.length) log(g, `Other Masons: ${others.map(o => o.name).join(', ')}`, [p.id])
    },
    winCheck: villageWin,
  },

  tanner: {
    team: 'neutral',
    winCheck: () => false,
  },

  cupid: {
    team: 'special',
    async firstNight(g, p, prompt) {
      const choices = livingPlayers(g).filter(x => x.id !== p.id).map(x => x.id)
      const picks = await prompt('Cupid: choose two lovers', choices, { multi: true, audience: [p.id] })
      if (picks.length === 2) {
        const [a, b] = picks
        playerById(g, a).modifiers.push({ type: 'lover', with: b })
        playerById(g, b).modifiers.push({ type: 'lover', with: a })
        log(g, `Cupid bound ${playerById(g, a).name} and ${playerById(g, b).name} as Lovers.`, [p.id])
      }
    },
    winCheck: (_g, p) => {
      const lovers = livingPlayers(_g).filter(x => x.modifiers.some(m => m.type === 'lover'))
      return p.alive && lovers.length === 2
    },
  },

  minion: {
    team: 'werewolf',
    async firstNight(g, p) {
      const wolves = livingPlayers(g).filter(x => x.role === 'werewolf')
      log(g, `Werewolves: ${wolves.map(w => w.name).join(', ') || '(none)'}`, [p.id])
    },
    winCheck: wolfWin,
  },
}

export const TEAM_OF: Record<string, Team> = Object.fromEntries(
  Object.entries(ROLES).map(([name, def]) => [name, def.team]),
)
