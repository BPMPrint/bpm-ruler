import { Link } from 'react-router'
import { motion } from 'framer-motion'

const PRODUCT = [
  { label: 'Measure', to: '/measure' },
  { label: 'Screen Ruler', to: '/ruler' },
  { label: 'History', to: '/history' },
]

const META = [
  { label: 'Privacy — camera never leaves your device', to: '/' },
  { label: 'GitHub', to: '/' },
  { label: 'Credits', to: '/' },
]

function FooterLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group relative inline-block text-sm text-fog transition-colors duration-200 hover:text-signal"
    >
      {label}
      <span className="absolute -bottom-0.5 left-0 h-[2px] w-0 bg-signal transition-all duration-300 group-hover:w-full" />
    </Link>
  )
}

export default function Footer() {
  return (
    <motion.footer
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="border-t border-line bg-ink"
    >
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="BPM Ruler logo" className="h-7 w-7" />
            <span className="font-display text-lg font-bold text-paper">BPM Ruler</span>
          </div>
          <p className="mt-3 text-sm text-fog">Measure anything.</p>
          <div
            className="mt-6 h-20 w-40 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>
        <div>
          <h4 className="font-mono-hud text-[11px] font-medium uppercase tracking-[0.06em] text-fog">
            Product
          </h4>
          <ul className="mt-4 space-y-3">
            {PRODUCT.map((l) => (
              <li key={l.label}>
                <FooterLink {...l} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-mono-hud text-[11px] font-medium uppercase tracking-[0.06em] text-fog">
            Meta
          </h4>
          <ul className="mt-4 space-y-3">
            {META.map((l) => (
              <li key={l.label}>
                <FooterLink {...l} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
          <span className="font-mono-hud text-[11px] uppercase tracking-[0.06em] text-fog">
            © 2025 ARULER
          </span>
          <span className="font-mono-hud text-[11px] tracking-[0.06em] text-signal">±2%</span>
        </div>
      </div>
    </motion.footer>
  )
}
