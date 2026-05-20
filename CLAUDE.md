# CLAUDE.md

Project-level instructions for Claude Code sessions in this repo. Read this
file fully before doing anything, then read `PLAN.md` for current milestone
state.

---

## 1. Project summary

Premium-feeling Shopify storefront for a Romanian prescription eyewear
reseller. The **product** is affordable; the **site** must feel premium —
clean typography, generous whitespace, restrained motion, considered
hierarchy. Premium presentation is the trust-building mechanism for a
category (prescription eyewear bought online) where customers need
confidence before paying.

**Market:** Romania only. Prescription verification, fulfillment, returns,
and regulatory compliance are all Romania-scoped. Do not suggest EU-wide
shipping, multi-country VAT (OSS), or international expansion features.

**Languages:** Romanian (primary) and English (secondary, for tourists
and expats physically in Romania). English is a UX courtesy, not an
international storefront.

**Design direction (locked May 19, 2026):** Serif-led editorial typography
+ monochrome palette with one ownable warm accent + type-led hero
treatment (provisional; may shift to product-as-object once real
photography exists). Closest single reference: **Cubitts**
(cubitts.com) — craft-feeling, restrained, archival. Not Warby Parker,
not Ace & Tate. Premium signal comes from typographic restraint and
editorial discipline, not lifestyle photography or playful colour
blocking. See `docs/m2-reference-grid.html` for the comparison that
locked this direction.

**Currencies:** RON is the store currency and settlement currency. EUR
displays as a secondary option for customers via Shopify Markets
auto-conversion; checkout still settles in RON. No real EUR checkout.

**Stack:** Dawn theme (forked, not rebuilt) on Online Store 2.0 · Liquid +
vanilla JS · Shopify Dev MCP server mandatory for Liquid/GraphQL work ·
v0 by Vercel for UI ideation · Photoroom + Flux 1.1 Pro for imagery ·
TryOnMe for virtual try-on at launch.

**Custom features planned:** (1) prescription → lens recipe → price
calculator, (2) virtual try-on integration. Everything else is
configuration and content on top of Dawn.

**Ownership:** Stefan builds (design, theme, content, free apps, QA).
Friend owns the business and pays for everything that costs money or
needs his legal identity (Shopify plan, domain, payment processor, paid
apps, legal review). See `PLAN.md` for the `[Me] / [Friend] / [Together]`
labels on every task.

---

## 2. Repository conventions

Full rules in `docs/GIT_CONVENTIONS.md`. Read it before any git operation.

**Highlights a Claude Code session must respect:**

- `main` is the working branch. Solo dev, no PRs to self. Commit directly
  to `main` unless work spans multiple sessions or is risky enough to want
  isolation — then use `feat/<name>`, `fix/<name>`, `chore/<name>`, or
  `docs/<name>` and merge with `--no-ff`.
- **Conventional Commits, lowercase, no period, ≤72 chars.** Types in use:
  `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`. One logical
  change per commit. If the summary needs "and," split it.
- **Never commit:** secrets, `.env`, API keys, theme settings exports that
  contain app credentials, `node_modules/`, `.shopify/` state, OS cruft.
- **Pushing to GitHub ≠ pushing to Shopify.** They are separate operations.
  GitHub push policy is in `docs/GIT_CONVENTIONS.md`; Shopify push policy
  is in section 8 of this file.
- **Upstream Dawn:** `upstream` remote tracks `Shopify/dawn`. Pull updates
  monthly during the build, never mid-milestone except for security fixes.

When in doubt about a git operation, stop and read `docs/GIT_CONVENTIONS.md`
rather than guessing.

---

## 3. Environment

**Local toolchain (May 2026):**

- Node 20.20.2 (LTS), npm 10.8.2 — npm prefix at `~/.npm-global` (no sudo for global installs)
- Git 2.43
- Shopify CLI 3.94.3
- Claude Code 2.1.143 (native binary, run from standalone terminal — not from Cursor)
- Shopify AI Toolkit plugin enabled (bundles 16 skills + Dev MCP server, auto-updates)

**Repo:**

