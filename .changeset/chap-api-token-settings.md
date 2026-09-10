---
'@dhis2-chap/modeling-app': minor
---

Add CHAP API token configuration to route settings, including replacement and removal. Settings now reports whether the server accepted, rejected or is missing the token, rather than only whether one is stored, and a refused request explains the token problem and where to fix it instead of showing a bare "Unauthorized" [CLIM-1044].
