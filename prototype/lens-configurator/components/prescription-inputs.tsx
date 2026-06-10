'use client'

import { formatDiopter } from '@/lib/lens'

interface StepperProps {
  label: string
  value: number
  step?: number
  min?: number
  max?: number
  onChange: (value: number) => void
  invalid?: boolean
}

function Stepper({
  label,
  value,
  step = 0.25,
  min = -20,
  max = 20,
  onChange,
  invalid,
}: StepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const round = (n: number) => Math.round(n / step) * step

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <div
        className={[
          'flex items-stretch border',
          invalid ? 'border-error' : 'border-hairline',
        ].join(' ')}
      >
        <button
          type="button"
          aria-label={`Scade ${label}`}
          onClick={() => onChange(clamp(round(value - step)))}
          className="flex w-9 items-center justify-center border-r border-hairline text-ink transition-colors hover:bg-muted"
        >
          <span className="text-lg leading-none">−</span>
        </button>
        <span
          className={[
            'flex flex-1 items-center justify-center px-2 py-2 font-mono text-[15px] tabular-nums',
            invalid ? 'text-error' : 'text-ink',
          ].join(' ')}
        >
          {formatDiopter(value)}
        </span>
        <button
          type="button"
          aria-label={`Crește ${label}`}
          onClick={() => onChange(clamp(round(value + step)))}
          className="flex w-9 items-center justify-center border-l border-hairline text-ink transition-colors hover:bg-muted"
        >
          <span className="text-lg leading-none">+</span>
        </button>
      </div>
    </div>
  )
}

export interface EyeValues {
  sph: number
  cyl: number
  add: number
}

interface EyeRowProps {
  rowId: string
  title: string
  subtitle: string
  values: EyeValues
  showAdd: boolean
  onChange: (next: EyeValues) => void
  sphInvalid?: boolean
  cylInvalid?: boolean
  addInvalid?: boolean
}

export function EyeRow({
  rowId,
  title,
  subtitle,
  values,
  showAdd,
  onChange,
  sphInvalid,
  cylInvalid,
  addInvalid,
}: EyeRowProps) {
  return (
    <div className="border border-hairline">
      <div className="flex items-baseline justify-between border-b border-hairline px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            {rowId}
          </span>
          <span className="text-[14px] font-medium text-ink">{title}</span>
        </div>
        <span className="text-[12px] text-muted-foreground">{subtitle}</span>
      </div>
      <div
        className="grid gap-4 p-4"
        style={{
          gridTemplateColumns: showAdd
            ? 'repeat(3, minmax(0, 1fr))'
            : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        <Stepper
          label="Sferă"
          value={values.sph}
          onChange={(sph) => onChange({ ...values, sph })}
          invalid={sphInvalid}
        />
        <Stepper
          label="Cilindru"
          value={values.cyl}
          min={-6}
          max={0}
          onChange={(cyl) => onChange({ ...values, cyl })}
          invalid={cylInvalid}
        />
        {showAdd ? (
          <Stepper
            label="Adiție"
            value={values.add}
            min={0}
            max={4}
            onChange={(add) => onChange({ ...values, add })}
            invalid={addInvalid}
          />
        ) : null}
      </div>
    </div>
  )
}
