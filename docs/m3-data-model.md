# M3 — Data model (catalog schema of record)

Source of truth for product types, metafields, tag conventions,
collection rules, navigation, and Markets/locale configuration on the
dev store. Decisions here are expensive to change after products
exist — change *this doc first*, then execute in admin, then update
`PLAN.md`.

**Romanian primary** for all customer-facing values. Diacritics
mandatory. English locale stays empty until M5.

---

## 1. Product types

Controlled vocabulary entered into Shopify's `product.type` field.
Closed set — do not introduce new types without updating this section.

| Type        | Status      | Notes                                                                 |
|-------------|-------------|-----------------------------------------------------------------------|
| `Lentile`   | active      | **Primary product.** Prescription-driven; sold via the lens flow at `/pages/lentile`. Product-modeling architecture (SKU-per-recipe vs cart-line-with-attributes vs lens-as-modifier) decided in M4. |
| `Ramă`      | active      | Eyeglass frames. Secondary product. Browsed via collections.          |
| `Accesoriu` | active      | Cases, cleaning cloth, screwdrivers, etc.                             |
| `Combo`     | reserved    | Pre-bundled frame+lens. Activation gated on M4 pricing logic.         |

For M3 we populate `Ramă` with placeholder products so the catalog
renders. `Lentile` is the headline business product but its purchase
path is the calculator at `/pages/lentile` (M4-built), not a
browsable collection — so no placeholder lens products are created
in M3. `Accesoriu` slot exists for the first shipping-padding upsell
when Friend's inventory list arrives.

---

## 2. Frame metafields — `custom.frame_*`

Defined in admin → Settings → Custom data → Products. Applied to
products of type `Ramă`. Definitions exist *before* products are
created so every frame lands schema-correct from day one.

| Key                          | Type                                          | Required | Example      |
|------------------------------|-----------------------------------------------|----------|--------------|
| `custom.frame_material`      | Choice list (single_line_text_field)          | yes      | `acetat`     |
| `custom.frame_shape`         | Choice list (single_line_text_field)          | yes      | `rotund`     |
| `custom.frame_colour_finish` | Choice list (single_line_text_field)          | yes      | `tortoise`   |
| `custom.frame_gender_fit`    | List of choices (list.single_line_text_field) | yes      | `bărbați, femei` (both = unisex) |
| `custom.frame_lens_width`    | dimension (mm)                                | yes      | `50 mm`      |
| `custom.frame_bridge_width`  | dimension (mm)                                | yes      | `20 mm`      |
| `custom.frame_temple_length` | dimension (mm)                                | yes      | `145 mm`     |
| `custom.frame_total_width`   | dimension (mm)                                | no       | `138 mm`     |
| `custom.frame_country_origin`| single_line_text_field                        | no       | `Italia`     |

Frame weight uses Shopify's built-in `variant.weight` (the shipping
field). Don't duplicate it as a metafield.

### Controlled value vocabularies

Romanian-only. Adding values to these lists *is* a schema change —
update this doc, then update collection rules that depend on the
value.

**`frame_material`:** `acetat`, `metal`, `titan`, `oțel inoxidabil`,
`TR-90`, `mixt`, `lemn`

**`frame_shape`:** `rectangular`, `rotund`, `pătrat`, `cat-eye`,
`aviator`, `geometric`, `oval`, `pilot`, `browline`

**`frame_colour_finish`:** `mat`, `lucios`, `transparent`, `tortoise`,
`două-tonuri`, `metalic`

**`frame_gender_fit`:** `bărbați`, `femei`
(a frame that fits both is tagged with both values — replaces the
former `unisex` single-value)

These are stored as **Choice list metafields** — single_line_text_field
under the hood, with a Shopify-native enum constraint enforced in the
admin UI. Adding or removing a value means editing both the metafield
definition in admin **and** the vocabulary list here in this doc.
(Earlier draft of this section deferred enum enforcement to metaobjects;
that's not necessary — Choice list gives the same typed-enum guarantee
with less complexity. Locked in admin 2026-05-20.)

