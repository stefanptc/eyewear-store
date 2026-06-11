# Lens pricing matrix — v1 (2026-06-10)

Source of truth for the M4 lens calculator. Derived from supplier spec
(Rareș, WhatsApp 2026-06-09/10). Retail prices in RON, **per pereche**
(per pair) unless noted. Wholesale costs are business-sensitive and live
in Notion (Eyewear · Decision log), **never in this public repo**.

Status: **LOCKED** except items marked `TBD` (see §6).

> **Machine mirror:** `assets/lens-pricing-data.json` is the derived, code-readable
> copy of this matrix. **This `.md` is the human source of truth; the JSON is
> downstream.** Any change to a row, range, price, or TBD here requires the same
> change in the JSON in the *same commit* (touch-both rule) — and the JSON's
> `_source.matrix_commit` must be bumped to the new matrix commit.

---

## 1. Model

Every sellable lens is one row in a lookup keyed by five axes:

```
price = lookup(type, coating, light, index, cyl_tier)
```

- **type** — `monofocal` | `bifocal` (progressives excluded: require
  physical fitting markings, impossible online — locked decision)
- **coating** — `hmc` (green AR, artificial light) | `ultra_blue`
  (blue-light filter, screens). Exactly one per lens.
- **light** — `clear` | `foto` (photochromic) | `transitions`
  (premium photochromic: faster darken/clear) | `sun` (fixed tint)
- **index** — `1.56` | `1.6` | `1.67`. Higher = thinner = pricier.
  Note: the "standard" tier is physically 1.56 ("ușor subțiat") for
  HMC/foto-coated lenses; label it **"Standard (1.56)"** in UI.
  Sun lenses are true 1.5.
- **cyl_tier** — `base` (|CYL| ≤ 2.00) | `high` (2.00 < |CYL| ≤ 6.00)

The prescription (SPH, CYL, ADD for bifocals) is validated against the
row's allowed ranges; CYL magnitude selects the tier.

## 2. Global rules

- **R1 — CYL hard cap:** |CYL| ≤ 6.00 everywhere. Above → not sellable
  online, show contact CTA.
- **R2 — Availability:** any row with cyl_tier `high` = **comandă**
  (special order). Any row with index 1.6 or 1.67 = **comandă, 5–7 zile
  lucrătoare** (some 1.6 stock exists, but we always quote the safe lead
  time). Everything else per-row below.
- **R3 — Thinning recommendation (soft):** on index 1.56, if |SPH| > 3.00,
  the lens is allowed (up to its range) but UI shows a non-blocking nudge:
  *"Pentru această dioptrie recomandăm lentile subțiate — mai estetice și
  mai ușoare."* Never block; never claim medical necessity.
- **R4 — Bifocal cylinder routing:** bifocal HMC 1.5 rows accept CYL = 0
  only. Any CYL ≠ 0 → auto-route to the matching HMC index-1.6 row,
  **preserving light behaviour and coating**: B01 (hmc clear 1.5) → B04
  (hmc clear 1.6), B02 (hmc foto 1.5) → B06 (hmc foto 1.6). Both are
  comandă. Do **not** route to B05 (ultra_blue) — that would flip the
  coating. UI explains the jump.
- **R5 — Bifocal scope:** bifocals exist only in `clear` and `foto`.
  No transitions, no sun.
- **R6 — Prices are per pair.** Both lenses identical spec assumed for
  v1. (Per-eye differing prescriptions: same row price — the pair is
  priced by the *stronger* requirement if SPH/CYL differ per eye. TBD-4
  confirms this with supplier.)

## 3. Monofocale

| # | Coating | Light | Index | SPH min | SPH max | CYL tier | Preț (RON) | Disponibilitate |
|---|---|---|---|---|---|---|---|---|
| M01 | hmc | clear | 1.56 | −6.00 | +6.00 | base | 100 | stoc |
| M02 | hmc | clear | 1.56 | −6.00 | +6.00 | high | 150 | comandă |
| M03 | hmc | clear | 1.6 | −10.00 | +6.00 | base | 180 | comandă 5–7 z.l. |
| M04 | hmc | clear | 1.6 | −10.00 | +6.00 | high | 220 | comandă 5–7 z.l. |
| M05 | hmc | clear | 1.67 | −10.00 | +10.00 | base | 380 | comandă 5–7 z.l. |
| M06 | hmc | clear | 1.67 | −6.00 | +6.00 | high | 450 | comandă 5–7 z.l. |
| M07 | ultra_blue | clear | 1.56 | −10.00 | +6.00 | base | 350 | stoc |
| M08 | ultra_blue | clear | 1.56 | −10.00 | +6.00 | high | 450 | comandă |
| M09 | ultra_blue | clear | 1.6 | −12.00 | +6.00 | base | 400 | comandă 5–7 z.l. |
| M10 | ultra_blue | clear | 1.6 | −12.00 | +6.00 | high | 650 | comandă 5–7 z.l. |
| M11 | ultra_blue | clear | 1.67 | −17.00 | +12.00 | base+high (≤±6) | 800 | comandă 5–7 z.l. |
| M12 | hmc | foto | 1.56 | −8.00 | +6.00 | base | 350 | stoc |
| M13 | hmc | foto | 1.56 | −6.00 | +6.00 | high | 480 | comandă |
| M14 | ultra_blue | foto | 1.56 | −9.00 | +8.00 | base+high (≤±6) | 650 | comandă |
| M15 | hmc | foto | 1.67 | −10.00 | +10.00 | base+high (≤±6) | 850 | comandă 5–7 z.l. |
| M16 | ultra_blue | foto | 1.67 | −10.00 | +10.00 | base+high (≤±6) | 900 | comandă 5–7 z.l. |
| M17 | hmc | transitions | 1.6 | −12.00 | +8.00 | base+high (≤±6) | 800 | comandă 5–7 z.l. |
| M18 | ultra_blue | transitions | 1.6 | −12.00 | +8.00 | base+high (≤±6) | 950 *(TBD-3)* | comandă 5–7 z.l. |
| M19 | hmc | transitions | 1.67 | −12.00 | +8.00 | base+high (≤±6) | 1200 | comandă 5–7 z.l. |
| M20 | ultra_blue | transitions | 1.67 | −12.00 | +8.00 | base+high (≤±6) | 1400 | comandă 5–7 z.l. |
| M21 | hmc | sun | 1.5 | −6.00 | +4.00 | base | 350 | stoc |
| M22 | hmc | sun | 1.5 | −6.00 | +4.00 | high | 500 | comandă |
| M23 | — | sun | thinned | *TBD-1* | *TBD-1* | *TBD-1* | *TBD-1* | comandă |

