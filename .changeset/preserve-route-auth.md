---
"@dhis2-chap/ui": patch
"@dhis2-chap/modeling-app": patch
"@dhis2-chap/early-warning-app": patch
---

Recognise encrypted route authentication and require token re-entry before edits that would discard it. Store new tokens encrypted on supported DHIS2 versions and warn for publicly readable routes [CLIM-1417].
