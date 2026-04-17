---
name: updating-guide-screenshots
description: (Re)capture screenshots for user guides under apps/modeling-app/docs/user-guides/. Use when adding a new guide, refreshing outdated images, or when a guide build fails because a referenced PNG is missing.
---

# Updating Guide Screenshots

How to (re)capture screenshots for any user guide under `apps/modeling-app/docs/user-guides/<guide-name>/images/`.

## Prerequisites

- DHIS2 running at `http://localhost:8080` and the CHAP app dev server running at `http://localhost:3000` (`pnpm start`).
- A CHAP instance with the relevant data for the guide (e.g. at least one configured model, a dataset, etc. — depends on the guide).
- Local dev DHIS2 credentials (ask the user if you don't already have them — do NOT commit them).

## Setup

1. Resize the browser window to match the resolution of the existing images in the target guide. Check with:
   ```bash
   identify apps/modeling-app/docs/user-guides/<guide>/images/*.png
   ```
   Keep the new captures consistent with the existing ones (e.g. 1728x1117 for most guides).
2. Temporarily comment out `<ReactQueryDevtools />` in `apps/modeling-app/src/App.tsx` so the devtools icon doesn't appear in captures. Revert before committing.
3. Close any browser error overlays (Vite HMR, console warnings, etc.) before capturing.

## Capturing

- Use the scripted browser (Devin's `browser` tool or Playwright over CDP at `http://localhost:29229`) to drive the app.
- Save each screenshot directly to the guide's `images/` folder using the filename referenced by the guide's markdown. The markdown imports the PNGs at build time, so every referenced file must exist or the build fails with a Rollup error like:
  ```
  Could not resolve "./images/configure-step-1-navigate.png"
  ```
- Capture real UI with real data — not placeholder content. Images should clearly show the forms, buttons, and state the guide step describes.

## Finishing

1. Uncomment `<ReactQueryDevtools />` in `App.tsx`.
2. Verify image sizes and that each referenced PNG exists:
   ```bash
   identify apps/modeling-app/docs/user-guides/<guide>/images/*.png
   pnpm build  # optional sanity check
   ```
3. Commit only the PNG changes (and any revert of `App.tsx`):
   ```bash
   git add apps/modeling-app/docs/user-guides/<guide>/images/*.png
   git commit -m "docs: refresh screenshots for <guide>"
   ```

## Adding a new guide

When adding a brand-new guide, also:
- Import it in `apps/modeling-app/docs/guides.ts` and register it via `createGuide(...)`.
- Set the `order` in the frontmatter appropriately — new guides go **last** unless the user specifies otherwise.
- Frontmatter fields: `title`, `description`, `order`, `category` (usually `User Guides`).
