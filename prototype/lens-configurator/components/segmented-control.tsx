'use client'

export interface SegmentOption {
  value: string
  label: string
  /** mono-font detail shown under the label, e.g. an index value */
  detail?: string
  /** small caption, e.g. a one-line description */
  hint?: string
  /** premium / quiet tag shown to the right */
  tag?: string
  disabled?: boolean
  /** reason shown on hover when disabled */
  reason?: string
}

interface SegmentedControlProps {
  legend: string
  options: SegmentOption[]
  value: string
  onChange: (value: string) => void
  /** number of columns at desktop width */
  columns?: number
}

export function SegmentedControl({
  legend,
  options,
  value,
  onChange,
  columns = 2,
}: SegmentedControlProps) {
  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="mb-3 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {legend}
      </legend>
      <div
        className="grid gap-px border border-hairline bg-hairline"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        role="radiogroup"
        aria-label={legend}
      >
        {options.map((opt) => {
          const selected = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={opt.disabled}
              title={opt.disabled ? opt.reason : undefined}
              onClick={() => !opt.disabled && onChange(opt.value)}
              className={[
                'group relative flex min-h-[64px] flex-col justify-center px-4 py-3 text-left transition-colors duration-150',
                selected
                  ? 'bg-ink text-paper'
                  : 'bg-paper text-ink hover:bg-muted',
                opt.disabled
                  ? 'cursor-not-allowed opacity-40 hover:bg-paper'
                  : 'cursor-pointer',
              ].join(' ')}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[15px] font-medium leading-tight">
                  {opt.label}
                </span>
                {opt.tag ? (
                  <span
                    className={[
                      'shrink-0 text-[10px] uppercase tracking-[0.16em]',
                      selected ? 'text-paper/70' : 'text-accent',
                    ].join(' ')}
                  >
                    {opt.tag}
                  </span>
                ) : null}
              </div>
              {opt.detail ? (
                <span
                  className={[
                    'mt-1 font-mono text-[12px]',
                    selected ? 'text-paper/70' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {opt.detail}
                </span>
              ) : null}
              {opt.hint ? (
                <span
                  className={[
                    'mt-1 text-[12px] leading-snug',
                    selected ? 'text-paper/70' : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {opt.hint}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
