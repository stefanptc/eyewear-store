'use client'

import type {
  ConfigState,
  ComputeResult,
  Coating,
  Light,
  LensType,
  EyeRx,
} from '@/lib/lens'
import {
  availableCoatings,
  availableLights,
  availableIndices,
} from '@/lib/lens'
import { SegmentedControl, type SegmentOption } from './segmented-control'
import { EyeRow } from './prescription-inputs'

const COATING_META: Record<Coating, { label: string; hint: string }> = {
  hmc: { label: 'HMC (verde)', hint: 'pentru lumină artificială' },
  ultra_blue: { label: 'Ultra Blue', hint: 'pentru ecrane și calculator' },
}

const LIGHT_META: Record<Light, { label: string; tag?: string }> = {
  clear: { label: 'Clare' },
  foto: { label: 'Fotocromatice' },
  transitions: { label: 'Transitions', tag: 'premium' },
  sun: { label: 'De soare' },
}

const INDEX_NAME: Record<string, string> = {
  '1.5': 'Standard',
  '1.56': 'Standard',
  '1.6': 'Subțiat',
  '1.67': 'Ultra-subțiat',
}

interface ConfiguratorProps {
  state: ConfigState
  result: ComputeResult
  onChange: (patch: Partial<ConfigState>) => void
  onEyeChange: (eye: 'od' | 'os', next: EyeRx) => void
}

export function Configurator({
  state,
  result,
  onChange,
  onEyeChange,
}: ConfiguratorProps) {
  // --- option lists (combo-aware) ---
  const coatingOpts: SegmentOption[] = (['hmc', 'ultra_blue'] as Coating[]).map(
    (c) => {
      const ok = availableCoatings(state.type, state.light).includes(c)
      return {
        value: c,
        label: COATING_META[c].label,
        hint: COATING_META[c].hint,
        disabled: !ok,
        reason: 'Indisponibil pentru această combinație',
      }
    },
  )

  const allLights: Light[] = ['clear', 'foto', 'transitions', 'sun']
  const lightOpts: SegmentOption[] = allLights
    .filter((l) => (state.type === 'bi' ? l === 'clear' || l === 'foto' : true))
    .map((l) => {
      const ok = availableLights(state.type, state.coating).includes(l)
      return {
        value: l,
        label: LIGHT_META[l].label,
        tag: LIGHT_META[l].tag,
        disabled: !ok,
        reason: 'Indisponibil pentru acest tratament',
      }
    })

  const indices = availableIndices(state)
  const indexOpts: SegmentOption[] = indices.map((idx) => ({
    value: idx,
    label: INDEX_NAME[idx] ?? idx,
    detail: `(${idx})`,
  }))
  // Monofocale de soare: append disabled "preț la cerere" thinning option.
  if (state.type === 'mono' && state.light === 'sun') {
    indexOpts.push({
      value: '__sun_thin',
      label: 'Subțiat',
      detail: 'preț la cerere',
      disabled: true,
      reason: 'Disponibil la cerere — contactează-ne',
    })
  }

  const showAdd = state.type === 'bi'
  const sphError = result.errors.some((e) => e.field === 'sph')
  const addError = result.errors.some((e) => e.field === 'add')

  return (
    <div className="flex flex-col gap-10">
      <SegmentedControl
        legend="Tip lentilă"
        columns={2}
        value={state.type}
        onChange={(v) => onChange({ type: v as LensType })}
        options={[
          { value: 'mono', label: 'Monofocale' },
          { value: 'bi', label: 'Bifocale' },
        ]}
      />

      <SegmentedControl
        legend="Tratament"
        columns={2}
        value={state.coating}
        onChange={(v) => onChange({ coating: v as Coating })}
        options={coatingOpts}
      />

      <SegmentedControl
        legend="Comportament la lumină"
        columns={2}
        value={state.light}
        onChange={(v) => onChange({ light: v as Light })}
        options={lightOpts}
      />

      <SegmentedControl
        legend="Subțiere (indice)"
        columns={indexOpts.length >= 3 ? 3 : 2}
        value={state.index}
        onChange={(v) => onChange({ index: v })}
        options={indexOpts}
      />

      <div className="flex flex-col gap-4">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Rețeta
        </span>
        <EyeRow
          rowId="OD"
          title="Ochi drept"
          subtitle="dreapta"
          values={state.od}
          showAdd={showAdd}
          onChange={(next) => onEyeChange('od', next)}
          sphInvalid={sphError}
          addInvalid={addError}
        />
        <EyeRow
          rowId="OS"
          title="Ochi stâng"
          subtitle="stânga"
          values={state.os}
          showAdd={showAdd}
          onChange={(next) => onEyeChange('os', next)}
          sphInvalid={sphError}
          addInvalid={addError}
        />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Pașii sunt de 0,25. Cilindrul se introduce în formă negativă.
        </p>
      </div>
    </div>
  )
}
