---
'@dhis2-chap/modeling-app': minor
'@dhis2-chap/ui': minor
---

Redesign threshold strategy selection for prediction runs against the typed thresholds API. Strategies are fetched from the backend and each strategy exposes its parameters (standard deviations, percentile band, baseline years) in the run details panel and the alert output dialog. The percentile strategy renders a WHO endemic channel band computed in a single request. Threshold calculation shows loading and error states with a retry action, and importing alert outputs is blocked while a calculation is in progress or failed.
