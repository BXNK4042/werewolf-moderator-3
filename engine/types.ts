export type Team = 'village' | 'werewolf' | 'neutral' | 'special'
export type Phase = 'setup' | 'night' | 'day' | 'ended'

export type Modifier =
  | { type: 'protected' }
  | { type: 'silenced'; untilPhase: Phase }
  | { type: 'lover'; with: string }
  | { type: 'usedHeal' }
  | { type: 'usedPoison' }

export interface Player {
  id: string
  name: string
  role: string
  team: Team
  alive: boolean
  modifiers: Modifier[]
}

export interface LogEntry {
  round: number
  phase: Phase
  text: string
  audience?: string[]
}

export interface Game {
  players: Player[]
  phase: Phase
  round: number
  winner?: { team: Team; playerIds: string[] }
  log: LogEntry[]
  nightKills: { id: string; cause: string }[]
}

export type PromptFn = (
  text: string,
  choices: string[],
  opts?: { multi?: boolean; audience?: string[] }
) => Promise<string[]>

export interface RoleDef {
  team: Team
  firstNight?: (g: Game, p: Player, prompt: PromptFn) => Promise<void>
  nightAction?: (g: Game, p: Player, prompt: PromptFn) => Promise<void>
  onAttacked?: (g: Game, victim: Player) => 'convert' | 'default'
  onDeath?: (g: Game, victim: Player, prompt: PromptFn) => Promise<void>
  winCheck: (g: Game, p: Player) => boolean
}
