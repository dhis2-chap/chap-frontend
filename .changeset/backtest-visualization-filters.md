---
'@dhis2-chap/modeling-app': minor
'@dhis2-chap/ui': minor
---

Add organisation unit, split period, and horizon filters to the custom evaluation plots widget, deriving the available filters from each visualization's facet coordinates and fetching filtered plots on demand. Supports grid layout plots and removes the metric plots experimental setting. Regenerates the API client with the new `maxHorizonDistance` backtest field.
