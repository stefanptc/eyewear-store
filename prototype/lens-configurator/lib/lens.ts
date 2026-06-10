// =============================================================
// Optic Mărășești — pure lens configurator logic.
// No React, no DOM. Ports 1:1 to vanilla JS for the Liquid port.
// =============================================================

export type Coating = 'hmc' | 'ultra_blue'
export type Light = 'clear' | 'foto' | 'transitions' | 'sun'
export type LensType = 'mono' | 'bi'
export type Availability = 'stoc' | 'comanda' | 'comanda57'

export interface MonoRow {
  id: string
  coating: Coating
  light: Light
  index: string
  sph: [number, number]
  cylTier: 'base' | 'high' | 'any'
  price: number
  avail: Availability
}

export interface BiRow {
  id: string
  coating: Coating
  light: Light
  index: string
  sph: [number, number]
  cyl: 'zero' | 'upto6'
  add: [number, number]
  price: number
  avail: Availability
}

export interface EyeRx {
  sph: number
  cyl: number
  add: number
  /** Axis 0–180. Manufacturing data only — never affects price. */
  ax?: number
}

/** Order payload collected for manufacturing. Does NOT influence pricing. */
export interface OrderData {
  od: { sph: number; cyl: number; ax: number | null }
  os: { sph: number; cyl: number; ax: number | null }
  pd: number | null
}

export function buildOrderData(
  od: EyeRx,
  os: EyeRx,
  pd: number | null,
): OrderData {
  const axOf = (e: EyeRx) => (e.cyl !== 0 ? (e.ax ?? null) : null)
  return {
    od: { sph: od.sph, cyl: od.cyl, ax: axOf(od) },
    os: { sph: os.sph, cyl: os.cyl, ax: axOf(os) },
    pd,
  }
}

export interface ConfigState {
  type: LensType
  coating: Coating
  light: Light
  index: string
  od: EyeRx
  os: EyeRx
}

export interface ComputeError {
  field: string
  messageRo: string
}

export interface ComputeResult {
  rowId: string | null
  priceRon: number | null
  availability: Availability | null
  nudge: 'recommend_thinning' | null
  routedFrom: string | null
  errors: ComputeError[]
}

// ---------------------------------------------------------------
// Pricing data (per pair, RON)
// ---------------------------------------------------------------

export const MONO: MonoRow[] = [
  { id: 'M01', coating: 'hmc', light: 'clear', index: '1.56', sph: [-6, 6], cylTier: 'base', price: 100, avail: 'stoc' },
  { id: 'M02', coating: 'hmc', light: 'clear', index: '1.56', sph: [-6, 6], cylTier: 'high', price: 150, avail: 'comanda' },
  { id: 'M03', coating: 'hmc', light: 'clear', index: '1.6', sph: [-10, 6], cylTier: 'base', price: 180, avail: 'comanda57' },
  { id: 'M04', coating: 'hmc', light: 'clear', index: '1.6', sph: [-10, 6], cylTier: 'high', price: 220, avail: 'comanda57' },
  { id: 'M05', coating: 'hmc', light: 'clear', index: '1.67', sph: [-10, 10], cylTier: 'base', price: 380, avail: 'comanda57' },
  { id: 'M06', coating: 'hmc', light: 'clear', index: '1.67', sph: [-6, 6], cylTier: 'high', price: 450, avail: 'comanda57' },
  { id: 'M07', coating: 'ultra_blue', light: 'clear', index: '1.56', sph: [-10, 6], cylTier: 'base', price: 350, avail: 'stoc' },
  { id: 'M08', coating: 'ultra_blue', light: 'clear', index: '1.56', sph: [-10, 6], cylTier: 'high', price: 450, avail: 'comanda' },
  { id: 'M09', coating: 'ultra_blue', light: 'clear', index: '1.6', sph: [-12, 6], cylTier: 'base', price: 400, avail: 'comanda57' },
  { id: 'M10', coating: 'ultra_blue', light: 'clear', index: '1.6', sph: [-12, 6], cylTier: 'high', price: 650, avail: 'comanda57' },
  { id: 'M11', coating: 'ultra_blue', light: 'clear', index: '1.67', sph: [-17, 12], cylTier: 'any', price: 800, avail: 'comanda57' },
  { id: 'M12', coating: 'hmc', light: 'foto', index: '1.56', sph: [-8, 6], cylTier: 'base', price: 350, avail: 'stoc' },
  { id: 'M13', coating: 'hmc', light: 'foto', index: '1.56', sph: [-6, 6], cylTier: 'high', price: 480, avail: 'comanda' },
  { id: 'M14', coating: 'ultra_blue', light: 'foto', index: '1.56', sph: [-9, 8], cylTier: 'any', price: 650, avail: 'comanda' },
  { id: 'M15', coating: 'hmc', light: 'foto', index: '1.67', sph: [-10, 10], cylTier: 'any', price: 850, avail: 'comanda57' },
  { id: 'M16', coating: 'ultra_blue', light: 'foto', index: '1.67', sph: [-10, 10], cylTier: 'any', price: 900, avail: 'comanda57' },
  { id: 'M17', coating: 'hmc', light: 'transitions', index: '1.6', sph: [-12, 8], cylTier: 'any', price: 800, avail: 'comanda57' },
  { id: 'M18', coating: 'ultra_blue', light: 'transitions', index: '1.6', sph: [-12, 8], cylTier: 'any', price: 950, avail: 'comanda57' },
  { id: 'M19', coating: 'hmc', light: 'transitions', index: '1.67', sph: [-12, 8], cylTier: 'any', price: 1200, avail: 'comanda57' },
  { id: 'M20', coating: 'ultra_blue', light: 'transitions', index: '1.67', sph: [-12, 8], cylTier: 'any', price: 1400, avail: 'comanda57' },
  { id: 'M21', coating: 'hmc', light: 'sun', index: '1.5', sph: [-6, 4], cylTier: 'base', price: 350, avail: 'stoc' },
  { id: 'M22', coating: 'hmc', light: 'sun', index: '1.5', sph: [-6, 4], cylTier: 'high', price: 500, avail: 'comanda' },
]

