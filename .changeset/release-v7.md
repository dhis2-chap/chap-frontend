---
'@dhis2-chap/modeling-app': major
---

Release v7 of the modeling app.

BREAKING CHANGES:

-   The modeling app now requires CHAP Core 2.3.0 or newer. The thresholds
    API was redesigned in CHAP Core 2.3.0 and is not backwards compatible,
    so prediction runs do not work against older backends. The app reports
    an incompatible version instead of failing at runtime [CLIM-1092].
-   Evaluation plots now require the facet coordinate endpoints introduced
    in CHAP Core 2.3.0 and no longer fall back to whole-plot rendering on
    older backends [CLIM-1039].
