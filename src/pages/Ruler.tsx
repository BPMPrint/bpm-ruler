import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GripHorizontal, GripVertical, Settings2, Shapes } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useToast } from '@/components/Toast'
import { useUnits, type Unit } from '@/hooks/useUnits'
import CalibrationWizard from '@/components/ruler/CalibrationWizard'
import ReferenceGuides from '@/components/ruler/ReferenceGuides'
import { cn } from '@/lib/utils'

const LS_KEY = 'aruler:pxPerMm'
const DEFAULT_PX_PER_MM = 96 / 25.4 // 3.7795 — 96 CSS DPI estimate

function loadCalibration(): { pxPerMm: number; calibrated: boolean } {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const v = Number(raw)
      if (Number.isFinite(v) && v > 0) return { pxPerMm: v, calibrated: true }
    }
  } catch {
    /* ignore */
  }
  return { pxPerMm: DEFAULT_PX_PER_MM, calibrated: false }
}

/* ------------------------------------------------------------------ */
/* Tick rulers (generated programmatically)                            */
/* ------------------------------------------------------------------ */

interface Tick {
  pos: number // px along ruler
  kind: 'minor' | 'medium' | 'major'
  label?: string
  signal?: boolean
}

function buildTicks(lengthPx: number, pxPerMm: number, unit: Unit): Tick[] {
  const ticks: Tick[] = []
  if (unit === 'cm') {
    const step = pxPerMm // 1 mm
    const n = Math.floor(lengthPx / step)
    for (let i = 0; i <= n; i++) {
      const major = i % 10 === 0
      const medium = !major && i % 5 === 0
      const cm = i / 10
      ticks.push({
        pos: i * step,
        kind: major ? 'major' : medium ? 'medium' : 'minor',
        label: major && i > 0 ? String(cm % 1 === 0 ? cm : cm.toFixed(1)) : undefined,
        signal: major && i > 0 && i % 50 === 0,
      })
    }
  } else {
    const step = (pxPerMm * 25.4) / 16 // 1/16 in
    const n = Math.floor(lengthPx / step)
    for (let i = 0; i <= n; i++) {
      const major = i % 16 === 0
      const medium = !major && i % 8 === 0
      ticks.push({
        pos: i * step,
        kind: major ? 'major' : medium ? 'medium' : 'minor',
        label: major && i > 0 ? String(i / 16) : undefined,
        signal: major && i > 0 && i % 80 === 0,
      })
    }
  }
  return ticks
}