- Local path: `~/AI/Projects/eyewear-store`
- `origin`: `git@github.com:stefanptc/eyewear-store.git` (public during build, flip to private at M4)
- `upstream`: `https://github.com/Shopify/dawn.git` (for periodic Dawn updates — see `docs/GIT_CONVENTIONS.md`)
- GitHub auth on this machine: SSH (ed25519)

**Dev store:**

- URL: `stefan-dev-lens-store.myshopify.com`
- Plan: Shopify development store (free, Partner-owned)
- Storefront password: `bahmah`
- Store currency: RON (settlement currency, do not change)
- Local preview: `shopify theme dev` → `http://127.0.0.1:9292` with hot reload

**Environment variables (in `~/.bashrc`):**

- `OPT_OUT_INSTRUMENTATION=true` — disables Shopify AI Toolkit telemetry. Keep set. Every validated GraphQL/Liquid snippet would otherwise be sent to Shopify's servers; opt-out is the right default for client work.

**Known open issue:**

- Dev store does not appear in the Partners dashboard. Ownership/access path to resolve before M6 transfer to Friend's account. Non-blocking for M1–M5.

**Do not modify** any of the above without updating this section and committing the change with `docs: update environment`.

---

## 4. Shopify Dev MCP — mandatory for any Liquid or GraphQL work

The Shopify AI Toolkit plugin is installed and provides the Dev MCP server.
**Use it. Do not write Liquid or GraphQL from memory.** Liquid is niche
enough that LLMs hallucinate filter names, object properties, and metafield
access patterns at a meaningful rate. The MCP exists to eliminate that.

**Before writing any Liquid:**

1. Call `search_docs_chunks` for the object, filter, or tag you're about to use.
2. Call `validate_theme_codeblocks` on the generated Liquid before saving.
3. If validation fails, fix and re-validate. Do not commit Liquid that
   hasn't been validated this session.

**Before writing any GraphQL (Admin or Storefront API):**

1. Call `introspect_admin_schema` (or the Storefront equivalent) to confirm
   the type, field, and connection shape you're about to query.
2. Call `validate_graphql_codeblocks` on the generated query.
3. Treat any field not in the schema as nonexistent, no matter how plausible
   the name sounds.

**What to never assume exists:**

- `product.specifications`, `product.dimensions`, `product.materials` — not
  standard Shopify fields. Custom data lives in **metafields**. Always check.
- "Common-sense" filter names like `currency_format`, `format_price`, or
  `pretty_print`. The real filter is almost always different. Look it up.
- Anything from a tutorial older than ~12 months. Liquid has gained tags and
  filters (e.g., the `content_for` ecosystem, theme blocks) and lost others.

**Templates and theme architecture:**

- This is an **Online Store 2.0** theme. Templates are JSON files that
  reference sections. Do not generate `.liquid` template files for things
  Shopify expects as `.json` (e.g., `templates/product.json`, not
  `templates/product.liquid`). If unsure, check what Dawn ships.
- Custom data goes in **metafields** with proper namespaces (`custom.*`
  for store-owned definitions, `app.*` for app-installed ones). The lens
  prescription parameters in M4 will be `custom.lens_*` — define them in
  Settings → Custom data, never inline as product tags.

**Other useful MCP tools:**

- `search_docs_chunks` — the daily driver for "is this real, and how is it
  spelled?" questions.
- `fetch_full_docs` — when the chunk excerpt isn't enough context.
- `learn_shopify_api` — for Admin/Storefront/Functions API surfaces you
  haven't used in this project before.

**Mutations and live-store writes:**

- The `shopify store execute` command (with `--allow-mutations`) can write
  to a real store via MCP. **This project does not enable that flag, ever.**
  All work happens on the dev store via `shopify theme dev` or
  `shopify theme push --unpublished`. If a workflow ever seems to need
  live mutations, stop and ask — it almost certainly doesn't. Writes go
  through the Shopify admin UI or the CLI, deliberately.
- Per Shopify's official AI Toolkit docs: there is no rollback for MCP
  operations. Treat every mutation as permanent.

**Failure mode to watch for:** Claude Code generating "obvious" Liquid that
*looks* right, ships, and silently produces empty output on the storefront
because the filter or property doesn't exist. Validation catches this.
Eyeballing does not.

