import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import {
  Crosshair,
  CreditCard,
  Ruler,
  MoveHorizontal,
  History,
  WifiOff,
  Check,
} from 'lucide-react'
import Layout from '@/components/Layout'
import MeasureLabel from '@/components/MeasureLabel'

gsap.registerPlugin(ScrollTrigger)

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]

/* ---------------------------------- shared --------------------------------- */

function PrimaryButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3 text-[15px] font-semibold text-ink transition duration-200 hover:brightness-110 active:scale-[0.97]"
      style={{ boxShadow: '0 0 0 rgba(0,176,240,0)' }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,176,240,0.35)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 0 rgba(0,176,240,0)')}
    >
      {children}
    </Link>
  )
}

function GhostButton({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3 text-[15px] font-semibold text-paper transition duration-200 hover:bg-ink-3 active:scale-[0.97]"
    >
      {children}
    </button>
  )
}

function SectionH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-[2.5rem] font-bold leading-[1.1] tracking-[-0.02em] text-paper">
      {children}
    </h2>
  )
}

/* ----------------------------------- hero ---------------------------------- */

function HeroSection() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.hero-word',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'expo.out', delay: 0.3 },
        )
        gsap.fromTo('.hero-eyebrow', { opacity: 0 }, { opacity: 1, duration: 0.3 })
        gsap.fromTo('.hero-sub', { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.4 })
        gsap.fromTo(
          '.hero-ctas',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.55, ease: 'expo.out' },
        )
        gsap.fromTo(
          '.hero-phone',
          { x: 60, rotate: -8, opacity: 0 },
          { x: 0, rotate: -4, opacity: 1, duration: 0.9, ease: 'expo.out', delay: 0.4 },
        )
        gsap.fromTo(
          '.hero-chip',
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(2)', delay: 0.9 },
        )
        const path = document.querySelector<SVGPathElement>('.hero-underline path')
        if (path) {
          const len = path.getTotalLength()
          gsap.fromTo(
            path,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: 0.8, delay: 1.0, ease: 'power2.out' },
          )
        }
        // scroll parallax
        gsap.to('.chip-slow', {
          yPercent: -30,
          scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: 0.7 },
        })
        gsap.to('.chip-fast', {
          yPercent: -70,
          scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: 1.3 },
        })
        gsap.to('.hero-grid', {
          opacity: 0.4,
          scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true },
        })
      }, rootRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  const words = 'Measure anything, with just your camera.'.split(' ')

  return (
    <section ref={rootRef} className="relative -mt-16 flex min-h-[100dvh] items-center overflow-hidden">
      {/* drifting crosshair grid */}
      <div
        className="hero-grid anim-grid-drift absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: 0.7,
        }}
      />
      {/* breathing glow */}
      <div
        className="anim-breathe pointer-events-none absolute right-[-10%] top-1/2 h-[70vmin] w-[70vmin] -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--signal-dim) 0%, transparent 65%)' }}
      />

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-16 px-6 pb-16 pt-32 lg:grid-cols-[55%_45%] lg:items-center lg:pb-24">
        <div>
          <p className="hero-eyebrow font-mono-hud text-[0.625rem] font-medium uppercase tracking-[0.06em] text-signal">
            ● Browser-based AR measurement
          </p>
          <h1
            className="mt-5 font-display font-bold tracking-[-0.03em] text-paper"
            style={{ fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', lineHeight: 1.02 }}
          >
            {words.map((w, i) =>
              w === 'anything,' ? (
                <span key={i} className="relative inline-block whitespace-nowrap text-signal">
                  <span className="hero-word inline-block">anything,</span>
                  <svg
                    className="hero-underline absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 12"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path d="M3 9 C 60 3, 140 3, 197 8" stroke="var(--signal)" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              ) : (
                <span key={i} className="hero-word inline-block">
                  {w}
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              ),
            )}
          </h1>
          <p className="hero-sub mt-6 max-w-[46ch] text-[1.125rem] leading-[1.65] text-fog">
            BPM Ruler turns your phone or laptop camera into a precision measuring tool. Drop two
            points, get the distance — calibrated to real-world centimeters and inches.
          </p>
          <div className="hero-ctas mt-8 flex flex-wrap items-center gap-4">
            <PrimaryButton to="/measure">Start Measuring →</PrimaryButton>
            <GhostButton onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
              See how it works
            </GhostButton>
            <a
              href="/BPMRuler.apk"
              download="BPMRuler.apk"
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[0.9375rem] font-semibold tracking-[0.01em] text-paper transition hover:bg-ink-3"
            >
              ⤓ Android APK
            </a>
          </div>
          <div className="hero-ctas mt-10 flex items-center divide-x divide-line">
            {['±2% ACCURACY', 'NO INSTALL', 'FREE FOREVER'].map((s, i) => (
              <span
                key={s}
                className={`font-mono-hud text-[0.625rem] font-medium uppercase tracking-[0.06em] text-fog ${i === 0 ? 'pr-5' : 'px-5'}`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* device visual */}
        <div className="relative mx-auto w-full max-w-[360px]">
          <div className="hero-phone anim-bob" style={{ rotate: '-4deg' }}>
            <img
              src="/hero-phone.png"
              alt="Phone running BPM Ruler with an AR measurement across a coffee mug"
              className="w-full rounded-[2rem]"
            />
          </div>
          {/* floating HUD chips */}
          <div className="hero-chip chip-slow absolute -left-10 top-16">
            <MeasureLabel value="24.6" unit="cm" className="pointer-events-auto" />
          </div>
          <div className="hero-chip chip-fast absolute -right-6 top-1/3 rounded-full border border-signal bg-[rgba(10,10,11,0.55)] p-3 backdrop-blur-md">
            <Crosshair size={22} className="text-signal" />
          </div>
          <div className="hero-chip chip-slow absolute -left-4 bottom-16 flex items-center gap-1.5 rounded-full border border-line bg-[rgba(10,10,11,0.55)] px-3 py-1.5 backdrop-blur-md">
            <Check size={13} style={{ color: 'var(--mint)' }} />
            <span className="font-mono-hud text-[11px] font-medium" style={{ color: 'var(--mint)' }}>
              calibrated
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- demo teaser ------------------------------- */

const DEMO_SCENES = [
  { x1: 18, y1: 62, x2: 42, y2: 48, label: '8.5', unit: 'cm' },
  { x1: 52, y1: 70, x2: 66, y2: 52, label: '6.2', unit: 'cm' },
  { x1: 70, y1: 66, x2: 90, y2: 40, label: '11.4', unit: 'cm' },
]

function DemoPlayer() {
  const [scene, setScene] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setScene((s) => (s + 1) % DEMO_SCENES.length), 4500)
    return () => window.clearInterval(id)
  }, [])
  const s = DEMO_SCENES[scene]

  return (
    <div className="relative aspect-video w-full overflow-hidden">
      <img src="/demo-scene.jpg" alt="Desk scene demo" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-ink/20" />
      <div key={scene} className="absolute inset-0">
        {/* endpoint dots with sonar */}
        {[
          { x: s.x1, y: s.y1, d: '0.4s' },
          { x: s.x2, y: s.y2, d: '1.4s' },
        ].map((p, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i === 0 ? 0.4 : 1.4, duration: 0.14 }}
            className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span className="relative block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white">
              <span className="anim-sonar absolute inset-0 rounded-full border-2 border-white" style={{ animationDelay: p.d }} />
            </span>
          </motion.div>
        ))}
        {/* line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.5, duration: 0.4, ease: EASE }}
          className="absolute h-[3px] origin-left bg-signal"
          style={{
            left: `${s.x1}%`,
            top: `${s.y1}%`,
            width: `${Math.hypot(s.x2 - s.x1, s.y2 - s.y1)}%`,
            transform: `rotate(${Math.atan2(s.y2 - s.y1, s.x2 - s.x1)}rad)`,
            transformOrigin: '0 50%',
          }}
        />
        {/* label */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.9, type: 'spring', stiffness: 400, damping: 22 }}
          className="absolute"
          style={{ left: `${(s.x1 + s.x2) / 2}%`, top: `${(s.y1 + s.y2) / 2}%`, transform: 'translate(-50%, -160%)' }}
        >
          <MeasureLabel value={s.label} unit={s.unit} />
        </motion.div>
      </div>
    </div>
  )
}

