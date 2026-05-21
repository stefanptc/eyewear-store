# PLAN.md

**Project:** Premium Shopify Store Build — Romanian Prescription Eyewear
**Last updated:** May 22, 2026 (session 6)
**Current milestone:** M3 — Information architecture & sample content (late-flight)

---

## How this plan works

- **Milestones are exit gates, not freezes.** Any milestone can be re-opened when later work reveals a real reason to. Re-opening requires a specific trigger, not perfectionism.
- **1 session ≈ 2–3 hours** of focused work. Sizes are rough.
- **Owners:** [Me] = Stefan, [Friend] = business owner, [Together] = needs both.
- **Status legend:** ⬜ todo · 🟡 in progress · ✅ done · 🔁 re-opened
- **End of each session:** "Mn — done X, blocked on Y." Claude updates this file.

---

## M1 — Foundations
*Size: ~4 sessions · Status: ✅ done (3 sessions, May 18–19)*

**Goal:** Dev environment fully wired so we can actually build.

- ✅ Shopify Partner account created
- ✅ Dev store created (Stefan dev lens store, Basic plan, RON)
- ✅ Project instructions + research PDF + this plan in place
- ✅ [Me] Install Shopify CLI, Node, Git locally (Node 20.20.2, npm 10.8.2, Git 2.43, Shopify CLI 3.94.3; npm prefix moved to `~/.npm-global` to avoid sudo)
- ✅ [Me] Install Claude Code + Shopify AI Toolkit plugin (Claude Code 2.1.143 native binary; plugin route instead of raw MCP — auto-updates, bundles 16 skills + MCP; telemetry opted out via `OPT_OUT_INSTRUMENTATION=true` in `~/.bashrc`; running Claude Code from terminal, not Cursor)
- ✅ [Me] Fork Dawn theme into a Git repo (forked `Shopify/dawn` → `stefanptc/eyewear-store`, public for now — flip to private when M4 business logic lands; cloned to `~/AI/Projects/eyewear-store`; `upstream` remote points to Shopify/dawn for future updates; SSH keys generated on this machine and added to GitHub; `shopify theme dev` confirmed working against `stefan-dev-lens-store.myshopify.com`, theme renders at 127.0.0.1:9292 with hot-reload; storefront password: `bahmah`)
- ✅ [Me] Create `docs/GIT_CONVENTIONS.md` (branching, Conventional Commits, push policy, upstream Dawn sync rules) — referenced by `CLAUDE.md`
- ✅ [Me] Create `CLAUDE.md` in repo root (project summary, Liquid version, brand voice, push policy, MCP rules) — committed `docs: add claude.md`
- ⬜ [Friend] Confirm optician partnership / regulatory status track (parallel, non-blocking)

**Exit criterion:** `shopify theme dev` runs locally, Claude Code can read the theme, first commit pushed.

---

## M2 — Design system & brand
*Size: ~5 sessions · Status: ✅ done (1 session, May 20 — faster than expected, scope shifted away from joint mood board)*

**Goal:** Visual identity locked. Every later decision flows from this.

- ✅ [Me] Built reference grid comparing 6 premium eyewear sites (Warby Parker, Ace & Tate, Cubitts, MOSCOT, Bailey Nelson, Dresden Vision) on type, colour, hero, card, motion — `docs/m2-reference-grid.html`
- ✅ [Together] Direction locked: A / A / D — serif-led editorial typography + monochrome with one ownable warm accent + type-led hero (provisional, may shift to product-as-object once real photography exists). Reference: **Cubitts**.
- ✅ [Me] Typography exploration — tested 3 serif/sans pairings on real Romanian product copy with full diacritic stress · `docs/m2-typography-exploration.html`. Locked: **Source Serif 4 × IBM Plex Sans × IBM Plex Mono**.
- ✅ [Me] Accent exploration — 7 warm candidates rendered in product context · `docs/m2-accent-exploration.html`. Locked: **Mushroom taupe #8C7A5C** (quiet-warm, whisper accent).
- ✅ [Me] Type scale + spacing kit — full homepage mock applying every token, plus reference panel · `docs/m2-kit-page.html`. Tokens live in `CLAUDE.md` section 5.
- ⏸️ [Friend] Sign-off deferred. Stefan is the design owner per session-4 agreement; Friend approves at M5 polish gate instead of every milestone.
- ⏸️ [Friend] Decide brand name + buy domain — DEFERRED to M5. Building under placeholder "Optic Mărășești" for now.
- ✅ [Me] Encode design tokens in CLAUDE.md section 5 — full `:root` block ready to paste into Dawn's `base.css`.