export const BI: BiRow[] = [
  { id: 'B01', coating: 'hmc', light: 'clear', index: '1.5', sph: [-2, 3], cyl: 'zero', add: [1.0, 3.5], price: 350, avail: 'stoc' },
  { id: 'B02', coating: 'hmc', light: 'foto', index: '1.5', sph: [-2, 3], cyl: 'zero', add: [1.0, 3.5], price: 450, avail: 'stoc' },
  { id: 'B03', coating: 'ultra_blue', light: 'clear', index: '1.5', sph: [-9, 10], cyl: 'upto6', add: [0.75, 4.0], price: 600, avail: 'comanda' },
  { id: 'B04', coating: 'hmc', light: 'clear', index: '1.6', sph: [-9, 7], cyl: 'upto6', add: [1.0, 3.0], price: 650, avail: 'comanda57' },
  { id: 'B05', coating: 'ultra_blue', light: 'clear', index: '1.6', sph: [-9, 7], cyl: 'upto6', add: [1.0, 3.0], price: 750, avail: 'comanda57' },
  { id: 'B06', coating: 'hmc', light: 'foto', index: '1.6', sph: [-8, 6], cyl: 'upto6', add: [1.0, 3.0], price: 850, avail: 'comanda57' },
  { id: 'B07', coating: 'hmc', light: 'clear', index: '1.67', sph: [-15, 6], cyl: 'upto6', add: [1.0, 3.0], price: 1200, avail: 'comanda57' },
  { id: 'B08', coating: 'ultra_blue', light: 'clear', index: '1.67', sph: [-15, 6], cyl: 'upto6', add: [1.0, 3.0], price: 1300, avail: 'comanda57' },
]

// ---------------------------------------------------------------
// Stronger-eye rule (provisional, supplier TBD — isolated here).
// Each requirement taken independently, conservatively.
// ---------------------------------------------------------------

export function strongerEye(od: EyeRx, os: EyeRx) {
  return {
    absSph: Math.max(Math.abs(od.sph), Math.abs(os.sph)),
    absCyl: Math.max(Math.abs(od.cyl), Math.abs(os.cyl)),
    add: Math.max(od.add, os.add),
    // signed extremes (for range checks)
    minSph: Math.min(od.sph, os.sph),
    maxSph: Math.max(od.sph, os.sph),
  }
}

// ---------------------------------------------------------------
// Catalogue introspection helpers (combo-aware option lists)
// ---------------------------------------------------------------

const INDEX_ORDER = ['1.5', '1.56', '1.6', '1.67']

function sortIndices(values: string[]): string[] {
  return [...new Set(values)].sort(
    (a, b) => INDEX_ORDER.indexOf(a) - INDEX_ORDER.indexOf(b),
  )
}

