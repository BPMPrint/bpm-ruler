import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, CircleHelp, Snowflake, SwitchCamera, Trash2, Undo2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import MeasureLabel from '@/components/MeasureLabel'
import { useToast } from '@/components/Toast'
import { useUnits } from '@/hooks/useUnits'
import { cn } from '@/lib/utils'
import { useCamera, type Facing } from '@/components/measure/useCamera'
import MeasureOverlay, { type OverlayPoint } from '@/components/measure/MeasureOverlay'
import CameraFallback from '@/components/measure/CameraFallback'
import CalibrationSheet from '@/components/measure/CalibrationSheet'
import SaveSheet from '@/components/measure/SaveSheet'
import CoachMarks from '@/components/measure/CoachMarks'

/** Average-device estimate used until calibrated (96 CSS px per inch). */
const DEFAULT_PX_PER_MM = 96 / 25.4
const HISTORY_KEY = 'aruler:measurements'
const ONBOARDED_KEY = 'aruler:onboarded'
const TIP_KEY = 'aruler:tip-click-seen'
const HIT_RADIUS_PX = 28

type Source = 'camera' | 'demo'
type LabelMode = 'auto' | 'mm' | 'in'

interface Calibration {
  pxPerMm: number
  label: string
  mm: number
}

interface MeasurementRecord {
  id: string
  label: string
  mm: number
  unit: 'cm' | 'in'
  createdAt: number
  snapshot: string | null
  source: Source
}

function readHistory(): MeasurementRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as MeasurementRecord[]) : []
  } catch {
    return []
  }
}

