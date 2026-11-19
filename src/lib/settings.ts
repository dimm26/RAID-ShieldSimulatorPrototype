export interface Prefs { diff: number; dark: boolean; sound: boolean; speed: 1 | 2 }
export interface Records { bestScore: number; bestDays: number }
const PK = 'raidshield.prefs.v1'
const RK = 'raidshield.records.v1'
const DEF: Prefs = { diff: 1, dark: false, sound: true, speed: 1 }

export function loadPrefs(): Prefs {
  try {
    const o = JSON.parse(localStorage.getItem(PK) || '{}')
    return { diff: [0, 1, 2].includes(o.diff) ? o.diff : DEF.diff, dark: !!o.dark, sound: o.sound !== false, speed: o.speed === 2 ? 2 : 1 }
  } catch { return DEF }
}
export function savePrefs(p: Prefs) { try { localStorage.setItem(PK, JSON.stringify(p)) } catch { /* storage unavailable */ } }
export function loadRecords(): Records {
  try {
    const o = JSON.parse(localStorage.getItem(RK) || '{}')
    return { bestScore: Number(o.bestScore) || 0, bestDays: Number(o.bestDays) || 0 }
  } catch { return { bestScore: 0, bestDays: 0 } }
}
export function saveRecords(r: Records) { try { localStorage.setItem(RK, JSON.stringify(r)) } catch { /* storage unavailable */ } }
