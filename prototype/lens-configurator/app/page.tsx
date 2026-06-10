'use client'

import { useMemo, useState } from 'react'
import type { ConfigState, EyeRx } from '@/lib/lens'
import {
  computeResult,
  availableLights,
  availableCoatings,
  availableIndices,
  nextThinnerIndex,
} from '@/lib/lens'
import { Configurator } from '@/components/configurator'
import { LensPreview } from '@/components/lens-preview'
import { PriceBlock } from '@/components/price-block'

const INITIAL: ConfigState = {
  type: 'mono',
  coating: 'hmc',
  light: 'clear',
  index: '1.56',
  od: { sph: -1.5, cyl: 0, add: 0 },
  os: { sph: -1.25, cyl: 0, add: 0 },
}

/** Keep coating / light / index coherent with the catalogue after a change. */
function normalize(next: ConfigState): ConfigState {
  const s = { ...next }

  // R5 — Bifocale only Clare / Fotocromatice.
  if (s.type === 'bi' && (s.light === 'transitions' || s.light === 'sun')) {
    s.light = 'clear'
  }

  // Resolve the coating/light interdependency.
  const lights = availableLights(s.type, s.coating)
  if (!lights.includes(s.light)) {
    const coatings = availableCoatings(s.type, s.light)
    if (coatings.length > 0) {
      s.coating = coatings[0]
    } else {
      s.light = availableLights(s.type, s.coating)[0]
    }
  }

  const coatings = availableCoatings(s.type, s.light)
  if (!coatings.includes(s.coating)) s.coating = coatings[0]

  const indices = availableIndices(s)
  if (!indices.includes(s.index)) s.index = indices[0]

  return s
}

export default function Page() {
  const [state, setState] = useState<ConfigState>(INITIAL)

  const result = useMemo(() => computeResult(state), [state])

  function patch(p: Partial<ConfigState>) {
    setState((prev) => normalize({ ...prev, ...p }))
  }

  function setEye(eye: 'od' | 'os', next: EyeRx) {
    setState((prev) => ({ ...prev, [eye]: next }))
  }

  function goThinner() {
    const idx = nextThinnerIndex(state)
    if (idx) patch({ index: idx })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-6 py-5">
          <span className="font-serif text-[20px] tracking-tight text-ink">
            Optic Mărășești
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Configurator lentile
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10 max-w-xl">
          <h1 className="text-balance font-serif text-[28px] leading-tight text-ink">
            Configurează lentilele tale de prescripție
          </h1>
          <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted-foreground">
            Alege tratamentul, comportamentul la lumină și subțierea, apoi
            introdu rețeta. Prețul se actualizează pe loc.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[55fr_45fr]">
          {/* Left — configurator */}
          <section aria-label="Configurator">
            <Configurator
              state={state}
              result={result}
              onChange={patch}
              onEyeChange={setEye}
            />
          </section>

          {/* Right — sticky preview + price */}
          <aside aria-label="Previzualizare și preț">
            <div className="lg:sticky lg:top-8">
              <div className="flex min-h-[34rem] items-center justify-center border border-hairline p-8">
                <div className="w-full max-w-[24rem]">
                  <LensPreview state={state} />
                </div>
              </div>
              <PriceBlock result={result} onThinner={goThinner} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
