'use client'

import { useState } from 'react'
import { Plus, X, Play, Dices } from 'lucide-react'
import { Button } from './ui/button'
import { ROLES } from '@/engine/roles'
import { cn, TEAM_COLOR_VAR, roleImg } from '@/lib/utils'
import type { Team } from '@/engine/types'

const ROLE_TEAM: Record<string, Team> = Object.fromEntries(
  Object.entries(ROLES).map(([name, def]) => [name, def.team]),
)

export function SetupForm({
  rows,
  error,
  onUpdate,
  onAdd,
  onRemove,
  onStart,
}: {
  rows: { name: string; role: string }[]
  error: string
  onUpdate: (i: number, patch: Partial<{ name: string; role: string }>) => void
  onAdd: () => void
  onRemove: (i: number) => void
  onStart: () => void
}): React.JSX.Element {
  return (
    <>
      <section className="mt-element mb-section">
        <div className="flex flex-wrap gap-4 items-center">
          {(['village', 'werewolf', 'neutral', 'special'] as Team[]).map(t => (
            <div key={t} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: TEAM_COLOR_VAR[t] }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider opacity-60">
                {t}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-element">
        {rows.map((r, i) => {
          const team = ROLE_TEAM[r.role] ?? 'village'
          return (
            <div
              key={i}
              className="relative bg-surface-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-3 border-l-[3px]"
              style={{ borderLeftColor: TEAM_COLOR_VAR[team] }}
            >
              <button
                onClick={() => onRemove(i)}
                className="absolute top-2 right-2 text-secondary opacity-40 hover:opacity-100 transition-opacity"
                aria-label="Remove player"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex flex-row gap-3">
                {/* ponytail: onError swap is the simplest surviving fallback for any missing asset
                    (villager/werewolf today, art-only roles later). Tracks per-row, no asset manifest. */}
                <PlayerThumb role={r.role} team={team} />
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <div className="flex flex-col gap-1 pr-6">
                    <label className="text-xs font-semibold uppercase tracking-wider opacity-60">
                      Player Name
                    </label>
                    <input
                      type="text"
                      value={r.name}
                      onChange={e => onUpdate(i, { name: e.target.value })}
                      placeholder={`Player ${i + 1}`}
                      className="w-full border-b border-outline-variant focus:border-primary bg-transparent py-1 text-base outline-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider opacity-60">
                      Role
                    </label>
                    <div className="flex items-center gap-2 border-b border-outline-variant">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: TEAM_COLOR_VAR[team] }}
                      />
                      <select
                        value={r.role}
                        onChange={e => onUpdate(i, { role: e.target.value })}
                        className="w-full bg-transparent py-1 text-base outline-none cursor-pointer"
                      >
                        {Object.keys(ROLES).map(role => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <button
          onClick={onAdd}
          className={cn(
            'w-full h-[120px] border-2 border-dashed border-outline-variant rounded-lg',
            'flex flex-col items-center justify-center gap-2 text-secondary',
            'hover:bg-surface-container hover:border-primary transition-all active:scale-[0.98]',
          )}
        >
          <Plus className="w-8 h-8" />
          <span className="text-xs font-semibold uppercase tracking-widest">+ Add Player</span>
        </button>
      </div>

      {error && (
        <p className="mt-element text-sm text-destructive">{error}</p>
      )}
    </>
  )
}

function PlayerThumb({ role, team }: { role: string; team: Team }): React.JSX.Element {
  const [ok, setOk] = useState(true)
  if (!ok) {
    return (
      <div
        className="w-16 h-16 shrink-0 rounded-lg flex items-center justify-center bg-surface-container text-lg font-bold uppercase"
        style={{ color: TEAM_COLOR_VAR[team] }}
        aria-label={role}
      >
        {role.charAt(0)}
      </div>
    )
  }
  return (
    <img
      src={roleImg(role)}
      alt={role}
      onError={() => setOk(false)}
      className="w-25 h-35 shrink-0 rounded-lg object-cover bg-surface-container"
    />
  )
}