**`frame_gender_fit` is the exception** — it's a *list-of-choices*
metafield (multiple values from the same enum), not a single Choice
list. A unisex frame carries both `bărbați` and `femei` in its list,
which is the literal truth (it fits both) and lets the `rame-barbati`
and `rame-femei` smart collections use a clean single-condition
`contains` rule. Switched from single-value Choice list to list on
2026-05-21 when smart-collection rule design hit Shopify's
no-mixed-AND/OR limitation. See §5 for the resulting collection rules.

---

## 3. Lens metafields — `custom.lens_*`

Namespace claimed in M3; **definitions land in M4** alongside the
„Lentile pe rețetă" variant model (OQ1, §10). These are **variant-level**
metafields — one value per matrix-row variant — so they are set via the
**variant bulk editor**, not the product import CSV (Shopify doesn't
support variant metafields in product CSV import/export; see
`docs/m4-lens-variant-metafields.md`).

### 3a. M4 variant metafields (locked 2026-06-11)

Backing the 30-variant lens product. Each maps 1:1 to a pricing-matrix
axis / flag (`assets/lens-pricing-data.json`, matrix `docs/lens-pricing-matrix.md`).
All are **Choice list** (single_line_text_field with a Shopify-native enum)
except `lens_index` (number_decimal). Vocabularies are **closed** — adding
a value is a schema change (edit this doc, the metafield definition in
admin, **and** the matrix).

| Key | Type | Required | Vocabulary (closed) |
|-----|------|----------|---------------------|
| `custom.lens_type`         | Choice list (single_line_text_field) | yes | `monofocal`, `bifocal` |
| `custom.lens_coating`      | Choice list (single_line_text_field) | yes | `hmc`, `ultra_blue` |
| `custom.lens_light`        | Choice list (single_line_text_field) | yes | `clear`, `foto`, `transitions`, `sun` |
| `custom.lens_index`        | number_decimal                       | yes | `1.5`, `1.56`, `1.6`, `1.67` |
| `custom.lens_availability` | Choice list (single_line_text_field) | yes | `stoc`, `comanda`, `comanda_5_7` |

`lens_availability` stores the machine flag the calculator/theme renders
as the Romanian label (`în stoc` / `comandă` / `comandă 5–7 zile
lucrătoare`); it parallels the variant's inventory-tracking policy
(`stoc` → tracked/deny, `comandă*` → untracked/continue) set in the import
CSV. Both, by design — the flag drives display, the policy drives
orderability.

### 3b. Other anticipated lens fields (not yet needed)

Reserved for later; no M4 definition, subject to Friend's review:

- `custom.lens_material` — single_line_text_field
- `custom.lens_coatings_available` — list.single_line_text_field
- `custom.lens_prescription_range` — single_line_text_field

**Customer-prescription** data (sphere, cylinder, axis, PD) is *not*
a product metafield. It lives on the customer/order/cart depending
on the M4 calculator architecture. Do not pre-define it on products.

---

## 4. Tag conventions

Tags are reserved for **runtime states**, not product attributes.
All attributes (material, shape, gender, etc.) live in metafields
so there is one source of truth per attribute. Smart-collection
rules use metafield conditions, not tags.

Allowed tag values (extend this list when adding a new state):

| Tag                  | Meaning                                            |
|----------------------|----------------------------------------------------|
| `nou`                | Recently added (manually applied, manually removed)|
| `editorial`          | Featured in editorial / homepage curation          |
| `epuizat-temporar`   | Out of stock pending restock                       |

**Anti-pattern:** do *not* tag with `material:acetat` or `forma:rotund`.
Those are metafields. If you find yourself wanting a new attribute
tag, add a metafield instead.

---

## 5. Collections (automated rules)

Starter set. Smart collection conditions reference metafields, not
tags. All conditions require `product_type equals Ramă` as a guard so
accessories don't leak in.

| Handle              | Title (RO)        | Rules (all required)                                                                |
|---------------------|-------------------|-------------------------------------------------------------------------------------|
| `rame`              | Toate ramele      | `product_type = Ramă`                                                               |
| `rame-barbati`      | Rame bărbați      | `product_type = Ramă` AND `frame_gender_fit contains bărbați`                       |
| `rame-femei`        | Rame femei        | `product_type = Ramă` AND `frame_gender_fit contains femei`                         |
| `rame-rotunde`      | Rame rotunde      | `product_type = Ramă` AND `frame_shape = rotund`                                    |
| `rame-acetat`       | Rame din acetat   | `product_type = Ramă` AND `frame_material = acetat`                                 |

