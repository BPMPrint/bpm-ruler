import { memo } from 'react'

export interface OverlayPoint {
  x: number
  y: number
}

interface MeasureOverlayProps {
  width: number
  height: number
  points: OverlayPoint[]
  /** Live cursor/finger position for the rubber-band preview */
  cursor: OverlayPoint | null
  draggingIndex: number | null
  /** Index of the most recently placed point — gets a one-shot sonar ring */
  sonarIndex: number | null
  showReticle: boolean
}

const TICK = 8

/** SVG layer: crosshair reticle, measurement line + end ticks, endpoint dots, sonar rings. */
function MeasureOverlay({
  width,
  height,
  points,
  cursor,
  draggingIndex,
  sonarIndex,
  showReticle,
}: MeasureOverlayProps) {
  const [a, b] = points

  // Rubber-band preview from the single placed point to the cursor
  const previewEnd = points.length === 1 && cursor ? cursor : null

  // Perpendicular end-tick vectors for the completed line
  let ticks: { x1: number; y1: number; x2: number; y2: number }[] = []
  if (a && b) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const nx = (-dy / len) * TICK
    const ny = (dx / len) * TICK
    ticks = [
      { x1: a.x - nx, y1: a.y - ny, x2: a.x + nx, y2: a.y + ny },
      { x1: b.x - nx, y1: b.y - ny, x2: b.x + nx, y2: b.y + ny },
    ]
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <defs>
        <filter id="measure-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00b0f0" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Center crosshair reticle */}
      {showReticle && (
        <g opacity={0.7}>
          <circle
            cx={width / 2}
            cy={height / 2}
            r={19}
            fill="none"
            stroke="var(--signal)"
            strokeWidth={1}
          />
          <line x1={width / 2 - 20} y1={height / 2} x2={width / 2 - 6} y2={height / 2} stroke="#fff" strokeWidth={1} />
          <line x1={width / 2 + 6} y1={height / 2} x2={width / 2 + 20} y2={height / 2} stroke="#fff" strokeWidth={1} />
          <line x1={width / 2} y1={height / 2 - 20} x2={width / 2} y2={height / 2 - 6} stroke="#fff" strokeWidth={1} />
          <line x1={width / 2} y1={height / 2 + 6} x2={width / 2} y2={height / 2 + 20} stroke="#fff" strokeWidth={1} />
        </g>
      )}

      {/* Completed measurement line */}
      {a && b && (
        <g filter="url(#measure-glow)">
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--signal)" strokeWidth={2} />
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--signal)" strokeWidth={2} />
          ))}
        </g>
      )}

      {/* Rubber-band preview */}
      {a && previewEnd && (
        <line
          x1={a.x}
          y1={a.y}
          x2={previewEnd.x}
          y2={previewEnd.y}
          stroke="var(--signal)"
          strokeWidth={1.5}
          strokeDasharray="6 5"
          opacity={0.85}
        />
      )}

      {/* Endpoint dots */}
      {points.map((p, i) => {
        const dragging = draggingIndex === i
        const r = dragging ? 8 : 5
        return (
          <g key={i}>
            {sonarIndex === i && (
              <circle
                cx={p.x}
                cy={p.y}
                r={22}
                fill="none"
                stroke="var(--signal)"
                strokeWidth={1.5}
                className="anim-sonar"
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill="#fff"
              stroke="var(--ink)"
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}
            />
          </g>
        )
      })}
    </svg>
  )
}

export default memo(MeasureOverlay)
