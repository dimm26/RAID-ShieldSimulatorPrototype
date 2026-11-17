export type Raid = 'RAID 0' | 'RAID 1' | 'RAID 5' | 'RAID 10'
export interface Cell { disk: number; row: number; ch: string; parity: boolean; idx: number; stripe: number }

export const RAIDS: { id: Raid; cap: string }[] = [
  { id: 'RAID 0', cap: 'Striping' },
  { id: 'RAID 1', cap: 'Mirroring' },
  { id: 'RAID 5', cap: 'Parity' },
  { id: 'RAID 10', cap: 'Mirror+Stripe' },
]
export const EFF: Record<Raid, [number, number]> = { 'RAID 0': [100, 0], 'RAID 1': [50, 50], 'RAID 5': [75, 25], 'RAID 10': [50, 50] }
export const COLORS = ['#B9A8F5', '#A8E6CF', '#FFE94D', '#FF7A5C', '#9fc4ff', '#ffc28a']
export const colorFor = (ch: string) => COLORS[(ch.charCodeAt(0) * 7) % COLORS.length]

export function buildCells(text: string, raid: Raid | null): Cell[] {
  const out: Cell[] = []
  if (!raid) return out
  const chars = text.split('')
  chars.forEach((ch, i) => {
    if (raid === 'RAID 0') out.push({ disk: i % 4, row: Math.floor(i / 4), ch, parity: false, idx: i, stripe: 0 })
    if (raid === 'RAID 1') {
      out.push({ disk: 0, row: i, ch, parity: false, idx: i, stripe: i })
      out.push({ disk: 1, row: i, ch, parity: false, idx: i, stripe: i })
    }
    if (raid === 'RAID 10') {
      const p = i % 2
      const row = Math.floor(i / 2)
      out.push({ disk: p * 2, row, ch, parity: false, idx: i, stripe: i })
      out.push({ disk: p * 2 + 1, row, ch, parity: false, idx: i, stripe: i })
    }
    if (raid === 'RAID 5') {
      const s = Math.floor(i / 3), pos = i % 3
      const pd = (3 - (s % 4) + 4) % 4
      const dd = [0, 1, 2, 3].filter((d) => d !== pd)
      out.push({ disk: dd[pos], row: s, ch, parity: false, idx: i, stripe: s })
      if (pos === 2 || i === chars.length - 1) out.push({ disk: pd, row: s, ch: 'P', parity: true, idx: -1, stripe: s })
    }
  })
  return out
}

export function recoveryLine(raid: Raid, c: Cell, cells: Cell[], failed: number, src = failed ^ 1) {
  const name = (x: Cell) => (x.parity ? 'Parity [P]' : `Data Blok ${x.idx + 1} [${x.ch}]`)
  if (raid === 'RAID 5') {
    const others = cells.filter((o) => o.stripe === c.stripe && o !== c)
    return `${others.map(name).join(' ⊕ ')} = Recovering ${name(c)}`
  }
  return `Mirror Disk ${src + 1} [${c.ch}] → Disk ${failed + 1} (Blok ${c.idx + 1})`
}