export default function Measure() {
  const { toast } = useToast()
  const { unit, formatMm } = useUnits()

  // ---- camera ----
  const [source, setSource] = useState<Source>('camera')
  const [facing, setFacing] = useState<Facing>('environment')
  const [retrySeed, setRetrySeed] = useState(0)
  const { videoRef, status: cameraStatus, deviceCount } = useCamera(
    facing,
    source === 'camera',
    retrySeed,
  )
  const demoImgRef = useRef<HTMLImageElement | null>(null)

  // ---- viewport geometry ----
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ---- measurement state (normalized 0..1 coordinates) ----
  const [points, setPoints] = useState<OverlayPoint[]>([])
  const [cursor, setCursor] = useState<OverlayPoint | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [sonarIndex, setSonarIndex] = useState<number | null>(null)
  const [labelMode, setLabelMode] = useState<LabelMode>('auto')

  // ---- calibration ----
  const [calibration, setCalibration] = useState<Calibration | null>(null)
  const [calibOpen, setCalibOpen] = useState(false)

  // ---- freeze / sheets / chrome ----
  const [frozen, setFrozen] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [showCoach, setShowCoach] = useState(
    () => localStorage.getItem(ONBOARDED_KEY) !== '1',
  )
  const [showTip, setShowTip] = useState(
    () =>
      localStorage.getItem(TIP_KEY) !== '1' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches,
  )

  useEffect(() => {
    if (!showTip) return
    const t = window.setTimeout(() => {
      setShowTip(false)
      localStorage.setItem(TIP_KEY, '1')
    }, 6000)
    return () => window.clearTimeout(t)
  }, [showTip])

  useEffect(() => {
    if (!confirmClear) return
    const t = window.setTimeout(() => setConfirmClear(false), 2000)
    return () => window.clearTimeout(t)
  }, [confirmClear])

  const pxPerMm = calibration?.pxPerMm ?? DEFAULT_PX_PER_MM

  const toPx = useCallback(
    (p: OverlayPoint): OverlayPoint => ({ x: p.x * size.w, y: p.y * size.h }),
    [size],
  )

  const pixelDistance = useMemo(() => {
    if (points.length < 2 || size.w === 0) return null
    const a = toPx(points[0])
    const b = toPx(points[1])
    return Math.hypot(b.x - a.x, b.y - a.y)
  }, [points, size, toPx])

  const previewPxDistance = useMemo(() => {
    if (points.length !== 1 || !cursor || size.w === 0) return null
    const a = toPx(points[0])
    const b = toPx(cursor)
    return Math.hypot(b.x - a.x, b.y - a.y)
  }, [points, cursor, size, toPx])

  const mm = pixelDistance !== null ? pixelDistance / pxPerMm : null
  const previewMm = previewPxDistance !== null ? previewPxDistance / pxPerMm : null

  const formatValue = useCallback(
    (value: number): string => {
      if (labelMode === 'mm') return `${Math.round(value)} mm`
      if (labelMode === 'in') return `${(value / 25.4).toFixed(2)} in`
      return formatMm(value)
    },
    [labelMode, formatMm],
  )

  // ---- frame capture ----
  const captureFrame = useCallback(
    (maxWidth: number): string | null => {
      const src: HTMLVideoElement | HTMLImageElement | null =
        source === 'camera' ? videoRef.current : demoImgRef.current
      if (!src) return null
      const sw =
        src instanceof HTMLVideoElement ? src.videoWidth : src.naturalWidth
      const sh =
        src instanceof HTMLVideoElement ? src.videoHeight : src.naturalHeight
      if (!sw || !sh) return null
      const scale = Math.min(1, maxWidth / sw)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(sw * scale)
      canvas.height = Math.round(sh * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(src, 0, 0, canvas.width, canvas.height)
      try {
        return canvas.toDataURL('image/jpeg', 0.7)
      } catch {
        return null
      }
    },
    [source, videoRef],
  )

  // ---- pointer interactions ----
  const clampNorm = (v: number) => Math.min(1, Math.max(0, v))

  const eventToNorm = (e: React.PointerEvent): OverlayPoint => {
    const rect = viewportRef.current!.getBoundingClientRect()
    return {
      x: clampNorm((e.clientX - rect.left) / rect.width),
      y: clampNorm((e.clientY - rect.top) / rect.height),
    }
  }

  const hitIndex = (pos: OverlayPoint): number | null => {
    if (size.w === 0) return null
    const px = toPx(pos)
    for (let i = 0; i < points.length; i++) {
      const p = toPx(points[i])
      if (Math.hypot(p.x - px.x, p.y - px.y) <= HIT_RADIUS_PX) return i
    }
    return null
  }

  const fireSonar = (index: number) => {
    setSonarIndex(index)
    window.setTimeout(() => setSonarIndex((cur) => (cur === index ? null : cur)), 450)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (size.w === 0) return
    const pos = eventToNorm(e)
    setCursor(pos)
    const hit = hitIndex(pos)
    if (hit !== null) {
      setDraggingIndex(hit)
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }
    if (points.length >= 2) {
      // third tap clears and restarts
      setPoints([pos])
      fireSonar(0)
    } else {
      setPoints((p) => [...p, pos])
      fireSonar(points.length)
    }
    if (showTip) {
      setShowTip(false)
      localStorage.setItem(TIP_KEY, '1')
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (size.w === 0) return
    const pos = eventToNorm(e)
    setCursor(pos)
    if (draggingIndex !== null) {
      setPoints((p) => p.map((pt, i) => (i === draggingIndex ? pos : pt)))
    }
  }

  const handlePointerUp = () => setDraggingIndex(null)

  // ---- actions ----
  const undo = () => setPoints((p) => p.slice(0, -1))

  const clearAll = () => {
    if (!confirmClear && points.length > 0) {
      setConfirmClear(true)
      return
    }
    setPoints([])
    setConfirmClear(false)
  }

  const toggleFreeze = () => {
    if (frozen) {
      setFrozen(null)
    } else {
      const frame = captureFrame(1280)
      if (frame) setFrozen(frame)
      else toast('Could not capture frame')
    }
  }

  const flipCamera = () =>
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'))

  const handleCalibrate = (label: string, realMm: number) => {
    if (pixelDistance === null) return
    const ratio = pixelDistance / realMm
    setCalibration({ pxPerMm: ratio, label, mm: realMm })
    setCalibOpen(false)
    toast(`Calibrated — ${ratio.toFixed(2)} px/mm`)
  }

  const dismissCoach = () => {
    setShowCoach(false)
    localStorage.setItem(ONBOARDED_KEY, '1')
  }

  const historyCount = readHistory().length
  const defaultLabel = `Measurement ${historyCount + 1}`

  const handleSave = (label: string) => {
    if (mm === null) return
    const record: MeasurementRecord = {
      id: crypto.randomUUID(),
      label,
      mm,
      unit,
      createdAt: Date.now(),
      snapshot: captureFrame(480),
      source,
    }
    const history = readHistory()
    history.push(record)
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {
      toast('Storage full — snapshot dropped')
      record.snapshot = null
      localStorage.setItem(HISTORY_KEY, JSON.stringify([...history.slice(0, -1), record]))
    }
    window.dispatchEvent(new Event('aruler:history-changed'))
    setSaveOpen(false)
    toast('Saved to history')
  }

  const cameraBlocked = source === 'camera' && cameraStatus === 'denied'
  const cameraWaiting = source === 'camera' && cameraStatus === 'pending'
  const complete = points.length === 2 && mm !== null
  const pxPoints = points.map(toPx)
  const pxCursor = cursor ? toPx(cursor) : null
  const midpoint =
    complete && size.w > 0
      ? { x: (pxPoints[0].x + pxPoints[1].x) / 2, y: (pxPoints[0].y + pxPoints[1].y) / 2 }
      : null
  const previewMidpoint =
    points.length === 1 && pxCursor
      ? { x: (pxPoints[0].x + pxCursor.x) / 2, y: (pxPoints[0].y + pxCursor.y) / 2 }
      : null

  return (
    <AppShell>
      <div className="relative h-full w-full overflow-hidden bg-ink">
        {/* ---- camera / demo viewport ---- */}
        <motion.div
          ref={viewportRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 cursor-crosshair touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={() => setCursor(null)}
        >
          {source === 'camera' ? (
            <motion.video
              key={facing}
              ref={videoRef}
              playsInline
              muted
              autoPlay
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
            />
          ) : (
            <img
              ref={demoImgRef}
              src="/demo-scene.jpg"
              alt="Demo scene: desk with objects to measure"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          )}

          {/* frozen frame sits on top of the live video */}
          {frozen && (
            <img
              src={frozen}
              alt="Frozen frame"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          )}

          {/* waiting shimmer */}
          {cameraWaiting && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink">
              <div className="absolute inset-0 animate-pulse bg-ink-2" />
              <span className="relative font-mono-hud text-xs uppercase tracking-[0.06em] text-fog">
                Waiting for camera…
              </span>
            </div>
          )}

          {/* SVG measurement overlay */}
          {size.w > 0 && (
            <MeasureOverlay
              width={size.w}
              height={size.h}
              points={pxPoints}
              cursor={pxCursor}
              draggingIndex={draggingIndex}
              sonarIndex={sonarIndex}
              showReticle={points.length < 2 && !cameraBlocked && !cameraWaiting}
            />
          )}

          {/* completed measurement label — tap to cycle format */}
          {midpoint && mm !== null && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLabelMode((m) => (m === 'auto' ? 'mm' : m === 'mm' ? 'in' : 'auto'))
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute z-20 -translate-x-1/2 cursor-pointer"
              style={{
                left: midpoint.x,
                top: midpoint.y,
                transform: 'translate(-50%, calc(-100% - 10px))',
              }}
              aria-label="Cycle display format"
            >
              <MeasureLabel
                value={formatValue(mm).split(' ')[0]}
                unit={formatValue(mm).split(' ')[1]}
              />
            </button>
          )}

          {/* rubber-band preview label */}
          {!midpoint && previewMidpoint && previewMm !== null && (
            <div
              className="absolute z-20 animate-pulse"
              style={{
                left: previewMidpoint.x,
                top: previewMidpoint.y,
                transform: 'translate(-50%, calc(-100% - 10px))',
              }}
            >
              <MeasureLabel
                value={formatValue(previewMm).split(' ')[0]}
                unit={formatValue(previewMm).split(' ')[1]}
                className="opacity-80"
              />
            </div>
          )}
        </motion.div>

        {/* ---- camera fallback ---- */}
        {cameraBlocked && (
          <CameraFallback
            onUseDemo={() => setSource('demo')}
            onRetry={() => setRetrySeed((s) => s + 1)}
          />
        )}

        {/* ---- FROZEN chip ---- */}
        {frozen && (
          <button
            onClick={() => setFrozen(null)}
            className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full border border-line bg-ink/70 px-3 py-1.5 font-mono-hud text-[11px] uppercase tracking-[0.06em] text-signal backdrop-blur-md transition hover:bg-ink-3"
          >
            <Snowflake size={12} />
            Frozen — tap to resume
          </button>
        )}

        {/* ---- calibration badge ---- */}
        {!cameraBlocked && (
          <motion.button
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setCalibOpen(true)}
            className={cn(
              'absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-ink/70 px-3.5 py-1.5 font-mono-hud text-[11px] uppercase tracking-[0.06em] backdrop-blur-md transition hover:bg-ink-3',
              !calibration && 'anim-breathe',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                calibration ? 'bg-[var(--mint)]' : 'bg-[var(--coral)]',
              )}
            />
            {calibration ? (
              <span className="text-mint">
                Calibrated · {calibration.label} {calibration.mm} mm
              </span>
            ) : (
              <span className="text-coral">Not calibrated — tap to calibrate</span>
            )}
          </motion.button>
        )}

        {/* ---- side toolbar ---- */}
        {!cameraBlocked && (
          <motion.div
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2"
          >
            {[
              {
                icon: <Undo2 size={18} />,
                label: 'Undo point',
                onClick: undo,
                disabled: points.length === 0,
              },
              {
                icon: <Trash2 size={18} className={confirmClear ? 'text-coral' : undefined} />,
                label: confirmClear ? 'Tap again to clear' : 'Clear all',
                onClick: clearAll,
                disabled: points.length === 0,
              },
              ...(source === 'camera' && deviceCount > 1
                ? [
                    {
                      icon: <SwitchCamera size={18} />,
                      label: 'Flip camera',
                      onClick: flipCamera,
                      disabled: false,
                    },
                  ]
                : []),
              {
                icon: frozen ? <Snowflake size={18} className="text-signal" /> : <Camera size={18} />,
                label: frozen ? 'Resume live view' : 'Freeze frame',
                onClick: toggleFreeze,
                disabled: false,
              },
              {
                icon: <CircleHelp size={18} />,
                label: 'Help',
                onClick: () => setShowCoach(true),
                disabled: false,
              },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                disabled={btn.disabled}
                aria-label={btn.label}
                title={btn.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink/70 text-paper backdrop-blur-md transition hover:bg-ink-3 active:scale-[0.97] disabled:opacity-35"
              >
                {btn.icon}
              </button>
            ))}
          </motion.div>
        )}

        {/* ---- desktop tip chip ---- */}
        <AnimatePresence>
          {showTip && !cameraBlocked && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full border border-line bg-ink/70 px-3.5 py-1.5 font-mono-hud text-[11px] uppercase tracking-[0.06em] text-fog backdrop-blur-md"
            >
              Tip: click to place points
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- bottom action bar ---- */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.24, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-3 px-4"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={() => setPoints([])}
            className="rounded-full border border-line bg-ink/70 px-5 py-2.5 text-[15px] font-medium text-paper backdrop-blur-md transition hover:bg-ink-3 active:scale-[0.97]"
          >
            New
          </button>
          <button
            disabled={!complete}
            onClick={() => setSaveOpen(true)}
            className="rounded-full bg-signal px-6 py-2.5 text-[15px] font-semibold text-ink transition enabled:hover:brightness-110 enabled:active:scale-[0.97] disabled:opacity-40"
          >
            Save measurement
          </button>
          {source === 'demo' && cameraStatus !== 'active' && (
            <button
              onClick={() => {
                setSource('camera')
                setRetrySeed((s) => s + 1)
              }}
              className="rounded-full border border-line bg-ink/70 px-5 py-2.5 text-[15px] font-medium text-paper backdrop-blur-md transition hover:bg-ink-3 active:scale-[0.97]"
            >
              Try camera
            </button>
          )}
        </motion.div>

        {/* ---- sheets & onboarding ---- */}
        <CalibrationSheet
          open={calibOpen}
          pixelDistance={pixelDistance}
          onClose={() => setCalibOpen(false)}
          onCalibrate={handleCalibrate}
        />
        <SaveSheet
          open={saveOpen}
          displayValue={mm !== null ? formatValue(mm) : '—'}
          defaultLabel={defaultLabel}
          snapshot={saveOpen ? captureFrame(480) : null}
          onClose={() => setSaveOpen(false)}
          onSave={handleSave}
        />
        <AnimatePresence>
          {showCoach && !cameraBlocked && !cameraWaiting && (
            <CoachMarks onDismiss={dismissCoach} />
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