Notes:
- M06: SPH range deliberately **narrows** to −6…+6 in the high-CYL tier
  (supplier-confirmed; the only such case among monofocals).
- M11: supplier floated anchoring at 1000 with a displayed discount.
  **Not implemented** — pricing strategy is [Friend]'s call, and displayed
  discounts must reference a real prior price (OUG 58/2022). Price stays 800.
- M17: corrected from a conflicting earlier spec (900 → **800**,
  range −12…+8 / CYL ±6 confirmed).
- Resolved during spec review: the earlier "Transitions HMC 1.6 =
  −6…+4 / ±2" message was superseded; lenses with no stated index are
  the standard 1.56 tier; `foto` and `transitions` are distinct
  customer-facing options, not synonyms.

## 4. Bifocale

| # | Coating | Light | Index | SPH min | SPH max | CYL | ADD min | ADD max | Preț (RON) | Disponibilitate |
|---|---|---|---|---|---|---|---|---|---|---|
| B01 | hmc | clear | 1.5 | −2.00 | +3.00 | **0 only** | +1.00 | +3.50 | 350 | stoc |
| B02 | hmc | foto | 1.5 | −2.00 | +3.00 | **0 only** | +1.00 | +3.50 | 450 | stoc |
| B03 | ultra_blue | clear | 1.5 | −9.00 | +10.00 | ≤±6 | +0.75 | +4.00 | 600 | comandă |
| B04 | hmc | clear | 1.6 | −9.00 | +7.00 | ≤±6 | +1.00 | +3.00 | 650 | comandă 5–7 z.l. |
| B05 | ultra_blue | clear | 1.6 | −9.00 | +7.00 | ≤±6 | +1.00 | +3.00 | 750 | comandă 5–7 z.l. |
| B06 | hmc | foto | 1.6 | −8.00 | +6.00 | ≤±6 | +1.00 | +3.00 | 850 | comandă 5–7 z.l. |
| B07 | hmc | clear | 1.67 | −15.00 | +6.00 | ≤±6 | +1.00 | +3.00 | 1200 | comandă 5–7 z.l. |
| B08 | ultra_blue | clear | 1.67 | −15.00 | +6.00 | ≤±6 | +1.00 | +3.00 | 1300 | comandă 5–7 z.l. |

Notes:
- B01/B02 are stock *because* CYL = 0; any cylinder routes to B04/B05 (R4).
- B03's wide range vs B01 is supplier-confirmed: ultra_blue bifocals are
  comandă-made, hence the larger envelope.

## 5. Calculator output contract

For a valid selection the calculator returns:
`{ row_id, price_ron, availability: 'stoc' | 'comanda' | 'comanda_5_7',`
`  nudge: null | 'recommend_thinning', routed_from: null | row_id }`

Invalid (out of range / over cap) returns the nearest reasons so the UI
can say *what* to change, not just "indisponibil".

## 6. Open TBDs

| ID | What's missing | Plan |
|---|---|---|
| TBD-1 | Thinned sun lenses: indices, ranges, prices | Ask supplier; until then UI shows "preț la cerere" for sun + thinning |
| TBD-2 | 1.56 high-CYL upper bound: assumed ±6 via comandă; supplier hinted high CYL belongs on thinned lenses | Confirm; if forced to thinned, cap M02/M08/M13 at ±4 and route ±4–6 to 1.6 |
| TBD-3 | M18 price: 950 set before M17's 900→800 correction; costs "destul de apropiate" | Confirm 950 vs ~850 |
| TBD-4 | Per-eye differing prescriptions: priced by stronger eye? | Confirm rule with supplier |

---

*Changes to this file require a matching entry in Eyewear · Decision log.*
