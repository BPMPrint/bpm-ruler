import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CalibrationPreset {
  id: string
  label: string
  mm: number
}

export const CALIBRATION_PRESETS: CalibrationPreset[] = [
  { id: 'credit-card', label: 'Credit card', mm: 85.6 },
  { id: 'us-quarter', label: 'US quarter', mm: 24.26 },
  { id: 'a4-short', label: 'A4 short edge', mm: 210 },
]

interface CalibrationSheetProps {
  open: boolean
  /** Pixel distance between the two placed points, null unless both are placed */
  pixelDistance: number | null
  onClose: () => void
  onCalibrate: (presetLabel: string, realMm: number) => void
}

/** Bottom sheet: pick a known-size reference to compute the px-per-mm ratio. */
export default function CalibrationSheet({
  open,
  pixelDistance,
  onClose,
  onCalibrate,
}: CalibrationSheetProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [customValue, setCustomValue] = useState('')

  const ready = pixelDistance !== null && pixelDistance > 4
  const customMm = parseFloat(customValue)
  const customValid = Number.isFinite(customMm) && customMm > 0

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30 bg-ink/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-line bg-ink-2 px-5 pb-8 pt-3"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-line" />
            <div className="mt-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-paper">Calibrate scale</h3>
              <button
                onClick={onClose}
                aria-label="Close calibration"
                className="rounded-full p-1.5 text-fog transition hover:bg-ink-3 hover:text-paper"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-fog">
              Measure an object you know the size of, then enter its real size.
            </p>

            {!ready && (
              <p className="mt-4 rounded-[6px] border border-line bg-ink-3 px-3 py-2 font-mono-hud text-[11px] uppercase tracking-[0.06em] text-coral">
                Place two points on the reference object first
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {CALIBRATION_PRESETS.map((p) => (
                <button
                  key={p.id}
                  disabled={!ready}
                  onClick={() => onCalibrate(p.label, p.mm)}
                  className={cn(
                    'rounded-full border border-line px-4 py-2 text-sm transition active:scale-[0.97]',
                    ready
                      ? 'text-paper hover:border-signal hover:bg-signal-dim'
                      : 'cursor-not-allowed text-fog opacity-50',
                  )}
                >
                  {p.label} <span className="font-mono-hud text-signal">— {p.mm} mm</span>
                </button>
              ))}
              <button
                disabled={!ready}
                onClick={() => setCustomOpen((v) => !v)}
                className={cn(
                  'rounded-full border border-line px-4 py-2 text-sm transition active:scale-[0.97]',
                  ready
                    ? 'text-paper hover:border-signal hover:bg-signal-dim'
                    : 'cursor-not-allowed text-fog opacity-50',
                  customOpen && 'border-signal bg-signal-dim',
                )}
              >
                Custom…
              </button>
            </div>

            {customOpen && ready && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Real size"
                  className="w-36 rounded-[6px] border border-line bg-ink-3 px-3 py-2 font-mono-hud text-sm text-paper outline-none focus:border-signal"
                />
                <span className="font-mono-hud text-xs text-fog">mm</span>
                <button
                  disabled={!customValid}
                  onClick={() => onCalibrate('Custom', customMm)}
                  className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-ink transition enabled:hover:brightness-110 enabled:active:scale-[0.97] disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            )}

            <p className="mt-5 font-mono-hud text-[10px] uppercase tracking-[0.06em] text-fog">
              Uncalibrated measurements use average device estimates
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
