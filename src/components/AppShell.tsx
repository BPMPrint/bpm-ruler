import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import UnitToggle from './UnitToggle'
import { cn } from '@/lib/utils'

const MODES = [
  { label: 'Measure', to: '/measure' },
  { label: 'Screen Ruler', to: '/ruler' },
  { label: 'History', to: '/history' },
]

interface AppShellProps {
  children: ReactNode
  /** Slot for extra right-aligned top-bar controls */
  actions?: ReactNode
}

/** Full-viewport dark shell shared by the tool pages (/measure, /ruler, /history). */
export default function AppShell({ children, actions }: AppShellProps) {
  const location = useLocation()

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-ink text-paper"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-ink px-4">
        <Link to="/" className="flex items-center gap-2" aria-label="BPM Ruler home">
          <img src="/logo.svg" alt="" className="h-6 w-6" />
          <span className="hidden font-display text-base font-bold sm:inline">BPM Ruler</span>
        </Link>

        <nav className="flex items-center rounded-full border border-line bg-ink-3 p-0.5">
          {MODES.map((m) => {
            const active = location.pathname === m.to
            return (
              <NavLink
                key={m.to}
                to={m.to}
                className={cn(
                  'relative rounded-full px-3 py-1 text-xs font-medium transition-colors sm:px-4 sm:text-[13px]',
                  active ? 'text-ink' : 'text-fog hover:text-paper',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="appshell-mode-thumb"
                    className="absolute inset-0 rounded-full bg-signal"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{m.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {actions}
          <UnitToggle />
        </div>
      </header>

      {/* Content with cross-fade/slide tab transition */}
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}
