---
"@dhis2-chap/modeling-app": minor
"@dhis2-chap/ui": patch
---

List persisted alerts for prediction setups and runs, create schema-driven single-line alert policies, and attach saved policies to prediction setups (CLIM-1136). Requires the CHAP Core alert-policy REST endpoints. The current backend does not expose threshold/probability snapshots or compute alerts automatically; chart previews and manual imports remain separate from recorded alerts.
