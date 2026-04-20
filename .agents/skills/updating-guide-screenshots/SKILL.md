---
name: updating-guide-screenshots
description: (Re)capture screenshots for user guides under apps/modeling-app/docs/user-guides/. Use when adding a new guide, refreshing outdated images, or when a guide build fails because a referenced PNG is missing.
---

# Updating Guide Screenshots

How to (re)capture screenshots for any user guide under `apps/modeling-app/docs/user-guides/<guide-name>/images/`.

We capture from a **production build deployed into the local DHIS2 instance** (not the Vite dev server). This avoids dev-only UI noise (ReactQueryDevtools, HMR overlays) without having to patch `App.tsx`, and mirrors what users actually see.

## Prerequisites

- Docker stack with:
    - DHIS2 at `http://localhost:8080`
    - CHAP backend at `http://localhost:8000`

  Bring it up from the repo root:
  ```bash
  pnpm docker:e2e up --wait
  pnpm docker:e2e ready   # waits for the analytics job to finish
  ```

- A CHAP instance with the relevant data for the guide (e.g. at least one configured model, a dataset, etc. — depends on the guide). The default docker stack seeded by the chap-frontend repo usually already has the relevant data.

- Local DHIS2 credentials. Throwaway instance is fine to use directly; these work against the default docker stack:
    - Server: `http://localhost:8080`
    - Username: `birk`
    - Password: `Solololo1!`

  If these don't work (e.g. credentials rotated), ask the user for fresh ones.

## Build and deploy the modeling app

1. From the repo root, build all packages:
   ```bash
   pnpm build
   ```
   This produces `apps/modeling-app/build/bundle/dhis2-chap-modeling-app-<version>.zip`.

2. From `apps/modeling-app/`, deploy the built bundle into the running DHIS2 instance:
   ```bash
   cd apps/modeling-app
   pnpm exec d2-app-scripts deploy http://localhost:8080 -u birk --password 'Solololo1!'
   ```
   On success you'll see:
   ```
   Successfully deployed @dhis2-chap/modeling-app to http://localhost:8080
   App is available at http://localhost:8080/api/apps/dhis2-chapmodeling-app/
   ```
   `--password` is undocumented by `d2-app-scripts deploy --help` but accepted by the handler. Alternatively omit it and let the CLI prompt (won't work in non-interactive shells).

3. If you change app code during capture (e.g. to tweak the UI for a shot), re-run `pnpm build` + the `deploy` command to refresh the deployed bundle.

## Setup before capturing

1. Confirm the viewport matches the existing images in the target guide:
   ```bash
   identify apps/modeling-app/docs/user-guides/<guide>/images/*.png
   ```
   Common resolutions used so far: `1600x1122` (e.g. `configuring-a-model`). Devin's `browser` tool renders at the resolution set by the `--ozone-override-screen-size` flag on the Chrome session; do not rely on CSS/window resize to match a different target size.

2. Log in to DHIS2 at `http://localhost:8080/dhis-web-login/` using the credentials above. Unlike the dev-server flow, there is **no** app-shell Server/Username/Password proxy form — you log in to DHIS2 directly.

3. Open the modeling app at `http://localhost:8080/api/apps/dhis2-chapmodeling-app/index.html` (or via the DHIS2 apps menu — look for "Modeling"). The app key is `dhis2-chapmodeling-app` (no hyphen between "chap" and "modeling"); this matches what `d2-app-scripts deploy` prints as the "App is available at …" URL.

4. Close any transient UI that isn't part of the documented flow:
    - The yellow "alpha version" banner at the top of the page (close button on the right).

   Notes specific to the production build (vs. the old dev-server flow):
    - `ReactQueryDevtools` is tree-shaken out in production, so there is no devtools flower icon to hide — no need to edit `App.tsx`.
    - No Vite HMR / console overlays appear.

## Capturing

- Use the scripted browser (Devin's `browser` tool or Playwright over CDP at `http://localhost:29229`) to drive the app.
- Save each screenshot directly to the guide's `images/` folder using the filename referenced by the guide's markdown. The markdown imports the PNGs at build time, so every referenced file must exist or the build fails with a Rollup error like:
  ```
  Could not resolve "./images/configure-step-1-navigate.png"
  ```
- Capture real UI with real data — not placeholder content. Images should clearly show the forms, buttons, and state the guide step describes.
- Some page content (e.g. the New model form) lives inside an inner scroll container rather than the document body. If `browser` scroll on the window doesn't move the content, scroll on the `devin-scrollable` element instead (pass its `devinid` to the scroll action).
- After saving a model, wait ~5 seconds for the "Model created successfully" toast to fade before capturing the list view.

## Finishing

1. Verify image sizes and that each referenced PNG exists:
   ```bash
   identify apps/modeling-app/docs/user-guides/<guide>/images/*.png
   pnpm build  # optional sanity check; fails loudly if a referenced PNG is missing
   ```
2. Commit only the PNG changes:
   ```bash
   git add apps/modeling-app/docs/user-guides/<guide>/images/*.png
   git commit -m "docs: refresh screenshots for <guide>"
   ```

## Keeping `.agents/` and `.claude/` in sync

This skill is mirrored at both `.agents/skills/updating-guide-screenshots/SKILL.md` and `.claude/skills/updating-guide-screenshots/SKILL.md`. When editing, update both copies so Devin and Claude Code see the same instructions.

## Adding a new guide

When adding a brand-new guide, also:
- Import it in `apps/modeling-app/docs/guides.ts` and register it via `createGuide(...)`.
- Set the `order` in the frontmatter appropriately — new guides go **last** unless the user specifies otherwise.
- Frontmatter fields: `title`, `description`, `order`, `category` (usually `User Guides`).
