import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export const NAV_HEIGHT = 64

const LINKS = [
  { label: 'How it works', to: '/#how' },
  { label: 'Measure', to: '/measure' },
  { label: 'Screen Ruler', to: '/ruler' },
  { label: 'History', to: '/history' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="BPM Ruler logo" className="h-7 w-7" />
      <span className="font-display text-lg font-bold tracking-tight text-paper">BPM Ruler</span>
    </Link>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-line backdrop-blur-md"
        style={{ backgroundColor: 'rgba(10,10,11,0.7)', height: NAV_HEIGHT }}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className="text-sm font-medium text-fog transition-colors hover:text-signal"
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/measure"
              className="rounded-full bg-signal px-5 py-2 text-[15px] font-semibold text-ink transition hover:brightness-110 active:scale-[0.97]"
            >
              Start Measuring
            </Link>
          </nav>
          <button
            className="text-paper md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] flex flex-col bg-ink px-6 py-5"
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="text-paper">
                <X size={26} />
              </button>
            </div>
            <nav className="mt-16 flex flex-col gap-6">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.label}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.08 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="font-display text-3xl font-bold text-paper transition-colors hover:text-signal"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.08 * LINKS.length, duration: 0.4 }}
              >
                <Link
                  to="/measure"
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-block rounded-full bg-signal px-7 py-3 text-base font-semibold text-ink"
                >
                  Start Measuring
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
