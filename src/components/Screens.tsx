import { useEffect, useRef, useState } from 'react'
import { Pixel, Sticker, Win } from './ui'

const Squiggle = ({ color = 'var(--ink)', w = 200, className = '', style }: { color?: string; w?: number; className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} width={w} height="30" viewBox="0 0 200 30"><path d="M2 15 Q 14 -5 26 15 T 50 15 T 74 15 T 98 15 T 122 15 T 146 15 T 170 15 T 194 15" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" /></svg>
)

function Float({ name, color, size, x, y, rot = 0, delay = 0 }: { name: string; color: string; size: number; x: number; y: number; rot?: number; delay?: number }) {
  return <div className="absolute drift" style={{ left: x, top: y, ['--r' as string]: `${rot}deg`, animationDelay: `${delay}s` }}><Pixel name={name} color={color} size={size} /></div>
}

export function StartScreen({ onStart, onHow, onSettings, record }: { onStart: () => void; onHow: () => void; onSettings: () => void; record: { bestScore: number; bestDays: number } }) {
  return (
    <div className="absolute inset-0" style={{ zIndex: 5 }}>
      {/* shapes */}
      <div className="absolute rounded-full" style={{ width: 520, height: 520, left: -170, top: -150, background: '#B9A8F5', border: '3px solid var(--ink)' }} />
      <div className="absolute rounded-full" style={{ width: 380, height: 380, right: -110, top: 40, background: '#F7A8C8', border: '3px solid var(--ink)' }} />
      <div className="absolute" style={{ width: 420, height: 300, left: 40, bottom: -90, background: '#A8E6CF', border: '3px solid var(--ink)', borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%' }} />
      <div className="absolute rounded-full drift" style={{ width: 150, height: 150, right: 160, bottom: 60, background: '#FFE94D', border: '3px solid var(--ink)' }} />
      <Squiggle className="absolute" style={{ left: 440, top: 70 }} w={260} />
      <Squiggle className="absolute" color="#FF7A5C" style={{ right: 330, bottom: 90 }} w={240} />
      <Squiggle className="absolute" color="#3B4BDB" style={{ left: 80, top: 440 }} w={180} />

      {/* floating icons */}
      <Float name="folder" color="#FFE94D" size={9} x={170} y={300} rot={-8} />
      <Float name="floppy" color="#3B4BDB" size={9} x={1180} y={640} rot={8} delay={.6} />
      <Float name="hdd" color="#B9A8F5" size={10} x={1130} y={190} rot={6} delay={1.1} />
      <Float name="hdd" color="#FF7A5C" size={8} x={310} y={840} rot={-6} delay={.3} />
      <Float name="star" color="#FFE94D" size={8} x={560} y={110} delay={.2} />
      <Float name="star" color="#fff" size={6} x={1010} y={90} delay={1.4} />
      <Float name="star" color="#3B4BDB" size={7} x={90} y={720} delay={.9} />
      <Float name="heart" color="#FF7A5C" size={9} x={1290} y={440} delay={.5} />
      <Float name="heart" color="#F7A8C8" size={8} x={240} y={560} delay={1.7} />
      <Float name="folder" color="#A8E6CF" size={7} x={1000} y={870} rot={10} delay={1.2} />

      {/* mini pop-ups */}
      <Win title="Loading..." color="#FFE94D" className="absolute drift" style={{ left: 70, top: 120, width: 270, ['--r' as string]: '-4deg' } as React.CSSProperties}>
        <div className="p-4"><div className="text-[13px] font-bold mb-2 font-mono">Memuat disk array...</div><div className="nb rounded-md overflow-hidden" style={{ height: 22, boxShadow: '2px 2px 0 var(--ink)', background: 'var(--card)' }}><div className="load-bar h-full" style={{ background: '#8CB35C' }} /></div></div>
      </Win>
      <Win title="System Error" color="#FF7A5C" className="absolute drift" style={{ right: 70, top: 440, width: 270, ['--r' as string]: '4deg', animationDelay: '.8s' } as React.CSSProperties}>
        <div className="p-4 flex gap-3 items-center"><Pixel name="warn" color="#FFE94D" size={5} /><div className="text-[13px] font-bold leading-snug">Disk 2 tidak merespons!</div></div>
        <div className="px-4 pb-4"><div className="btn text-center py-1 text-[13px]" style={{ background: '#FFE94D' }}>OK</div></div>
      </Win>
      <Win title="Are you ready?" color="#A8E6CF" className="absolute drift" style={{ left: 90, top: 790, width: 250, ['--r' as string]: '3deg', animationDelay: '1.5s' } as React.CSSProperties}>
        <div className="p-3 flex gap-2"><span className="btn flex-1 text-center py-1 text-[13px]" style={{ background: '#8CB35C' }}>YES</span><span className="btn flex-1 text-center py-1 text-[13px]" style={{ background: '#F7A8C8' }}>NO</span></div>
      </Win>

      <div className="absolute flex gap-3 items-center" style={{ left: 760, top: 96, zIndex: 4 }}>
        <Sticker bg="#FFE94D" rot={4} className="!text-[15px] !px-4">REKOR: {record.bestScore} Poin</Sticker>
        <Sticker bg="#F7A8C8" rot={-4} className="!text-[13px]">TERLAMA: {record.bestDays} Hari</Sticker>
      </div>

      {/* center window */}
      <div className="absolute" style={{ left: 340, top: 150, width: 760 }}>
        <div className="absolute drift" style={{ left: 40, top: -78, zIndex: 3 }}><Pixel name="trex" size={8} /></div>
        <Win title="RAID-Shield.exe" color="#FFE94D" style={{ boxShadow: '8px 8px 0 var(--ink)' }}>
          <div className="flex flex-col items-center px-10 pt-9 pb-9 relative">
            <div className="logo-bounce font-display" style={{ fontSize: 112, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', textShadow: '5px 5px 0 #B9A8F5, 8px 8px 0 var(--ink)' }}>RAID-Shield</div>
            <div className="nb rounded-full px-6 py-2 mt-7 font-display" style={{ background: '#A8E6CF', color: '#111', fontSize: 24, fontWeight: 800 }}>Bertahan 30 Hari sebagai SysAdmin</div>
            <div className="flex items-center gap-3 mt-6 font-mono text-[14px] font-bold w-[420px]">
              <span>loading</span>
              <div className="nb rounded-md overflow-hidden flex-1" style={{ height: 20, boxShadow: '2px 2px 0 var(--ink)', background: 'var(--card)' }}><div className="load-bar h-full" style={{ background: '#3B4BDB' }} /></div>
              <span className="cursor" style={{ background: 'var(--txt)' }} />
            </div>
            <div className="flex flex-col gap-4 mt-7 w-[420px]">
              <button onClick={onStart} className="btn py-5 font-display" style={{ background: '#3B4BDB', color: '#fff', fontSize: 30, fontWeight: 800, letterSpacing: '.04em' }}>MULAI GAME</button>
              <div className="flex gap-4">
                <button onClick={onHow} className="btn flex-1 py-3 text-[17px]" style={{ background: '#FFE94D' }}>CARA BERMAIN</button>
                <button onClick={onSettings} className="btn flex-1 py-3 text-[17px]" style={{ background: '#B9A8F5' }}>PENGATURAN</button>
              </div>
            </div>
            <div className="absolute" style={{ right: -34, top: 28 }}><Sticker bg="#FF7A5C" rot={9} className="!text-[15px]">BETA</Sticker></div>
            <div className="absolute" style={{ left: -34, bottom: 120 }}><Sticker bg="#F7A8C8" rot={-8} className="!text-[15px]">30 HARI</Sticker></div>
            <div className="absolute" style={{ right: -26, bottom: 40 }}><Sticker bg="#8CB35C" rot={-5} className="!text-[15px]">NEW</Sticker></div>
          </div>
        </Win>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-8 font-mono text-[14px] font-bold">{'>'} press MULAI GAME to boot server<span className="cursor ml-1" style={{ background: 'var(--txt)' }} /></div>
    </div>
  )
}

function Rule({ icon, color, children }: { icon: string; color: string; children: React.ReactNode }) {
  return <li className="flex gap-3 items-start"><span className="mt-0.5"><Pixel name={icon} color={color} size={3} /></span><span>{children}</span></li>
}

export function Overlay({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return <div className="absolute inset-0 grid place-items-center" style={{ background: 'rgba(17,17,17,.55)', zIndex: 60 }} onClick={onClose}><div onClick={(e) => e.stopPropagation()}>{children}</div></div>
}

export function HowTo({ onClose, onOk }: { onClose: () => void; onOk: () => void }) {
  return (
    <Overlay onClose={onClose}>
      <div className="modal-in relative" style={{ width: 960 }}>
        <Win title="CARA_BERMAIN.exe" color="#FFE94D" onClose={onClose} style={{ boxShadow: '8px 8px 0 var(--ink)' }}>
          <div className="px-8 pt-5 pb-6" style={{ fontSize: 15, lineHeight: 1.4 }}>
            <div className="flex items-center gap-3 mb-3">
              <Pixel name="trex" size={4} />
              <h2 className="font-display" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>CARA BERMAIN</h2>
              <Sticker bg="#F7A8C8" rot={5}>30 HARI</Sticker>
            </div>
            <ul className="how-list">
              <Rule icon="book" color="#B9A8F5"><b>Tujuanmu:</b> Bertahan hidup sebagai SysAdmin selama <b>"30 Hari"</b> tanpa membiarkan data server hancur.</Rule>
              <Rule icon="coin" color="#FFE94D">Kamu punya modal awal <b>$1500</b>. Pilih tipe RAID yang menurutmu paling efisien.</Rule>
              <Rule icon="gear" color="#A8E6CF">Setiap hari yang berlalu, server akan menghasilkan uang.</Rule>
              <Rule icon="warn" color="#D97F3D"><b>BENCANA:</b> Sewaktu-waktu, Hard Disk bisa terbakar secara acak! Semakin lama, risiko semakin besar.</Rule>
            </ul>
            <div className="grid grid-cols-2 gap-5 mt-3">
              <div className="nb rounded-2xl p-4" style={{ background: 'var(--card)' }}>
                <Sticker bg="#3B4BDB" rot={-3} className="!text-white !text-[14px] mb-3">Cara Menyelamatkan Data</Sticker>
                <ol className="how-list mt-2 pl-0 list-none">
                  {['Saat disk rusak (merah), klik "Beli Pengganti ($100)".', 'Setelah disk baru dipasang, klik tombol besar "Rebuild Data" di kiri bawah.', 'Tunggu 3 detik. Jangan sampai disk lain rusak saat proses rebuild berlangsung!'].map((t, i) => (
                    <li key={i} className="flex gap-3 items-start"><span className="grid place-items-center flex-none rounded-full font-bold text-[13px]" style={{ width: 24, height: 24, background: '#FFE94D', color: '#111', border: '3px solid var(--ink)' }}>{i + 1}</span><span>{t}</span></li>
                  ))}
                </ol>
              </div>
              <div className="nb rounded-2xl p-4" style={{ background: 'var(--card)' }}>
                <Sticker bg="#D97F3D" rot={3} className="!text-[14px] mb-3 inline-flex items-center gap-2"><Pixel name="warn" color="#FFE94D" size={2} /> Peringatan Kritis (Game Over jika)</Sticker>
                <ul className="how-list mt-2">
                  <Rule icon="hdd" color="#FF7A5C"><b>RAID 0:</b> Jika 1 disk saja rusak = LANGSUNG GAME OVER.</Rule>
                  <Rule icon="hdd" color="#F7A8C8"><b>RAID 5:</b> Hanya tahan 1 disk rusak. Jika 2 disk rusak bersamaan = GAME OVER.</Rule>
                  <Rule icon="hdd" color="#B9A8F5"><b>RAID 1 & 10:</b> Tahan 2 disk rusak. Jika 3 disk rusak bersamaan = GAME OVER (Disederhanakan untuk game ini).</Rule>
                  <Rule icon="coin" color="#FFE94D">Kamu kehabisan uang dan tidak bisa membeli disk pengganti ($100)!</Rule>
                </ul>
              </div>
            </div>
            <button onClick={onOk} className="btn w-full mt-5 py-4 font-display" style={{ background: '#8CB35C', fontSize: 26, fontWeight: 800, letterSpacing: '.04em' }}>SAYA MENGERTI</button>
          </div>
        </Win>
        <div className="absolute" style={{ right: -18, top: -16 }}><Sticker bg="#FFE94D" rot={8}>NEW</Sticker></div>
      </div>
    </Overlay>
  )
}

function Group({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-bold mb-2">{label}</div>
      <div className="flex gap-3">{children}</div>
      {note && <div className="text-[12px] opacity-70 mt-1.5">{note}</div>}
    </div>
  )
}

export function Settings({ diff, speed, dark, sound, setDark, setSound, onSave, onCancel }: {
  diff: number; speed: 1 | 2; dark: boolean; sound: boolean
  setDark: (b: boolean) => void; setSound: (b: boolean) => void
  onSave: (diff: number, speed: 1 | 2) => void; onCancel: () => void
}) {
  const snap = useRef({ dark, sound })
  const [dDiff, setDDiff] = useState(diff)
  const [dSpeed, setDSpeed] = useState<1 | 2>(speed)
  const cancel = () => { setDark(snap.current.dark); setSound(snap.current.sound); onCancel() }
  const cancelRef = useRef(cancel)
  cancelRef.current = cancel
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelRef.current() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])
  const levels = ['Santai', 'Normal', 'Sulit']
  const Opt = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={`pick flex-1 py-2 text-center font-bold ${on ? 'on' : ''}`} aria-pressed={on}>{children}</button>
  )
  return (
    <Overlay onClose={cancel}>
      <div className="modal-in" style={{ width: 460 }}>
        <Win title="PENGATURAN.exe" color="#B9A8F5" onClose={cancel} style={{ boxShadow: '8px 8px 0 var(--ink)' }}>
          <div className="p-6 flex flex-col gap-4">
            <Group label="Tingkat Bencana" note="Berlaku mulai hari berikutnya">
              {levels.map((l, i) => <Opt key={l} on={dDiff === i} onClick={() => setDDiff(i)}>{l}</Opt>)}
            </Group>
            <Group label="Tema">
              <Opt on={!dark} onClick={() => setDark(false)}>Terang</Opt>
              <Opt on={dark} onClick={() => setDark(true)}>Gelap</Opt>
            </Group>
            <Group label="Suara">
              <Opt on={sound} onClick={() => setSound(true)}>Nyala</Opt>
              <Opt on={!sound} onClick={() => setSound(false)}>Mati</Opt>
            </Group>
            <Group label="Kecepatan Game" note="Berlaku mulai hari berikutnya">
              <Opt on={dSpeed === 1} onClick={() => setDSpeed(1)}>1x</Opt>
              <Opt on={dSpeed === 2} onClick={() => setDSpeed(2)}>2x</Opt>
            </Group>
            <div className="flex gap-3 mt-1">
              <button onClick={() => onSave(dDiff, dSpeed)} className="btn flex-1 py-3 text-[17px]" style={{ background: '#8CB35C' }}>SIMPAN</button>
              <button onClick={cancel} className="btn flex-1 py-3 text-[17px]" style={{ background: '#FBF3E4' }}>BATAL</button>
            </div>
          </div>
        </Win>
      </div>
    </Overlay>
  )
}

export function PauseMenu({ onResume, onHow, onSettings, onRetry, onMenu }: { onResume: () => void; onHow: () => void; onSettings: () => void; onRetry: () => void; onMenu: () => void }) {
  return (
    <Overlay>
      <div className="modal-in relative" style={{ width: 420 }}>
        <Win title="PAUSE.EXE" color="#B9A8F5" onClose={onResume} style={{ boxShadow: '8px 8px 0 var(--ink)' }}>
          <div className="p-6 flex flex-col gap-3">
            <div className="font-display text-center" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>PAUSE</div>
            <div className="text-center text-[13px] opacity-70 mb-1">Waktu server berhenti sementara.</div>
            <button onClick={onResume} className="btn py-3 text-[19px]" style={{ background: '#8CB35C' }}>LANJUTKAN</button>
            <button onClick={onHow} className="btn py-3 text-[17px]" style={{ background: '#FFE94D' }}>CARA BERMAIN</button>
            <button onClick={onSettings} className="btn py-3 text-[17px]" style={{ background: '#B9A8F5' }}>PENGATURAN</button>
            <button onClick={onRetry} className="btn py-3 text-[17px]" style={{ background: '#D97F3D' }}>ULANGI GAME</button>
            <button onClick={onMenu} className="btn py-3 text-[17px]" style={{ background: '#FBF3E4' }}>MENU UTAMA</button>
          </div>
        </Win>
        <div className="absolute" style={{ right: -22, top: -16 }}><Sticker bg="#FFE94D" rot={7} className="!text-[14px]">GAME DIJEDA</Sticker></div>
      </div>
    </Overlay>
  )
}

export function Confirm({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <Overlay onClose={onNo}>
      <div className="modal-in relative" style={{ width: 400 }}>
        <Win title="ARE YOU SURE?" color="#FF7A5C" onClose={onNo} style={{ boxShadow: '8px 8px 0 var(--ink)' }}>
          <div className="p-6">
            <div className="flex gap-4 items-center mb-5"><Pixel name="warn" color="#FFE94D" size={5} /><div className="font-bold text-[17px] leading-snug">Progres game akan hilang. Lanjut?</div></div>
            <div className="flex gap-3">
              <button onClick={onYes} className="btn flex-1 py-3 text-[18px]" style={{ background: '#D97F3D' }}>YA</button>
              <button onClick={onNo} className="btn flex-1 py-3 text-[18px]" style={{ background: '#FBF3E4' }}>BATAL</button>
            </div>
          </div>
        </Win>
      </div>
    </Overlay>
  )
}
