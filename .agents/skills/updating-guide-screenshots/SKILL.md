---
name: updating-guide-screenshots
description: (Re)capture screenshots for user guides under apps/modeling-app/docs/user-guides/. Use when adding a new guide, refreshing outdated images, or when a guide build fails because a referenced PNG is missing.
---

# Updating Guide Screenshots

How to (re)capture screenshots for any user guide under `apps/modeling-app/docs/user-guides/<guide-name>/images/`.

## Prerequisites

- A running local stack with:
    - DHIS2 at `http://localhost:8080`
    - CHAP backend at `http://localhost:8000`
    - CHAP Modeling app dev server at `http://localhost:3000` (start with `pnpm start` from the repo root).
- A CHAP instance with the relevant data for the guide (e.g. at least one configured model, a dataset, etc. — depends on the guide). The default docker stack seeded by the chap-frontend repo usually already has the relevant data.
- Local dev DHIS2 credentials. Throwaway instance is fine to use directly; these work against the default docker stack:
    - Server: `http://localhost:8080`
    - Username: `birk`
    - Password: `Solololo1!`

  If these don't work (e.g. credentials rotated), ask the user for fresh ones.

## Setup

1. Confirm the viewport matches the existing images in the target guide. Check with:
   ```bash
   identify apps/modeling-app/docs/user-guides/<guide>/images/*.png
   ```
   Common resolutions used so far: `1600x1122` (e.g. `configuring-a-model`). Devin's `browser` tool renders at the resolution set by the `--ozone-override-screen-size` flag on the Chrome session; do not rely on CSS/window resize to match a different target size.
2. Temporarily comment out `<ReactQueryDevtools />` in `apps/modeling-app/src/App.tsx` so the devtools flower icon doesn't appear in captures. Revert before committing.
3. Log in to the modeling app (DHIS2 app-shell sign-in proxy) using the credentials above. The first navigation to `http://localhost:3000` will redirect to the sign-in form that asks for Server / Username / Password.
4. Close any transient UI that isn't part of the documented flow:
    - The yellow "alpha version" banner at the top of the page (close button on the right).
    - Any Vite HMR / console overlays.

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

1. Uncomment `<ReactQueryDevtools />` in `App.tsx`.
2. Verify image sizes and that each referenced PNG exists:
   ```bash
   identify apps/modeling-app/docs/user-guides/<guide>/images/*.png
   pnpm build  # optional sanity check; fails loudly if a referenced PNG is missing
   ```
3. Commit only the PNG changes (and any revert of `App.tsx`):
   ```bash
   git add apps/modeling-app/docs/user-guides/<guide>/images/*.png apps/modeling-app/src/App.tsx
   git commit -m "docs: refresh screenshots for <guide>"
   ```

## Keeping `.agents/` and `.claude/` in sync

This skill is mirrored at both `.agents/skills/updating-guide-screenshots/SKILL.md` and `.claude/skills/updating-guide-screenshots/SKILL.md`. When editing, update both copies so Devin and Claude Code see the same instructions.

## Adding a new guide

When adding a brand-new guide, also:
- Import it in `apps/modeling-app/docs/guides.ts` and register it via `createGuide(...)`.
- Set the `order` in the frontmatter appropriately — new guides go **last** unless the user specifies otherwise.
- Frontmatter fields: `title`, `description`, `order`, `category` (usually `User Guides`).
