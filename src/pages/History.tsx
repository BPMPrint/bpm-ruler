import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router'
import {
  Check,
  Copy,
  Download,
  MoreHorizontal,
  Pencil,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useToast } from '@/components/Toast'
import { useUnits } from '@/hooks/useUnits'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const LS_KEY = 'aruler:measurements'
const CHANGE_EVENT = 'aruler:history-changed'

interface Measurement {
  id: string
  label: string
  mm: number
  unit: 'cm' | 'in'
  createdAt: number
  snapshot: string | null
  source: 'camera' | 'demo'
}

function loadMeasurements(): Measurement[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((r): Measurement | null => {
        if (typeof r !== 'object' || r === null) return null
        const o = r as Record<string, unknown>
        const mm = typeof o.mm === 'number' ? o.mm : typeof o.valueMm === 'number' ? o.valueMm : null
        if (mm === null || !Number.isFinite(mm)) return null
        return {
          id: typeof o.id === 'string' ? o.id : `m-${Math.random().toString(36).slice(2)}`,
          label: typeof o.label === 'string' ? o.label : 'Measurement',
          mm,
          unit: o.unit === 'in' ? 'in' : 'cm',
          createdAt: typeof o.createdAt === 'number' ? o.createdAt : Date.now(),
          snapshot:
            typeof o.snapshot === 'string'
              ? o.snapshot
              : typeof o.thumbnail === 'string'
                ? o.thumbnail
                : null,
          source: o.source === 'demo' ? 'demo' : 'camera',
        }
      })
      .filter((m): m is Measurement => m !== null)
  } catch {
    return []
  }
}

