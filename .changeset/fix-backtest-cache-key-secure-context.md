---
"@dhis2-chap/modeling-app": patch
---

Fix "Cannot read properties of undefined (reading 'digest')" when starting a dry run or import from a non-HTTPS, non-localhost origin, by replacing the SHA-256 cache key with a plain concatenated string key that doesn't depend on crypto.subtle.