---

## 5. Liquid and theme conventions

**Dawn is the base. Modify, don't rebuild.** Dawn ships ~30k lines of
production-ready Liquid. Replacing it with a custom theme is a 6-month
project; we have 4 months total. Customize Dawn's sections, add new ones
where needed, override CSS via the theme's design tokens, and resist the
urge to refactor what already works.

**Theme architecture rules:**

- **Online Store 2.0 only.** All templates are JSON; sections are reusable;
  blocks are merchant-editable within sections.
- **One responsibility per section.** A hero section renders a hero. A
  product grid renders a grid. Don't create god-sections that do five
  things behind a toggle — that's how Dawn ends up unmaintainable.
- **Every new section ships a `{% schema %}` block.** Settings exposed for
  anything the merchant should be able to change (text, image, color,
  alignment, padding). Never hard-code copy in a section.
- **Block types over toggles.** If a section needs "show/hide subtitle,"
  that's a `subtitle` block, not a `show_subtitle` boolean.

**Styling:**

- **Use Dawn's CSS variables** (`--color-*`, `--font-*`, `--spacing-*`)
  as the design tokens. Don't sprinkle hex codes or magic numbers in
  section CSS — define a variable once in the theme's settings or
  `base.css`, reference it everywhere.
- **No Tailwind CDN script tag.** Ever. It tanks Lighthouse scores and
  loads MB of CSS the page doesn't use. If we ever need Tailwind, it
  comes through a local PostCSS build pipeline scanning `.liquid` files
  for class usage and outputting purged CSS as a theme asset — and we
  discuss before adding that complexity.
- **Mobile-first.** Default styles target mobile; media queries scale up.
  Romania's e-commerce traffic skews heavily mobile.
- **Restrained motion.** Premium = considered, not animated. Transitions
  ≤300ms, easing on real properties only (opacity, transform), respect
  `prefers-reduced-motion`. No parallax. No scroll-jacking.
- **No rounded corners.** `--radius: 0` is the system default. Editorial
  restraint. Re-discuss if a single element genuinely demands it.

**Design tokens (locked May 19, 2026):**

The full token system was developed and signed off via the M2 kit page
(`docs/m2-kit-page.html`). Apply these to Dawn's `base.css` and theme
settings — every section references variables, never raw values.

```css
:root {
  /* Colour — mushroom system */
  --bg:          #faf8f3;  /* warm off-white, page background */
  --bg-shaded:   #f3efe5;  /* surfaces, footers, shaded blocks */
  --bg-card:     #ffffff;  /* product image plates */
  --ink:         #1a1a17;  /* warm near-black, body + headlines */
  --ink-soft:    #3a3833;  /* secondary copy */
  --ink-muted:   #6a665a;  /* labels, specs, tertiary */
  --rule:        #d4cfc2;  /* hairlines, borders */
  --rule-faint:  #e8e3d6;  /* internal dividers, faint separators */
  --accent:      #8c7a5c;  /* mushroom taupe — prices, italics, active */
  --accent-soft: #b8aa8a;  /* hover surfaces, dark-mode contrast */

  /* Type families */
  --serif: 'Source Serif 4', serif;
  --sans:  'IBM Plex Sans', system-ui, sans-serif;
  --mono:  'IBM Plex Mono', ui-monospace, monospace;

  /* Type scale — px, with line-height notes */
  --t-mono-xs:   11px;     /* lh 1.5 — mono eyebrows, smallest labels */
  --t-mono-sm:   12.5px;   /* lh 1.5 — small mono, codes, meta */
  --t-ui-sm:     13.5px;   /* lh 1.5 — UI controls, small links */
  --t-body-sm:   14.5px;   /* lh 1.6 — secondary body, footer */
  --t-body:      16px;     /* lh 1.55 — default body (sans) */
  --t-body-lg:   18px;     /* lh 1.55 — serif intro paragraphs */
  --t-h4:        22px;     /* lh 1.2  — product names, card titles */
  --t-h3:        28px;     /* lh 1.15 — section subheads */
  --t-h2:        40px;     /* lh 1.08 — section titles */
  --t-h1:        56px;     /* lh 1.05 — page hero (non-display) */
  --t-display:   88px;     /* lh 1.02 — brand hero only */

  /* Spacing scale — 8px base, expanding ratio */
  --s-1:    4px;   /* micro */
  --s-2:    8px;   /* xs   — tight UI gaps */
  --s-3:   12px;   /* sm   — small gaps */
  --s-4:   16px;   /* md   — default gap, paragraph margins */
  --s-5:   24px;   /* md+  — card padding, paragraph spacing */
  --s-6:   32px;   /* lg   — between content blocks */
  --s-7:   48px;   /* xl   — internal section spacing */
  --s-8:   64px;   /* 2xl  — between sections */
  --s-9:   96px;   /* 3xl  — major section break */
  --s-10: 128px;   /* 4xl  — hero top/bottom, page rhythm */
  --s-11: 160px;   /* 5xl  — rare, marquee spacing */

  /* Layout */
  --max:    1200px;   /* max content width */
  --pad-x:  48px;     /* page side padding (24px at <=640px) */

  /* Borders / radii */
  --border-thin: 1px;
  --radius:      0;     /* no rounded corners */

  /* Motion */
  --duration:  120ms;
  --easing:    ease;
  /* Only color/opacity transitions — no transforms unless explicit */
}
```