**Exit criterion met:** Kit page renders the full design system at every breakpoint (375 / 1024 / 1440 tested). Stefan signed off on type, colour, scale, spacing.

---

## M3 — Information architecture & sample content
*Size: ~4 sessions · Status: 🟡 late-flight (session 6 closed — structural skeleton up, products in progress)*

**Goal:** Store has structure, even with placeholder products.

- ⏸️ [Friend] Send 5–10 real product samples — **DEFERRED** per session-4 decision. Building with theatre (Unsplash stock + AI-generated generic eyewear) through M5 so design comes alive. Real product photography swaps in pre-M6 launch.
- ✅ [Me] Apply locked design tokens to Dawn's `base.css` (commit c62b917, session 5)
- ✅ [Me] **Recreate dev store as Romania-defaulted** — `lens-store-romanian.myshopify.com` (session 5). Old US-defaulted store `stefan-dev-lens-store` flagged for deletion next session. Learned: Shopify Create-store flow doesn't ask for country; every dev store needs a manual Settings → General regional fix afterward. Cascade from store-address country change handles most of it; backup region and time zone need manual correction.
- ✅ [Me] **Define frame product schema** — `docs/m3-data-model.md` drafted and committed (commit fb691cd, session 5). Captures lens-led IA (`/pages/lentile` primary, Rame secondary), product type vocabulary, frame metafields, tag conventions, collection rules, navigation skeleton, stub pages, Markets/locale config, and open M4 lens-product-modeling questions.
- ✅ [Me] **Create 9 frame metafield definitions in admin** — `custom.frame_*` namespace, all with Romanian display names + full diacritics. 4 Choice list (material, shape, colour_finish, gender_fit), 1 plain Single line text (country_origin), 4 Dimension/mm (lens_width, bridge_width, temple_length, total_width). Two doc updates after this session: Choice list is the right Shopify-native enum (replaces "deferred to metaobjects" language); Dimension fields cannot be used in smart collection rules.
- ✅ [Me] Set up collections, stub pages, navigation (session 6). **5 automated collections** (`rame`, `rame-barbati`, `rame-femei`, `rame-rotunde`, `rame-acetat`) with smart-collection rules referencing the frame_* metafields. **3 stub pages** (`lentile`, `despre`, `contact` — Contact pre-existed with Dawn's contact form template). **Main + footer nav wired** per data model §6 (lens-led: Acasă, Lentile, Rame ▾ {Pentru bărbați, Pentru femei}, Despre, Contact in main; Returnări / Confidențialitate / Termeni / Contact in footer). Romanian policy pages initialized via "Insert template" so footer links resolve (full lawyer-reviewed text is M6 work). Product templates left at Dawn defaults — customization is M5.
- ✅ [Me] **Mid-session schema fix: `frame_gender_fit` switched from Choice list to List of choices** (commit 2ae3543). Smart-collection rules don't support mixed AND/OR, so the original `product_type = Ramă AND gender ∈ {bărbați, unisex}` shape wasn't expressible. With a list metafield, the rule simplifies to `product_type = Ramă AND gender_fit contains bărbați` (clean AND), and a "unisex" frame carries both `bărbați` and `femei` values in its list. Doc + admin both updated. `unisex` is gone as a discrete value.
- ✅ [Me] **Push Dawn fork to dev store, publish live** (session 6). When `lens-store-romanian` was created session 5, Shopify auto-installed **Horizon** as default (Shopify changed the default theme in 2025). Our local Dawn fork with M2 design tokens had never been pushed — was running invisible. Pushed via `shopify theme push --unpublished -t "Dawn M2 (in dev)"`, theme ID 155087208621, then published via admin. Horizon now in Draft themes library. Decision rationale recorded: Dawn stays per CLAUDE.md §1 — LLM reliability, sunk M2 cost, restrained design language all align. M2 *visual* design isn't fully landed yet (tokens defined but not yet wired into Dawn's section CSS — that's M5 work); structural skeleton is what M3 delivers.
- ⏸️ [Me] ~~Configure metafields for lens parameters (sphere, cylinder, axis, PD, lens type, coatings) — namespace `custom.lens_*`~~ — **moved to M4.** Discovered during session 5 that these are *customer-prescription* data (sphere/cylinder/axis/PD), not product attributes — they live on customer/cart/order, not products. Architecture decided in M4 (see `docs/m3-data-model.md` §10 open question 1). The `custom.lens_*` namespace stays reserved; no fields created yet.
- ⬜ [Me] Build out core pages: home, collection, product (Romanian content first; English deferred to M5). Stub pages exist; rich content lands later — copy work belongs in M5.
- 🟡 [Me] Source Unsplash placeholder product shots — generic eyewear, neutral backgrounds. **1 of 5 sourced session 6** (tortoise round acetate for Mărășești). Remaining 4 land alongside their products next session.
- 🟡 [Me] **Create placeholder frame products** (session 6 started). **Mărășești** created — first product, validates the full schema: Pentru list metafield accepts multi-value (bărbați + femei), all 9 frame_* metafields populated, image uploaded inline. Smart-collection auto-population unverified at session close (sidebar showed "Home page" only — but that's the homepage feature, not the smart collections; tomorrow's first step is verifying Mărășești lands in `rame`, `rame-barbati`, `rame-femei`, `rame-rotunde`, `rame-acetat`). Remaining 4 frames designed for diversity: Aviatorilor (metal/aviator/bărbați-only), Universității (acetat/cat-eye/femei-only), Victoria (titan/rectangular/bărbați), Lipscani (acetat/rotund/unisex).
- 🟡 [Me] Configure Shopify Markets — RON as store/settlement currency ✅ (session 5). **EUR display deferred to M6** — Shopify Markets multi-currency requires Shopify Payments setup, which requires Friend's business entity. See CLAUDE.md §1.
- ✅ [Me] Install Translate & Adapt + add EN locale empty (session 5) — both auto-handled by Shopify when store address country was set to Romania. Romanian primary/published, English added with no translations (content lands M5).

**Exit criterion:** Click-through prototype on dev store. Stefan can browse it like a customer and find anything. EN locale present but empty (no content yet). Design tokens applied across every page. (EUR display toggle is M6, not M3.)

---

## M4 — Custom feature: lens recipe calculator
*Size: ~6–8 sessions · Status: ⬜ not started · Hardest milestone*

**Goal:** Customer enters prescription, sees correct lens + price.

- ⬜ [Together] Friend documents pricing logic: which lens types, which coatings, how index/material affect price
- ⬜ [Me] Build calculator UI in a Liquid section + JS (or small React widget if logic gets complex)
- ⬜ [Me] Wire to metafields, validate edge cases, handle invalid prescriptions
- ⬜ [Me] Add to product page flow

**Exit criterion:** End-to-end test — enter a real prescription, get correct product variant in cart at correct price. Friend signs off on the math.

---

## M5 — Polish layer
*Size: ~5 sessions · Status: ⬜ not started*

**Goal:** Store feels premium, not "AI-generated."

- ⬜ [Me] Final product imagery pass (Photoroom cleanup of real product shots, Flux for hero)
- ⬜ [Me] Romanian copy pass (primary): bulk via Shopify Magic → re-tone with Claude → friend reviews as native speaker
- ⬜ [Me] English copy pass (secondary, for tourists/expats in Romania): translate finalized Romanian content via Translate & Adapt + Claude tone pass; UX courtesy, not an international storefront
- ⬜ [Me] Install virtual try-on app (TryOnMe to start), configure on product pages
- ⬜ [Me] Microinteractions, transitions, loading states

**Exit criterion:** Friend shows it to 3 people who aren't us; they describe it as "looks like a real brand." Both RO and EN locales feel polished.

---

## M6 — Launch readiness
*Size: ~4 sessions · Status: ⬜ not started*

**Goal:** Transferable to friend's paid plan and ready for real customers.

- ⬜ [Me] Performance pass: Lighthouse ≥85 mobile, image lazy-loading, CSS minification
- ⬜ [Me] Accessibility pass: keyboard navigation, alt text, color contrast
- ⬜ [Me] SEO pass: meta tags, schema markup, `llms.txt`, hreflang (`ro-RO` primary, `en-RO` secondary — region is RO for both, not en-US/en-GB)
- ⬜ [Me] Legal pages drafted (privacy, terms, returns) — flagged for legal review
- ⬜ [Friend] Pay for Shopify plan, set up Shopify Payments, buy/transfer domain
- ⬜ [Friend] **One-hour consult with a Romanian e-commerce lawyer** (non-negotiable)
- ⬜ [Together] Transfer dev store to friend's account
- ⬜ [Me] Final QA on production env

**Exit criterion:** Order one product end-to-end as a real customer. It works. We launch.

---

## Parking lot (deferred decisions, not blockers)

- Camweara upgrade trigger: VTO usage clears ~29% adoption benchmark post-launch
- Headless / Hydrogen migration: not before 10k monthly orders (2027+ question)
- Agentic Storefronts / UCP: re-evaluate when Shopify rolls it out in EU
- v0 Premium upgrade: only if free $5/mo credit runs out in real ideation work
- Claude Pro → Max upgrade: only if hitting usage limits 2x+ per week

---

## Change log

- **May 21–22, 2026 (session 6)** — **M3 structural skeleton up, design vs. structure separated.** Shipped: 5 automated collections with proper handles + smart-collection rules; mid-session schema fix flipping `frame_gender_fit` from Choice list to List of choices because Shopify smart collections don't support mixed AND/OR (commit 2ae3543); 3 stub pages including discovering Dawn's auto-applied `contact` template gives us a free contact form; Romanian policy boilerplate inserted to unblock footer nav link picker; main + footer nav wired per data model §6 (lens-led order, Rame with two nested children); Dawn fork pushed to `lens-store-romanian` and published live (theme ID 155087208621) — previously the store was running Horizon (Shopify's new default), and our local Dawn customizations were invisible; first placeholder frame product **Mărășești** created, validating the full metafield architecture end-to-end (list metafield Pentru accepts bărbați + femei multi-select). **Theme decision reaffirmed: Dawn stays** per CLAUDE.md §1 — Horizon is newer/Shopify's default now, but Dawn wins on LLM reliability, sunk M2 cost, and design-language fit (restrained editorial ≈ Cubitts) for this specific project. **Critical discovery: M2 *visual* design isn't actually visible yet** — tokens were applied to `:root` in session 5 but Dawn's section CSS still uses its own typography and color classes; rewiring is M5 polish work, not M3. **Process learnings:** (a) Shopify menus moved from Online Store to Content sub-nav; (b) Romanian policy URLs (`/policies/*`) need "Insert template" in Settings → Legal before the menu link picker surfaces them; (c) dev stores can't fully remove password protection until on a paid plan — that's a Friend M6 prereq, workaround for dev is admin preview URL bypass; (d) Shopify auto-installs Horizon as default theme on new dev stores in 2025+; (e) smart-collection rules for list metafields show only "is equal to" but the semantics is "contains" (verified by Mărășești being assignable as both bărbați AND femei). **Next session opens with:** (1) verify Mărășești auto-populated all 5 smart collections, (2) create the remaining 4 placeholder frames, (3) delete the old US dev store (carryover task #13), (4) preview the storefront end-to-end with multiple products in collections.
- **May 20, 2026 (session 5)** — **Heavy M3 admin execution.** Shipped: design tokens applied to Dawn `base.css` + fixed a pre-existing `featured-product.liquid` schema-translation error (commit c62b917); `docs/m3-data-model.md` drafted and committed as the schema of record (commit fb691cd); dev store recreated as `lens-store-romanian.myshopify.com` after discovering the original was US-defaulted; Settings → General fully Romanian (business entity, address Brașov, currency RON, metric, grams, Europe/Bucharest); Markets configured Romania-only with RON; Romanian set as primary published language with English added empty; Translate & Adapt installed; **9 frame metafields created** (`custom.frame_*` namespace, 4 Choice list + 1 plain text + 4 Dimension/mm, all with diacritics). **Two big constraints discovered:** (a) EUR display via Shopify Markets requires Shopify Payments configured, which requires Friend's business entity — deferred to M6, captured in CLAUDE.md §1. (b) Dimension-type metafields can't be used in smart collection rules — non-blocking for our 5 starter collections but captured in `docs/m3-data-model.md` §5 so future "narrow frames"-style collections take the tag-based path. **Process learnings:** Shopify Create-store flow ignores country (every new dev store starts US-defaulted, needs Settings → General fix); dev stores live at `dev.shopify.com`, not `partners.shopify.com` — the old "open issue" about Partners visibility was a mental-model error, now resolved in CLAUDE.md §3. **Next session:** automated collections (#6, 5 rules using the Choice list metafields), stub pages (#7 — `lentile`/`despre`/`contact`), navigation (#8 — Lentile in primary slot per lens-led IA), then delete the old US dev store (#13). After M3 admin closes, source Unsplash placeholders and create the first batch of placeholder frame products to verify smart collections auto-populate.
- **May 20, 2026 (session 4)** — **M1 closed, M2 closed in a single session, M3 opened.** Working model clarified: Stefan owns design + product decisions, Friend approves at M5 polish gate (not every milestone). M2 collapsed from 5 sessions to 1 because the joint mood board step became unnecessary. Built four artifacts in `docs/`: reference grid (6 sites scored), typography exploration (3 pairings on Romanian copy), accent exploration (7 warm candidates), kit page (full homepage mock + token reference). **Locked design direction: A/A/D** — serif-led editorial + monochrome with one accent + type-led hero (provisional). **Locked stack:** Source Serif 4 × IBM Plex Sans × IBM Plex Mono, mushroom taupe #8C7A5C accent, 88px display down to 11px mono-xs, 8px spacing base. Closest reference: Cubitts. Full token set committed to `CLAUDE.md` section 5. **Imagery policy clarified:** Unsplash + AI placeholders fine through M5, real product photography required pre-M6 launch; updated section 10 accordingly. Brand name + domain pushed to M5 — building under placeholder "Optic Mărășești." Next: switch from chat to Claude Code, apply `:root` block to Dawn's `base.css`, start configuring collections and metafields.
- **May 19, 2026 (session 3)** — Started M1 step 7 (`CLAUDE.md`). Drafted and committed `docs/GIT_CONVENTIONS.md` first so `CLAUDE.md` can reference it (`docs: add git conventions`). Solo-on-main + Conventional Commits + `--no-ff` for feature branches. **Scope clarification:** site is RO + EN (EN as UX courtesy for tourists/expats physically in Romania, not international storefront) and RON + EUR (RON store/settlement, EUR display-only via Shopify Markets auto-conversion). No EU-wide shipping, no real EUR checkout, no multi-country VAT. M3 picks up Markets config + Translate & Adapt locale setup; M5 copy pass becomes RO primary then EN secondary; M6 SEO adds `hreflang ro-RO` + `en-RO`. `CLAUDE.md` section 1 (Project summary) drafted, awaiting sign-off. Next: section 2 (Repository conventions, points at `docs/GIT_CONVENTIONS.md`).
- **May 18, 2026 (session 2)** — M1 steps 4, 5, 6 done. Local dev env fully wired (Node 20, npm 10, Shopify CLI 3.94.3, Git 2.43), Claude Code 2.1.143 with Shopify AI Toolkit plugin enabled (chose plugin path over raw Dev MCP — auto-updates, bundles skills), telemetry opted out. GitHub auth on this machine via SSH (ed25519). Dawn forked to `stefanptc/eyewear-store` (public), cloned, `shopify theme dev` confirmed working against dev store. **M1 exit criterion met.** Switched from "Claude Code in Cursor terminal" to "Claude Code in standalone terminal" — Cursor optional. Open question for M6: dev store doesn't appear in Partners dashboard, need to resolve ownership before transfer to Friend's account. Next session: M1 step 7 (`CLAUDE.md` in repo root).
- **May 18, 2026** — Plan created. M1 partially done (Partner account + dev store live).
