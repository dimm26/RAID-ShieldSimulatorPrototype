// 8-bit sound effects generated with the Web Audio API (no audio files).
type Name = 'click' | 'burn' | 'buy' | 'success' | 'gameover' | 'win'
let ctx: AudioContext | null = null
let enabled = true

function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}
function tone(c: AudioContext, t: number, freq: number, dur: number, type: OscillatorType = 'square', vol = 0.08, endFreq?: number) {
  const o = c.createOscillator(), g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t); o.stop(t + dur + 0.02)
}
function noise(c: AudioContext, t: number, dur: number, vol = 0.1) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const s = c.createBufferSource(), g = c.createGain()
  s.buffer = buf; g.gain.value = vol
  s.connect(g).connect(c.destination); s.start(t)
}
const seq = (c: AudioContext, notes: number[], step: number, dur: number, type: OscillatorType = 'square') =>
  notes.forEach((f, i) => tone(c, c.currentTime + i * step, f, dur, type))

export const sfx = {
  setEnabled(v: boolean) { enabled = v },
  play(name: Name) {
    if (!enabled) return
    try {
      const c = getCtx()
      if (!c) return
      const t = c.currentTime
      switch (name) {
        case 'click': tone(c, t, 660, 0.05, 'square', 0.05); break
        case 'burn': noise(c, t, 0.5, 0.12); tone(c, t, 320, 0.5, 'sawtooth', 0.08, 50); break
        case 'buy': tone(c, t, 988, 0.07); tone(c, t + 0.08, 1319, 0.16); break
        case 'success': seq(c, [523, 659, 784, 1047], 0.09, 0.12); break
        case 'gameover': seq(c, [392, 330, 262, 196], 0.18, 0.22, 'triangle'); noise(c, t + 0.6, 0.4, 0.06); break
        case 'win': seq(c, [523, 523, 659, 784, 659, 784, 1047], 0.11, 0.16); break
      }
    } catch { /* audio unavailable */ }
  },
}