function DemoTeaser() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: '+=160%',
            pin: true,
            scrub: true,
          },
        })
        tl.fromTo('.demo-frame', { scale: 0.92 }, { scale: 1, duration: 0.3, ease: 'none' })
        tl.fromTo('.demo-scan', { top: '0%' }, { top: '100%', duration: 0.5, ease: 'none' }, 0.2)
        tl.fromTo(
          '.demo-caption span',
          { opacity: 0.15 },
          { opacity: 1, stagger: 0.05, duration: 0.4 },
          0.6,
        )
      }, rootRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  const caption = 'Real footage? No — this is the actual UI. Try it live.'.split(' ')

  return (
    <section ref={rootRef} className="flex min-h-[100dvh] flex-col items-center justify-center py-24">
      <div className="demo-frame relative w-[min(920px,92vw)] overflow-hidden rounded-2xl border border-line bg-ink-2 p-2 shadow-2xl">
        {/* browser chrome */}
        <div className="flex items-center gap-1.5 px-2 pb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5C5C]" />
          <span className="h-2.5 w-2.5 rounded-full bg-signal" />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--mint)' }} />
          <span className="ml-3 font-mono-hud text-[10px] tracking-wider text-fog">bpmruler.app/measure</span>
        </div>
        <div className="relative overflow-hidden rounded-lg">
          <DemoPlayer />
          <div className="demo-scan pointer-events-none absolute left-0 h-[2px] w-full bg-signal/70 shadow-[0_0_18px_rgba(0,176,240,0.6)]" />
        </div>
      </div>
      <p className="demo-caption mt-8 max-w-xl px-6 text-center text-[1.125rem] text-fog">
        {caption.map((w, i) => (
          <span key={i}>
            {w}
            {i < caption.length - 1 ? ' ' : ''}
          </span>
        ))}
      </p>
    </section>
  )
}
/* -------------------------------- how it works ------------------------------ */