export function rowsForCombo(state: ConfigState): (MonoRow | BiRow)[] {
  const data = state.type === 'mono' ? MONO : BI
  return data.filter(
    (r) => r.coating === state.coating && r.light === state.light,
  )
}

export function availableLights(type: LensType, coating: Coating): Light[] {
  const data = type === 'mono' ? MONO : BI
  const lights = data
    .filter((r) => r.coating === coating)
    .map((r) => r.light)
  // R5: Bifocale only Clare / Fotocromatice
  const order: Light[] = ['clear', 'foto', 'transitions', 'sun']
  return order.filter((l) => lights.includes(l))
}

export function availableCoatings(type: LensType, light: Light): Coating[] {
  const data = type === 'mono' ? MONO : BI
  const out: Coating[] = []
  for (const c of ['hmc', 'ultra_blue'] as Coating[]) {
    if (data.some((r) => r.coating === c && r.light === light)) out.push(c)
  }
  return out
}

export function availableIndices(state: ConfigState): string[] {
  return sortIndices(rowsForCombo(state).map((r) => r.index))
}

/** Next thinner (higher) index available for the current combo, or null. */
export function nextThinnerIndex(state: ConfigState): string | null {
  const indices = availableIndices(state)
  const pos = indices.indexOf(state.index)
  if (pos === -1 || pos === indices.length - 1) return null
  return indices[pos + 1]
}

// ---------------------------------------------------------------
// Romanian formatting
// ---------------------------------------------------------------

