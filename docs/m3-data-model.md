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
| `custom.frame_gender_fit`    | Choice list (single_line_text_field)          | yes      | `unisex`     |
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

**`frame_gender_fit`:** `bărbați`, `femei`, `unisex`

These are stored as **Choice list metafields** — single_line_text_field
under the hood, with a Shopify-native enum constraint enforced in the
admin UI. Adding or removing a value means editing both the metafield
definition in admin **and** the vocabulary list here in this doc.
(Earlier draft of this section deferred enum enforcement to metaobjects;
that's not necessary — Choice list gives the same typed-enum guarantee
with less complexity. Locked in admin 2026-05-20.)

---

## 3. Lens metafields — `custom.lens_*` (reserved)

Namespace claimed; no definitions in admin until M4. Anticipated
fields (subject to Friend's pricing logic review):

- `custom.lens_index` — number_decimal (1.50, 1.56, 1.60, 1.67, 1.74)
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
| `rame-barbati`      | Rame bărbați      | `product_type = Ramă` AND `frame_gender_fit ∈ {bărbați, unisex}`                    |
| `rame-femei`        | Rame femei        | `product_type = Ramă` AND `frame_gender_fit ∈ {femei, unisex}`                      |
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

---

## 6. Navigation skeleton

Main menu (admin → Online Store → Navigation → Main menu).
Lens-led hierarchy — `Lentile` is the headline business product
and lives at the top of the menu.

```
Acasă             →  /
Lentile           →  /pages/lentile          ← calculator + Rx upload lives here (M4)
Rame              →  /collections/rame
  ├ Pentru bărbați →  /collections/rame-barbati
  └ Pentru femei   →  /collections/rame-femei
Despre            →  /pages/despre
Contact           →  /pages/contact
```

Footer menu (admin → Online Store → Navigation → Footer menu):

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

**2. Pricing logic.** Friend documents which lens indexes are offered,
which coatings, the price delta per option, and which combinations are
"recommended upgrades" the calculator should surface. Determines
whether the `Combo` product type activates or stays reserved.

**3. Where the prescription lives.** Depending on (1):
  - Customer record metafield? (Persistent across orders.)
  - Order-level note attribute? (Per-purchase only.)
  - Line-item properties? (Per-purchase, tied to the lens line.)
  - Uploaded file (PDF/image of the original Rx)? — separate storage
    decision regardless of where the parsed values go.

**4. Optometrist partnership for prescription validation** —
regulatory requirement per CLAUDE.md §7. Affects what gets stored on
the order, what triggers fulfillment (validated vs unvalidated state),
and the email/handoff to the optometrist.

**5. "Recommended upgrades" UX.** Are coatings (anti-reflective,
blue-light filter, photochromic) separate cart line items or attributes
on the lens line? Affects refund granularity and analytics.

---

*Schema changes here are commits, not edits. When this doc changes,
admin state catches up; never the reverse.*
