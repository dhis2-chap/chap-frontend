# @dhis2-chap/early-warning-app

## 0.2.0

### Minor Changes

-   cabdadf: Add the Early Warning App with its own CHAP route settings, and share the Modeling side navigation and route settings [CLIM-1403].
-   03afebf: List predictions awaiting review with pending alert counts per level, and preview a prediction's pending alerts.

### Patch Changes

-   5ac76da: Recognise encrypted route authentication and require token re-entry before edits that would discard it. Store new tokens encrypted on supported DHIS2 versions and warn for publicly readable routes [CLIM-1417].

    Store new and replacement CHAP tokens encrypted on DHIS2 2.40.7+, 2.41.4+, and 2.42+: as DHIS2 `api-token` authentication for Chap Core 2.5.0+ (dhis2-chap/chap-core#728), and as encrypted `api-headers` Bearer authentication for older or unreachable Chap Core servers. Regenerate the backend client from Chap Core 2.5.0.dev0.

    **Existing installations:** API tokens previously entered through the Modeling App may be stored in plain text in the route's Authorization header, readable by users with access to the route configuration. Upgrading the app does not migrate these tokens automatically. A warning now identifies affected routes. On supported DHIS2 versions, edit the route and re-enter the token to replace the plain-text header with encrypted authentication. If the token may have been exposed, rotate it on the CHAP server and save the new token in the route. The apps no longer set tokens on older DHIS2 versions, which can only store them in plain text; upgrade DHIS2 before migrating. Existing tokens can still be removed there.

-   Updated dependencies [ab4b8f1]
-   Updated dependencies [cabdadf]
-   Updated dependencies [5ac76da]
    -   @dhis2-chap/ui@7.3.0
    -   @dhis2-chap/core@7.3.0