export function formatLei(n: number): string {
  const fixed = n.toFixed(2)
  const [intPart, dec] = fixed.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${grouped},${dec} lei`
}

export function formatDiopter(n: number): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  const abs = Math.abs(n).toFixed(2).replace('.', ',')
  return `${sign}${abs}`
}

// ---------------------------------------------------------------
// computeResult — the single source of truth for rendering.
// ---------------------------------------------------------------

export function computeResult(state: ConfigState): ComputeResult {
  const errors: ComputeError[] = []
  const strong = strongerEye(state.od, state.os)

  // R1 — cylinder above ±6 is out of scope.
  if (strong.absCyl > 6.0) {
    return {
      rowId: null,
      priceRon: null,
      availability: null,
      nudge: null,
      routedFrom: null,
      errors: [
        {
          field: 'cyl',
          messageRo:
            'Pentru cilindru peste ±6 contactează-ne — te ajutăm telefonic.',
        },
      ],
    }
  }

  if (state.type === 'mono') {
    return computeMono(state, strong, errors)
  }
  return computeBi(state, strong, errors)
}

function computeMono(
  state: ConfigState,
  strong: ReturnType<typeof strongerEye>,
  errors: ComputeError[],
): ComputeResult {
  const neededTier: 'base' | 'high' = strong.absCyl <= 2.0 ? 'base' : 'high'

  const candidates = MONO.filter(
    (r) =>
      r.coating === state.coating &&
      r.light === state.light &&
      r.index === state.index &&
      (r.cylTier === neededTier || r.cylTier === 'any'),
  )

  const row = candidates[0] ?? null

  if (!row) {
    return {
      rowId: null,
      priceRon: null,
      availability: null,
      nudge: null,
      routedFrom: null,
      errors: [
        {
          field: 'combo',
          messageRo:
            'Această combinație nu este disponibilă. Alege alt indice sau alt tratament.',
        },
      ],
    }
  }

  // SPH range validation (both eyes must fit).
  checkSphRange(state, row.sph, errors)

  const nudge = computeNudge(state, strong)

  return {
    rowId: row.id,
    priceRon: row.price,
    availability: row.avail,
    nudge,
    routedFrom: null,
    errors,
  }
}

function computeBi(
  state: ConfigState,
  strong: ReturnType<typeof strongerEye>,
  errors: ComputeError[],
): ComputeResult {
  let row =
    BI.find(
      (r) =>
        r.coating === state.coating &&
        r.light === state.light &&
        r.index === state.index,
    ) ?? null

  if (!row) {
    return {
      rowId: null,
      priceRon: null,
      availability: null,
      nudge: null,
      routedFrom: null,
      errors: [
        {
          field: 'combo',
          messageRo:
            'Această combinație nu este disponibilă. Alege alt indice sau alt tratament.',
        },
      ],
    }
  }

  let routedFrom: string | null = null

  // R4 — zero-cyl bifocal + any cylinder → route to same-light 1.6 row.
  if (row.cyl === 'zero' && strong.absCyl > 0) {
    const routed = BI.find(
      (r) =>
        r.coating === state.coating &&
        r.light === state.light &&
        r.index === '1.6',
    )
    if (routed) {
      routedFrom = row.id
      row = routed
    }
  }

  checkSphRange(state, row.sph, errors)
  checkAddRange(state, row.add, errors)

  const nudge = computeNudge(state, strong)

  return {
    rowId: row.id,
    priceRon: row.price,
    availability: row.avail,
    nudge,
    routedFrom,
    errors,
  }
}

function checkSphRange(
  state: ConfigState,
  range: [number, number],
  errors: ComputeError[],
) {
  const [min, max] = range
  const over = state.od.sph > max || state.os.sph > max
  const under = state.od.sph < min || state.os.sph < min
  if (over) {
    const worst = Math.max(state.od.sph, state.os.sph)
    errors.push({
      field: 'sph',
      messageRo: `Sfera ${formatDiopter(worst)} depășește limita acestei lentile (${formatDiopter(
        max,
      )}). Alege un indice mai subțire sau ajustează.`,
    })
  }
  if (under) {
    const worst = Math.min(state.od.sph, state.os.sph)
    errors.push({
      field: 'sph',
      messageRo: `Sfera ${formatDiopter(worst)} depășește limita acestei lentile (${formatDiopter(
        min,
      )}). Alege un indice mai subțire sau ajustează.`,
    })
  }
}

function checkAddRange(
  state: ConfigState,
  range: [number, number],
  errors: ComputeError[],
) {
  const [min, max] = range
  const adds = [state.od.add, state.os.add]
  if (adds.some((a) => a > max)) {
    errors.push({
      field: 'add',
      messageRo: `Adiția ${formatDiopter(Math.max(...adds))} depășește limita acestei lentile (${formatDiopter(
        max,
      )}). Ajustează adiția.`,
    })
  }
  if (adds.some((a) => a > 0 && a < min)) {
    errors.push({
      field: 'add',
      messageRo: `Adiția trebuie să fie cel puțin ${formatDiopter(
        min,
      )} pentru această lentilă. Ajustează adiția.`,
    })
  }
}

// R3 — gentle thinning suggestion (never blocks).
function computeNudge(
  state: ConfigState,
  strong: ReturnType<typeof strongerEye>,
): 'recommend_thinning' | null {
  const indices = availableIndices(state)
  const isLowest = indices.length > 0 && state.index === indices[0]
  const hasThinner = nextThinnerIndex(state) !== null
  if (isLowest && hasThinner && strong.absSph > 3.0) {
    return 'recommend_thinning'
  }
  return null
}

// ---------------------------------------------------------------
// Contextual upsell suggestion (never blocks, never affects price).
// Priority: thinning (handled via result.nudge) > ultra_blue > foto.
// Returns at most ONE, only when the equivalent row exists.
// ---------------------------------------------------------------

export type SuggestionKind = 'ultra_blue' | 'foto'

export interface Suggestion {
  kind: SuggestionKind
  deltaRon: number
}

/** Price of an alternative config, or null if that combo has no valid row. */
function priceOfAlternative(alt: ConfigState): number | null {
  const r = computeResult(alt)
  const blocking = r.errors.some((e) => e.field === 'cyl' || e.field === 'combo')
  if (blocking || r.priceRon === null) return null
  return r.priceRon
}

export function computeSuggestion(
  state: ConfigState,
  currentPrice: number | null,
): Suggestion | null {
  if (currentPrice === null) return null

  // (b) HMC + clear → suggest Ultra Blue (blue-light filter for screens).
  if (state.coating === 'hmc' && state.light === 'clear') {
    const alt: ConfigState = { ...state, coating: 'ultra_blue' }
    const altPrice = priceOfAlternative(alt)
    if (altPrice !== null && altPrice > currentPrice) {
      return { kind: 'ultra_blue', deltaRon: altPrice - currentPrice }
    }
  }

  // (c) clear (and b not shown) → suggest photochromic.
  if (state.light === 'clear') {
    const alt: ConfigState = { ...state, light: 'foto' }
    const altPrice = priceOfAlternative(alt)
    if (altPrice !== null && altPrice > currentPrice) {
      return { kind: 'foto', deltaRon: altPrice - currentPrice }
    }
  }

  return null
}
