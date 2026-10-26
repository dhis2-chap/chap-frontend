---
'@dhis2-chap/modeling-app': patch
---

Extract the endemic-threshold period selection (canonical dedup of series periods and location mapping) out of `useEndemicThresholds` into pure helpers on `@dhis2-chap/ui`, and add unit tests covering the dedup, ordering, empty-series handling, and query gating.
