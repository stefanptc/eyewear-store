# Git conventions

Working rules for this repo. Short, opinionated, and meant to be followed.

---

## Branching

- **`main` is the working branch.** Solo dev, no PRs to self. Commit directly to `main` while it's just Stefan working.
- **Switch to PR flow when:** Friend gets repo access, OR we're inside M6 launch prep and want a self-review checkpoint before risky merges (calculator logic, payment config, production push).
- **Feature branches** when work spans multiple sessions and might get messy:
  - `feat/<short-name>` — new feature (e.g., `feat/lens-calculator`)
  - `fix/<short-name>` — bug fix (e.g., `fix/header-mobile`)
  - `chore/<short-name>` — tooling, deps, config (e.g., `chore/theme-check-config`)
  - `docs/<short-name>` — docs only (e.g., `docs/claude-md`)
- **Merge feature branches with `--no-ff`** so the branch point stays visible in history. Delete the branch after merge.

---

## Commit messages — Conventional Commits (lightweight)

Format: `<type>: <imperative summary>` — lowercase, no period, ≤72 chars.

**Types we use:**

- `feat:` — new functionality (a section, a page, a calculator field)
- `fix:` — bug fix
- `chore:` — tooling, deps, config, cleanup (no behavior change)
- `docs:` — docs only (`README.md`, `CLAUDE.md`, `PLAN.md`, this file)
- `style:` — CSS/visual changes with no logic change
- `refactor:` — restructure code, no behavior change
- `perf:` — performance work (image opt, CSS minification, lazy-load)

**Examples:**

```
feat: add lens recipe calculator section
fix: correct PD validation on prescription form
chore: bump shopify cli to 3.94.3
docs: add brand voice rules to CLAUDE.md
style: tighten hero spacing on mobile
```

**Body (optional)** — add a blank line then prose if the *why* isn't obvious from the summary. Wrap at ~72 chars. Skip the body for trivial commits.

**Scopes** (the `feat(scope):` form) — skip for now. Add only if the repo grows complex enough that grepping by area becomes useful.

---

## When to commit

- **Small and atomic.** One logical change per commit. If the summary needs "and," it's two commits.
- **Working state only.** Don't commit a broken theme. If you have to commit WIP, push to a feature branch, not `main`.
- **Before context switches.** End of session, switching tasks, before a risky operation — commit first.

## When to push

- After `shopify theme check` passes with no errors.
- After a quick visual sanity check in `shopify theme dev` (does the page still render?).
- Never push directly to a Shopify store from the IDE. Pushing to GitHub ≠ pushing to Shopify — those are separate operations governed by `CLAUDE.md`'s push policy.

---

## Pulling from upstream Dawn

`upstream` remote points to `Shopify/dawn`. Pull Dawn updates periodically — security fixes and new features land there.

**Process:**

```bash
git fetch upstream
git checkout main
git merge upstream/main --no-ff
# resolve conflicts (likely in sections/ and assets/ where we've customized)
shopify theme check
shopify theme dev  # visual sanity check
git push origin main
```

**Cadence:** check `upstream` monthly during the build, quarterly post-launch. Don't merge upstream changes during an active milestone unless there's a security fix — wait for a clean checkpoint.

---

## What never gets committed

- **Secrets and credentials.** No API keys, no tokens, no passwords. Use `.env` (gitignored) for anything sensitive.
- **`.env` files.** Ever.
- **Theme settings exports** that contain API keys (`config/settings_data.json` can be fine, but audit before committing if a paid app was just installed).
- **Local Shopify CLI state.** `.shopify/` directory is gitignored by default — keep it that way.
- **OS cruft.** `.DS_Store`, `Thumbs.db`, editor swap files. Already in `.gitignore`.
- **Build artifacts** if we add a Tailwind/Vite pipeline later. Source in, compiled out.
- **`node_modules/`.** Obviously.

If you commit a secret by accident: rotate the secret immediately, then rewrite history with `git filter-repo` (not just `git rm` — the secret stays in history). Treat the leaked credential as compromised regardless of how fast you caught it.

---

## Tags and releases

Skipped for now. Revisit at M6 launch — tag `v1.0.0` on the launch commit, then semantic versioning from there if it earns its keep.

---

## Quick reference

```bash
# new feature
git checkout -b feat/lens-calculator
# ...work, commit small...
git checkout main
git merge feat/lens-calculator --no-ff
git branch -d feat/lens-calculator
git push origin main

# sync with Dawn
git fetch upstream
git merge upstream/main --no-ff

# undo last commit (keep changes)
git reset --soft HEAD~1

# see what's about to be pushed
git log origin/main..HEAD
```
