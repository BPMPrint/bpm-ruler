import { motion } from 'framer-motion'

interface ReferenceGuidesProps {
  pxPerMm: number
}

/** True-scale reference silhouettes (credit card, AA battery, A4 corner) for calibration sanity checks. */
export default function ReferenceGuides({ pxPerMm }: ReferenceGuidesProps) {
  const card = { w: 85.6 * pxPerMm, h: 54 * pxPerMm }
  const battery = { w: 14.5 * pxPerMm, h: 50.5 * pxPerMm }
  const a4 = { w: 210 * pxPerMm, h: 297 * pxPerMm }

  const draw = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* credit card */}
      <motion.div
        custom={0}
        variants={draw}
        initial="hidden"
        animate="visible"
        className="absolute left-8 top-8 rounded-md border border-dashed border-signal/70"
        style={{ width: card.w, height: card.h }}
      >
        <span className="absolute -bottom-5 left-0 font-mono-hud text-[10px] uppercase tracking-[0.06em] text-signal/70">
          Credit card · 85.6 × 54 mm
        </span>
      </motion.div>

      {/* AA battery */}
      <motion.div
        custom={1}
        variants={draw}
        initial="hidden"
        animate="visible"
        className="absolute bottom-16 right-8 rounded-full border border-dashed border-signal/70"
        style={{ width: battery.w, height: battery.h }}
      >
        <span className="absolute -left-2 top-1/2 -translate-x-full -translate-y-1/2 whitespace-nowrap font-mono-hud text-[10px] uppercase tracking-[0.06em] text-signal/70">
          AA · Ø14.5 × 50.5 mm
        </span>
      </motion.div>

      {/* A4 corner (clips off-stage naturally) */}
      <motion.div
        custom={2}
        variants={draw}
        initial="hidden"
        animate="visible"
        className="absolute bottom-0 left-1/3 border-l border-t border-dashed border-signal/70"
        style={{ width: a4.w, height: a4.h, transform: 'translateY(calc(100% - 120px))' }}
      >
        <span className="absolute left-2 top-2 font-mono-hud text-[10px] uppercase tracking-[0.06em] text-signal/70">
          A4 corner · 210 × 297 mm
        </span>
      </motion.div>
    </div>
  )
}
