import type { ReactNode } from 'react'

export const INK = '#111'
export const ART: Record<string, string[]> = {
  star: ['...X...', '...X...', '..XXX..', 'XXXXXXX', '..XXX..', '...X...', '...X...'],
  heart: ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'],
  trex: ['......XXXXX.', '......XwXXXX', '......XXXXXX', '......XXXX..', 'X....XXXXX..', 'XX..XXXXXXX.', 'XXXXXXXXXX..', '.XXXXXXXX...', '..XXXXXX....', '...XX.XX....', '...X..X.....'],
  floppy: ['kkkkkkkkk.', 'kXXwwwwXkk', 'kXXwwwwXXk', 'kXXwwwwXXk', 'kXXXXXXXXk', 'kXkkkkkkXk', 'kXkXXXXkXk', 'kXkXXXXkXk', 'kkkkkkkkkk'],
  folder: ['kkkk......', 'kXXXkkkkkk', 'kXXXXXXXXk', 'kXXXXXXXXk', 'kXXXXXXXXk', 'kXXXXXXXXk', 'kkkkkkkkkk'],
  warn: ['....X....', '...XXX...', '...XkX...', '..XXkXX..', '..XXkXX..', '.XXXXXXX.', '.XXXkXXX.', 'XXXXXXXXX'],
  book: ['kkkkkkkkk', 'kXXXkwwwk', 'kXXXkwkwk', 'kXXXkwwwk', 'kXXXkwkwk', 'kXXXkwwwk', 'kkkkkkkkk'],
  gear: ['...X.X...', '.XXXXXXX.', '.XXkkkXX.', 'XXXkwkXXX', '.XXkkkXX.', '.XXXXXXX.', '...X.X...'],
  coin: ['..kkkk..', '.kXXXXk.', 'kXXwwXXk', 'kXwXXXXk', 'kXwXXXXk', 'kXXXXXXk', '.kXXXXk.', '..kkkk..'],
  hdd: ['kkkkkkkkkk', 'kXXXXXXXXk', 'kXXXXXXXXk', 'kXwXXXXXXk', 'kXXXXXXXXk', 'kkkkkkkkkk'],
}

export function Pixel({ name, color = INK, size = 4, accent = '#fff', className = '', style }: { name: string; color?: string; size?: number; accent?: string; className?: string; style?: React.CSSProperties }) {
  const rows = ART[name]
  return (
    <svg className={className} width={rows[0].length * size} height={rows.length * size} shapeRendering="crispEdges" style={{ flex: 'none', ...style }}>
      {rows.flatMap((r, y) =>
        r.split('').map((c, x) => {
          if (c === '.') return null
          const fill = c === 'X' ? color : c === 'w' ? accent : INK
          return <rect key={`${x}-${y}`} x={x * size} y={y * size} width={size} height={size} fill={fill} />
        }),
      )}
    </svg>
  )
}

export function Win({ title, color, children, className = '', right, style, onClose }: { title: string; color: string; children: ReactNode; className?: string; right?: ReactNode; style?: React.CSSProperties; onClose?: () => void }) {
  return (
    <div className={`win ${className}`} style={style}>
      <div className="win-bar" style={{ background: color }}>
        <button aria-label="Tutup" onClick={onClose} className="dot" style={{ background: '#FF7A5C', padding: 0, cursor: onClose ? 'pointer' : 'default' }} />
        <span className="dot" style={{ background: '#FFE94D' }} />
        <span className="dot" style={{ background: '#8CB35C' }} />
        <span className="ml-2">{title}</span>
        <span className="ml-auto">{right}</span>
      </div>
      {children}
    </div>
  )
}

export function Sticker({ children, bg, rot = -4, className = '' }: { children: ReactNode; bg: string; rot?: number; className?: string }) {
  return (
    <span className={`sticker ${className}`} style={{ background: bg, transform: `rotate(${rot}deg)` }}>
      {children}
    </span>
  )
}
