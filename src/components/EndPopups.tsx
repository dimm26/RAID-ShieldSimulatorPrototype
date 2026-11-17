import { useEffect, useMemo, useState } from 'react'
import { Pixel, Sticker, Win } from './ui'

export const WIN_BONUS = 500
export const starsFor = (points: number) => (points >= 2000 ? 3 : points >= 1000 ? 2 : 1)

function Backdrop({ children, tint }: { children: React.ReactNode; tint: string }) {
  return <div className="absolute inset-0 grid place-items-center" style={{ background: tint, zIndex: 60 }}>{children}</div>
}

function Stat({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <div className="nb rounded-xl px-4 py-2 flex items-center justify-between" style={{ background: bg, color: '#111' }}>
      <span className="text-[14px] font-bold">{label}</span>
      <span className="font-mono text-[18px] font-bold">{value}</span>
    </div>
  )
}

export function GameOverPopup({ reason, day, points, raid, onRetry, onMenu }: { reason: string; day: number; points: number; raid: string | null; onRetry: () => void; onMenu: () => void }) {
  return (
    <Backdrop tint="rgba(17,17,17,.55)">
      <div className="drop-in relative" style={{ width: 600 }}>
        <Win title="GAME_OVER.exe" color="#D97F3D" style={{ boxShadow: '8px 8px 0 var(--ink)' }}>
          <div className="px-6 pt-5 pb-3 flex items-center gap-5" style={{ background: '#D97F3D', borderBottom: '3px solid var(--ink)' }}>
            <div className="relative flex-none" style={{ width: 96, height: 96 }}>
              <div className="absolute inset-0 grid place-items-center rounded-2xl" style={{ background: '#FFE94D', border: '3px solid #111', boxShadow: '4px 4px 0 #111' }}>
                <Pixel name="trex" color="#333" size={6} accent="#FFE94D" style={{ transform: 'rotate(-12deg) translateY(4px)' }} />
              </div>
              <svg className="absolute" style={{ right: -12, top: -12 }} width="40" height="40" viewBox="0 0 24 24"><path d="M5 5 19 19M19 5 5 19" stroke="#111" strokeWidth="7" strokeLinecap="round" /><path d="M5 5 19 19M19 5 5 19" stroke="#E5322D" strokeWidth="3.5" strokeLinecap="round" /></svg>
            </div>
            <div className="font-display gtitle" style={{ fontSize: 66, fontWeight: 800, lineHeight: 1, color: '#FBF3E4', WebkitTextStroke: '2px #111', letterSpacing: '-.01em' }}>GAME OVER</div>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <div className="rounded-xl px-4 py-3 text-[16px] font-bold flex items-center gap-3" style={{ background: '#FFD9C2', border: '3px solid var(--ink)', color: '#111' }}>
              <Pixel name="warn" color="#D97F3D" size={3} />{reason}
            </div>
            <Stat label="Bertahan sampai" value={`Hari ${day}`} bg="#A8E6CF" />
            <Stat label="Poin akhir" value={`$${points}`} bg="#FFE94D" />
            <Stat label="Tipe RAID" value={raid ?? '-'} bg="#B9A8F5" />
            <div className="flex gap-4 mt-2">
              <button onClick={onRetry} className="btn flex-1 py-3 text-[20px]" style={{ background: '#8CB35C' }}>COBA LAGI</button>
              <button onClick={onMenu} className="btn flex-1 py-3 text-[20px]" style={{ background: '#FBF3E4' }}>MENU UTAMA</button>
            </div>
          </div>
        </Win>
        <div className="absolute" style={{ right: -22, top: -22 }}><Sticker bg="#E5322D" rot={9} className="!text-white !text-[16px] !px-4 !py-1">DATA LOST</Sticker></div>
      </div>
    </Backdrop>
  )
}

export function WinPopup({ points, raid, onAgain, onMenu }: { points: number; raid: string | null; onAgain: () => void; onMenu: () => void }) {
  const [bonus, setBonus] = useState(0)
  const stars = starsFor(points)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now() + 500
    const step = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / 1400))
      setBonus(Math.round(WIN_BONUS * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])
  const bits = useMemo(() => Array.from({ length: 44 }, (_, i) => ({
    left: (i * 97) % 1440, dur: 3.2 + ((i * 13) % 20) / 10, delay: -((i * 7) % 40) / 10, size: 3 + (i % 3),
    name: i % 3 === 0 ? 'heart' : 'star', color: ['#FFE94D', '#F7A8C8', '#8CB35C', '#3B4BDB', '#B9A8F5', '#FF7A5C'][i % 6],
  })), [])
  return (
    <Backdrop tint="rgba(17,17,17,.5)">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bits.map((b, i) => <div key={i} className="confetti" style={{ left: b.left, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}><Pixel name={b.name} color={b.color} size={b.size} /></div>)}
      </div>
      <div className="drop-in relative" style={{ width: 600 }}>
        <Win title="YOU_WIN.exe" color="#8CB35C" style={{ boxShadow: '8px 8px 0 var(--ink)' }}>
          <div className="px-6 py-5 text-center" style={{ background: '#8CB35C', borderBottom: '3px solid var(--ink)' }}>
            <div className="font-display" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.05, color: '#FBF3E4', WebkitTextStroke: '2px #111', textShadow: '3px 3px 0 #111' }}>YOU SURVIVED<br />30 DAYS!</div>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <div className="flex justify-center gap-3 py-1">
              {[0, 1, 2].map((i) => i < stars
                ? <div key={i} className="starpop" style={{ animationDelay: `${0.4 + i * 0.5}s` }}><svg width="64" height="64" viewBox="0 0 24 24"><path d="M12 2l3 6.8 7.4.7-5.6 4.9 1.7 7.2L12 17.7 5.5 21.6l1.7-7.2L1.6 9.5 9 8.8z" fill="#FFE94D" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" /></svg></div>
                : <div key={i} style={{ opacity: .35 }}><svg width="64" height="64" viewBox="0 0 24 24"><path d="M12 2l3 6.8 7.4.7-5.6 4.9 1.7 7.2L12 17.7 5.5 21.6l1.7-7.2L1.6 9.5 9 8.8z" fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeDasharray="2 2" strokeLinejoin="round" /></svg></div>)}
            </div>
            <Stat label={`Poin Akhir (${raid ?? '-'})`} value={`$${points}`} bg="#FFE94D" />
            <Stat label="Bonus Bertahan" value={`+$${bonus}`} bg="#A8E6CF" />
            <Stat label="Total Skor" value={`$${points + bonus}`} bg="#B9A8F5" />
            <div className="flex gap-4 mt-2">
              <button onClick={onAgain} className="btn flex-1 py-3 text-[20px]" style={{ background: '#3B4BDB', color: '#fff' }}>MAIN LAGI</button>
              <button onClick={onMenu} className="btn flex-1 py-3 text-[20px]" style={{ background: '#FBF3E4' }}>MENU UTAMA</button>
            </div>
          </div>
        </Win>
        <div className="absolute" style={{ right: -26, top: -22 }}><Sticker bg="#FFE94D" rot={8} className="!text-[16px] !px-4 !py-1">SYSDMIN LEGEND</Sticker></div>
      </div>
    </Backdrop>
  )
}