const STEPS = [
  {
    num: '01',
    title: 'Drop points',
    img: '/how-points.png',
    body: 'Point your camera at any surface and tap both ends of what you want to measure. White markers snap in with haptic-precision feedback.',
  },
  {
    num: '02',
    title: 'Calibrate once',
    img: '/how-calibrate.png',
    body: 'Hold a credit card, coin, or A4 sheet in frame. One known size unlocks real-world accuracy for everything else.',
  },
  {
    num: '03',
    title: 'Save & export',
    img: '/how-save.png',
    body: 'Every measurement lands in your history with a photo snapshot. Label it, share it, or export the whole log as CSV.',
  },
]

function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1200px] px-6 py-24 md:py-36">
      <SectionH2>Three taps to a real measurement.</SectionH2>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ y: 60, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-25%' }}
            transition={{ delay: i * 0.15, duration: 0.7, ease: EASE }}
            whileHover={{ y: -4 }}
            className="group overflow-hidden rounded-[10px] border border-line bg-ink-2 transition-colors duration-300 hover:border-signal"
          >
            <div className="overflow-hidden">
              <motion.img
                src={s.img}
                alt={s.title}
                initial={{ clipPath: 'inset(100% 0 0 0)' }}
                whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
                viewport={{ once: true, margin: '-25%' }}
                transition={{ delay: i * 0.15 + 0.1, duration: 0.6, ease: EASE }}
                className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="p-6">
              <span className="font-mono-hud text-sm font-bold tracking-[0.06em] text-signal">{s.num}</span>
              <h3 className="mt-2 font-display text-[1.375rem] font-semibold leading-[1.25] tracking-[-0.01em] text-paper">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.65] text-fog">{s.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* --------------------------------- features --------------------------------- */

const FEATURES = [
  { icon: Crosshair, title: 'Camera AR overlay', body: 'Live point placement over your real camera feed with sub-pixel line rendering.' },
  { icon: CreditCard, title: 'Reference calibration', body: 'Card, coin, or paper presets. One-tap calibration persists across sessions.' },
  { icon: Ruler, title: 'cm ⇄ inch toggle', body: 'Switch units anywhere. Values convert instantly, everywhere.' },
  { icon: MoveHorizontal, title: 'Screen ruler mode', body: 'Drag calipers across your display to measure physical objects on screen.' },
  { icon: History, title: 'History & export', body: 'Snapshot-backed log with labels, filters, and CSV/JSON export.' },
  { icon: WifiOff, title: 'Works offline', body: 'No account, no upload. Your camera feed never leaves your device.' },
]

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-[1200px] px-6 py-24 md:py-36">
      <SectionH2>Built like an instrument.</SectionH2>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
            whileHover={{ y: -4 }}
            className="group rounded-[10px] border border-line bg-ink-2 p-6"
          >
            <motion.div
              className="inline-block text-signal"
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <f.icon size={28} />
            </motion.div>
            <h3 className="mt-4 font-display text-[1.375rem] font-semibold leading-[1.25] text-paper">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-[1.65] text-fog">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------ calibration band ---------------------------- */

