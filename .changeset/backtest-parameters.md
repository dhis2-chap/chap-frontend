---
"@dhis2-chap/modeling-app": minor
---

Expose all backtest parameters when evaluating saved datasets or importing from DHIS2, with CHAP Core defaults, labels and descriptions, count validation, a weather-provider picker, and backend validation messages. Show the stored configuration in evaluation details (CLIM-1131). Requires CHAP Core 2.4.0; older versions keep using their own defaults. Weekly evaluations now use the same CHAP Core defaults as monthly ones instead of 12 forecast periods and a step of 4.
