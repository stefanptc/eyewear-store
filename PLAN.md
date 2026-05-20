# PLAN.md

**Project:** Premium Shopify Store Build — Romanian Prescription Eyewear
**Last updated:** May 20, 2026
**Current milestone:** M3 — Information architecture & sample content (starting)

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
*Size: ~4 sessions · Status: 🟡 starting*

**Goal:** Store has structure, even with placeholder products.

- ⏸️ [Friend] Send 5–10 real product samples — **DEFERRED** per session-4 decision. Building with theatre (Unsplash stock + AI-generated generic eyewear) through M5 so design comes alive. Real product photography swaps in pre-M6 launch.
- ⬜ [Me] Apply locked design tokens to Dawn's `base.css` (full `:root` block from `CLAUDE.md` section 5) — first thing in Claude Code
- ⬜ [Me] Set up collections (frames, lenses, combos), product templates, navigation
- ⬜ [Me] Configure metafields for lens parameters (sphere, cylinder, axis, PD, lens type, coatings) — namespace `custom.lens_*`
- ⬜ [Me] Build out core pages: home, collection, product, about, contact (Romanian content first; English deferred to M5)
- ⬜ [Me] Source 8–10 Unsplash placeholder product shots — generic eyewear, neutral backgrounds
- ⬜ [Me] Configure Shopify Markets: RON as store/settlement currency, EUR as display-only secondary currency (auto-conversion, customer still settles in RON)
- ⬜ [Me] Install Translate & Adapt (free, official Shopify app); add English as secondary locale, leave content empty until M5 copy pass

**Exit criterion:** Click-through prototype on dev store. Stefan can browse it like a customer and find anything. RON↔EUR display toggle works. EN locale present but empty (no content yet). Design tokens applied across every page.

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

- **May 20, 2026 (session 4)** — **M1 closed, M2 closed in a single session, M3 opened.** Working model clarified: Stefan owns design + product decisions, Friend approves at M5 polish gate (not every milestone). M2 collapsed from 5 sessions to 1 because the joint mood board step became unnecessary. Built four artifacts in `docs/`: reference grid (6 sites scored), typography exploration (3 pairings on Romanian copy), accent exploration (7 warm candidates), kit page (full homepage mock + token reference). **Locked design direction: A/A/D** — serif-led editorial + monochrome with one accent + type-led hero (provisional). **Locked stack:** Source Serif 4 × IBM Plex Sans × IBM Plex Mono, mushroom taupe #8C7A5C accent, 88px display down to 11px mono-xs, 8px spacing base. Closest reference: Cubitts. Full token set committed to `CLAUDE.md` section 5. **Imagery policy clarified:** Unsplash + AI placeholders fine through M5, real product photography required pre-M6 launch; updated section 10 accordingly. Brand name + domain pushed to M5 — building under placeholder "Optic Mărășești." Next: switch from chat to Claude Code, apply `:root` block to Dawn's `base.css`, start configuring collections and metafields.
- **May 19, 2026 (session 3)** — Started M1 step 7 (`CLAUDE.md`). Drafted and committed `docs/GIT_CONVENTIONS.md` first so `CLAUDE.md` can reference it (`docs: add git conventions`). Solo-on-main + Conventional Commits + `--no-ff` for feature branches. **Scope clarification:** site is RO + EN (EN as UX courtesy for tourists/expats physically in Romania, not international storefront) and RON + EUR (RON store/settlement, EUR display-only via Shopify Markets auto-conversion). No EU-wide shipping, no real EUR checkout, no multi-country VAT. M3 picks up Markets config + Translate & Adapt locale setup; M5 copy pass becomes RO primary then EN secondary; M6 SEO adds `hreflang ro-RO` + `en-RO`. `CLAUDE.md` section 1 (Project summary) drafted, awaiting sign-off. Next: section 2 (Repository conventions, points at `docs/GIT_CONVENTIONS.md`).
- **May 18, 2026 (session 2)** — M1 steps 4, 5, 6 done. Local dev env fully wired (Node 20, npm 10, Shopify CLI 3.94.3, Git 2.43), Claude Code 2.1.143 with Shopify AI Toolkit plugin enabled (chose plugin path over raw Dev MCP — auto-updates, bundles skills), telemetry opted out. GitHub auth on this machine via SSH (ed25519). Dawn forked to `stefanptc/eyewear-store` (public), cloned, `shopify theme dev` confirmed working against dev store. **M1 exit criterion met.** Switched from "Claude Code in Cursor terminal" to "Claude Code in standalone terminal" — Cursor optional. Open question for M6: dev store doesn't appear in Partners dashboard, need to resolve ownership before transfer to Friend's account. Next session: M1 step 7 (`CLAUDE.md` in repo root).
- **May 18, 2026** — Plan created. M1 partially done (Partner account + dev store live).
