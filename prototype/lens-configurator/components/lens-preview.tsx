'use client'

import { useEffect, useRef, useState } from 'react'
import type { ConfigState } from '@/lib/lens'
import { strongerEye } from '@/lib/lens'

interface LensPreviewProps {
  state: ConfigState
}

// Index → thickness multiplier (higher index = slimmer edge = the upsell).
const IDX_FACTOR: Record<string, number> = {
  '1.5': 1.0,
  '1.56': 1.0,
  '1.6': 0.66,
  '1.67': 0.48,
}

// Edge profile of the lens, thickness exaggerated for legibility.
function edgePath(E: number): string {
  const cx = 200
  const hw = 110
  const my = 400
  const C = 10 // center thickness
  const N = 42
  const top: string[] = []
  const bot: string[] = []
  for (let i = 0; i <= N; i++) {
    const x = cx - hw + (2 * hw * i) / N
    const t = C + (E - C) * Math.pow(Math.abs(x - cx) / hw, 1.6)
    top.push(`${x.toFixed(1)} ${(my - t / 2).toFixed(1)}`)
    bot.unshift(`${x.toFixed(1)} ${(my + t / 2).toFixed(1)}`)
  }
  return `M${top.join(' L')} L${bot.join(' L')} Z`
}

/** Smoothly interpolate a numeric value over `duration` ms via rAF. */
function useAnimatedNumber(target: number, duration = 300): number {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const next = from + (target - from) * eased
      setValue(next)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      fromRef.current = value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}

export function LensPreview({ state }: LensPreviewProps) {
  const [environment, setEnvironment] = useState<'interior' | 'exterior'>(
    'exterior',
  )

  const strong = strongerEye(state.od, state.os)
  const idxFactor = IDX_FACTOR[state.index] ?? 1.0

  // E = 10 + |SPH_stronger| * 6.5 * idxFactor (the upsell driver).
  const targetEdge = 10 + strong.absSph * 6.5 * idxFactor
  const edge = useAnimatedNumber(targetEdge, 300)

  // Qualitative caption keyed off the (target) edge thickness.
  let thicknessLabel = 'Standard'
  if (targetEdge < 20) thicknessLabel = 'Subțire'
  else if (targetEdge > 38) thicknessLabel = 'Groasă'

  const isAdaptive = state.light === 'foto' || state.light === 'transitions'

  // Face tint opacity, per the spec.
  let tintA = 0.1
  if (state.light === 'sun') tintA = 0.62
  else if (state.light === 'foto')
    tintA = environment === 'exterior' ? 0.55 : 0.2
  else if (state.light === 'transitions')
    tintA = environment === 'exterior' ? 0.6 : 0.18

  // Transitions darken faster — the premium cue.
  const tintDuration = state.light === 'transitions' ? 150 : 400

  const tint = `rgba(122,112,96,${tintA})`
  const sheen = state.coating === 'hmc' ? '#6f8f5f' : '#4f79b0'

  return (
    <div className="flex flex-col">
      <svg
        viewBox="0 0 400 480"
        className="w-full"
        role="img"
        aria-label="Reprezentare a lentilei și a secțiunii pe margine"
      >
        <defs>
          <clipPath id="lensFaceClip">
            <ellipse cx={200} cy={190} rx={130} ry={160} />
          </clipPath>
        </defs>

        {/* ---- 1. Lens face (hero) ---- */}
        <ellipse
          cx={200}
          cy={190}
          rx={130}
          ry={160}
          fill={tint}
          stroke="var(--foreground)"
          strokeOpacity={0.5}
          strokeWidth={1.2}
          style={{ transition: `fill ${tintDuration}ms ease` }}
        />

        {/* Bifocal segment: chord + tinted lower zone (clipped to the face). */}
        {state.type === 'bi' ? (
          <g clipPath="url(#lensFaceClip)">
            <rect
              x={70}
              y={245}
              width={260}
              height={120}
              fill="rgba(122,112,96,0.16)"
            />
            <line
              x1={70}
              y1={245}
              x2={330}
              y2={245}
              stroke="var(--foreground)"
              strokeOpacity={0.45}
              strokeWidth={1}
            />
          </g>
        ) : null}

        {/* Coating sheen along the inner-left edge. */}
        <path
          d="M135 85 Q90 190 145 295"
          fill="none"
          stroke={sheen}
          strokeWidth={7}
          strokeLinecap="round"
          opacity={0.5}
          style={{ transition: 'stroke 200ms ease' }}
        />

        {/* ---- 2. Edge cross-section (supporting detail) ---- */}
        <path
          d={edgePath(edge)}
          fill="rgba(125,130,140,0.45)"
          stroke="var(--foreground)"
          strokeOpacity={0.55}
          strokeWidth={0.6}
        />
      </svg>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Grosime margine
          </span>
          <span className="font-serif text-[18px] text-ink">
            {thicknessLabel}
          </span>
        </div>

        {isAdaptive ? (
          <div
            className="flex border border-hairline"
            role="radiogroup"
            aria-label="Mediu"
          >
            {(['interior', 'exterior'] as const).map((env) => (
              <button
                key={env}
                type="button"
                role="radio"
                aria-checked={environment === env}
                onClick={() => setEnvironment(env)}
                className={[
                  'px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors',
                  environment === env
                    ? 'bg-ink text-paper'
                    : 'bg-paper text-ink hover:bg-muted',
                ].join(' ')}
              >
                {env === 'interior' ? 'Interior' : 'Exterior'}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Reprezentare orientativă, nu la scară.
      </p>
    </div>
  )
}
