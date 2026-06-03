# M5 — Cedilla → comma-below diacritic cleanup

Tracking doc for the M5 carryover: placeholder catalog + smart-collection
rules were created (sessions 6–7) with the **deprecated cedilla** forms
`ş ţ` (Turkish-origin codepoints) instead of Romanian's correct
**comma-below** forms `ș ț`. They look near-identical but are distinct
Unicode codepoints, and Romanian SEO / screen readers / search treat them
as different characters. CLAUDE.md §6 mandates comma-below.

| Form | s | S | t | T |
|------|---|---|---|---|
| ✅ comma-below (correct) | ș U+0219 | Ș U+0218 | ț U+021B | Ț U+021A |
| ❌ cedilla (replace)     | ş U+015F | Ş U+015E | ţ U+0163 | Ţ U+0162 |

Only **s** and **t** carry this distinction. `ă â î` are single
codepoints — never affected. So every string that could be wrong is one
that contains `ș`/`ț`; everything else in the catalog is already correct
regardless.

---

## Status

- **Theme files (this repo): ✅ clean.** Verified by grepping the whole
  repo for cedilla codepoints — only `locales/tr.json` (Turkish, correct)
  matches. `locales/ro.json` and the session-9 Romanian copy pass are all
  comma-below. **No theme edits needed.**
- **Admin data: ⬜ pending — this checklist.** All fixes are admin clicks
  (product fields, smart-collection rules, metafield definitions). Claude
  Code cannot edit these (`--allow-mutations` is banned, CLAUDE.md §4).

---

## ⚠️ The one trap: atomic flip

Smart-collection metafield matching is **codepoint-exact**. The
`rame-barbati` collection rule (`frame_gender_fit contains bărbați`)
matches the literal value stored on each product. If the rule and the
product values disagree on cedilla-vs-comma, **the collection empties**.

→ Fix the `bărbați` metafield value on all 4 products **and** the
`rame-barbati` rule value in the same sitting. There will be a brief
window where `Rame bărbați` shows 0 products mid-edit; that's expected
(smart collections re-evaluate instantly once both sides agree). No live
customers on the dev store, so the transient is harmless.

The same applies to any *value* a rule matches on. Our other rules match
`acetat` / `rotund` / `femei` / `Ramă` — none contain `ș`/`ț`, so only
`bărbați` is at risk.

---

## Punch list (admin)

Work top-to-bottom. **Confirmed** = called out in the session-7 change log;
**Verify** = inferred, check the actual stored value before/while editing.

### 1. Smart-collection rule + gender_fit values (DO TOGETHER)

Admin → Products → Collections → **Rame bărbați** → edit the condition
value, and Products → each frame → Metafields → `Pentru / gender_fit`.

| Where | Value now (cedilla) | Fix to (comma-below) | Status |
|-------|---------------------|----------------------|--------|
| `rame-barbati` rule value | `bărbaţi` | `bărbați` | Confirmed |
| Mărășești → gender_fit | `bărbaţi` (+ femei) | `bărbați` | Confirmed |
| Aviatorilor → gender_fit | `bărbaţi` | `bărbați` | Confirmed |
| Victoria → gender_fit | `bărbaţi` | `bărbați` | Confirmed |
| Lipscani → gender_fit | `bărbaţi` (+ femei) | `bărbați` | Confirmed |

`femei` has no `ș`/`ț` — leave it. After the flip, confirm
`Rame bărbați = 4` and `Rame femei = 3` repopulate.

### 2. Collection title

Admin → Products → Collections → **Rame bărbați** → Title.

| Collection | Title now | Fix to | Status |
|------------|-----------|--------|--------|
| `rame-barbati` | `Rame bărbaţi` | `Rame bărbați` | Confirmed |

Other 4 titles (Toate ramele, Rame femei, Rame rotunde, Rame din acetat)
have no `ș`/`ț` — clean.

### 3. Product titles

Admin → Products → (each) → Title.

| Product | Title now | Fix to | Status |
|---------|-----------|--------|--------|
| Mărășești | `Mărăşeşti` | `Mărășești` (ș×2) | Confirmed |
| Universității | `Universităţii` | `Universității` (ț) | Confirmed |

Aviatorilor / Victoria / Lipscani — no `ș`/`ț`, clean.

### 4. Vendor

Admin → Products → (each) → Product organization → Vendor. Vendor is
per-product free text in Shopify — fix on **all 5**, not once.

**Superseded by the Optivix rename (session 13):** set the vendor to the
new brand name rather than fixing the old cedilla. `Optivix` has no special
characters, so this clears the cedilla issue and the brand swap in one edit.

| Field | Value now | Fix to | Status |
|-------|-----------|--------|--------|
| Vendor (all products) | `Optic Mărăşeşti` | `Optivix` | Confirmed (brand rename) |

### 5. country_origin metafield value — VERIFY

Admin → Products → (each) → Metafields → `Țară de origine / frame_country_origin`.
Only needs fixing if the stored value contains `ș`/`ț` (e.g. `Franța`).
`Italia` / `România` / `China` are clean. Check each product's value.

### 6. Product descriptions / body — VERIFY

If any product body HTML was Shopify-Magic-generated or hand-typed with
cedilla, fix it. Likely minimal or empty (placeholders). Quickest check:
the CSV export in the verification step below.

### 7. Metafield definition display names — admin-cosmetic, lower priority

Admin → Settings → Custom data → Products → (each `frame_*` definition) →
display Name. These render in **admin only** — the storefront PDP labels
are hardcoded in `sections/main-product.liquid` (already comma-below). Fix
for consistency while you're in there, but no storefront impact.

| Definition | Display name now (likely cedilla) | Fix to | Status |
|------------|-----------------------------------|--------|--------|
| frame_lens_width | `Lăţime lentilă` | `Lățime lentilă` | Confirmed (`Lăţime`) |
| frame_bridge_width | `Lăţime punte` | `Lățime punte` | Verify |
| frame_temple_length | `Lungime braţ` | `Lungime braț` | Verify |
| frame_total_width | `Lăţime totală` | `Lățime totală` | Verify |
| frame_country_origin | `Ţară de origine` | `Țară de origine` | Verify |
| frame_gender_fit | (check for `ș`/`ț`) | — | Verify |

material / shape / colour_finish display names have no `ș`/`ț` if named
`Material` / `Formă` / `Culoare` — confirm.

---

## Exhaustive verification (recommended one-shot)

To turn every "Verify" above into a confirmed exact string in one move:

1. Admin → Products → Export → **All products** → CSV (plain), include
   metafield columns if offered.
2. Drop the file in the repo root (gitignored / temp) or paste its path.
3. Claude greps it for cedilla codepoints and returns the exact list of
   offending strings + which column/row — no more inference.

This also catches anything not anticipated here (a stray cedilla in a
handle, SEO title, alt text, or body).

---

## Prevention (forward)

When Friend's real supplier feed is imported via the canonical CSV
pipeline (PLAN.md / data-model §, M3's "biggest architectural win"), the
**source CSV must use comma-below** `ș ț`. Once the rules above are flipped
to comma-below, a cedilla-carrying import would silently fail to join
`rame-barbati`. Add a comma-below check to the import prep step.