function saveMeasurements(list: Measurement[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function dayKey(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (sameDay(d, today)) return 'TODAY'
  if (sameDay(d, yesterday)) return 'YESTERDAY'
  return d
    .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    .toUpperCase()
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`
}

type SortMode = 'newest' | 'oldest' | 'longest' | 'shortest'
type UnitFilter = 'all' | 'cm' | 'in'

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
      <motion.svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        fill="none"
        initial="hidden"
        animate="visible"
      >
        <motion.rect
          x="14"
          y="14"
          width="68"
          height="68"
          rx="10"
          stroke="var(--signal)"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <motion.line
          x1="48" y1="30" x2="48" y2="66"
          stroke="var(--signal)" strokeWidth="1.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        />
        <motion.line
          x1="30" y1="48" x2="66" y2="48"
          stroke="var(--signal)" strokeWidth="1.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        />
        <motion.circle
          cx="48" cy="48" r="5"
          stroke="var(--signal)" strokeWidth="1.5" fill="none"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.6, 1], opacity: [0, 0.7, 0] }}
          transition={{ duration: 1.6, delay: 1.2, repeat: Infinity, repeatDelay: 2.4 }}
          style={{ transformOrigin: '48px 48px' }}
        />
      </motion.svg>
      <div>
        <h3 className="font-display text-xl font-semibold text-paper">No measurements yet</h3>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-fog">
          Your saved measurements from the camera tool and screen ruler will live here.
        </p>
      </div>
      <Link
        to="/measure"
        className="rounded-full bg-signal px-6 py-2.5 text-[15px] font-semibold text-ink transition hover:brightness-110 active:scale-[0.97]"
      >
        Start measuring
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Fallback thumbnail (generated mini ruler-graphic)                   */
/* ------------------------------------------------------------------ */

function RulerThumb({ value }: { value: string }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-md bg-ink p-1.5">
      <svg className="absolute inset-x-0 top-0 h-4 w-full" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1={`${(i / 24) * 100}%`}
            y1="16"
            x2={`${(i / 24) * 100}%`}
            y2={i % 6 === 0 ? '4' : i % 3 === 0 ? '8' : '11'}
            stroke="var(--paper)"
            strokeOpacity={0.5}
            strokeWidth="1"
          />
        ))}
      </svg>
      <span className="truncate font-mono-hud text-[11px] font-bold text-signal">{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function History() {
  const { formatMm } = useUnits()
  const { toast } = useToast()

  const [records, setRecords] = useState<Measurement[]>(loadMeasurements)
  const [query, setQuery] = useState('')
  const [unitFilter, setUnitFilter] = useState<UnitFilter>('all')
  const [sort, setSort] = useState<SortMode>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [lightbox, setLightbox] = useState<Measurement | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [undoItem, setUndoItem] = useState<Measurement | null>(null)
  const undoTimer = useRef<number | undefined>(undefined)

  // live refresh on change event + cross-tab storage
  useEffect(() => {
    const reload = () => setRecords(loadMeasurements())
    window.addEventListener(CHANGE_EVENT, reload)
    window.addEventListener('storage', reload)
    return () => {
      window.removeEventListener(CHANGE_EVENT, reload)
      window.removeEventListener('storage', reload)
    }
  }, [])

  // esc closes lightbox
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = records.filter(
      (m) =>
        (unitFilter === 'all' || m.unit === unitFilter) &&
        (q === '' || m.label.toLowerCase().includes(q)),
    )
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.createdAt - a.createdAt
        case 'oldest':
          return a.createdAt - b.createdAt
        case 'longest':
          return b.mm - a.mm
        case 'shortest':
          return a.mm - b.mm
      }
    })
    return list
  }, [records, query, unitFilter, sort])

  const groups = useMemo(() => {
    const map = new Map<string, Measurement[]>()
    for (const m of filtered) {
      const k = dayKey(m.createdAt)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(m)
    }
    return [...map.entries()]
  }, [filtered])

  const copyValue = (m: Measurement) => {
    navigator.clipboard
      ?.writeText(formatMm(m.mm))
      .then(() => toast('Copied'))
      .catch(() => toast('Copy failed'))
  }

  const share = async (m: Measurement) => {
    const text = `${m.label}: ${formatMm(m.mm)} — measured with BPM Ruler`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'BPM Ruler measurement', text })
        return
      }
      throw new Error('no-share')
    } catch {
      navigator.clipboard
        ?.writeText(text)
        .then(() => toast('Copied to clipboard'))
        .catch(() => toast('Share failed'))
    }
  }

  const commitDelete = useCallback(
    (id: string) => {
      setRecords((prev) => {
        const next = prev.filter((m) => m.id !== id)
        saveMeasurements(next)
        return next
      })
    },
    [],
  )

  const remove = (m: Measurement) => {
    commitDelete(m.id)
    window.clearTimeout(undoTimer.current)
    setUndoItem(m)
    undoTimer.current = window.setTimeout(() => setUndoItem(null), 4000)
  }

  const undo = () => {
    if (!undoItem) return
    setRecords((prev) => {
      const next = [...prev, undoItem]
      saveMeasurements(next)
      return next
    })
    window.clearTimeout(undoTimer.current)
    setUndoItem(null)
  }

  const clearAll = () => {
    saveMeasurements([])
    setRecords([])
    setConfirmClear(false)
    toast('All measurements deleted')
  }

  const startRename = (m: Measurement) => {
    setEditingId(m.id)
    setEditValue(m.label)
  }
  const commitRename = () => {
    if (editingId) {
      const v = editValue.trim()
      if (v) {
        setRecords((prev) => {
          const next = prev.map((m) => (m.id === editingId ? { ...m, label: v } : m))
          saveMeasurements(next)
          return next
        })
      }
    }
    setEditingId(null)
  }

  const exportCSV = () => {
    const header = 'label,value_mm,value_display,unit,source,created_at'
    const rows = filtered.map((m) =>
      [
        `"${m.label.replace(/"/g, '""')}"`,
        m.mm.toFixed(2),
        `"${formatMm(m.mm)}"`,
        m.unit,
        m.source,
        new Date(m.createdAt).toISOString(),
      ].join(','),
    )
    download([header, ...rows].join('\n'), 'bpmruler-measurements.csv', 'text/csv')
    toast(`${filtered.length} measurements exported as CSV`)
  }
  const exportJSON = () => {
    download(JSON.stringify(filtered, null, 2), 'bpmruler-measurements.json', 'application/json')
    toast(`${filtered.length} measurements exported as JSON`)
  }
  const copyAll = () => {
    const text = filtered
      .map((m) => `${m.label}\t${formatMm(m.mm)}\t${new Date(m.createdAt).toISOString()}`)
      .join('\n')
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast(`${filtered.length} measurements copied`))
      .catch(() => toast('Copy failed'))
  }
  const download = (content: string, name: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  let rowIndex = 0

  return (
    <AppShell>
      <div className="h-full overflow-y-auto bg-ink">
        <div className="mx-auto max-w-[880px] px-4 py-8 sm:px-6">
          {records.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl">
                    Measurement history
                  </h2>
                  <span className="rounded-full border border-line bg-ink-3 px-2.5 py-0.5 font-mono-hud text-[11px] uppercase tracking-[0.06em] text-fog">
                    {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                {/* controls */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <div className="relative min-w-40 flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search labels…"
                      className="h-9 w-full rounded-md border border-line bg-ink-3 pl-8 pr-3 text-sm text-paper outline-none placeholder:text-fog focus:border-signal"
                    />
                  </div>

                  <div className="flex items-center rounded-full border border-line bg-ink-3 p-0.5">
                    {(['all', 'cm', 'in'] as UnitFilter[]).map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnitFilter(u)}
                        className={cn(
                          'rounded-full px-3 py-1 font-mono-hud text-[11px] font-medium uppercase tracking-wider transition-colors',
                          unitFilter === u ? 'bg-signal text-ink' : 'text-fog hover:text-paper',
                        )}
                      >
                        {u === 'all' ? 'All' : u}
                      </button>
                    ))}
                  </div>

                  <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
                    <SelectTrigger className="h-9 w-32 rounded-md border-line bg-ink-3 text-sm text-paper">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="longest">Longest</SelectItem>
                      <SelectItem value="shortest">Shortest</SelectItem>
                    </SelectContent>
                  </Select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-9 items-center gap-1.5 rounded-md border border-signal px-3.5 text-sm font-semibold text-signal transition hover:bg-signal-dim">
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={exportCSV}>CSV</DropdownMenuItem>
                      <DropdownMenuItem onClick={exportJSON}>JSON</DropdownMenuItem>
                      <DropdownMenuItem onClick={copyAll}>Copy all to clipboard</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    onClick={() => setConfirmClear(true)}
                    className="h-9 rounded-md border border-line px-3.5 text-sm font-semibold text-coral transition hover:bg-ink-3"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>

              {/* grouped list */}
              {filtered.length === 0 ? (
                <p className="mt-16 text-center text-sm text-fog">
                  No measurements match your filters.
                </p>
              ) : (
                <div className="mt-6">
                  {groups.map(([day, items]) => (
                    <div key={day} className="mb-6">
                      <div className="sticky top-0 z-10 -mx-1 bg-ink/90 px-1 py-2 font-mono-hud text-[11px] uppercase tracking-[0.06em] text-fog backdrop-blur">
                        {day}
                      </div>
                      <div className="flex flex-col gap-3">
                        <AnimatePresence initial={false}>
                          {items.map((m) => {
                            const i = rowIndex++
                            return (
                              <motion.div
                                key={m.id}
                                layout="position"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                                transition={{
                                  duration: i < 10 ? 0.5 : 0.25,
                                  delay: i < 10 ? i * 0.05 : 0,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="group flex items-center gap-4 rounded-[10px] border border-line bg-ink-2 p-3 transition-all hover:-translate-y-0.5 hover:border-signal"
                              >
                                {/* thumbnail */}
                                <button
                                  onClick={() => setLightbox(m)}
                                  className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-md border border-line transition-transform hover:scale-105 sm:h-[90px] sm:w-[120px]"
                                  aria-label={`Open snapshot of ${m.label}`}
                                >
                                  {m.snapshot ? (
                                    <img
                                      src={m.snapshot}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <RulerThumb value={formatMm(m.mm)} />
                                  )}
                                </button>

                                {/* value + label + meta */}
                                <div className="min-w-0 flex-1">
                                  <div className="font-mono-hud text-xl font-bold text-paper sm:text-2xl">
                                    {formatMm(m.mm)}
                                  </div>
                                  {editingId === m.id ? (
                                    <input
                                      autoFocus
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={commitRename}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') commitRename()
                                        if (e.key === 'Escape') setEditingId(null)
                                      }}
                                      className="mt-1 h-7 w-full max-w-56 rounded-md border border-signal bg-ink-3 px-2 text-sm text-paper outline-none"
                                    />
                                  ) : (
                                    <button
                                      onClick={() => startRename(m)}
                                      onDoubleClick={() => startRename(m)}
                                      className="mt-0.5 flex max-w-full items-center gap-1.5 text-left text-sm text-fog transition-colors hover:text-paper"
                                      title="Rename"
                                    >
                                      <span className="truncate">{m.label}</span>
                                      <Pencil className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                                    </button>
                                  )}
                                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono-hud text-[10px] uppercase tracking-[0.06em]">
                                    <span className="rounded border border-line px-1.5 py-px text-fog">
                                      {m.source === 'camera' ? 'Camera' : 'Demo'}
                                    </span>
                                    <span className="text-fog">{formatTime(m.createdAt)}</span>
                                  </div>
                                </div>

                                {/* actions: desktop icon row */}
                                <div className="hidden shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                                  {[
                                    { icon: Copy, label: 'Copy value', fn: () => copyValue(m) },
                                    { icon: Share2, label: 'Share', fn: () => share(m) },
                                    { icon: Trash2, label: 'Delete', fn: () => remove(m), danger: true },
                                  ].map(({ icon: Icon, label, fn, danger }) => (
                                    <button
                                      key={label}
                                      onClick={fn}
                                      aria-label={label}
                                      title={label}
                                      className={cn(
                                        'rounded-md p-2 transition-colors hover:bg-ink-3',
                                        danger ? 'text-coral' : 'text-fog hover:text-paper',
                                      )}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </button>
                                  ))}
                                </div>

                                {/* actions: mobile overflow */}
                                <div className="shrink-0 sm:hidden">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        aria-label="More actions"
                                        className="rounded-md p-2 text-fog transition-colors hover:bg-ink-3 hover:text-paper"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => copyValue(m)}>
                                        <Copy className="mr-2 h-4 w-4" /> Copy value
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => share(m)}>
                                        <Share2 className="mr-2 h-4 w-4" /> Share
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => startRename(m)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Rename
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => remove(m)}
                                        className="text-coral focus:text-coral"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* undo toast */}
      <AnimatePresence>
        {undoItem && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-1/2 z-[85] flex -translate-x-1/2 items-center gap-3 rounded-full border-l-2 border-signal bg-ink-2 py-2 pl-4 pr-2 text-sm text-paper shadow-lg"
            style={{ borderLeftColor: 'var(--signal)' }}
          >
            Measurement deleted
            <button
              onClick={undo}
              className="rounded-full bg-signal px-3 py-1 text-xs font-semibold text-ink transition hover:brightness-110"
            >
              Undo
            </button>
            <button
              onClick={() => setUndoItem(null)}
              aria-label="Dismiss"
              className="rounded-full p-1 text-fog transition hover:text-paper"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-md"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-ink-2"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={lightbox.label}
            >
              <div className="relative flex max-h-[60vh] items-center justify-center bg-ink">
                {lightbox.snapshot ? (
                  <img
                    src={lightbox.snapshot}
                    alt={lightbox.label}
                    className="max-h-[60vh] w-full object-contain"
                  />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center">
                    <span className="font-mono-hud text-4xl font-bold text-signal">
                      {formatMm(lightbox.mm)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setLightbox(null)}
                  aria-label="Close"
                  className="absolute right-3 top-3 rounded-full bg-ink/70 p-2 text-paper backdrop-blur transition hover:bg-ink-3"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <h3 className="font-display text-lg font-semibold text-paper">{lightbox.label}</h3>
                  <p className="mt-1 font-mono-hud text-[11px] uppercase tracking-[0.06em] text-fog">
                    {formatTime(lightbox.createdAt)} · {lightbox.source} · recorded in{' '}
                    {lightbox.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-hud text-2xl font-bold text-signal">
                    {formatMm(lightbox.mm)}
                  </span>
                  <button
                    onClick={() => copyValue(lightbox)}
                    aria-label="Copy value"
                    className="rounded-md p-2 text-fog transition-colors hover:bg-ink-3 hover:text-paper"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* clear-all confirm */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent className="border-line bg-ink-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-paper">Delete all measurements?</AlertDialogTitle>
            <AlertDialogDescription className="text-fog">
              This removes {records.length} {records.length === 1 ? 'entry' : 'entries'} from this
              browser. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-line bg-transparent text-paper hover:bg-ink-3 hover:text-paper">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAll}
              className="bg-coral text-ink hover:brightness-110"
            >
              <Check className="mr-1.5 h-4 w-4" />
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
