import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface SaveSheetProps {
  open: boolean
  /** Formatted measurement value, e.g. "11.4 cm" */
  displayValue: string
  defaultLabel: string
  /** Snapshot dataURL (may be null) */
  snapshot: string | null
  onClose: () => void
  onSave: (label: string) => void
}

/** Bottom sheet for saving a measurement to history. */
export default function SaveSheet({
  open,
  displayValue,
  defaultLabel,
  snapshot,
  onClose,
  onSave,
}: SaveSheetProps) {
  const [label, setLabel] = useState(defaultLabel)

  useEffect(() => {
    if (open) setLabel(defaultLabel)
  }, [open, defaultLabel])

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
            className="absolute inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-line bg-ink-2 px-5 pt-3"
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-line" />
            <div className="mt-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-paper">Save measurement</h3>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-fog transition hover:bg-ink-3 hover:text-paper"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="h-[90px] w-[120px] shrink-0 overflow-hidden rounded-[10px] border border-line bg-ink-3">
                {snapshot ? (
                  <img src={snapshot} alt="Measurement snapshot" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono-hud text-[10px] uppercase tracking-[0.06em] text-fog">
                    No frame
                  </div>
                )}
              </div>
              <div>
                <div className="font-mono-hud text-2xl font-bold text-signal">{displayValue}</div>
                <div className="mt-1 font-mono-hud text-[11px] tracking-[0.06em] text-fog">
                  {new Date().toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <label className="mt-5 block text-xs font-medium text-fog" htmlFor="measure-save-label">
              Label
            </label>
            <input
              id="measure-save-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Desk width"
              className="mt-1.5 w-full rounded-[6px] border border-line bg-ink-3 px-3 py-2.5 text-sm text-paper outline-none focus:border-signal"
            />

            <button
              onClick={() => onSave(label.trim() || defaultLabel)}
              className="mt-5 w-full rounded-full bg-signal px-5 py-3 text-[15px] font-semibold text-ink transition hover:brightness-110 active:scale-[0.97]"
            >
              Save to history
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