All start empty (no products). They populate automatically as frame
products land with metafields filled.

Smart-collection rules-by-metafield require the metafield to be
flagged as **storefront filter / available in collection rules** in
admin. Check this box on every `custom.frame_*` definition.

**Shopify limitation discovered 2026-05-20:** Dimension-type metafields
(the `frame_*_width` and `frame_temple_length` set) **cannot** be used
in smart collection rules. The "Use as a condition in smart collections"
toggle isn't even exposed on Dimension definitions — Shopify's
collection engine doesn't support dimension-range filtering as a rule.
Non-blocking for the five starter collections above (none of them
filter on dimensions). But any future dimension-driven collection
("Rame înguste" for narrow frames, "Rame late" for wide) needs either
manual curation or a tag-based approach (e.g., tag products with
`dim:ingust` / `dim:lat` and have the smart rule filter on tag).

**Shopify limitation discovered 2026-05-21:** Smart-collection rules
support either "all conditions" (AND) or "any condition" (OR) across
*all* rules in the collection — no mixed AND/OR, no nesting. This is
why `frame_gender_fit` had to switch from Choice list to *list of
choices* (§2): the original rule shape `product_type = Ramă AND
gender_fit ∈ {bărbați, unisex}` is not expressible as a single smart
collection. With a list metafield, the rule simplifies to
`product_type = Ramă AND gender_fit contains bărbați` — pure AND,
clean fit for Shopify's engine, and a unisex frame is naturally
included because its list contains both values.

---

## 6. Navigation skeleton

Main menu (admin → Content → Menus → Main menu).
Lens-led hierarchy — `Lentile` is the headline business product
and lives at the top of the menu.

```
Acasă             →  /
Lentile           →  /pages/lentile          ← calculator + Rx upload lives here (M4)
Rame              →  (dropdown trigger — see Dawn quirk below)
  ├ Vezi toate     →  /collections/rame
  ├ Pentru bărbați →  /collections/rame-barbati
  └ Pentru femei   →  /collections/rame-femei
Despre            →  /pages/despre
Contact           →  /pages/contact
```

**Dawn parent-menu-link quirk** (discovered 2026-05-22, session 7):
Dawn ignores the `Link` field on a menu item when that item has
children — the parent renders as a `<summary>` dropdown trigger,
not a link. Even with `Link = Toate ramele` configured in the
Shopify menu editor, clicking the `Rame` parent on desktop just
opens the dropdown. The standard premium-theme fix is to add a
`Vezi toate` first child that links to `/collections/rame`
explicitly — Cubitts, Moscot, and most editorial eyewear sites
use this pattern. A proper `header.liquid` modification to make
parents both navigable and expandable is M5 polish work; the
`Vezi toate` workaround ships in 30 seconds with zero theme code.

**Resolved 2026-05-27 (session 10):** the proper fix landed. The parent
label is now an `<a href="{{ link.url }}">` nested inside the `<summary>`
toggle in both `snippets/header-dropdown-menu.liquid` (desktop) and
`snippets/header-drawer.liquid` (mobile) — clicking the label navigates,
the caret/row still opens the submenu. Dawn's desktop dropdown opens on
click (not hover), so a plain-link parent would have killed the dropdown;
the nested-anchor "split control" is the working pattern. `Vezi toate` is
now **optional** — both viewports reach `/collections/rame` via the parent.
Keep it for an explicit dropdown "view all" or remove it; nothing breaks.

Footer menu (admin → Content → Menus → Footer menu):

```
Returnări          →  /policies/refund-policy
Confidențialitate  →  /policies/privacy-policy
Termeni            →  /policies/terms-of-service
Contact            →  /pages/contact
```

Labels are placeholders. Friend-final naming happens during M5 copy
pass. Policy pages are stubs auto-generated by Shopify; full text
drafts and lawyer review are in M6.

---

## 7. Stub pages

