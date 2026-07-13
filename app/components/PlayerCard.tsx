import { Shield, Ban, Heart } from 'lucide-react'
import type { Player, Game } from '@/engine/types'
import { playerById } from '@/engine/engine'
import { Badge } from './ui/badge'
import { cn, TEAM_COLOR_VAR } from '@/lib/utils'

const MOD_LABEL: Record<string, string> = {
  protected: 'PROTECTED',
  silenced: 'SILENCED',
  usedHeal: 'USED HEAL',
  usedPoison: 'USED POISON',
}

export function PlayerCard({
  player,
  game,
  className,
}: {
  player: Player
  game: Game
  className?: string
}): React.JSX.Element {
  const teamColor = TEAM_COLOR_VAR[player.team]
  const mods = player.modifiers.map(m => {
    if (m.type === 'lover') {
      try {
        return { label: `LOVER:${playerById(game, m.with).name}`, icon: Heart }
      } catch {
        return { label: 'LOVER', icon: Heart }
      }
    }
    return { label: MOD_LABEL[m.type] ?? m.type.toUpperCase(), icon: undefined }
  })

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border border-outline-variant bg-surface-lowest',
        'border-l-[3px]',
        !player.alive && 'opacity-40 grayscale',
        className,
      )}
      style={{ borderLeftColor: teamColor }}
    >
      {/* ponytail: plain img, not next/image — no remote/loader config needed for static /public files */}
      <img
        src={`/assets/${player.role === 'mason' ? 'Masons' : player.role}.webp`}
        alt={player.role}
        className="w-20 h-27 rounded-md object-cover shrink-0 bg-surface-low"
      />
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'text-base font-semibold text-primary',
              !player.alive && 'line-through',
            )}
          >
            {player.name}
          </span>
          {mods.map((m, i) => (
            <Badge key={i}>
              {m.icon && <m.icon className="w-3 h-3" />}
              {m.label}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-secondary opacity-60 mt-0.5">
          {player.role} · {player.alive ? 'Alive' : 'Dead'}
        </p>
      </div>
      {!player.alive && <Ban className="w-4 h-4 text-outline-variant shrink-0" />}
      {player.alive && player.modifiers.some(m => m.type === 'protected') && (
        <Shield className="w-4 h-4 text-primary shrink-0" />
      )}
    </div>
  )
}
