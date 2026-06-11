# M4 — Lens variant metafields (companion to `m4-lens-product-import.csv`)

**Why this is a separate file.** Shopify's *product* CSV import/export does **not**
support variant metafields (confirmed against Shopify docs, 2026-06). They're set
via the **variant bulk editor** instead, whose CSV uses `Metafield: <ns>.<key> [type]`
headers. Our axes + availability are per-variant, so they cannot live in the import
CSV — this sheet carries them for that second upload, done after the product exists.

## Metafield definitions required first (M3 §3 follow-up)

Only `custom.lens_index` is anticipated in `docs/m3-data-model.md §3`. The other four
have **no definition** — proposed below, **not invented into the import CSV**. Add to
M3 §3 + admin before the bulk-editor upload.

| Key | Type | Status | Vocabulary |
|-----|------|--------|------------|
| `custom.lens_index`        | number_decimal           | anticipated in M3 §3 ✓ | 1.5, 1.56, 1.6, 1.67 |
| `custom.lens_type`         | single_line_text_field   | **PROPOSED (no def)**  | monofocal, bifocal |
| `custom.lens_coating`      | single_line_text_field   | **PROPOSED (no def)**  | hmc, ultra_blue |
| `custom.lens_light`        | single_line_text_field   | **PROPOSED (no def)**  | clear, foto, transitions, sun |
| `custom.lens_availability` | single_line_text_field   | **PROPOSED (no def)**  | stoc, comanda, comanda_5_7 |

`availability` is **also** encoded in the import CSV as inventory policy
(`stoc` → tracked/deny, `comandă`/`comandă 5–7` → untracked/continue). The metafield
carries the machine flag the calculator/theme renders as the RO label; the inventory
policy governs orderability. Both, by design.

## Bulk-editor sheet — save as `.csv` once the definitions exist

```csv
Variant SKU,Metafield: custom.lens_type [single_line_text_field],Metafield: custom.lens_coating [single_line_text_field],Metafield: custom.lens_light [single_line_text_field],Metafield: custom.lens_index [number_decimal],Metafield: custom.lens_availability [single_line_text_field]
M01,monofocal,hmc,clear,1.56,stoc
M02,monofocal,hmc,clear,1.56,comanda
M03,monofocal,hmc,clear,1.6,comanda_5_7
M04,monofocal,hmc,clear,1.6,comanda_5_7
M05,monofocal,hmc,clear,1.67,comanda_5_7
M06,monofocal,hmc,clear,1.67,comanda_5_7
M07,monofocal,ultra_blue,clear,1.56,stoc
M08,monofocal,ultra_blue,clear,1.56,comanda
M09,monofocal,ultra_blue,clear,1.6,comanda_5_7
M10,monofocal,ultra_blue,clear,1.6,comanda_5_7
M11,monofocal,ultra_blue,clear,1.67,comanda_5_7
M12,monofocal,hmc,foto,1.56,stoc
M13,monofocal,hmc,foto,1.56,comanda
M14,monofocal,ultra_blue,foto,1.56,comanda
M15,monofocal,hmc,foto,1.67,comanda_5_7
M16,monofocal,ultra_blue,foto,1.67,comanda_5_7
M17,monofocal,hmc,transitions,1.6,comanda_5_7
M18,monofocal,ultra_blue,transitions,1.6,comanda_5_7
M19,monofocal,hmc,transitions,1.67,comanda_5_7
M20,monofocal,ultra_blue,transitions,1.67,comanda_5_7
M21,monofocal,hmc,sun,1.5,stoc
M22,monofocal,hmc,sun,1.5,comanda
B01,bifocal,hmc,clear,1.5,stoc
B02,bifocal,hmc,foto,1.5,stoc
B03,bifocal,ultra_blue,clear,1.5,comanda
B04,bifocal,hmc,clear,1.6,comanda_5_7
B05,bifocal,ultra_blue,clear,1.6,comanda_5_7
B06,bifocal,hmc,foto,1.6,comanda_5_7
B07,bifocal,hmc,clear,1.67,comanda_5_7
B08,bifocal,ultra_blue,clear,1.67,comanda_5_7
```

Derived from `assets/lens-pricing-data.json` (matrix v1, commit 016f720). M23 excluded
(TBD-1, null price). Touch-both rule: regenerate alongside the import CSV.
