# v0 prompt — Lens calculator + live preview (v2, post-review)

Paste everything below this line into v0.

---

Build a single-page React prototype of a **prescription lens configurator** for a premium-minimalist Romanian eyewear store. This is a UI/UX ideation prototype — it will later be ported to a Shopify Liquid section with vanilla JS, so keep state logic in plain functions (one `computeResult(state)` function, no context/redux), components shallow, and avoid any library beyond React + Tailwind.

## Brand & design system (strict)

- Feel: editorial, restrained, precise — like a well-set book or an optical instrument catalogue. Reference: **Cubitts**. Explicitly NOT Warby Parker friendliness, NOT a SaaS dashboard.
- Typography: **Source Serif 4** for headings and the price; **IBM Plex Sans** for UI/labels; **IBM Plex Mono** for prescription values and row IDs. (Google Fonts.)
- Color: near-black ink on warm white. ONE accent: mushroom taupe **#8C7A5C** — used only for selected states, the nudge, and the price underline. A muted red for validation errors only.
- **No rounded corners anywhere — border-radius: 0 globally.** Choice groups are square segmented controls: hairline 1px borders, selected state = ink background with warm-white text (or 1px taupe inset), never a fill of the accent.
- Spacing on an 8px base. No cards-in-cards, no shadows, no gradients.
- Entire UI in **Romanian** (diacritics correct). Currency in Romanian format, comma decimals: `780,00 lei` / `1.234,00 lei`.
- Brand name shown in the header: „Optic Mărășești" (placeholder, final name TBD — keep it a plain text node, easy to swap).

## Layout

Two columns on desktop (stack on mobile):
- **Left (~55%):** the configurator — a vertical sequence of choice groups (square segmented controls), then prescription inputs.
- **Right (~45%), sticky:** the **live lens preview** (SVG, spec below) with the price block under it.

## Configurator flow (top to bottom)

1. **Tip lentilă:** Monofocale / Bifocale
2. **Tratament:** HMC (verde) / Ultra Blue — with one-line descriptions: HMC „pentru lumină artificială", Ultra Blue „pentru ecrane și calculator"
3. **Comportament la lumină:** Clare / Fotocromatice / Transitions / De soare — Transitions tagged „premium"; for Bifocale only Clare/Fotocromatice are shown (rule R5)
4. **Subțiere (indice):** show only indices that exist for the current combo, with **combo-aware labels**:
   - Monofocale: Standard (1.56) / Subțiat (1.6) / Ultra-subțiat (1.67)
   - Monofocale de soare: Standard (1.5) + a disabled „Subțiat — preț la cerere" option
   - Bifocale: Standard (1.5) / Subțiat (1.6) / Ultra-subțiat (1.67)
5. **Rețeta** — two rows, OD (ochi drept) and OS (ochi stâng), each with: SFERĂ (SPH, steps of 0.25), CILINDRU (CYL, steps of 0.25), and for Bifocale ADIȚIE (ADD, steps of 0.25). Number steppers, mono font. The pair is priced by the **stronger requirement**: max |SPH|, max |CYL|, max ADD across the two eyes, each taken independently (conservative; never under-prices). This rule is provisional (supplier TBD) — keep it isolated in one small function `strongerEye(od, os)`.

## Pricing data (per pair, RON)