Created empty in admin → Online Store → Pages. Real Romanian copy
in M5, English locale in M5 (deferred). Body content: a single
`TODO` marker so the page resolves but signals draft state.

| Handle    | Title (RO)        | Body marker             | Notes                                                                                       |
|-----------|-------------------|-------------------------|---------------------------------------------------------------------------------------------|
| `lentile` | Lentile           | `TODO: M4 — calculator` | URL slot reserved. M4 wires the prescription upload, calculator, price display, upsells.    |
| `despre`  | Despre noi        | `TODO: M5`              | About copy in M5.                                                                            |
| `contact` | Contact           | `TODO: M5`              | Contact form + details in M5.                                                                |

The `lentile` page handle is locked. Inbound links and nav resolve to
this URL from M3 onward; the calculator section gets attached in M4
without changing the URL.

**Known future page (M5):** the virtual try-on flow lands when the
TryOnMe app is installed during M5 polish. Handle to be decided at
that point (likely `proba-virtuala` or similar). Not created in M3.

---

## 8. Markets & locale configuration

Admin → Settings → Markets:

- **Primary market: Romania.** RON is store and settlement currency.
- **Secondary currency: EUR**, display-only via Shopify Markets
  auto-conversion. Customer checkout still settles in RON.
- **No other markets.** Do not enable EU-wide, multi-country, or
  international shipping. (CLAUDE.md §1, §10.)

Admin → Apps → install **Translate & Adapt** (official, free):

- Primary language: **Română (ro)**
- Secondary language: **English (en)** — added, content empty
- Default storefront: ro
- English content arrives in M5 via the tone-pass workflow
  (CLAUDE.md §6).

---

## 9. Execution checklist

Execute in admin in this exact order. Each step idempotent — if it's
already done, skip. Update `PLAN.md` step status after each chunk.

1. **Markets** — confirm RON store currency, add EUR display-only.
2. **Translate & Adapt** — install, add `en` locale, leave empty.
3. **Metafield definitions** — create all `custom.frame_*` fields
   from section 2. For each: enable "available in collection rules"
   and "available in product filters."
4. **Product types** — no admin step; vocabulary is enforced when
   creating products. Document only.
5. **Collections** — create the 5 automated collections from section 5.
   They'll show as empty; that's correct.
6. **Pages** — create the 3 stub pages from section 7
   (`lentile`, `despre`, `contact`).
7. **Navigation** — wire up main and footer menus per section 6.
   Confirm `Lentile` sits in the first menu slot (after `Acasă`).

After step 7, the storefront has the full information architecture
visible (empty collections, empty pages, working nav) and is ready
to accept placeholder products without rework.

---

## 10. Open questions (resolve before M4)

**Status (2026-06-10):** OQ1, OQ3, OQ5 resolved + locked below; OQ2 resolved
by `docs/lens-pricing-matrix.md` (v1). OQ4 stays open — [Friend], gates
launch not build.

**1. Lens product modeling — the architectural question of M4.**

Lenses are the headline business product, sold via the prescription
calculator at `/pages/lentile`. How they're modeled in Shopify
determines how the cart, checkout, and admin order view all behave.
Pick exactly one before any calculator code is written:

  - **(a) SKU-per-recipe.** Every lens variant (index × material ×
    coatings × prescription class) is a real product/variant.
    Calculator looks up the matching SKU. Pros: clean inventory,
    standard Shopify analytics, refunds and reorders are trivial.
    Cons: variant explosion (1000s of combinations), bulk-creation
    burden, hard to add a new coating retroactively.
  - **(b) Cart line with custom attributes.** A single "Lentile pe
    rețetă" line item carries the full recipe in `line_item.properties`
    (sphere, cylinder, axis, PD, index, material, coatings). Price
    is computed by the calculator at the moment of add-to-cart from
    a published price formula. Pros: no variant explosion, prescription
    travels with the order naturally. Cons: less standard, harder to
    do inventory tracking on lenses, refund/reorder needs custom UX.
  - **(c) Lens-as-modifier on a frame.** The lens recipe is attached
    as line-item properties to a frame product, no separate lens
    product exists. Only works if lenses are *only* sold with a frame
    — eliminates the standalone-replacement-lens use case.

