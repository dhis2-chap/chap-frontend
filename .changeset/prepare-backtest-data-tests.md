---
'@dhis2-chap/modeling-app': patch
---

Add unit tests for `prepareBacktestData`, covering the `Model not found` and `Data layer not found` error branches, period calculation for unsupported period types, and the analytics/org-unit cache hit and miss paths. Extracts `calculatePeriods`, `buildDataItems`, `buildDataSources`, and `convertDhis2AnalyticsToChap` into standalone exported functions to make them testable; behavior is unchanged.