**Mobile scaling** (matches the kit page):

```css
@media (max-width: 1024px) {
  :root { --t-display: 64px; --t-h1: 44px; --t-h2: 32px; --pad-x: 32px; }
}
@media (max-width: 640px) {
  :root { --t-display: 44px; --t-h1: 36px; --t-h2: 26px; --pad-x: 24px; }
}
```

**Font loading:** Source Serif 4 (variable, opsz 8–60, weights 300/400/500/600,
ital 0/1) · IBM Plex Sans (300/400/500/600) · IBM Plex Mono (400/500). All
Google Fonts, full Romanian diacritic support verified.

**JavaScript:**

- **Vanilla JS preferred.** Dawn uses web components and module scripts;
  follow that pattern. No jQuery, no bringing in React unless the lens
  calculator (M4) genuinely needs it.
- **Defer non-critical scripts.** `defer` attribute on every external
  script. Inline scripts only for above-the-fold critical paths.
- **No new dependencies without a reason.** Every npm package is a
  perf cost and a security surface. Document why in the commit message.

**Performance baseline (enforced in section 9):**

- Images: lazy-loaded except above-the-fold hero, explicit width/height
  attributes, WebP/AVIF via Shopify's `image_url` filter with `format`
  parameter.
- CSS: minified, no unused selectors at section level.
- Fonts: max 2 families, max 4 weights, `font-display: swap`.

**Accessibility (baseline, not aspirational):**

- Every interactive element keyboard-reachable.
- Focus states visible and not removed.
- Alt text on every content image (decorative images get `alt=""`).
- Color contrast meets WCAG AA (4.5:1 for body text, 3:1 for large text).
- Form fields have visible labels, not just placeholders.

---

## 6. Brand voice — Romanian primary, English secondary

The site is bilingual. Romanian is the working language and gets written
first; English is translated from finalized Romanian, not written
independently. Voice reference: **Cubitts** (cubitts.com) — considered,
plain-spoken, slightly archival, never corporate, never breathless. Long
copy can be long when the subject earns it (provenance, materials,
craft). Short copy stays short. The voice equivalent of the serif type
choice: restraint reads as premium, ornament reads as desperate.

Specifically NOT: Warby Parker's friendly-marketing warmth, Ace & Tate's
playful campaign energy. We picked the editorial direction; the writing
follows.

**Romanian — non-negotiable rules:**

- **"Tu," not "dumneavoastră."** Premium-casual D2C address. Formal
  Romanian reads as cold and old-fashioned for this category and audience.
- **Diacritics mandatory: ă, â, î, ș, ț.** Every page, every product
  name, every meta tag, every alt text. LLMs drop diacritics in long
  outputs — re-check. Romanian search treats "ochelari de vedere" and
  "ochelari de vedere" (without diacritics) as different queries.