**Recommendation pending Friend's input:** (b) is the cleanest for a
prescription-first business with optional standalone lens purchases.
But the choice depends on (i) whether Friend wants per-recipe inventory
tracking and (ii) Romanian accounting/invoice requirements for SKU
identifiers on receipts. Confirm with Friend's accountant before locking.

**LOCKED 2026-06-10 — (b), implemented as variant-per-matrix-row.**
Stefan's call (accounting questions answered on his authority, not the
accountant's: an internal code on invoices suffices, no separate
lens-stock requirement; residual risk accepted as SKU-naming-only). The
model:

  - **One product** „Lentile pe rețetă", **one variant per pricing-matrix
    row** — M01–M22 + B01–B08 = **30 variants** — surfaced as a single
    product option (e.g. „Cod") so Shopify's 3-option / 100-variant
    limits never bind.
  - **SKU = row ID** (`M01`…`B08`). **Variant price = matrix price.**
  - **Availability** (`stoc` / `comandă` / `comandă 5–7 zile`) stored as a
    **variant metafield**. `stoc` rows get **real inventory tracking**;
    `comandă` rows stay **untracked** (always orderable).
  - The per-eye **prescription** (SPH/CYL/AX per eye, PD) is **not** a
    variant axis. The matrix already collapsed the dioptre ranges into 30
    priced rows via its `cyl_tier` + range-validation design, so the
    prescription rides in **`line_item.properties`** (see OQ3). This is
    what preserves (b)'s "no variant explosion" while gaining (a)'s clean
    inventory / analytics / refunds for the 30 canonical rows. Flow:
    calculator validates a prescription → maps it to a matrix row →
    adds that variant with the prescription as line-item properties.

**2. Pricing logic.** Friend documents which lens indexes are offered,
which coatings, the price delta per option, and which combinations are
"recommended upgrades" the calculator should surface. Determines
whether the `Combo` product type activates or stays reserved.

**RESOLVED 2026-06-10** — documented in `docs/lens-pricing-matrix.md`
(v1 locked): 30 priced rows across type × coating × light × index ×
cyl_tier, with range validation, availability, and routing rules. 4 TBDs
open (thinned sun, M18 price, per-eye rule, 1.56 high-CYL bound) — all
non-blocking. `Combo` stays reserved.

**3. Where the prescription lives.** Depending on (1):
  - Customer record metafield? (Persistent across orders.)
  - Order-level note attribute? (Per-purchase only.)
  - Line-item properties? (Per-purchase, tied to the lens line.)
  - Uploaded file (PDF/image of the original Rx)? — separate storage
    decision regardless of where the parsed values go.

**RESOLVED 2026-06-10** — parsed values (SPH/CYL/AX per eye, PD) live in
**line-item properties** on the „Lentile pe rețetă" line (per-purchase,
tied to the lens line), consistent with the OQ1 lock. The **Rx file
upload** (PDF/image of the original) is **deferred** — it ships with the
OQ4 optometrist-validation flow, not in the first calculator build.

**4. Optometrist partnership for prescription validation** —
regulatory requirement per CLAUDE.md §7. Affects what gets stored on
the order, what triggers fulfillment (validated vs unvalidated state),
and the email/handoff to the optometrist.

**STILL OPEN — [Friend]. Gates launch, not the build.** The calculator,
variant model, and prescription-in-properties all ship without it. What
lands when the partnership is confirmed (M6 regulatory track): an
order-hold / validation state and the optometrist handoff, before any
fulfillment. No glasses ship without this step (CLAUDE.md §7).

**5. "Recommended upgrades" UX.** Are coatings (anti-reflective,
blue-light filter, photochromic) separate cart line items or attributes
on the lens line? Affects refund granularity and analytics.

**RESOLVED 2026-06-10 → attributes, not line items.** Each matrix row
bakes its coating (HMC / Ultra Blue) into the single variant price, so a
coating is an attribute of the chosen lens row, never a separate cart
item. Refund granularity is per-lens-line; accepted.

---

*Schema changes here are commits, not edits. When this doc changes,
admin state catches up; never the reverse.*
