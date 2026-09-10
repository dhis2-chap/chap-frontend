---
'@dhis2-chap/core': patch
---

Cache resolved fixed periods in the period engine so chart period sorting no longer regenerates a full year of localized periods per comparison, cutting endemic threshold toggle rendering from seconds to tens of milliseconds
