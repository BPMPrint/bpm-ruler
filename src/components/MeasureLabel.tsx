import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MeasureLabelProps {
  value: string
  unit?: string
  className?: string
}

/** HUD pill showing a measurement value over camera feeds. */
export default function MeasureLabel({ value, unit, className }: MeasureLabelProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
      className={cn(
        'pointer-events-none inline-flex items-baseline gap-1 rounded-full border border-signal px-3.5 py-1.5 backdrop-blur-md',
        className,
      )}
      style={{
        backgroundColor: 'rgba(10,10,11,0.65)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      <span className="font-mono-hud text-base font-bold tracking-wide text-signal md:text-xl">
        {value}
      </span>
      {unit && <span className="font-mono-hud text-[11px] font-medium text-fog">{unit}</span>}
    </motion.div>
  )
}
