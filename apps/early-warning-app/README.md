# Early Warning App

A DHIS2 application for reviewing CHAP alerts, sharing the Modeling App's CHAP route and UI components.

Run `pnpm install` at the repository root, then `pnpm start:early-warning-app`.
Build with `pnpm exec turbo build --filter=@dhis2-chap/early-warning-app...`.

The app requires DHIS2 2.40+ and an accessible `chap` route configured in the Modeling App settings. It uses the signed-in DHIS2 session; no separate backend URL or token is stored here. The DHIS2 app platform extracts translations during build. Do not edit generated translations manually.

Implementation follows [CLIM-1402](https://dhis2.atlassian.net/browse/CLIM-1402). Automatic alert creation requires the CHAP backend work in [CLIM-1335](https://dhis2.atlassian.net/browse/CLIM-1335).

The review queue lists predictions with pending alerts, newest first, with the model and counts by alert level. Open a prediction to inspect its alerts. Predictions without alerts are not included.

Prediction details reuse the Modeling App forecast chart. Select an organisation unit and alert-policy threshold to inspect the forecast; the alert statistics show the 80% range, threshold and estimated exceedance probability alongside the policy trigger. Thresholds use the current policy and available observations, rather than a stored snapshot from the original run.
