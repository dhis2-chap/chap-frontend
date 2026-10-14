---
"@dhis2-chap/ui": patch
"@dhis2-chap/modeling-app": patch
"@dhis2-chap/early-warning-app": patch
---

Recognise encrypted route authentication and require token re-entry before edits that would discard it. Store new tokens encrypted on supported DHIS2 versions and warn for publicly readable routes [CLIM-1417].

Use DHIS2 `api-token` authentication for new and replacement CHAP tokens on DHIS2 2.40.7+, 2.41.4+, and 2.42+. Requires Chap Core with ApiToken support (dhis2-chap/chap-core#728). Regenerate the backend client from Chap Core 2.5.0.dev0.

**Existing installations:** API tokens previously entered through the Modeling App may be stored in plain text in the route's Authorization header, readable by users with access to the route configuration. Upgrading the app does not migrate these tokens automatically. A warning now identifies affected routes. On supported DHIS2 versions, edit the route and re-enter the token to replace the plain-text header with encrypted authentication. If the token may have been exposed, rotate it on the CHAP server and save the new token in the route. Older DHIS2 versions retain the plain-text fallback and show a warning; upgrade DHIS2 before migrating.
