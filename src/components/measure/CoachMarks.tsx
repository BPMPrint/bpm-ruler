import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CoachMarksProps {
  onDismiss: () => void
}

const RING =
  'pointer-events-none absolute rounded-full border-2 border-signal anim-breathe'

/** First-visit onboarding: pulsing coach marks over the live UI. */
export default function CoachMarks({ onDismiss }: CoachMarksProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50"
      style={{ backgroundColor: 'rgba(10,10,11,0.45)' }}
    >
      {/* Center: tap to place points */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className={cn(RING, 'h-24 w-24 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2')} />
        <div className="mt-14 w-52 -translate-x-1/2 rounded-[10px] border border-line bg-ink-2/90 px-3 py-2 text-center backdrop-blur-md">
          <span className="font-mono-hud text-[11px] uppercase tracking-[0.06em] text-signal">
            Tap to place two points
          </span>
        </div>
      </div>

      {/* Right toolbar */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <div className={cn(RING, '-right-1 -top-1 bottom-1 h-auto w-[60px] rounded-2xl')} />
        <div className="absolute right-16 top-0 w-40 rounded-[10px] border border-line bg-ink-2/90 px-3 py-2 backdrop-blur-md">
          <span className="font-mono-hud text-[11px] uppercase tracking-[0.06em] text-signal">
            Undo, freeze &amp; flip tools
          </span>
        </div>
      </div>

      {/* Calibration badge (top center) */}
      <div className="absolute left-1/2 top-16 -translate-x-1/2">
        <div className={cn(RING, 'left-1/2 top-1/2 h-12 w-72 max-w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full')} />
        <div className="mt-8 w-64 -translate-x-1/2 rounded-[10px] border border-line bg-ink-2/90 px-3 py-2 text-center backdrop-blur-md">
          <span className="font-mono-hud text-[11px] uppercase tracking-[0.06em] text-signal">
            Calibrate for real-world accuracy
          </span>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="absolute bottom-8 right-6 rounded-full bg-signal px-6 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 active:scale-[0.97]"
        style={{ bottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        Got it
      </button>
    </motion.div>
  )
}