function RulerBar({
  orientation,
  length,
  thickness,
  pxPerMm,
  unit,
}: {
  orientation: 'h' | 'v'
  length: number
  thickness: number
  pxPerMm: number
  unit: Unit
}) {
  const ticks = useMemo(() => buildTicks(length, pxPerMm, unit), [length, pxPerMm, unit])
  const h = orientation === 'h'
  return (
    <motion.svg
      key={unit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      width={h ? length : thickness}
      height={h ? thickness : length}
      className="block bg-ink-2"
      aria-hidden
    >
      {ticks.map((t, i) => {
        const len = t.kind === 'major' ? thickness * 0.42 : t.kind === 'medium' ? thickness * 0.3 : thickness * 0.18
        const color = t.signal ? 'var(--signal)' : 'var(--paper)'
        const opacity = t.kind === 'minor' ? 0.4 : t.kind === 'medium' ? 0.65 : 0.9
        return h ? (
          <line
            key={i}
            x1={t.pos}
            y1={thickness}
            x2={t.pos}
            y2={thickness - len}
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={t.kind === 'major' ? 1.2 : 1}
          />
        ) : (
          <line
            key={i}
            x1={thickness}
            y1={t.pos}
            x2={thickness - len}
            y2={t.pos}
            stroke={color}
            strokeOpacity={opacity}
            strokeWidth={t.kind === 'major' ? 1.2 : 1}
          />
        )
      })}
      {ticks
        .filter((t) => t.label)
        .map((t, i) =>
          h ? (
            <text
              key={i}
              x={t.pos + 3}
              y={thickness * 0.36}
              fill={t.signal ? 'var(--signal)' : 'var(--paper)'}
              fillOpacity={0.85}
              fontSize={10}
              className="font-mono-hud"
              style={{ letterSpacing: '0.06em' }}
            >
              {t.label}
            </text>
          ) : (
            <text
              key={i}
              x={thickness * 0.36}
              y={t.pos + 3}
              fill={t.signal ? 'var(--signal)' : 'var(--paper)'}
              fillOpacity={0.85}
              fontSize={10}
              className="font-mono-hud"
              style={{ letterSpacing: '0.06em' }}
              transform={`rotate(90 ${thickness * 0.36 - 4} ${t.pos + 3})`}
            >
              {t.label}
            </text>
          ),
        )}
      {/* baseline hairline */}
      {h ? (
        <line x1={0} y1={thickness - 0.5} x2={length} y2={thickness - 0.5} stroke="var(--line)" strokeWidth={1} />
      ) : (
        <line x1={thickness - 0.5} y1={0} x2={thickness - 0.5} y2={length} stroke="var(--line)" strokeWidth={1} />
      )}
    </motion.svg>
  )
}

/* ------------------------------------------------------------------ */
/* Caliper line                                                        */
/* ------------------------------------------------------------------ */

interface CaliperProps {
  axis: 'x' | 'y' // x = vertical line, y = horizontal line
  pos: number
  thickness: number
  readout: string
  dragging: boolean
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: () => void
  onDoubleClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

function Caliper({
  axis,
  pos,
  readout,
  dragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
  onContextMenu,
  onKeyDown,
}: CaliperProps) {
  const vertical = axis === 'x'
  return (
    <div
      className="absolute z-20"
      style={
        vertical
          ? { left: pos - 14, top: 0, bottom: 0, width: 28 }
          : { top: pos - 14, left: 0, right: 0, height: 28 }
      }
    >
      {/* line */}
      <div
        className="absolute bg-signal transition-[width,height] duration-100"
        style={
          vertical
            ? { left: 14, top: 0, bottom: 0, width: dragging ? 2 : 1 }
            : { top: 14, left: 0, right: 0, height: dragging ? 2 : 1 }
        }
      />
      {/* grab handle at ruler edge */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        onKeyDown={onKeyDown}
        tabIndex={0}
        aria-label={vertical ? 'Vertical caliper — drag or use arrow keys' : 'Horizontal caliper — drag or use arrow keys'}
        className={cn(
          'absolute flex items-center justify-center rounded-full border border-signal bg-ink-2 text-signal outline-none focus-visible:ring-2 focus-visible:ring-signal',
          dragging ? 'cursor-grabbing' : 'cursor-grab',
          vertical ? 'left-[3px] top-1 h-7 w-[22px]' : 'left-1 top-[3px] h-[22px] w-7',
        )}
      >
        {vertical ? <GripVertical className="h-3.5 w-3.5" /> : <GripHorizontal className="h-3.5 w-3.5" />}
      </button>
      {/* floating readout */}
      <motion.div
        layout="position"
        className={cn(
          'pointer-events-none absolute whitespace-nowrap rounded-full border border-signal/60 bg-ink/70 px-2 py-0.5 font-mono-hud text-[11px] font-bold tracking-wide text-signal backdrop-blur-md',
          vertical ? 'left-5 top-8' : 'left-9 top-[18px]',
        )}
      >
        {readout}
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type AxisMode = 'h' | 'v' | 'both'

export default function Ruler() {
  const { unit, formatMm } = useUnits()
  const { toast } = useToast()

  const [{ pxPerMm, calibrated }, setCal] = useState(loadCalibration)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [guidesOn, setGuidesOn] = useState(false)
  const [axisMode, setAxisMode] = useState<AxisMode>('both')
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [zeroFlash, setZeroFlash] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })

  // caliper positions in stage-local px + zero offsets
  const [posX, setPosX] = useState<number | null>(null)
  const [posY, setPosY] = useState<number | null>(null)
  const [zeroX, setZeroX] = useState(0)
  const [zeroY, setZeroY] = useState(0)
  const [dragging, setDragging] = useState<'x' | 'y' | null>(null)
  const dragOffset = useRef(0)
  const lastVibrate = useRef(0)
  const [menu, setMenu] = useState<{ axis: 'x' | 'y'; x: number; y: number } | null>(null)
  const zoomToastAt = useRef(0)

  // measure stage
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setStageSize({ w: el.clientWidth, h: el.clientHeight })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // initial caliper placement at 30% mark (slide-in)
  useEffect(() => {
    if (stageSize.w > 0 && posX === null) {
      setPosX(Math.round(stageSize.w * 0.3))
      setPosY(Math.round(stageSize.h * 0.3))
    }
  }, [stageSize, posX])

  // keep calipers in bounds on resize
  useEffect(() => {
    if (posX !== null && posX > stageSize.w) setPosX(stageSize.w)
    if (posY !== null && posY > stageSize.h) setPosY(stageSize.h)
  }, [stageSize, posX, posY])

  const ppi = pxPerMm * 25.4
  const nudgePx = useCallback(
    (shift: boolean) => pxPerMm * (shift ? 10 : 1),
    [pxPerMm],
  )

  const vibrateTick = (pos: number) => {
    const mm = Math.round(pos / pxPerMm)
    if (mm !== lastVibrate.current) {
      lastVibrate.current = mm
      try {
        navigator.vibrate?.(2)
      } catch {
        /* ignore */
      }
    }
  }

  const startDrag = (axis: 'x' | 'y') => (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    const rect = stageRef.current!.getBoundingClientRect()
    const local = axis === 'x' ? e.clientX - rect.left : e.clientY - rect.top
    dragOffset.current = local - (axis === 'x' ? (posX ?? 0) : (posY ?? 0))
    setDragging(axis)
  }
  const moveDrag = (axis: 'x' | 'y') => (e: React.PointerEvent) => {
    if (dragging !== axis) return
    const rect = stageRef.current!.getBoundingClientRect()
    const local = axis === 'x' ? e.clientX - rect.left : e.clientY - rect.top
    const max = axis === 'x' ? stageSize.w : stageSize.h
    const next = Math.min(max, Math.max(0, local - dragOffset.current))
    if (axis === 'x') setPosX(next)
    else setPosY(next)
    vibrateTick(next)
  }
  const endDrag = () => setDragging(null)

  const nudge = (axis: 'x' | 'y') => (e: React.KeyboardEvent) => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? nudgePx(e.shiftKey)
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -nudgePx(e.shiftKey)
          : 0
    if (delta === 0) return
    e.preventDefault()
    if (axis === 'x') setPosX((p) => Math.min(stageSize.w, Math.max(0, (p ?? 0) + delta)))
    else setPosY((p) => Math.min(stageSize.h, Math.max(0, (p ?? 0) + delta)))
  }

  const setZero = (axis: 'x' | 'y') => {
    if (axis === 'x') setZeroX(posX ?? 0)
    else setZeroY(posY ?? 0)
    setZeroFlash(true)
    window.setTimeout(() => setZeroFlash(false), 1200)
  }
  const resetZero = (axis: 'x' | 'y') => (axis === 'x' ? setZeroX(0) : setZeroY(0))

  const mmX = posX === null ? 0 : (posX - zeroX) / pxPerMm
  const mmY = posY === null ? 0 : (posY - zeroY) / pxPerMm
  const bboxW = Math.abs(mmX)
  const bboxH = Math.abs(mmY)
  const showBBox = Math.abs(mmX) > 0.05 && Math.abs(mmY) > 0.05

  const copy = (text: string) => {
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast('Copied'))
      .catch(() => toast('Copy failed'))
  }

  const onStageWheel = (e: React.WheelEvent) => {
    const now = Date.now()
    if (now - zoomToastAt.current > 3000 && Math.abs(e.deltaY) > 0) {
      zoomToastAt.current = now
      toast('Zoom is locked so measurements stay true.')
    }
  }

  const saveCalibration = (v: number) => {
    try {
      localStorage.setItem(LS_KEY, String(v))
    } catch {
      /* ignore */
    }
    setCal({ pxPerMm: v, calibrated: true })
    setWizardOpen(false)
    toast(`Calibrated — ${(v * 25.4).toFixed(0)} PPI saved`)
  }

  const rulerThickness = 56

  const showV = posX !== null && (axisMode !== 'h')
  const showH = posY !== null && (axisMode !== 'v')

  return (
    <AppShell
      actions={
        <button
          onClick={() => setGuidesOn((g) => !g)}
          aria-pressed={guidesOn}
          title="Toggle reference object guides"
          className={cn(
            'rounded-md p-1.5 transition-colors',
            guidesOn ? 'bg-signal-dim text-signal' : 'text-fog hover:bg-ink-3 hover:text-paper',
          )}
        >
          <Shapes className="h-4 w-4" />
        </button>
      }
    >
      <div className="flex h-full flex-col bg-ink">
        {/* uncalibrated banner */}
        <AnimatePresence>
          {!calibrated && !bannerDismissed && (
            <motion.div
              initial={{ y: -32, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -32, opacity: 0 }}
              className="absolute left-1/2 top-16 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-coral/50 bg-ink-2/90 py-1.5 pl-4 pr-2 backdrop-blur-md"
            >
              <span className="font-mono-hud text-[11px] uppercase tracking-[0.06em] text-coral">
                Estimated PPI — calibrate for true scale
              </span>
              <button
                onClick={() => setWizardOpen(true)}
                className="rounded-full bg-signal px-3 py-1 text-xs font-semibold text-ink transition hover:brightness-110"
              >
                Calibrate
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="rounded-full px-2 py-1 text-xs text-fog transition hover:text-paper"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* top ruler row */}
        <div className="flex shrink-0" style={{ height: rulerThickness }}>
          {/* corner block */}
          <div
            className="relative flex shrink-0 flex-col items-center justify-center gap-0.5 border-b border-r border-line bg-ink-2"
            style={{ width: rulerThickness, height: rulerThickness }}
          >
            <span className="font-mono-hud text-[10px] font-bold uppercase tracking-[0.06em] text-paper">
              {unit}
            </span>
            <span
              className={cn(
                'font-mono-hud text-[8px] uppercase tracking-[0.06em]',
                calibrated ? 'text-mint' : 'text-coral',
              )}
            >
              {ppi.toFixed(0)} PPI {calibrated ? '✓' : 'est'}
            </span>
            <AnimatePresence>
              {zeroFlash && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-ink-2 font-mono-hud text-[9px] font-bold uppercase tracking-[0.06em] text-signal"
                >
                  Zero set
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <motion.div
            className="min-w-0 flex-1 overflow-hidden border-b border-line"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {stageSize.w > 0 && (
              <RulerBar
                orientation="h"
                length={stageSize.w}
                thickness={rulerThickness}
                pxPerMm={pxPerMm}
                unit={unit}
              />
            )}
          </motion.div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* left ruler */}
          <motion.div
            className="shrink-0 overflow-hidden border-r border-line"
            style={{ width: rulerThickness }}
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {stageSize.h > 0 && (
              <RulerBar
                orientation="v"
                length={stageSize.h}
                thickness={rulerThickness}
                pxPerMm={pxPerMm}
                unit={unit}
              />
            )}
          </motion.div>

          {/* stage */}
          <div
            ref={stageRef}
            className="relative min-w-0 flex-1 touch-none select-none overflow-hidden bg-ink"
            onWheel={onStageWheel}
            style={{
              backgroundImage:
                'linear-gradient(rgba(245,245,242,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,245,242,0.04) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          >
            {guidesOn && <ReferenceGuides pxPerMm={pxPerMm} />}

            {/* calipers */}
            {showV && (
              <Caliper
                axis="x"
                pos={posX}
                thickness={rulerThickness}
                readout={formatMm(mmX)}
                dragging={dragging === 'x'}
                onPointerDown={startDrag('x')}
                onPointerMove={moveDrag('x')}
                onPointerUp={endDrag}
                onDoubleClick={() => setZero('x')}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenu({ axis: 'x', x: e.clientX, y: e.clientY })
                }}
                onKeyDown={nudge('x')}
              />
            )}
            {showH && (
              <Caliper
                axis="y"
                pos={posY}
                thickness={rulerThickness}
                readout={formatMm(mmY)}
                dragging={dragging === 'y'}
                onPointerDown={startDrag('y')}
                onPointerMove={moveDrag('y')}
                onPointerUp={endDrag}
                onDoubleClick={() => setZero('y')}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenu({ axis: 'y', x: e.clientX, y: e.clientY })
                }}
                onKeyDown={nudge('y')}
              />
            )}

            {/* context menu */}
            <AnimatePresence>
              {menu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null) }} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="fixed z-50 min-w-40 overflow-hidden rounded-lg border border-line bg-ink-2 py-1 shadow-xl"
                    style={{ left: menu.x, top: menu.y }}
                  >
                    {[
                      { label: 'Set zero here', fn: () => setZero(menu.axis) },
                      { label: 'Reset zero', fn: () => resetZero(menu.axis) },
                      {
                        label: 'Copy value',
                        fn: () => copy(formatMm(menu.axis === 'x' ? mmX : mmY)),
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.fn()
                          setMenu(null)
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-paper transition-colors hover:bg-ink-3"
                      >
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* measurement card */}
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2"
            >
              <div
                className="flex items-center gap-4 rounded-full border border-line px-5 py-2.5 backdrop-blur-md"
                style={{ backgroundColor: 'rgba(10,10,11,0.65)', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
              >
                <button onClick={() => copy(formatMm(mmX))} className="text-left" title="Copy width">
                  <span className="block font-mono-hud text-[9px] uppercase tracking-[0.06em] text-fog">X</span>
                  <span className="font-mono-hud text-sm font-bold text-signal">{formatMm(mmX)}</span>
                </button>
                <button onClick={() => copy(formatMm(mmY))} className="text-left" title="Copy height">
                  <span className="block font-mono-hud text-[9px] uppercase tracking-[0.06em] text-fog">Y</span>
                  <span className="font-mono-hud text-sm font-bold text-signal">{formatMm(mmY)}</span>
                </button>
                {showBBox && (
                  <button
                    onClick={() => copy(`${formatMm(bboxW)} × ${formatMm(bboxH)}`)}
                    className="border-l border-line pl-4 text-left"
                    title="Copy bounding box"
                  >
                    <span className="block font-mono-hud text-[9px] uppercase tracking-[0.06em] text-fog">
                      Box
                    </span>
                    <span className="whitespace-nowrap font-mono-hud text-sm font-bold text-paper">
                      W {formatMm(bboxW, false)} × H {formatMm(bboxH, false)}{' '}
                      <span className="text-[10px] uppercase text-fog">{unit}</span>
                    </span>
                  </button>
                )}
              </div>
            </motion.div>

            {/* calibrate button */}
            <button
              onClick={() => setWizardOpen(true)}
              className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-line bg-ink/70 px-4 py-2 text-sm font-semibold text-paper backdrop-blur-md transition hover:bg-ink-3 active:scale-[0.97]"
            >
              <Settings2 className="h-4 w-4" />
              Calibrate PPI
            </button>

            {/* mobile axis-mode toggle */}
            <div className="absolute right-4 top-4 z-20 flex items-center rounded-full border border-line bg-ink-3 p-0.5 md:hidden">
              {(['h', 'v', 'both'] as AxisMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setAxisMode(m)}
                  className={cn(
                    'rounded-full px-3 py-1 font-mono-hud text-[11px] font-medium uppercase tracking-wider transition-colors',
                    axisMode === m ? 'bg-signal text-ink' : 'text-fog',
                  )}
                >
                  {m === 'h' ? 'H' : m === 'v' ? 'V' : 'Both'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CalibrationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSave={saveCalibration}
        currentPxPerMm={pxPerMm}
        defaultPxPerMm={DEFAULT_PX_PER_MM}
      />
    </AppShell>
  )
}