```json
{"mono":[
{"id":"M01","coating":"hmc","light":"clear","index":"1.56","sph":[-6,6],"cylTier":"base","price":100,"avail":"stoc"},
{"id":"M02","coating":"hmc","light":"clear","index":"1.56","sph":[-6,6],"cylTier":"high","price":150,"avail":"comanda"},
{"id":"M03","coating":"hmc","light":"clear","index":"1.6","sph":[-10,6],"cylTier":"base","price":180,"avail":"comanda57"},
{"id":"M04","coating":"hmc","light":"clear","index":"1.6","sph":[-10,6],"cylTier":"high","price":220,"avail":"comanda57"},
{"id":"M05","coating":"hmc","light":"clear","index":"1.67","sph":[-10,10],"cylTier":"base","price":380,"avail":"comanda57"},
{"id":"M06","coating":"hmc","light":"clear","index":"1.67","sph":[-6,6],"cylTier":"high","price":450,"avail":"comanda57"},
{"id":"M07","coating":"ultra_blue","light":"clear","index":"1.56","sph":[-10,6],"cylTier":"base","price":350,"avail":"stoc"},
{"id":"M08","coating":"ultra_blue","light":"clear","index":"1.56","sph":[-10,6],"cylTier":"high","price":450,"avail":"comanda"},
{"id":"M09","coating":"ultra_blue","light":"clear","index":"1.6","sph":[-12,6],"cylTier":"base","price":400,"avail":"comanda57"},
{"id":"M10","coating":"ultra_blue","light":"clear","index":"1.6","sph":[-12,6],"cylTier":"high","price":650,"avail":"comanda57"},
{"id":"M11","coating":"ultra_blue","light":"clear","index":"1.67","sph":[-17,12],"cylTier":"any","price":800,"avail":"comanda57"},
{"id":"M12","coating":"hmc","light":"foto","index":"1.56","sph":[-8,6],"cylTier":"base","price":350,"avail":"stoc"},
{"id":"M13","coating":"hmc","light":"foto","index":"1.56","sph":[-6,6],"cylTier":"high","price":480,"avail":"comanda"},
{"id":"M14","coating":"ultra_blue","light":"foto","index":"1.56","sph":[-9,8],"cylTier":"any","price":650,"avail":"comanda"},
{"id":"M15","coating":"hmc","light":"foto","index":"1.67","sph":[-10,10],"cylTier":"any","price":850,"avail":"comanda57"},
{"id":"M16","coating":"ultra_blue","light":"foto","index":"1.67","sph":[-10,10],"cylTier":"any","price":900,"avail":"comanda57"},
{"id":"M17","coating":"hmc","light":"transitions","index":"1.6","sph":[-12,8],"cylTier":"any","price":800,"avail":"comanda57"},
{"id":"M18","coating":"ultra_blue","light":"transitions","index":"1.6","sph":[-12,8],"cylTier":"any","price":950,"avail":"comanda57"},
{"id":"M19","coating":"hmc","light":"transitions","index":"1.67","sph":[-12,8],"cylTier":"any","price":1200,"avail":"comanda57"},
{"id":"M20","coating":"ultra_blue","light":"transitions","index":"1.67","sph":[-12,8],"cylTier":"any","price":1400,"avail":"comanda57"},
{"id":"M21","coating":"hmc","light":"sun","index":"1.5","sph":[-6,4],"cylTier":"base","price":350,"avail":"stoc"},
{"id":"M22","coating":"hmc","light":"sun","index":"1.5","sph":[-6,4],"cylTier":"high","price":500,"avail":"comanda"}],
"bi":[
{"id":"B01","coating":"hmc","light":"clear","index":"1.5","sph":[-2,3],"cyl":"zero","add":[1.0,3.5],"price":350,"avail":"stoc"},
{"id":"B02","coating":"hmc","light":"foto","index":"1.5","sph":[-2,3],"cyl":"zero","add":[1.0,3.5],"price":450,"avail":"stoc"},
{"id":"B03","coating":"ultra_blue","light":"clear","index":"1.5","sph":[-9,10],"cyl":"upto6","add":[0.75,4.0],"price":600,"avail":"comanda"},
{"id":"B04","coating":"hmc","light":"clear","index":"1.6","sph":[-9,7],"cyl":"upto6","add":[1.0,3.0],"price":650,"avail":"comanda57"},
{"id":"B05","coating":"ultra_blue","light":"clear","index":"1.6","sph":[-9,7],"cyl":"upto6","add":[1.0,3.0],"price":750,"avail":"comanda57"},
{"id":"B06","coating":"hmc","light":"foto","index":"1.6","sph":[-8,6],"cyl":"upto6","add":[1.0,3.0],"price":850,"avail":"comanda57"},
{"id":"B07","coating":"hmc","light":"clear","index":"1.67","sph":[-15,6],"cyl":"upto6","add":[1.0,3.0],"price":1200,"avail":"comanda57"},
{"id":"B08","coating":"ultra_blue","light":"clear","index":"1.67","sph":[-15,6],"cyl":"upto6","add":[1.0,3.0],"price":1300,"avail":"comanda57"}]}
```

