# Early Warning App

A DHIS2 application for reviewing CHAP alerts, sharing the Modeling App's CHAP route and UI components.

Run `pnpm install` at the repository root, then `pnpm start:early-warning-app`.
Build with `pnpm exec turbo build --filter=@dhis2-chap/early-warning-app...`.

The app requires DHIS2 2.40+ and an accessible `chap` route configured in the Modeling App settings. It uses the signed-in DHIS2 session; no separate backend URL or token is stored here. The DHIS2 app platform extracts translations during build. Do not edit generated translations manually.

Implementation follows [CLIM-1402](https://dhis2.atlassian.net/browse/CLIM-1402). Automatic alert creation requires the CHAP backend work in [CLIM-1335](https://dhis2.atlassian.net/browse/CLIM-1335).

The review queue lists predictions with pending alerts, newest first, with the model and counts by alert level. Open a prediction to inspect its alerts. Predictions without alerts are not included.

Prediction details reuse the Modeling App forecast chart. Select an organisation unit and alert-policy threshold to inspect the forecast; the alert statistics show the 80% range, threshold and estimated exceedance probability alongside the policy trigger. Thresholds use the current policy and available observations, rather than a stored snapshot from the original run.

## Forecast import

Import uses the prediction setup's data-element mapping configured in the Modeling App. Reviewers select which organisation units to import; only accepted alerts produce outbreak indicators. Import is unavailable without a forecast mapping. App-specific mapping overrides are deferred.

The import helpers share the Modeling App's forecast mapping and import-response validation, including conversion of CHAP month/week periods into DHIS2 period IDs. The review preview shows decision changes and selected forecast imports before submission.

## Review submission

Reviewers can accept or decline individual alerts or all pending alerts, leaving untouched alerts unchanged. Submission validates any DHIS2 import first, records CHAP decisions, then imports forecasts. Failed preflight validation can be cancelled and corrected. Once a write is attempted, keep the preview open and retry to resume incomplete tasks; completed tasks are not repeated. These checkpoints exist only while the preview stays open. Refreshing loses that retry context.

The current DHIS2 user's name is recorded as the reviewer. It is attribution, not authorization: the CHAP approval endpoint accepts a caller-supplied reviewer, so access must be enforced on the server or route. This app does not claim that a UI authority check secures the API. Notifications and reviewer-role settings are deferred.

## History and withdrawal

Review history lists each prediction's current accepted, declined and pending counts, reviewer names, and latest review time. CHAP exposes the current decision per alert, so this is not an append-only audit trail.

The app stores successfully imported indicator targets in its shared DHIS2 datastore namespace. Withdrawing an accepted alert validates and clears its original DHIS2 indicator values, even after the setup mapping changes. Saving the import record is a separate retryable step; a failed save stops submission and must be retried before closing the preview. Imports made elsewhere or before this tracking existed cannot be inferred from the API. Concurrent reviewers should coordinate because CHAP decisions, imports and datastore updates do not form one transaction.

Register the app in DHIS2 and grant its users app access plus `F_CHAP_EARLY_WARNING_APP` to read and write the `chap-early-warning` datastore namespace. This authority controls the app's import records only; it does not authorize or protect CHAP approval endpoints. There is no separate reviewer-role gate in this initial workflow.

Initial PR order: foundation → review queue → forecasts/thresholds → forecast import → review submission → history/withdrawal. App overrides, reviewer settings, interventions, maps and notifications are deferred.
