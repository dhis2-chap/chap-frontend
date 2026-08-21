---
'@dhis2-chap/ui': patch
---

Fix uncertainty area chart x-axis ordering for weekly data: padded (2025W03) and unpadded (2025W3) week ids are now canonicalized and merged into a single chronologically sorted axis, and gaps in actual data no longer connect across missing weeks.
