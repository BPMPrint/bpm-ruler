import { motion } from 'framer-motion'
import { useUnits, type Unit } from '@/hooks/useUnits'
import { cn } from '@/lib/utils'

const OPTIONS: Unit[] = ['cm', 'in']

export default function UnitToggle() {
  const { unit, setUnit } = useUnits()
  return (
    <div
      className="flex items-center rounded-full border border-line bg-ink-3 p-0.5"
      role="group"
      aria-label="Unit"
    >
      {OPTIONS.map((opt) => {
        const active = opt === unit
        return (
          <button
            key={opt}
            onClick={() => setUnit(opt)}
            className={cn(
              'relative rounded-full px-3 py-1 font-mono-hud text-[11px] font-medium uppercase tracking-wider transition-colors',
              active ? 'text-ink' : 'text-fog hover:text-paper',
            )}
          >
            {active && (
              <motion.span
                layoutId="unit-toggle-thumb"
                className="absolute inset-0 rounded-full bg-signal"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{opt}</span>
          </button>
        )
      })}
    </div>
  )
}
