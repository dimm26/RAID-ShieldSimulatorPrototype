import { useEffect, useMemo, useRef, useState } from 'react'
import { EFF, RAIDS, buildCells, colorFor, recoveryLine, type Raid } from './lib/sim'
import { Pixel, Sticker, Win } from './components/ui'
import { GameOverPopup, WinPopup, WIN_BONUS } from './components/EndPopups'
import { HowTo, Overlay, Settings, StartScreen } from './components/Screens'

type Phase = 'idle' | 'processing' | 'stored'
type DiskState = 'ok' | 'failed' | 'replaced' | 'rebuilding'
type Over = { kind: 'lost' | 'win'; reason: string } | null
type Screen = 'start' | 'game'
type Modal = 'how' | 'settings' | null
const ALL_OK: DiskState[] = ['ok', 'ok', 'ok', 'ok']
const REPLACE_COST = 100
const START_POINTS = 1500
const RATE = 80 // $ per 1% usable capacity per day
const OP_COST = 40 // daily operating cost
const incomeFor = (avail: number) => Math.round((avail / 100) * RATE) - OP_COST
const R_RAID0 = 'RAID 0: 1 disk rusak = data hilang'
const R_NOMONEY = 'Modal habis, tidak bisa beli disk pengganti'
const TOLERANCE: Record<Raid, number> = { 'RAID 0': 1, 'RAID 1': 3, 'RAID 5': 2, 'RAID 10': 3 }

function Decor() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute rounded-full" style={{ width: 380, height: 380, left: -140, top: 560, background: '#B9A8F5', border: '3px solid var(--ink)' }} />
      <div className="absolute rounded-full" style={{ width: 300, height: 300, right: -90, top: 60, background: '#F7A8C8', border: '3px solid var(--ink)' }} />
      <div className="absolute" style={{ width: 260, height: 220, right: 220, bottom: 150, background: '#A8E6CF', border: '3px solid var(--ink)', borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%' }} />
      <svg className="absolute" style={{ left: 380, top: 70 }} width="200" height="30" viewBox="0 0 200 30"><path d="M2 15 Q 14 -5 26 15 T 50 15 T 74 15 T 98 15 T 122 15 T 146 15 T 170 15 T 194 15" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" /></svg>
      <svg className="absolute" style={{ right: 60, bottom: 230 }} width="160" height="30" viewBox="0 0 200 30"><path d="M2 15 Q 14 -5 26 15 T 50 15 T 74 15 T 98 15 T 122 15 T 146 15 T 170 15 T 194 15" fill="none" stroke="#FF7A5C" strokeWidth="5" strokeLinecap="round" /></svg>
      <div className="absolute bob" style={{ left: 330, top: 86 }}><Pixel name="star" color="#FFE94D" size={6} /></div>
      <div className="absolute bob" style={{ right: 28, top: 420 }}><Pixel name="heart" color="#FF7A5C" size={7} /></div>
      <div className="absolute bob" style={{ left: 20, top: 520 }}><Pixel name="heart" color="#F7A8C8" size={6} /></div>
      <div className="absolute" style={{ left: 300, top: 760, transform: 'rotate(-8deg)' }}><Pixel name="floppy" color="#3B4BDB" size={7} /></div>
      <div className="absolute" style={{ right: 36, top: 140, transform: 'rotate(8deg)' }}><Pixel name="folder" color="#FFE94D" size={7} /></div>
    </div>
  )
}

const JUMPS = ['0 Start', '0b Cara Bermain', '1 Idle', '2 RAID dipilih', '3 Processing', '4 Stored', '5 Failure', '6 Rebuild', '7 RAID 0 Data Lost', '8 Dark mode', '9 Game Over (uang)', '10 Menang', '11 Start (Gelap)', '12 Game Over (Gelap)', '13 Menang (Gelap)', '14 Hari 30 belum rebuild'] as const

