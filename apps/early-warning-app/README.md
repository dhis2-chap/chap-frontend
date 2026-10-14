# Early Warning App

A DHIS2 application for reviewing CHAP alerts, sharing the Modeling App's CHAP route and UI components.

Run `pnpm install` at the repository root, then `pnpm start:early-warning-app`.
Build with `pnpm exec turbo build --filter=@dhis2-chap/early-warning-app...`.

The app requires DHIS2 2.40+ and an accessible `chap` route. Configure it under Settings, or in the Modeling App when both run on the same instance; both apps share the same route. Users need the `F_CHAP_MODELING_APP` authority to call it. The DHIS2 app platform extracts translations during build. Do not edit generated translations manually.

Implementation follows [CLIM-1402](https://dhis2.atlassian.net/browse/CLIM-1402). Automatic alert creation requires the CHAP backend work in [CLIM-1335](https://dhis2.atlassian.net/browse/CLIM-1335).

The review queue lists predictions with pending alerts, newest first, with the model and pending counts per alert level from least to most severe. Open a prediction to preview its pending alerts. Settings manages the shared CHAP route and shows the CHAP connection status.

Prediction details reuse the Modeling App's organisation unit menu and forecast chart. Organisation units are listed with their pending-alert counts, most severe first, ranking levels by strictness like the backend; selecting one shows its forecast with an alert line for every level of the alert policy (levels with matching threshold parameters share one threshold line), with alert periods highlighted and a table of each alert's 80% forecast range, threshold, estimated chance of exceeding it and the policy trigger. Thresholds use current policies and observations, not a historical snapshot.