- **Currency format:** `199,00 lei` — decimal **comma**, not point.
  Use "lei" or "RON" consistently, never "RON $" or "$199". Prices
  include 19% TVA by default (Romanian consumer protection law).
- **Avoid English calques.** "Computor" → "calculator." "A aplica
  pentru" → "a candida la." Native speaker (Friend) does the final
  pass; flag anything that sounds translated.
- **Banned phrases (AI-smell):** "Descoperă rama perfectă pentru
  stilul tău unic." "Călătorește în lumea ochelarilor de vedere."
  "Soluții personalizate pentru fiecare client." If a sentence sounds
  like a brochure, rewrite it.

**English — when we get to it (M5):**

- **Same tone register: friendly, direct, second-person.** No "Dear
  customer," no "We are pleased to offer."
- **Currency:** EUR display via Shopify Markets, RON in parentheses
  for clarity if helpful. Never invent EUR prices — Shopify converts.
- **Audience reminder:** the English reader is physically in Romania.
  Don't write copy that implies international shipping, customs, or
  cross-border returns.

**Universal rules (both languages):**

- **No medical claims.** This is also a regulatory hard rule (section 7).
  No "improves vision," "prevents myopia," "doctor-recommended" unless
  the doctor is named, verifiable, and has approved the line.
- **No fake urgency.** No "only 2 left!" unless inventory truly is at 2.
  No "limited-time offer" without a real end date. Premium brands don't
  do panic-marketing.
- **No emoji in body copy.** Sparingly OK in social/email subject lines.
  Never in product titles, descriptions, or navigation.

**Workflow (M5):**

1. Bulk-generate Romanian product descriptions via Shopify Magic in admin.
2. Re-tone via Claude with this section's rules in the system prompt.
3. Friend reviews as native speaker; corrections fold back.
4. Once Romanian is locked, translate to English via Translate & Adapt;
   tone-pass via Claude; spot-check.

---

## 7. Regulatory guardrails (Romania, prescription eyewear)

**This section is informational, not legal advice.** Friend's mandatory
one-hour consult with a Romanian e-commerce lawyer (M6) is the source of
truth. These rules are conservative defaults until that consult overrides
them.

**Why this matters:**

Corrective lenses are classified as medical devices under EU MDR
(Medical Device Regulation). Online sale in Romania is governed by
ANMDMR (Agenția Națională a Medicamentului și a Dispozitivelor Medicale
din România). False or unauthorized medical-device advertising carries
fines up to RON 20,000 (~EUR 4,000) **per breach**.

**Hard rules for any copy or feature on this store:**

- **No medical claims, ever.** No "vă vindecă vederea," "previne
  miopia," "tratament pentru astigmatism," "recomandat de medic,"
  "îmbunătățește vederea." Frames correct refractive error; they don't
  heal anything. Even softer claims like "for healthier eyes" are out.
- **Prescription verification requires a licensed Romanian optometrist.**
  This is Friend's regulatory partnership track (M1 parallel item,
  carried through M6). The site can collect a prescription upload; the
  licensed partner must validate it before fulfillment. Claude Code
  does not build a flow that ships glasses without that validation step.
- **TVA (19%) included in displayed prices** per OUG 34/2014. No
  "+ TVA" pricing patterns. The price the customer sees is the price
  they pay.
- **Returns policy must reflect Romanian consumer law:** 14-day
  withdrawal right for distance contracts, with exceptions for
  custom-made goods (which prescription lenses likely are — Friend's
  lawyer confirms). Don't draft this from memory.
- **Legal pages (privacy, terms, returns, cookies, GDPR) get drafted
  by AI as starting points only, then reviewed by Friend's lawyer
  before launch.** Section 10 lists these as out-of-scope for
  autonomous AI generation.

**Where AI is allowed to help with regulatory content:**

- Product technical specs (frame material, lens index, coating types) —
  factual, not promotional.
- Customer service copy ("how to read your prescription," "what is PD,"
  "how to measure your face") — educational, not medical-advice.
- FAQ scaffolding — friend and lawyer fill in the answers that touch
  regulated territory.

**When in doubt, the rule is:** if a sentence makes any claim about
health, vision improvement, or medical efficacy, delete it and ask
Friend before re-adding.

---

## 8. Push policy — Shopify deploys

