---
'@dhis2-chap/modeling-app': minor
---

Require CHAP Core 2.3.0 or newer. The redesigned thresholds API in CHAP Core 2.3.0 is not backwards compatible, so prediction runs do not work against older backends. The app now reports an incompatible version instead of failing at runtime [CLIM-1092].
