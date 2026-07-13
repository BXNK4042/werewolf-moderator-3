import assert from 'node:assert'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import type { Game, PromptFn } from './types'
import { setupGame, startGame, resolveNight, resolveDay, livingPlayers, playerById } from './engine'

function scriptPrompt(responses: string[][]): PromptFn {
  let i = 0
  return async () => responses[i++] ?? []
}

async function runGame(g: Game, prompt: PromptFn): Promise<void> {
  while (g.phase !== 'ended') {
    if (g.phase === 'night') await resolveNight(g, prompt)
    else if (g.phase === 'day') await resolveDay(g, prompt)
  }
}

async function cliPrompt(g: Game): Promise<PromptFn> {
  const rl = readline.createInterface({ input, output })
  const nameOf = (id: string) => (id === '__skip__' ? '(skip)' : playerById(g, id).name)
  return async (text, choices, opts) => {
    const multi = opts?.multi
    console.log(`\n[audience: ${opts?.audience?.map(id => playerById(g, id).name).join(', ') ?? 'all'}] ${text}`)
    choices.forEach((c, idx) => console.log(`  ${idx + 1}. ${nameOf(c)}`))
    if (!multi) {
      const ans = await rl.question('pick # (blank=skip): ')
      const n = parseInt(ans, 10)
      return n >= 1 && n <= choices.length ? [choices[n - 1]] : []
    }
    const ans = await rl.question('pick #s comma-separated (need 2): ')
    return ans
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => n >= 1 && n <= choices.length)
      .map(n => choices[n - 1])
  }
}

function announce(g: Game): void {
  console.log(`\n=== Round ${g.round} — ${g.phase} ===`)
  console.log('Alive:', livingPlayers(g).map(p => p.name).join(', '))
  for (const e of g.log.filter(e => e.round === g.round && e.phase === g.phase)) {
    const tag = e.audience ? '(mod only)' : ''
    console.log(`  ${tag} ${e.text}`)
  }
}

// --- demos -----------------------------------------------------------------

async function demoVillageVote(): Promise<void> {
  const g = setupGame(
    ['Alice', 'Bob', 'Carol', 'Dan', 'Eve', 'Frank', 'Grace'],
    ['werewolf', 'werewolf', 'seer', 'bodyguard', 'hunter', 'witch', 'villager'],
  )
  const prompt = scriptPrompt([
    ['p6'], ['p2'], ['p2'], [], [],   // n1: wolves kill Grace, seer→Bob, bodyguard→Bob, witch no/no
    ['p0'],                            // d1: vote Alice
    ['p3'], ['p1'], ['p4'], [], [],    // n2: wolves kill Dan, seer→Bob, bodyguard→Eve, witch no/no
    ['p1'],                            // d2: vote Bob → village wins
  ])
  await startGame(g, prompt)
  await runGame(g, prompt)
  assert.strictEqual(g.winner!.team, 'village')
  assert.deepStrictEqual(g.winner!.playerIds, ['p2', 'p4', 'p5'])
}

async function demoWolfParity(): Promise<void> {
  const g = setupGame(
    ['Alice', 'Bob', 'Carol', 'Dan', 'Eve'],
    ['werewolf', 'werewolf', 'villager', 'villager', 'villager'],
  )
  const prompt = scriptPrompt([
    ['p2'],   // n1: wolves kill Carol → 2 wolves vs 2 others
    [],       // d1: skip vote → checkWin triggers wolf win at parity
  ])
  await startGame(g, prompt)
  await runGame(g, prompt)
  assert.strictEqual(g.winner!.team, 'werewolf')
  assert.deepStrictEqual(g.winner!.playerIds, ['p0', 'p1'])
}

async function demoTanner(): Promise<void> {
  const g = setupGame(
    ['Alice', 'Bob', 'Carol', 'Dan', 'Eve'],
    ['tanner', 'villager', 'villager', 'werewolf', 'werewolf'],
  )
  const prompt = scriptPrompt([
    ['p1'],   // n1: wolves kill Bob
    ['p0'],   // d1: village votes Alice (tanner) → tanner wins alone
  ])
  await startGame(g, prompt)
  await runGame(g, prompt)
  assert.strictEqual(g.winner!.team, 'neutral')
  assert.deepStrictEqual(g.winner!.playerIds, ['p0'])
  assert.strictEqual(playerById(g, 'p0').alive, false)
}

async function demoHunter(): Promise<void> {
  const g = setupGame(
    ['Alice', 'Bob', 'Carol', 'Dan'],
    ['hunter', 'villager', 'villager', 'werewolf'],
  )
  const prompt = scriptPrompt([
    ['p1'],   // n1: wolf kills Bob
    ['p0'],   // d1: vote Alice (hunter) → onDeath fires
    ['p3'],   // hunter shoots Dan (the wolf) → no wolves left → village wins
  ])
  await startGame(g, prompt)
  await runGame(g, prompt)
  assert.strictEqual(g.winner!.team, 'village')
  assert.strictEqual(playerById(g, 'p3').alive, false)
  assert.deepStrictEqual(g.winner!.playerIds, ['p2'])
}