**Pushing to GitHub and pushing to Shopify are different operations.**
GitHub push policy is in `docs/GIT_CONVENTIONS.md`. This section governs
Shopify pushes only.

**The two Shopify push commands:**

```bash
shopify theme push --unpublished   # SAFE: pushes to an unpublished theme on the dev store
shopify theme push --live          # DANGEROUS: overwrites the published storefront
```

**Project policy:**

- **`--unpublished` is the default and only routine command.** Push to
  an unpublished theme on the dev store, preview it via the theme picker
  in admin, promote manually if it looks right.
- **`--live` is forbidden during M1–M5.** No exceptions. The dev store
  has no live customers; nothing should ever publish automatically.
- **At M6 (launch readiness), `--live` requires explicit human
  confirmation in the same session, with the words "publish to live"
  typed by Stefan.** Not "ship it," not "push live," not "go." The exact
  phrase. This is a guardrail against typo-driven disasters.

**Slash command convention (`.claude/commands/push-staging.md`):**

When a Claude Code session is asked to push the theme, it should:

1. Run `shopify theme check --fail-level=error` and stop if it fails.
2. Run `shopify theme push --unpublished --json` and capture output.
3. Print the preview URL of the unpublished theme.
4. **Never** run `shopify theme push --live`, regardless of phrasing,
   without the exact confirmation phrase from the bullet above.

**Before any push:**

- The working tree should be committed to git (no uncommitted Liquid
  changes about to land on Shopify but not in version control).
- `shopify theme dev` should have been running and the change visually
  confirmed locally.
- `theme check` passes.

**Backups before risky operations:**

- Before any operation that could overwrite store data (theme push to
  a theme that already has merchant edits, settings_data.json import),
  download a backup of the current theme via `shopify theme pull` to
  a timestamped local directory.
- Product data backup happens via Shopify admin → Settings → Export, not
  via CLI.

---

## 9. Quality gates

Definition of "done" for any non-trivial change. Every section, every
template change, every Romanian copy pass goes through these.

**Lint / validation:**

- `shopify theme check --fail-level=error` passes.
- `AssetSizeCSS` and `ParserBlocking` rules at error severity in
  `.theme-check.yml`.
- Every Liquid snippet validated via MCP (`validate_theme_codeblocks`)
  before commit.
- Every GraphQL query validated via MCP (`validate_graphql_codeblocks`).

**Performance (mobile, dev-store conditions):**

- Lighthouse Performance ≥85.
- Largest Contentful Paint ≤2.5s.
- Cumulative Layout Shift ≤0.1.
- No layout shift from late-loading fonts (preload critical, swap rest).
- Images lazy-loaded below the fold with explicit dimensions.

**Accessibility:**

- Lighthouse Accessibility ≥90.
- Manual keyboard navigation test: tab through every interactive
  element on home, collection, product, cart.
- Alt text on every content image; `alt=""` on decorative.
- Color contrast WCAG AA (axe DevTools clean).
- Screen-reader smoke test on the main flows before launch.

**Content:**

- Romanian diacritics correct everywhere (grep for common misspellings).
- No medical claims (grep for "vindecă," "previne," "tratament,"
  "îmbunătățește").
- Prices in `199,00 lei` format, never `199.00 RON` or `$199`.
- TVA included; "TVA inclus" stated once on product/cart pages.

**Before any commit:** run `theme check`. Before any push: run all of
the above. Before launch (M6): all of the above plus the lawyer review
and the end-to-end real-customer order test.

---

## 10. Out of scope

Things Claude Code should not propose, build, or pursue without an
explicit override from Stefan.

**Architecture:**

- **Hydrogen / headless.** Not before 10k monthly orders. 2027+ question.
- **A second theme.** We have Dawn. No "let's also try Impulse to compare."
- **Custom Shopify app for the lens calculator.** First-pass build is a
  Liquid section + JS. Promote to an app only if section-level state
  becomes unworkable, and only with Stefan's sign-off.

**Stack additions:**

- **Tailwind via CDN script tag.** Never. Local build pipeline only,
  and only after explicit discussion.
