---
"@dhis2-chap/modeling-app": patch
"@dhis2-chap/ui": patch
---

Show the threshold lines of the alert policy a prediction ran with, hidden while exploring thresholds, and import that policy's alert codes. With Chap Core 2.6.0 or later, this uses the policy recorded for each run instead of the setup's current policy. Block imports when the outbreak indicator's value type cannot store the imported values.
