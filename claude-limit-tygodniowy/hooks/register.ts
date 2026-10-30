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

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const ran = await next(e)
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

  on('command.run', { command: 'limit' }, async $ => {
    const w = tygodniowy((await $.session.usage()).rateLimits)
    return {
      text: w
        ? opis(w)
        : 'Brak odczytu limitu tygodniowego — pojawi się po pierwszej odpowiedzi Claude w tej sesji.',
    }
  })
}
