import { createContext, useContext, useState, type ReactNode } from 'react'

export type Unit = 'cm' | 'in'

const MM_PER_IN = 25.4

interface UnitsContextValue {
  unit: Unit
  setUnit: (u: Unit) => void
  /** Format a millimetre value in the active unit, e.g. "11.4 cm" */
  formatMm: (mm: number, withUnit?: boolean) => string
  /** Convert mm to the active unit's numeric value */
  fromMm: (mm: number) => number
  /** Convert a value in the active unit to mm */
  toMm: (v: number) => number
}

const UnitsContext = createContext<UnitsContextValue | null>(null)

export function UnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<Unit>('cm')

  const fromMm = (mm: number) => (unit === 'cm' ? mm / 10 : mm / MM_PER_IN)
  const toMm = (v: number) => (unit === 'cm' ? v * 10 : v * MM_PER_IN)

  const formatMm = (mm: number, withUnit = true) => {
    const v = fromMm(mm)
    const str = unit === 'cm' ? v.toFixed(1) : v.toFixed(2)
    return withUnit ? `${str} ${unit}` : str
  }

  return (
    <UnitsContext.Provider value={{ unit, setUnit, formatMm, fromMm, toMm }}>
      {children}
    </UnitsContext.Provider>
  )
}

export function useUnits() {
  const ctx = useContext(UnitsContext)
  if (!ctx) throw new Error('useUnits must be used inside <UnitProvider>')
  return ctx
}