cylTier: `base` = |CYL| ≤ 2.00 · `high` = 2.00 < |CYL| ≤ 6.00 · `any` = |CYL| ≤ 6.00 in one price.

## Rules (implement exactly)

- R1: |CYL| > 6.00 → invalid; show „Pentru cilindru peste ±6 contactează-ne — te ajutăm telefonic." with a contact button.
- R2: availability labels — `stoc` → „În stoc"; `comanda` → „La comandă"; `comanda57` → „La comandă · livrare 5–7 zile lucrătoare". Shown as a quiet line under the price, never a scary badge.
- R3: if the current index is the lowest available for the combo AND stronger-eye |SPH| > 3.00 → show a gentle inline suggestion in taupe: „Pentru această dioptrie recomandăm lentile subțiate — mai estetice și mai ușoare." with a one-click „Treci la lentile subțiate" action that switches to the **next available thinner index for the current combo** (compute it from the data — for some foto combos that's 1.67, not 1.6). Never block the purchase. If no thinner index exists (sun lenses), show no nudge.
- R4: Bifocale with B01/B02 selected + any CYL ≠ 0 → auto-switch the result to the same-light 1.6 row, **preserving light behaviour and coating**: B01 → B04 (clear), B02 → B06 (foto). Explain: „Cu cilindru, lentila bifocală se execută la comandă (indice 1.6)." Show `routedFrom` subtly (mono font: „B01 → B04").
- Out-of-range SPH/ADD → don't just disable; say what to change: „Sfera +7,00 depășește limita acestei lentile (+6,00). Alege ultra-subțiat 1.67 sau ajustează."
- Selecting options that don't exist as a combo (e.g. Bifocale + Transitions) is prevented by hiding/disabling those options with a one-line reason on hover.

## computeResult contract

```ts
computeResult(state) => {
  rowId: string | null,
  priceRon: number | null,
  availability: 'stoc' | 'comanda' | 'comanda57' | null,
  nudge: 'recommend_thinning' | null,
  routedFrom: string | null,
  errors: { field: string, messageRo: string }[]
}
```

Render entirely from this object. Keep it pure — it will be ported 1:1 to vanilla JS.

## Live preview (right column) — parametric SVG, no images

Draw a lens that reacts to state:
- **Edge thickness** (the hero effect): a lens cross-section whose edge thickness grows with stronger-eye |SPH| and shrinks with higher index (1.5/1.56 → 1.0×, 1.6 → 0.66×, 1.67 → 0.48×). Animate with a 300ms ease transition. Caption the thickness qualitatively: Subțire / Standard / Groasă.
- **Tint**: clear = faint; foto = light tint + an Interior/Exterior toggle that darkens it (Transitions darkens faster — 150ms vs 400ms); sun = constant dark tint.
- **Coating sheen**: a thin arc reflection — green (#6f8f5f) for HMC, blue (#4f79b0) for Ultra Blue.
- **Bifocal**: visible segment line in the lower third.
- Under the preview, in small muted text, ALWAYS: „Reprezentare orientativă, nu la scară."

## Price block

Serif, large: `780,00 lei` with a 2px taupe underline. Under it the availability line (R2), then nudge/routing notes, then a full-width „Adaugă în coș" button (ink background, warm-white text, square corners) — non-functional, prototype only.

## Hard constraints

- No medical or optical-accuracy claims anywhere. The preview is an illustration.
- No discount/anchor pricing UI. Real prices only.
- No localStorage. State in memory.
- Romanian only; no English strings.
- border-radius: 0 everywhere. No exceptions.
