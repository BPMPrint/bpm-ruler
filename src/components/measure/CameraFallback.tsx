import { motion } from 'framer-motion'
import { Camera, ImagePlay } from 'lucide-react'

interface CameraFallbackProps {
  onUseDemo: () => void
  onRetry: () => void
}

/**
 * Shown when getUserMedia is denied or unavailable.
 * Radar-sweep panel; the user can switch to the interactive demo scene
 * or retry the camera permission request.
 */
export default function CameraFallback({ onUseDemo, onRetry }: CameraFallbackProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink px-6">
      <div className="flex w-full max-w-sm flex-col items-center rounded-[10px] border border-line bg-ink-2 p-8 text-center">
        {/* Radar sweep */}
        <div className="relative h-32 w-32 overflow-hidden rounded-full border border-line">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle, transparent 24%, var(--line) 24.5%, transparent 25%), radial-gradient(circle, transparent 49%, var(--line) 49.5%, transparent 50%), radial-gradient(circle, transparent 74%, var(--line) 74.5%, transparent 75%), linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
              backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 2px, 2px 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'conic-gradient(from 0deg, rgba(0,176,240,0.5), transparent 90deg)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal" />
        </div>

        <h2 className="mt-6 font-display text-lg font-semibold text-paper">
          Camera unavailable
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-fog">
          BPM Ruler needs camera access to measure the real world. You can still try
          the full measuring experience on a demo scene.
        </p>

        <div className="mt-6 flex w-full flex-col gap-3">
          <button
            onClick={onUseDemo}
            className="flex items-center justify-center gap-2 rounded-full bg-signal px-5 py-2.5 text-[15px] font-semibold text-ink transition hover:brightness-110 active:scale-[0.97]"
          >
            <ImagePlay size={16} />
            Use demo scene
          </button>
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-[15px] font-medium text-paper transition hover:bg-ink-3 active:scale-[0.97]"
          >
            <Camera size={16} />
            Retry camera
          </button>
        </div>

        <span className="mt-5 font-mono-hud text-[10px] uppercase tracking-[0.06em] text-fog">
          Camera never leaves your device
        </span>
      </div>
    </div>
  )
}
