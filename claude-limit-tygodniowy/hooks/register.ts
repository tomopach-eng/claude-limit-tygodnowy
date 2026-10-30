import type { Register, SessionRateLimit } from 'claude-code'

const PROG_H = 48
const KEY = 'powiadomiono-dla-resetu'

const fmtReset = (iso: string) =>
  new Date(iso).toLocaleString('pl-PL', {
    timeZone: 'Europe/Warsaw',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

const opis = (w: SessionRateLimit) => {
  const zostalo = Math.max(0, Math.round((100 - w.percentUsed) * 10) / 10)
  const reset = w.resetsAt ? `, reset: ${fmtReset(w.resetsAt)}` : ''
  const uwaga = zostalo < 20 ? '⚠️ Uwaga: ' : ''
  return `${uwaga}Limit tygodniowy Claude: zostało ${zostalo}% (wykorzystano ${w.percentUsed}%)${reset}`
}

const tygodniowy = (list: SessionRateLimit[]) => list.find(w => w.kind === 'seven_day')

async function sprawdz($: any, list: SessionRateLimit[]) {
    const w = tygodniowy(list)
    if (!w?.resetsAt) return
    const doResetu = Date.parse(w.resetsAt) - $.clock.now()
    if (doResetu <= 0 || doResetu > PROG_H * 3600_000) return
    if ((await $.store.get(KEY)) === w.resetsAt) return
    await $.store.set(KEY, w.resetsAt)
    const tekst = opis(w)
    $.ui.toast(tekst)
    await $.ui.notify(tekst)
  }

const nazwa = (k: string) =>
  ({ five_hour: 'Sesja (5 h)', seven_day: 'Tydzień', spend_limit: 'Limit wydatków' } as Record<string, string>)[k] ?? k

const raport = (list: SessionRateLimit[]) =>
  list.map(w => {
    const zostalo = Math.max(0, Math.round((100 - w.percentUsed) * 10) / 10)
    const reset = w.resetsAt ? fmtReset(w.resetsAt) + ' (' + w.resetsAt + ')' : 'brak danych'
    return `${nazwa(w.kind)}: wykorzystano ${w.percentUsed}%, zostało ${zostalo}%, reset: ${reset}`
  })

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const ran = await next(e)
    await $.tool.register({
      name: 'sprawdz_limity',
      description:
        'Zwraca aktualne wykorzystanie limitów konta Claude (okno 5 h i tygodniowe) wraz z terminami resetu, odczytane z silnika Claude Code. Bez parametrów.',
      inputSchema: { type: 'object', properties: {} },
    })
    await $.command.register({
      name: 'limit',
      description: 'Pokaż, ile zostało limitu tygodniowego Claude',
    })
    await sprawdz($, (await $.session.usage()).rateLimits)
    return ran
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) await sprawdz($, e.rateLimits)
    return next(e)
  })

  on('tool.call', { tool: 'mcp__limit-tygodniowy__sprawdz_limity' }, async $ => {
    const { rateLimits } = await $.session.usage()
    return {
      result:
        rateLimits.length === 0
          ? 'Brak odczytu limitów w tej sesji (silnik nie otrzymał jeszcze danych o limitach albo konto nie korzysta z subskrypcji).'
          : ['Limity Claude:', ...raport(rateLimits)].join('\n'),
    }
  })

  on('command.run', { command: 'limit' }, async $ => {
    const w = tygodniowy((await $.session.usage()).rateLimits)
    return {
      text: w
        ? opis(w)
        : 'Brak odczytu limitu tygodniowego — pojawi się po pierwszej odpowiedzi Claude w tej sesji.',
    }
  })
}
