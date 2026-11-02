# Early Warning App

A DHIS2 application for reviewing Chap alerts, sharing the Modeling App's Chap route and UI components.

Run `pnpm install` at the repository root, then `pnpm start:early-warning-app`.
Build with `pnpm exec turbo build --filter=@dhis2-chap/early-warning-app...`.

The app requires DHIS2 2.40+ and an accessible `chap` route. Configure it under Settings, or in the Modeling App when both run on the same instance; both apps share the same route. Users need the `F_CHAP_MODELING_APP` authority to call it. The DHIS2 app platform extracts translations during build. Do not edit generated translations manually.

Implementation follows [CLIM-1402](https://dhis2.atlassian.net/browse/CLIM-1402). Automatic alert creation requires the Chap backend work in [CLIM-1335](https://dhis2.atlassian.net/browse/CLIM-1335).

The review queue lists predictions with pending alerts, newest first, with the model and pending counts per alert level from least to most severe. Open a prediction to preview its pending alerts. Settings manages the shared Chap route and shows the Chap connection status.