- **React, Vue, Svelte for general theme work.** Vanilla JS + web
  components, following Dawn's pattern. The lens calculator is the only
  candidate for a framework, and only if its logic genuinely demands it.
- **jQuery.** No.
- **Any npm package without a clear reason logged in the commit message.**

**Content:**

- **AI-generated photos of real frames at launch (M6+).** Customers
  will return mismatches. Real product photography required for catalog
  shots before going live. **During development (M2–M5), Unsplash stock
  and AI-generated generic eyewear are fine as placeholders** — they
  help the design come alive. Every placeholder gets replaced with
  Friend-supplied product photography before M6 launch. Track which
  cards are still on placeholder imagery in `PLAN.md`.
- **AI-generated legal pages, medical-claim copy, or prescription-flow
  copy without lawyer/optometrist review.** Section 7 covers why.
- **AI-translated copy without the tone-pass workflow** in section 6.
- **OpenLLM-Ro models (RoLlama3, RoMistral, RoGemma) for any production
  output.** They're CC-BY-NC licensed — non-commercial only. Off limits.

**Market scope:**

- **EU-wide shipping.** Romania only.
- **Multi-country VAT / OSS scheme.** Romania VAT only.
- **Real EUR checkout.** Display-only EUR via Shopify Markets.
- **Cross-border returns logistics.** N/A.

**Operations:**

- **`shopify store execute --allow-mutations`.** Never. Writes go
  through admin UI or `theme push --unpublished` (section 8).
- **`shopify theme push --live` without the exact human confirmation
  phrase.** Forbidden through M5; gated through M6.
- **Pulling `upstream/main` (Dawn updates) during an active milestone.**
  Wait for the milestone exit. Exception: critical security patches.
- **Touching `~/.bashrc`, npm prefix, or global tool versions** without
  updating section 3 and committing the change.

If a request lands in any of the above, surface the conflict before
acting. Don't quietly work around it.

---

## 11. Working memory — how a session should run

**At session start:**

1. Read this file (`CLAUDE.md`) in full.
2. Read `PLAN.md` for current milestone, current step, and any
   carried-over blockers from the last session's change log.
3. If anything in `PLAN.md` contradicts this file, this file wins —
   then flag the contradiction so we reconcile.
4. State current milestone and the next concrete step before doing
   anything.

**During the session:**

- **One step at a time.** Propose a single concrete action, wait for
  Stefan's confirmation or result, then move on. Don't stack changes.
- **Plan before doing** for any non-trivial decision (new section,
  app install, integration choice, schema design). Options, trade-offs,
  recommendation — then build.
- **Research before deciding** for anything that may have changed
  since training cutoff (Shopify features, app pricing, theme
  capabilities). The Dev MCP is the first stop for Shopify-specific
  facts; web search for the broader ecosystem.
- **Ask when unsure** rather than guess. If a step depends on info
  you don't have (Friend's pricing logic, brand assets, supplier
  specs), ask before fabricating placeholders.
- **Reference the project research PDF** (`Shopify_AI_Stack_Research_May2026.pdf`)
  for tool/app/stack decisions. It captures decisions we don't want
  to re-litigate.
- **Label every task with ownership.** `[Me]` (Stefan), `[Friend]`,
  or `[Together]`. When Friend's action is needed, pause and wait —
  don't move on until he's done it and Stefan has confirmed.

**At session end:**

1. Report status in the form: `Mn — done X, blocked on Y` (where Mn
   is the current milestone).
2. Update `PLAN.md`:
   - Flip completed items to ✅ with a note on what was actually done.
   - Flip in-progress items to 🟡.
   - Add a dated change-log entry at the bottom capturing decisions
     made, scope changes, and the next concrete step.
3. Commit any docs changes (`docs: update plan` or similar) before
   the session closes.

**Communication style Stefan expects:**

- Concise. Skip preamble and recaps.
- Show the "why" in one or two lines, not paragraphs.
- Flag risks, gotchas, and reversibility (is this easy to undo?) when
  relevant.
- Push back on bad ideas rather than acquiesce. Stefan is building this
  to learn; pretend-agreement isn't useful.

---

*End of CLAUDE.md. When this file gets out of sync with reality, fix the
file before continuing the work.*