export default function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [modal, setModal] = useState<Modal>(null)
  const [seenHow, setSeenHow] = useState(false)
  const [diff, setDiff] = useState(1)
  const [text, setText] = useState('')
  const [raid, setRaid] = useState<Raid | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealed, setRevealed] = useState(0)
  const [disks, setDisks] = useState<DiskState[]>(ALL_OK)
  const [rebuildStep, setRebuildStep] = useState(0)
  const [lines, setLines] = useState<string[]>([])
  const [dark, setDark] = useState(false)
  const [popup, setPopup] = useState(false)
  const [day, setDay] = useState(1)
  const [money, setMoney] = useState(1500)
  const [floats, setFloats] = useState<{ id: number; t: string; c: string }[]>([])
  const [paused, setPaused] = useState(false)
  const [over, setOver] = useState<Over>(null)
  const [demo, setDemo] = useState(true)
  const [scale, setScale] = useState(1)
  const [cur, setCur] = useState(0)
  const [debug, setDebug] = useState(false)
  const timers = useRef<number[]>([])
  const termRef = useRef<HTMLDivElement>(null)
  const tickRef = useRef<() => void>(() => {})
  const fid = useRef(0)
  const cooldown = useRef(0)

  useEffect(() => {
    const f = () => setScale(Math.min(window.innerWidth / 1440, (window.innerHeight - 70) / 1024))
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  useEffect(() => { termRef.current?.scrollTo({ top: 99999 }) }, [lines])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => { if (popup && !over) { const t = window.setTimeout(() => setPopup(false), 3200); return () => clearTimeout(t) } }, [popup, over])

  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const say = (l: string) => setLines((p) => [...p, l])
  const addMoney = (d: number) => {
    setMoney((m) => m + d)
    const id = ++fid.current
    setFloats((f) => [...f, { id, t: `${d > 0 ? '+' : '-'}$${Math.abs(d)}`, c: d > 0 ? '#8CB35C' : '#D97F3D' }])
    window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400)
  }

  const cells = useMemo(() => buildCells(text, raid), [text, raid])
  const failedCount = disks.filter((s) => s === 'failed').length
  const damaged = disks.filter((s) => s !== 'ok').length
  const anyRebuilding = disks.includes('rebuilding')
  const lost = over?.kind === 'lost'
  const status = lost ? 'DATA LOST' : damaged > 0 ? 'DEGRADED' : 'OPTIMAL'
  const statusColor = lost ? '#E5322D' : status === 'DEGRADED' ? '#D97F3D' : '#8CB35C'
  const [avail, waste] = EFF[raid ?? 'RAID 0']
  const alive = screen === 'game' && !over
  const canStore = alive && !!raid && text.length > 0 && phase === 'idle'
  const canFail = alive && phase === 'stored' && disks.includes('ok')
  const canRebuild = alive && !!raid && raid !== 'RAID 0' && disks.includes('replaced') && !anyRebuilding
  const clockOn = alive && !paused && !modal && !demo && phase === 'stored'
  const lockPick = !demo && phase !== 'idle'

  /* ---- game rules ---- */
  const endLost = (reason: string) => { clear(); setOver({ kind: 'lost', reason }); setPopup(false); say(`> !! GAME OVER: ${reason}`) }
  const failDisk = (d: number, moneyNow: number) => {
    if (!raid) return
    const next = disks.map((s, i) => (i === d ? 'failed' : s)) as DiskState[]
    setDisks(next); setPopup(true); cooldown.current = 2
    say(`> !! ERROR: Disk ${d + 1} terbakar / tidak merespons`)
    const bad = next.filter((s) => s !== 'ok').length
    if (bad >= TOLERANCE[raid]) {
      setDisks(next)
      return endLost(raid === 'RAID 0' ? R_RAID0 : raid === 'RAID 5' ? '2 disk RAID 5 rusak bersamaan' : '3 disk rusak bersamaan')
    }
    if (moneyNow < REPLACE_COST) return endLost(R_NOMONEY)
    say(`> Mode DEGRADED: ${raid} tetap berjalan. Beli pengganti untuk Disk ${d + 1}`)
  }
  tickRef.current = () => {
    if (day >= 30) {
      if (damaged === 0) { setOver({ kind: 'win', reason: '' }); say('> Hari ke-30 tercapai. Server selamat!') }
      else if (disks.includes('failed') && money < REPLACE_COST) endLost(R_NOMONEY)
      return
    }
    const nd = day + 1
    setDay(nd)
    const inc = incomeFor(avail)
    addMoney(inc)
    const m = money + inc
    if (nd % 5 === 0) say(`> [Hari ${nd}] Server stabil. Saldo $${m}`)
    if (cooldown.current > 0) cooldown.current--
    else {
      const p = (0.03 + nd * 0.008) * [0.6, 1, 1.5][diff]
      const okDisks = disks.map((s, i) => (s === 'ok' ? i : -1)).filter((i) => i >= 0)
      if (okDisks.length && Math.random() < p) return failDisk(okDisks[Math.floor(Math.random() * okDisks.length)], m)
    }
    if (disks.includes('failed') && m < REPLACE_COST) endLost(R_NOMONEY)
  }
  useEffect(() => {
    if (!clockOn) return
    const id = window.setInterval(() => tickRef.current(), 1000)
    return () => clearInterval(id)
  }, [clockOn])

  const buy = (d: number) => {
    if (money < REPLACE_COST) return
    setDemo(false)
    addMoney(-REPLACE_COST)
    setDisks((p) => p.map((s, i) => (i === d ? 'replaced' : s)) as DiskState[])
    say(`> Disk pengganti untuk Disk ${d + 1} dipasang ($${REPLACE_COST}). Klik "Jalankan Rebuild Data"`)
  }
  const startRebuild = () => {
    setDemo(false); setRebuildStep(0); setPopup(false)
    setDisks((p) => p.map((s) => (s === 'replaced' ? 'rebuilding' : s)) as DiskState[])
    say('> Reading surviving blocks...')
  }
  // rebuild progress: 10 steps x 300ms = 3s
  useEffect(() => {
    if (!anyRebuilding || !alive || paused || modal) return
    const id = window.setInterval(() => setRebuildStep((s) => s + 1), 300)
    return () => clearInterval(id)
  }, [anyRebuilding, alive, paused, modal])
  useEffect(() => {
    if (!anyRebuilding || !raid || rebuildStep === 0) return
    if (rebuildStep >= 10) {
      setDisks((p) => p.map((s) => (s === 'rebuilding' ? 'ok' : s)) as DiskState[])
      setRebuildStep(0); say('> Rebuild complete. Integrity: OK')
      return
    }
    if ((rebuildStep - 1) % 3 === 0) {
      const k = (rebuildStep - 1) / 3
      disks.forEach((s, d) => {
        if (s !== 'rebuilding') return
        const mine = cells.filter((c) => c.disk === d)
        if (k < mine.length) {
          const src = [d ^ 1, 0, 1, 2, 3].find((x) => x !== d && disks[x] === 'ok') ?? d ^ 1
          say(`> ${recoveryLine(raid, mine[k], cells, d, src)}`)
        }
      })
    }
    // eslint-disable-next-line
  }, [rebuildStep])

  /* ---- sim actions ---- */
  const store = (r: Raid, t: string) => {
    clear(); setDemo(false); setRevealed(0); setDisks(ALL_OK); setPhase('processing')
    const cs = buildCells(t, r)
    setLines([`> Memproses "${t}" dengan ${r}...`, '> Membagi data ke 4 disk via data bus'])
    cs.forEach((_, i) => later(() => setRevealed(i + 1), 500 + i * 280))
    later(() => { setPhase('stored'); say('> Data berhasil disimpan. Server online, hari berjalan!') }, 700 + cs.length * 280)
  }
  const manualFail = () => {
    setDemo(false)
    const ok = disks.map((s, i) => (s === 'ok' ? i : -1)).filter((i) => i >= 0)
    failDisk(ok[Math.floor(Math.random() * ok.length)], money)
  }
  const resetSim = (r: Raid | null, t: string) => { clear(); setRaid(r); setText(t); setPhase('idle'); setRevealed(0); setDisks(ALL_OK); setRebuildStep(0); setPopup(false) }
  const pickRaid = (r: Raid) => { setDemo(false); resetSim(r, text); setLines([`> ${r} dipilih (${EFF[r][0]}% kapasitas tersedia)`]) }

  const startGame = () => {
    resetSim(null, 'DATA'); setScreen('game'); setModal(null); setSeenHow(true); setDemo(false); setPaused(false); setOver(null)
    setDay(1); setMoney(START_POINTS); setFloats([]); cooldown.current = 2; setCur(2)
    setLines(['raid-shield:~$ boot server...', '> Pilih RAID, lalu "Proses Penyimpanan" untuk menyalakan server.'])
  }
  const toMenu = () => { clear(); setScreen('start'); setModal(null); setOver(null); setPaused(false); setCur(0) }
  const pressStart = () => (seenHow ? startGame() : setModal('how'))

  /* ---- prototype flow jumps ---- */
  const setup = (o: { raid: Raid | null; text: string; stored?: boolean; disks?: DiskState[]; day?: number; money?: number; dark?: boolean; lines: string[]; over?: Over; step?: number; popup?: boolean }) => {
    resetSim(o.raid, o.text); setScreen('game'); setModal(null); setDemo(true); setPaused(false); setSeenHow(true)
    setPhase(o.stored ? 'stored' : 'idle'); setRevealed(o.stored ? buildCells(o.text, o.raid).length : 0)
    setDisks(o.disks ?? ALL_OK); setDay(o.day ?? 1); setMoney(o.money ?? START_POINTS); setDark(!!o.dark); setLines(o.lines)
    setOver(o.over ?? null); setRebuildStep(o.step ?? 0); setPopup(!!o.popup); setFloats([])
  }
  const jump = (i: number) => {
    setCur(i); clear()
    const F: DiskState[] = ['ok', 'failed', 'ok', 'ok']
    const err = '> !! ERROR: Disk 2 terbakar / tidak merespons'
    if (i === 0) { setScreen('start'); setModal(null); setDark(false); setOver(null) }
    if (i === 1) { setScreen('start'); setModal('how'); setDark(false); setOver(null) }
    if (i === 2) setup({ raid: null, text: '', dark: false, lines: ['raid-shield:~$ menunggu perintah...'] })
    if (i === 3) setup({ raid: 'RAID 5', text: 'DATA', lines: ['> RAID 5 dipilih (75% kapasitas tersedia)'] })
    if (i === 4) { setup({ raid: 'RAID 5', text: 'DATA', lines: [] }); store('RAID 5', 'DATA'); setDemo(true) }
    if (i === 5) setup({ raid: 'RAID 5', text: 'DATA', stored: true, day: 4, money: 1580, lines: ['> Data berhasil disimpan. Server online, hari berjalan!'] })
    if (i === 6) setup({ raid: 'RAID 5', text: 'DATA', stored: true, disks: F, day: 9, money: 1730, popup: true, lines: ['> Data berhasil disimpan.', err, '> Mode DEGRADED: RAID 5 tetap berjalan. Beli pengganti untuk Disk 2'] })
    if (i === 7) setup({ raid: 'RAID 5', text: 'DATA', stored: true, disks: ['ok', 'rebuilding', 'ok', 'ok'], step: 4, day: 9, money: 1630, lines: [err, '> Disk pengganti untuk Disk 2 dipasang ($100).', '> Reading surviving blocks...', '> Data Blok 1 [D] ⊕ Data Blok 3 [T] ⊕ Parity [P] = Recovering Data Blok 2 [A]'] })
    if (i === 8) setup({ raid: 'RAID 0', text: 'DATA', stored: true, disks: F, day: 6, money: 1620, over: { kind: 'lost', reason: R_RAID0 }, lines: ['> Data berhasil disimpan.', err, '> !! GAME OVER: RAID 0 kehilangan 1 disk.'] })
    if (i === 9) setup({ raid: 'RAID 5', text: 'DATA', stored: true, disks: F, dark: true, day: 9, money: 1730, popup: true, lines: ['> Data berhasil disimpan.', err, '> Mode DEGRADED: RAID 5 tetap berjalan.'] })
    if (i === 10) setup({ raid: 'RAID 5', text: 'DATA', stored: true, disks: F, day: 14, money: 40, over: { kind: 'lost', reason: R_NOMONEY }, lines: [err, '> !! GAME OVER: Uang habis.'] })
    if (i === 12) { setScreen('start'); setModal(null); setDark(true); setOver(null) }
    if (i === 13) setup({ raid: 'RAID 5', text: 'DATA', stored: true, disks: ['ok', 'failed', 'failed', 'ok'], dark: true, day: 17, money: 1180, over: { kind: 'lost', reason: '2 disk RAID 5 rusak bersamaan' }, lines: [err, '> !! GAME OVER: 2 disk rusak.'] })
    if (i === 14) setup({ raid: 'RAID 5', text: 'DATA', stored: true, dark: true, day: 30, money: 1640, over: { kind: 'win', reason: '' }, lines: ['> Hari ke-30 tercapai. Server selamat!'] })
    if (i === 15) setup({ raid: 'RAID 5', text: 'DATA', stored: true, disks: ['ok', 'replaced', 'ok', 'ok'], day: 30, money: 1500, lines: [err, '> Disk pengganti dipasang. Klik "Jalankan Rebuild Data"'] })
    if (i === 11) setup({ raid: 'RAID 10', text: 'DATA', stored: true, day: 30, money: 2010, over: { kind: 'win', reason: '' }, lines: ['> Hari ke-30 tercapai. Server selamat!'] })
  }

  /* ---- disk view ---- */
  const roles = (d: number) => {
    if (!raid) return 'KOSONG'
    if (raid === 'RAID 1' && d > 1) return 'STANDBY'
    if (raid === 'RAID 1') return 'MIRROR'
    if (raid === 'RAID 10') return d < 2 ? 'MIRROR A' : 'MIRROR B'
    if (raid === 'RAID 5') return 'DATA + P'
    return 'STRIPE'
  }
  const lowMoney = money < 200

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: '#1d1b26' }}>
      <div style={{ width: 1440 * scale, height: 1024 * scale }}>
        <div className={`frame ${dark ? 'dark' : ''} ${lost ? 'shake' : ''}`} style={{ transform: `scale(${scale})`, ['--s' as string]: scale }}>
          {screen === 'start' && <StartScreen onStart={pressStart} onHow={() => setModal('how')} onSettings={() => setModal('settings')} />}

          {screen === 'game' && (<>
          <Decor />

          {/* HEADER */}
          <header className="absolute left-0 right-0 top-0 flex items-center gap-4 px-6" style={{ height: 72, background: 'var(--card)', borderBottom: '3px solid var(--ink)', zIndex: 30 }}>
            <div className="flex items-center gap-3">
              <Sticker bg="#FFE94D" rot={-5} className="!p-2 !rounded-xl"><Pixel name="trex" size={4} /></Sticker>
              <span className="font-display" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>RAID-Shield</span>
            </div>
            <div className="nb flex items-center gap-3 px-4 py-2 rounded-full ml-3" style={{ background: 'var(--card)' }}>
              <span className="rounded-full" style={{ width: 16, height: 16, background: statusColor, border: '3px solid var(--ink)' }} />
              <span className="font-display whitespace-nowrap" style={{ fontWeight: 800, letterSpacing: '.05em', fontSize: 17 }}>STATUS: {status}</span>
            </div>
            {/* HARI */}
            <div className="nb flex items-center gap-2 px-3 py-1 rounded-xl" style={{ background: '#FFE94D', color: '#111', transform: 'rotate(-1.5deg)', width: 168 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" stroke="#111" strokeWidth="2.5" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" /></svg>
              <div className="flex-1">
                <div className="font-display font-extrabold text-[15px] leading-none mb-1">HARI {day}/30</div>
                <div className="rounded-full overflow-hidden" style={{ height: 8, border: '2px solid #111', background: '#fff' }}><div style={{ width: `${(day / 30) * 100}%`, height: '100%', background: '#3B4BDB', transition: 'width .4s' }} /></div>
              </div>
            </div>
            {/* POIN */}
            <div className={`nb relative flex items-center gap-2 px-3 py-1 rounded-xl ${lowMoney ? 'pulse-warn' : ''}`} style={{ background: '#A8E6CF', color: '#111', transform: 'rotate(1.5deg)', width: 160, height: 46 }}>
              <Pixel name="coin" color="#FFE94D" size={3} />
              <div className="font-display font-extrabold text-[15px] leading-none whitespace-nowrap">POIN <span className="font-mono text-[18px]">${money}</span></div>
              {floats.map((f) => <span key={f.id} className="floatup" style={{ color: f.c }}>{f.t}</span>)}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button onClick={() => setPaused((p) => !p)} disabled={!!over} className="btn rounded-full px-4 h-[44px] flex items-center gap-2 text-[14px]" style={{ background: '#B9A8F5' }}>
                {paused ? <svg width="14" height="14" viewBox="0 0 14 14" fill="#111"><path d="M2 1 13 7 2 13z" /></svg> : <svg width="14" height="14" viewBox="0 0 14 14" fill="#111"><rect x="1" y="1" width="4" height="12" /><rect x="9" y="1" width="4" height="12" /></svg>}
                {paused ? 'LANJUT' : 'PAUSE'}
              </button>
              <button aria-label="Cara bermain" onClick={() => setModal('how')} className="btn rounded-full font-display" style={{ width: 44, height: 44, background: '#FFE94D', fontSize: 22, fontWeight: 800 }}>?</button>
              <button aria-label="Toggle theme" onClick={() => setDark(!dark)} className="btn relative flex items-center rounded-full" style={{ width: 96, height: 44, background: dark ? '#3B4BDB' : '#FFE94D' }}>
                <svg className="absolute left-2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill="#fff" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></svg>
                <svg className="absolute right-2" width="22" height="22" viewBox="0 0 24 24" fill="#fff" stroke="#111" strokeWidth="2.5" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></svg>
                <span className="absolute rounded-full" style={{ width: 28, height: 28, top: 5, left: dark ? 56 : 5, background: '#fff', border: '3px solid #111', transition: 'left .2s' }} />
              </button>
            </div>
          </header>

          {/* SIDEBAR */}
          <aside className="absolute" style={{ left: 16, top: 88, width: 344, height: 712, zIndex: 10 }}>
            <Win title="Panel Kontrol Simulasi" color="#B9A8F5" className="h-full" right={<Pixel name="floppy" color="#FFE94D" size={3} />}>
              <div className="flex-1 flex flex-col gap-4 p-4" style={{ minHeight: 0 }}>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="in" className="font-bold text-[15px]">Input Data</label>
                    <Sticker bg="#A8E6CF" rot={4} className="!text-[11px] !py-0">{text.length}/12</Sticker>
                  </div>
                  <input id="in" value={text} maxLength={12} disabled={lockPick} placeholder="Ketik: DATA" onChange={(e) => { setDemo(false); resetSim(raid, e.target.value.toUpperCase()); setLines(['> Input diubah: siap diproses']) }}
                    className="nb w-full px-4 py-3 rounded-xl font-mono outline-none focus:bg-[#FFF6B8] focus:text-[#111] disabled:opacity-60" style={{ background: 'var(--card)', fontSize: 18, fontWeight: 700, letterSpacing: '.1em', boxShadow: '4px 4px 0 var(--ink)' }} />
                </div>

                <div>
                  <div className="font-bold text-[15px] mb-2">Pemilih Arsitektur</div>
                  <div className="grid grid-cols-2 gap-3">
                    {RAIDS.map((r) => (
                      <button key={r.id} disabled={lockPick} onClick={() => pickRaid(r.id)} className={`pick px-3 py-3 ${raid === r.id ? 'on' : ''}`} aria-pressed={raid === r.id}>
                        <div className="font-display" style={{ fontWeight: 800, fontSize: 21, lineHeight: 1.1 }}>{r.id}</div>
                        <div className="text-[13px] opacity-80 mt-1">{r.cap}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-1">
                  <div className="font-bold text-[15px] -mb-1">Action Center</div>
                  <button disabled={!canStore} onClick={() => { setCur(4); store(raid!, text) }} className="btn px-4 py-4 text-[17px]" style={{ background: '#3B4BDB', color: '#fff' }}>Proses Penyimpanan</button>
                  <button disabled={!canRebuild} onClick={() => { setCur(7); startRebuild() }} className="btn px-4 py-6 text-[20px]" style={{ background: '#8CB35C' }}>Jalankan Rebuild Data</button>
                  {debug && <button disabled={!canFail} onClick={manualFail} className="btn px-3 py-1 text-[12px]" style={{ background: '#D97F3D' }}>Debug: Rusakkan Drive</button>}
                  <div className="text-[12px] opacity-70 leading-snug">
                    {raid === 'RAID 0' ? 'RAID 0 tidak bisa di-rebuild.' : failedCount > 0 ? 'Beli disk pengganti ($100) dulu, lalu rebuild.' : 'Rebuild aktif setelah disk rusak dan diganti.'}
                  </div>
                </div>
              </div>
            </Win>
          </aside>

          {/* MAIN STAGE */}
          <main className="absolute" style={{ left: 376, top: 88, width: 1048, height: 712, zIndex: 10 }}>
            <Win title="Panggung Visualisasi Disk" color="#A8E6CF" className="h-full" right={<span className="flex items-center gap-2">{phase === 'processing' && <Sticker bg="#FFE94D" rot={4} className="!py-0 !text-[11px]">PLAYING</Sticker>}{phase === 'stored' && !over && <Sticker bg="#B9A8F5" rot={3} className="!py-0 !text-[11px]">STORED</Sticker>}</span>}>
              <div className="relative flex-1 px-5 pt-4 pb-5" style={{ minHeight: 0 }}>
                <div className="relative" style={{ height: 112 }}>
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 nb flex items-center gap-2 px-4 py-1.5 rounded-xl" style={{ background: '#3B4BDB', color: '#fff', zIndex: 2 }}>
                    <span className="text-[12px] font-bold opacity-80">INPUT PANEL KONTROL</span>
                    <span className="font-mono font-bold text-[18px] tracking-widest" style={{ color: '#FFE94D' }}>{text || '----'}</span>
                  </div>
                  <svg className="absolute inset-0" width="100%" height="112" viewBox="0 0 1008 112" preserveAspectRatio="none">
                    {[0, 1, 2, 3].map((d) => {
                      const x = 120 + d * 256
                      const live = phase === 'processing' || disks[d] === 'rebuilding'
                      const dead = disks[d] === 'failed'
                      return <path key={d} d={`M504 38 V68 H${x} V112`} fill="none" stroke={dead ? '#D97F3D' : live ? '#3B4BDB' : 'var(--ink)'} strokeWidth="4" strokeDasharray="10 8" strokeLinecap="round" className={live ? 'bus-live' : ''} opacity={live || phase !== 'idle' ? 1 : 0.4} />
                    })}
                  </svg>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((d) => {
                    const s = disks[d]
                    const isFailed = s === 'failed'
                    const isRebuild = s === 'rebuilding'
                    const isNew = s === 'replaced'
                    const standby = raid === 'RAID 1' && d > 1
                    const mine = cells.map((c, order) => ({ c, order })).filter((x) => x.c.disk === d)
                    const recoveredN = isRebuild ? Math.ceil((rebuildStep / 10) * mine.length) : 0
                    const green = isRebuild || isNew
                    return (
                      <div key={d} className="relative rounded-2xl p-3" style={{ background: 'var(--card)', border: `3px ${green || standby ? 'dashed' : 'solid'} ${green ? '#8CB35C' : 'var(--ink)'}`, boxShadow: `4px 4px 0 ${green ? '#8CB35C' : 'var(--ink)'}`, opacity: standby && !isFailed ? 0.65 : 1 }}>
                        <div className="flex items-center gap-2 mb-2">
                          <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="var(--ink)" strokeWidth="3"><rect x="2" y="5" width="30" height="24" rx="5" fill="#B9A8F5" /><circle cx="17" cy="17" r="7" fill="#fff" /><circle cx="17" cy="17" r="2" fill="#111" /></svg>
                          <span className="font-display" style={{ fontSize: 20, fontWeight: 800 }}>Disk {d + 1}</span>
                          <span className="ml-auto rounded-full" style={{ width: 14, height: 14, border: '3px solid var(--ink)', background: isFailed ? '#E5322D' : green ? '#FFE94D' : standby || !raid ? '#999' : '#8CB35C' }} />
                        </div>
                        <Sticker bg={standby ? '#e2dccd' : '#FFE94D'} rot={d % 2 ? 3 : -3} className="!text-[10px] !py-0 !px-2 mb-3">{standby ? 'STANDBY' : roles(d)}</Sticker>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {Array.from({ length: 12 }, (_, r) => {
                            const m = mine.find((x) => x.c.row === r)
                            const shown = m && m.order < revealed
                            const idxIn = m ? mine.indexOf(m) : -1
                            if (!shown || isNew || (isRebuild && idxIn >= recoveredN)) return <div key={r} className="slot" style={shown && green ? { borderColor: '#8CB35C' } : undefined} />
                            const c = m.c
                            const justNow = isRebuild && idxIn === recoveredN - 1
                            return (
                              <div key={r} className={`block ${(phase === 'processing' && m.order === revealed - 1) || justNow ? 'fly' : ''} ${isFailed ? 'burnt' : ''}`} style={{ background: c.parity ? '#F7A8C8' : colorFor(c.ch) }}>
                                {c.ch}
                                {c.parity && <span className="absolute -top-2 -right-2 text-[9px] font-bold px-1 rounded" style={{ background: '#fff', border: '2px solid #111', color: '#111' }}>PAR</span>}
                              </div>
                            )
                          })}
                        </div>

                        {isFailed && (
                          <div className="absolute inset-0 rounded-2xl overflow-hidden pop pointer-events-none" style={{ background: 'rgba(217,127,61,.18)' }}>
                            <div className="glitch" style={{ top: '30%' }} /><div className="glitch" style={{ top: '62%', animationDelay: '.2s' }} />
                            <svg className="absolute inset-0" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M12 10 88 90M88 10 12 90" stroke="#111" strokeWidth="14" strokeLinecap="round" vectorEffect="non-scaling-stroke" /><path d="M12 10 88 90M88 10 12 90" stroke="#D97F3D" strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" /></svg>
                          </div>
                        )}
                        {isFailed && [0, 1, 2, 3].map((k) => <span key={k} className="smoke" style={{ left: 50 + k * 38, top: 20, animationDelay: `${k * 0.5}s` }} />)}
                        {isFailed && !over && (
                          <button onClick={() => buy(d)} disabled={money < REPLACE_COST} className="btn absolute left-3 right-3 bottom-3 py-2 text-[13px] leading-tight" style={{ background: '#FFE94D', zIndex: 5 }}>Beli Pengganti (${REPLACE_COST})</button>
                        )}
                        {isNew && <div className="absolute inset-x-0 bottom-3 text-center text-[12px] font-bold">Disk baru terpasang<br />siap di-rebuild</div>}
                        {isRebuild && <div className="absolute -top-4 left-1/2 -translate-x-1/2"><Sticker bg="#8CB35C" rot={-4}>REBUILDING...</Sticker></div>}
                        {isFailed && !lost && <div className="absolute -top-4 left-1/2 -translate-x-1/2"><Sticker bg="#D97F3D" rot={5}>DEGRADED</Sticker></div>}
                        {damaged === 0 && phase !== 'idle' && !standby && d === 0 && <div className="absolute -top-4 -left-3"><Sticker bg="#8CB35C" rot={-6} className="!text-[11px]">OPTIMAL</Sticker></div>}
                      </div>
                    )
                  })}
                </div>

                {phase === 'idle' && !over && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-3 nb rounded-xl px-4 py-2 text-[14px] font-bold" style={{ background: '#FFE94D', color: '#111' }}>
                    {raid ? 'Tekan "Proses Penyimpanan" untuk menyalakan server' : 'Pilih arsitektur RAID di panel kiri untuk memulai'}
                  </div>
                )}

                {popup && !over && failedCount > 0 && (
                  <div className="absolute pop" style={{ left: 330, top: 300, width: 330, zIndex: 20, transform: 'rotate(-2deg)' }}>
                    <Win title="SYSTEM FAILURE" color="#D97F3D" onClose={() => setPopup(false)}>
                      <div className="p-4 flex gap-3 items-center">
                        <Pixel name="warn" color="#FFE94D" size={5} />
                        <div className="text-[14px] leading-snug"><b>Disk rusak!</b><br />Klik "Beli Pengganti ($100)" pada disk merah, lalu rebuild.</div>
                      </div>
                    </Win>
                  </div>
                )}

              </div>
            </Win>
          </main>

          {/* BOTTOM */}
          <section className="absolute flex gap-4" style={{ left: 16, right: 16, top: 816, height: 192, zIndex: 10 }}>
            <Win title="Terminal Parity" color="#FFE94D" className="h-full" right={<span className="font-mono text-[11px]">bash</span>}>
              <div ref={termRef} className="term flex-1 overflow-y-auto px-4 py-3 font-mono" style={{ background: '#333', color: '#8CB35C', fontSize: 13.5, lineHeight: '20px', fontWeight: 500 }}>
                {lines.map((l, i) => (
                  <div key={i} style={{ color: l.includes('!!') ? '#D97F3D' : undefined }}>{l}</div>
                ))}
                <div>{'>'} <span className="cursor" /></div>
              </div>
            </Win>
            <Win title="Efisiensi Penyimpanan" color="#F7A8C8" className="h-full">
              <div className="flex-1 flex items-center gap-5 px-5">
                <div className="relative flex-none" style={{ width: 128, height: 128 }}>
                  <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="64" cy="64" r="46" fill="none" stroke="var(--ink)" strokeWidth="38" />
                    <circle cx="64" cy="64" r="46" fill="none" stroke="#D97F3D" strokeWidth="30" />
                    {avail > 0 && <circle cx="64" cy="64" r="46" fill="none" stroke="#8CB35C" strokeWidth="30" strokeDasharray={`${(avail / 100) * 289.03} 289.03`} style={{ transition: 'stroke-dasharray .5s' }} />}
                    {avail > 0 && avail < 100 && <line x1="64" y1="3" x2="64" y2="33" stroke="var(--ink)" strokeWidth="3" />}
                    {avail > 0 && avail < 100 && <line x1="64" y1="3" x2="64" y2="33" stroke="var(--ink)" strokeWidth="3" transform={`rotate(${avail * 3.6} 64 64)`} />}
                  </svg>
                  <div className="absolute inset-0 grid place-items-center font-display" style={{ fontSize: 26, fontWeight: 800 }}>{avail}%</div>
                </div>
                <div className="flex flex-col gap-2 text-[14px] font-bold">
                  <div className="flex items-center gap-2"><span className="inline-block" style={{ width: 18, height: 18, background: '#8CB35C', border: '3px solid var(--ink)', borderRadius: 4 }} />Kapasitas Tersedia <span className="font-mono ml-1">{avail}%</span></div>
                  <div className="flex items-center gap-2"><span className="inline-block" style={{ width: 18, height: 18, background: '#D97F3D', border: '3px solid var(--ink)', borderRadius: 4 }} />Redundansi/Terbuang <span className="font-mono ml-1">{waste}%</span></div>
                  <Sticker bg="#FFE94D" rot={-3} className="self-start !text-[11px]">{raid ?? 'PILIH RAID'} {raid ? `· ${incomeFor(avail) >= 0 ? '+' : '-'}$${Math.abs(incomeFor(avail))}/hari` : ''}</Sticker>
                </div>
              </div>
            </Win>
          </section>
          <style>{`section > div:first-child{width:60%}section > div:last-child{width:40%}`}</style>

          {paused && !over && !modal && (
            <Overlay>
              <div className="modal-in" style={{ width: 380 }}>
                <Win title="PAUSED.exe" color="#B9A8F5" style={{ boxShadow: '8px 8px 0 var(--ink)' }}>
                  <div className="p-6 text-center">
                    <div className="font-display" style={{ fontSize: 40, fontWeight: 800 }}>PAUSE</div>
                    <div className="text-[14px] mb-4">Waktu server berhenti sementara.</div>
                    <button onClick={() => setPaused(false)} className="btn w-full py-3 text-[18px]" style={{ background: '#8CB35C' }}>LANJUTKAN</button>
                  </div>
                </Win>
              </div>
            </Overlay>
          )}
          </>)}

          {screen === 'game' && day >= 30 && damaged > 0 && !over && (
            <div className="absolute pop" style={{ left: 520, top: 100, zIndex: 50 }}><Sticker bg="#FFE94D" rot={-3} className="!text-[15px] !px-4 !py-1">Selesaikan rebuild dulu untuk menang!</Sticker></div>
          )}
          {lost && <div className="gflash" key="gf" />}
          {lost && <GameOverPopup reason={over!.reason} day={day} points={money} raid={raid} onRetry={startGame} onMenu={toMenu} />}
          {over?.kind === 'win' && <WinPopup points={money} raid={raid} onAgain={startGame} onMenu={toMenu} />}
          {screen === 'game' && !over && <button className={`dbg ${debug ? 'on' : ''}`} onClick={() => setDebug((d) => !d)}>Debug {debug ? 'ON' : 'off'}</button>}
          {modal === 'how' && <HowTo onClose={() => setModal(null)} onOk={() => (screen === 'start' ? startGame() : setModal(null))} />}
          {modal === 'settings' && <Settings onClose={() => setModal(null)} dark={dark} setDark={setDark} diff={diff} setDiff={setDiff} />}
        </div>
      </div>

      <nav className="flex items-center gap-2 flex-wrap justify-center px-4" style={{ minHeight: 64, paddingTop: 8, maxWidth: 1440 }}>
        <span className="text-white/60 text-xs font-bold mr-2">FLOW PROTOTYPE</span>
        {JUMPS.map((j, i) => (
          <button key={j} className={`jump ${cur === i ? 'cur' : ''}`} onClick={() => jump(i)}>{j}</button>
        ))}
      </nav>
    </div>
  )
}
