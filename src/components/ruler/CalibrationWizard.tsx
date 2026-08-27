import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, RotateCcw, X } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

const PRESETS = [
  { id: 'credit-card', label: 'Credit / ID card', widthMm: 85.6 },
  { id: 'a4-short', label: 'A4 paper (short edge)', widthMm: 210 },
  { id: 'us-letter', label: 'US Letter (short edge)', widthMm: 215.9 },
]

interface CalibrationWizardProps {
  open: boolean
  onClose: () => void
  /** Persisted px/mm, or null when only estimated */
  onSave: (pxPerMm: number) => void
  currentPxPerMm: number
  defaultPxPerMm: number
}

/** 3-step DPI calibration wizard: hold a known object to the screen. */
export default function CalibrationWizard({
  open,
  onClose,
  onSave,
  currentPxPerMm,
  defaultPxPerMm,
}: CalibrationWizardProps) {
  const [step, setStep] = useState(0)
  const [preset, setPreset] = useState(PRESETS[0])
  const [customMm, setCustomMm] = useState('')
  const [widthPx, setWidthPx] = useState(320)
  const [hasDragged, setHasDragged] = useState(false)
  const dragRef = useRef<{ startX: number; startW: number } | null>(null)

  const knownMm = customMm.trim() !== '' ? Number(customMm) : preset.widthMm
  const validMm = Number.isFinite(knownMm) && knownMm > 0
  const pxPerMm = validMm ? widthPx / knownMm : null
  const ppi = pxPerMm ? pxPerMm * 25.4 : null

  useEffect(() => {
    if (open) {
      setStep(0)
      setWidthPx(Math.round(currentPxPerMm * PRESETS[0].widthMm))
      setPreset(PRESETS[0])
      setCustomMm('')
      setHasDragged(false)
    }
  }, [open, currentPxPerMm])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onHandlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startW: widthPx }
    setHasDragged(true)
  }
  const onHandlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const next = Math.round(
      Math.min(1200, Math.max(40, dragRef.current.startW + (e.clientX - dragRef.current.startX))),
    )
    setWidthPx(next)
  }
  const onHandlePointerUp = () => {
    dragRef.current = null
  }
  const onHandleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      setHasDragged(true)
      setWidthPx((w) =>
        Math.min(1200, Math.max(40, w + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 10 : 1))),
      )
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-line bg-ink-2 p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Calibrate screen ruler"
          >
            {/* header + progress dots */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === step ? 'w-6 bg-signal' : i < step ? 'w-1.5 bg-mint' : 'w-1.5 bg-ink-3',
                    )}
                  />
                ))}
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-fog transition-colors hover:bg-ink-3 hover:text-paper"
                aria-label="Close calibration"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="why"
                  initial={{ x: 24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -24, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h3 className="font-display text-xl font-semibold text-paper">
                    Calibrate your screen
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">
                    Screens come in hundreds of pixel densities. One quick calibration makes this
                    ruler true to life.
                  </p>
                  {/* CSS-drawn card outline illustration */}
                  <div className="my-6 flex h-36 items-center justify-center rounded-lg border border-line bg-ink">
                    <div className="relative">
                      <div className="h-16 w-28 rounded-md border-2 border-dashed border-signal" />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono-hud text-[10px] uppercase tracking-[0.06em] text-fog">
                        85.6 mm
                      </span>
                      <span className="absolute -right-3 -top-3 h-2 w-2 rounded-full bg-signal" />
                      <span className="absolute -left-3 -top-3 h-2 w-2 rounded-full bg-signal" />
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full rounded-full bg-signal px-5 py-2.5 text-[15px] font-semibold text-ink transition hover:brightness-110 active:scale-[0.97]"
                  >
                    Start calibration
                  </button>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="measure"
                  initial={{ x: 24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -24, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h3 className="font-display text-xl font-semibold text-paper">
                    Match a known object
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog">
                    Hold the object against the screen and drag the box edge until it matches.
                  </p>

                  {/* preset picker */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPreset(p)
                          setCustomMm('')
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                          preset.id === p.id && customMm === ''
                            ? 'border-signal bg-signal-dim text-signal'
                            : 'border-line text-fog hover:bg-ink-3 hover:text-paper',
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-fog">or known width:</span>
                    <input
                      value={customMm}
                      onChange={(e) => setCustomMm(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="mm"
                      inputMode="decimal"
                      className="h-8 w-20 rounded-md border border-line bg-ink-3 px-2 font-mono-hud text-xs text-paper outline-none focus:border-signal"
                    />
                    <span className="font-mono-hud text-[11px] text-fog">mm</span>
                  </div>

                  {/* resizable silhouette */}
                  <div className="mt-5 flex h-28 items-center justify-center overflow-hidden rounded-lg border border-line bg-ink">
                    <div
                      className="relative flex h-16 items-center rounded-md border-2 border-signal bg-signal-dim"
                      style={{ width: widthPx }}
                    >
                      <button
                        onPointerDown={onHandlePointerDown}
                        onPointerMove={onHandlePointerMove}
                        onPointerUp={onHandlePointerUp}
                        onKeyDown={onHandleKeyDown}
                        tabIndex={0}
                        aria-label="Drag to resize reference box"
                        className={cn(
                          'absolute -right-3 top-1/2 h-10 w-5 -translate-y-1/2 cursor-ew-resize rounded-full border border-signal bg-ink-2 outline-none focus-visible:ring-2 focus-visible:ring-signal',
                          !hasDragged && 'animate-pulse',
                        )}
                      >
                        <span className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-signal" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between font-mono-hud text-[11px] uppercase tracking-[0.06em] text-fog">
                    <span>
                      width <span className="text-signal">{widthPx}px</span>
                    </span>
                    {validMm && <span>÷ {knownMm} mm</span>}
                  </div>
                  <div className="mt-3">
                    <Slider
                      value={[widthPx]}
                      min={40}
                      max={1200}
                      step={1}
                      onValueChange={([v]) => {
                        setWidthPx(v)
                        setHasDragged(true)
                      }}
                    />
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => setStep(0)}
                      className="rounded-full border border-line px-5 py-2.5 text-[15px] font-semibold text-paper transition hover:bg-ink-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => validMm && setStep(2)}
                      disabled={!validMm}
                      className="flex-1 rounded-full bg-signal px-5 py-2.5 text-[15px] font-semibold text-ink transition hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="done"
                  initial={{ x: 24, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -24, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-mint bg-mint/10">
                      <Check className="h-6 w-6 text-mint" />
                    </div>
                    <h3 className="mt-4 font-display text-xl font-semibold text-paper">
                      <span className="font-mono-hud text-mint">✓ {ppi ? ppi.toFixed(0) : '—'} PPI</span>{' '}
                      — saved to this browser
                    </h3>
                    <p className="mt-2 text-sm text-fog">
                      {pxPerMm ? pxPerMm.toFixed(4) : '—'} px/mm · ruler measurements are now true
                      to life on this screen.
                    </p>
                  </div>
                  <div className="mt-2 flex flex-col gap-2">
                    <button
                      onClick={() => pxPerMm && onSave(pxPerMm)}
                      className="w-full rounded-full bg-mint px-5 py-2.5 text-[15px] font-semibold text-ink transition hover:brightness-110 active:scale-[0.97]"
                    >
                      Save calibration
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 rounded-full border border-line px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink-3"
                      >
                        Recalibrate
                      </button>
                      <button
                        onClick={() => onSave(defaultPxPerMm)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-semibold text-fog transition hover:bg-ink-3 hover:text-paper"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset to estimate
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