function CalibrationWidget() {
  const [refMm, setRefMm] = useState(85.6)
  // A demo object measured as 114mm when calibrated against an 85.6mm card.
  // Resizing the reference rescales the reading live.
  const readingMm = 114 * (85.6 / refMm)
  const cardWidth = 90 + (refMm - 60) * 2.2

  return (
    <div className="rounded-[10px] border border-line bg-ink p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono-hud text-[0.625rem] uppercase tracking-[0.06em] text-fog">
            Reference size
          </p>
          <p className="font-mono-hud text-2xl font-bold text-signal">{refMm.toFixed(1)} mm</p>
        </div>
        <MeasureLabel value={(readingMm / 10).toFixed(1)} unit="cm" />
      </div>

      {/* virtual card */}
      <div className="mt-6 flex h-24 items-center justify-center">
        <motion.div
          animate={{ width: cardWidth }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="flex h-16 items-center justify-center rounded-md border border-signal bg-ink-3"
        >
          <span className="font-mono-hud text-[10px] uppercase tracking-[0.06em] text-fog">card</span>
        </motion.div>
      </div>

      <input
        type="range"
        min={60}
        max={100}
        step={0.1}
        value={refMm}
        onChange={(e) => setRefMm(parseFloat(e.target.value))}
        className="mt-4 w-full accent-[#00b0f0]"
        aria-label="Reference size in millimetres"
      />
      <p className="mt-3 text-xs leading-relaxed text-fog">
        Drag to change the known reference size — the sample reading rescales instantly.
      </p>
    </div>
  )
}

function CalibrationSection() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: rootRef.current, start: 'top top', end: '+=100%', pin: true, scrub: true },
        })
        tl.fromTo('.cal-copy > *', { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.4 })
        tl.fromTo('.cal-widget', { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 }, 0.3)
      }, rootRef)
      return () => ctx.revert()
    })
    return () => mm.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      className="flex min-h-[100dvh] items-center border-y border-line bg-ink-2"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(0,176,240,0.05) 0 1px, transparent 1px 14px)',
      }}
    >
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-14 px-6 py-24 lg:grid-cols-2">
        <div className="cal-copy">
          <SectionH2>Calibrated to reality, not pixels.</SectionH2>
          <p className="mt-6 max-w-[52ch] leading-[1.65] text-fog">
            Phone cameras don't know scale — so BPM Ruler borrows it. Measure any object whose size
            you know, and every subsequent measurement inherits that ground truth. We show a live
            confidence badge so you always know when to re-calibrate.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {['Credit card — 85.6 mm', 'US quarter — 24.3 mm', 'A4 width — 210 mm'].map((c) => (
              <span
                key={c}
                className="rounded-full border border-line bg-ink px-3.5 py-1.5 font-mono-hud text-[11px] font-medium tracking-wider text-paper"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="cal-widget">
          <CalibrationWidget />
        </div>
      </div>
    </section>
  )
}

/* --------------------------------- final CTA -------------------------------- */

function FinalCTA() {
  return (
    <section className="flex min-h-[60dvh] flex-col items-center justify-center px-6 py-24 text-center">
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-20%' }}
        className="text-signal"
      >
        {[
          'M60 14 v26',
          'M60 80 v26',
          'M14 60 h26',
          'M80 60 h26',
        ].map((d, i) => (
          <motion.path
            key={d}
            d={d}
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1 } }}
            transition={{ duration: 1.2, delay: i * 0.1, ease: EASE }}
          />
        ))}
        <motion.circle
          cx="60"
          cy="60"
          r="9"
          stroke="currentColor"
          strokeWidth="4"
          variants={{ hidden: { pathLength: 0 }, show: { pathLength: 1 } }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
      </motion.svg>
      <motion.span
        initial={{ scale: 0.5, opacity: 0.7 }}
        whileInView={{ scale: 2.2, opacity: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 1.3, duration: 0.8, ease: 'easeOut' }}
        className="pointer-events-none -mt-[92px] h-[64px] w-[64px] rounded-full border-2 border-signal"
      />
      <h2 className="mt-10 font-display text-[2.5rem] font-bold leading-[1.1] tracking-[-0.02em] text-paper">
        Your next measurement is one tap away.
      </h2>
      <div className="mt-8">
        <PrimaryButton to="/measure">Open BPM Ruler</PrimaryButton>
        <a
          href="/BPMRuler.apk"
          download="BPMRuler.apk"
          className="ml-4 inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-[0.9375rem] font-semibold tracking-[0.01em] text-paper transition hover:bg-ink-3"
        >
          ⤓ Download Android App
        </a>
      </div>
      <p className="mt-6 font-mono-hud text-[0.625rem] font-medium uppercase tracking-[0.06em] text-fog">
        Works on Chrome · Safari · Edge — mobile &amp; desktop
      </p>
    </section>
  )
}

/* ----------------------------------- page ----------------------------------- */

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 })
    const onRaf = (time: number) => lenis.raf(time)
    gsap.ticker.add(onRaf)
    lenis.on('scroll', ScrollTrigger.update)
    return () => {
      gsap.ticker.remove(onRaf)
      lenis.destroy()
    }
  }, [])

  return (
    <Layout>
      <HeroSection />
      <DemoTeaser />
      <HowItWorks />
      <FeatureGrid />
      <CalibrationSection />
      <FinalCTA />
    </Layout>
  )
}