async function demoWitch(): Promise<void> {
  const g = setupGame(
    ['Alice', 'Bob', 'Carol', 'Dan', 'Eve'],
    ['witch', 'villager', 'villager', 'werewolf', 'werewolf'],
  )
  const prompt = scriptPrompt([
    ['p1'],   // n1: wolves kill Bob
    ['p1'],   // witch heals Bob
    ['p3'],   // witch poisons Dan
    ['p4'],   // d1: vote Eve (last wolf) → village wins
  ])
  await startGame(g, prompt)
  await runGame(g, prompt)
  assert.strictEqual(playerById(g, 'p1').alive, true, 'Bob should survive (healed)')
  assert.strictEqual(playerById(g, 'p3').alive, false, 'Dan should die (poisoned)')
  const witch = playerById(g, 'p0')
  assert.ok(witch.modifiers.some(m => m.type === 'usedHeal'))
  assert.ok(witch.modifiers.some(m => m.type === 'usedPoison'))
  assert.strictEqual(g.winner!.team, 'village')
}

async function demoBodyguard(): Promise<void> {
  const g = setupGame(
    ['Alice', 'Bob', 'Carol', 'Dan'],
    ['bodyguard', 'villager', 'villager', 'werewolf'],
  )
  const prompt = scriptPrompt([
    ['p1'],   // n1: wolf kills Bob
    ['p1'],   // bodyguard protects Bob
    ['p3'],   // d1: vote Dan (wolf) → village wins
  ])
  await startGame(g, prompt)
  await runGame(g, prompt)
  assert.strictEqual(playerById(g, 'p1').alive, true, 'Bob should survive (protected)')
  assert.ok(
    g.log.some(e => e.text.includes('was protected from werewolves')),
    'should log a protection event',
  )
  assert.strictEqual(g.winner!.team, 'village')
}

async function demoCupid(): Promise<void> {
  const g = setupGame(
    ['Alice', 'Bob', 'Carol', 'Dan', 'Eve'],
    ['cupid', 'villager', 'villager', 'villager', 'werewolf'],
  )
  const prompt = scriptPrompt([
    ['p1', 'p2'],   // firstNight: cupid binds Bob+Carol as lovers
    ['p1'],         // n1: wolf kills Bob → heartbreak kills Carol
    ['p4'],         // d1: vote Eve (wolf) → village wins
  ])
  await startGame(g, prompt)
  await runGame(g, prompt)
  assert.strictEqual(playerById(g, 'p1').alive, false, 'Bob killed by wolves')
  assert.strictEqual(playerById(g, 'p2').alive, false, 'Carol dead via heartbreak recursion')
  assert.ok(g.log.some(e => e.text.includes('dies of heartbreak')), 'should log heartbreak')
  assert.strictEqual(g.winner!.team, 'village')
  assert.deepStrictEqual(g.winner!.playerIds, ['p3'])
}

const DEMOS: { name: string; run: () => Promise<void> }[] = [
  { name: 'village-vote-win', run: demoVillageVote },
  { name: 'wolf-parity-win', run: demoWolfParity },
  { name: 'tanner-vote-win', run: demoTanner },
  { name: 'hunter-last-shot', run: demoHunter },
  { name: 'witch-both-potions', run: demoWitch },
  { name: 'bodyguard-save', run: demoBodyguard },
  { name: 'cupid-heartbreak', run: demoCupid },
]

async function runDemos(which: number | 'all'): Promise<void> {
  const list = which === 'all' ? DEMOS : [DEMOS[which - 1]]
  if (!list[0]) throw new Error(`no demo #${which}; pick 1-${DEMOS.length}`)
  let passed = 0
  for (let i = 0; i < list.length; i++) {
    const idx = which === 'all' ? i + 1 : which
    const { name, run } = list[i]
    try {
      await run()
      console.log(`  #${idx} ${name}: PASS`)
      passed++
    } catch (e) {
      console.error(`  #${idx} ${name}: FAIL — ${(e as Error).message}`)
      process.exitCode = 1
    }
  }
  console.log(`\n${passed}/${list.length} demos passed`)
}

async function interactive(): Promise<void> {
  const rl = readline.createInterface({ input, output })
  const nameStr = await rl.question('Player names (comma-separated): ')
  const roleStr = await rl.question('Roles (comma-separated, must match count): ')
  const names = nameStr.split(',').map(s => s.trim()).filter(Boolean)
  const roles = roleStr.split(',').map(s => s.trim()).filter(Boolean)
  const g = setupGame(names, roles)
  const prompt = await cliPrompt(g)
  await startGame(g, prompt)
  announce(g)
  while (g.phase !== 'ended') {
    if (g.phase === 'night') {
      await resolveNight(g, prompt)
      announce(g)
    } else if (g.phase === 'day') {
      await resolveDay(g, prompt)
      announce(g)
    }
  }
  console.log(`\n=== WINNER: ${g.winner!.team} ===`)
  console.log(g.winner!.playerIds.map(id => playerById(g, id).name).join(', '))
  rl.close()
}

const arg = process.argv[2]
if (arg === 'demo') {
  const n = process.argv[3] ? parseInt(process.argv[3], 10) : 'all'
  runDemos(Number.isNaN(n as number) ? 'all' : (n as number)).catch(e => {
    console.error(e)
    process.exit(1)
  })
} else if (arg) {
  console.error(`unknown command: ${arg}\nusage: tsx harness.ts [demo [n]]`)
  process.exit(1)
} else {
  interactive().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
