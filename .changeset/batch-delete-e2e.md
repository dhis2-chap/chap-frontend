---
'@dhis2-chap/modeling-app': patch
---

Add Playwright coverage for the evaluations table batch delete: verifies the
DELETE request carries the comma-joined ids and removes the rows, and that a
failed delete shows the error alert while preserving the row selection.
