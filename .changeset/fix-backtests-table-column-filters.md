---
'@dhis2-chap/modeling-app': patch
---

Fix the evaluations table model filter being silently dropped when combined with text search, caused by columnFilters being assembled as a numeric-keyed object instead of an array.
