'use client'

import type { ComputeResult } from '@/lib/lens'
import { formatLei } from '@/lib/lens'

const AVAILABILITY_LABEL: Record<string, string> = {
  stoc: 'În stoc',
  comanda: 'La comandă',
  comanda57: 'La comandă · livrare 5–7 zile lucrătoare',
}

interface PriceBlockProps {
  result: ComputeResult
  onThinner: () => void
}

export function PriceBlock({ result, onThinner }: PriceBlockProps) {
  const blocking = result.errors.find((e) => e.field === 'cyl')
  const hasPrice = result.priceRon !== null && !blocking

  return (
    <div className="border-t border-hairline pt-6">
      {blocking ? (
        <div>
          <p className="max-w-sm text-pretty text-[15px] leading-relaxed text-error">
            {blocking.messageRo}
          </p>
          <button
            type="button"
            className="mt-4 w-full bg-ink px-4 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90"
          >
            Contactează-ne
          </button>
        </div>
      ) : (
        <>
          {hasPrice ? (
            <div className="inline-block">
              <span className="font-serif text-[44px] leading-none text-ink">
                {formatLei(result.priceRon as number)}
              </span>
              <div className="mt-2 h-[2px] w-full bg-accent" />
            </div>
          ) : (
            <span className="font-serif text-[28px] leading-none text-muted-foreground">
              Preț indisponibil
            </span>
          )}

          {/* availability — quiet line (R2) */}
          {result.availability ? (
            <p className="mt-4 text-[13px] text-muted-foreground">
              {AVAILABILITY_LABEL[result.availability]}
            </p>
          ) : null}

          {/* routing note (R4) */}
          {result.routedFrom && result.rowId ? (
            <p className="mt-3 text-[13px] leading-relaxed text-ink">
              Cu cilindru, lentila bifocală se execută la comandă (indice 1.6).{' '}
              <span className="font-mono text-[12px] text-muted-foreground">
                {result.routedFrom} → {result.rowId}
              </span>
            </p>
          ) : null}

          {/* thinning nudge (R3) */}
          {result.nudge === 'recommend_thinning' ? (
            <div className="mt-4 border-l-2 border-accent pl-4">
              <p className="text-pretty text-[13px] leading-relaxed text-accent">
                Pentru această dioptrie recomandăm lentile subțiate — mai
                estetice și mai ușoare.
              </p>
              <button
                type="button"
                onClick={onThinner}
                className="mt-2 text-[13px] font-medium text-accent underline underline-offset-4 hover:opacity-80"
              >
                Treci la lentile subțiate
              </button>
            </div>
          ) : null}

          {/* non-blocking field errors (R-out-of-range) */}
          {result.errors
            .filter((e) => e.field !== 'cyl')
            .map((e) => (
              <p
                key={e.field + e.messageRo}
                className="mt-4 text-pretty text-[13px] leading-relaxed text-error"
              >
                {e.messageRo}
              </p>
            ))}

          <button
            type="button"
            disabled={!hasPrice}
            className="mt-6 w-full bg-ink px-4 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            Adaugă în coș
          </button>
        </>
      )}
    </div>
  )
}
