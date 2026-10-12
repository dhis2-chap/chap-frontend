# Early Warning App

A DHIS2 application for reviewing CHAP alerts, sharing the Modeling App's CHAP route and UI components.

Run `pnpm install` at the repository root, then `pnpm start:early-warning-app`.
Build with `pnpm exec turbo build --filter=@dhis2-chap/early-warning-app...`.

The app requires DHIS2 2.40+ and an accessible `chap` route configured in the Modeling App settings. It uses the signed-in DHIS2 session; no separate backend URL or token is stored here. The DHIS2 app platform extracts translations during build. Do not edit generated translations manually.

Implementation follows [CLIM-1402](https://dhis2.atlassian.net/browse/CLIM-1402). Automatic alert creation requires the CHAP backend work in [CLIM-1335](https://dhis2.atlassian.net/browse/CLIM-1335).
