# @dhis2-chap/ui

## 6.0.0

### Major Changes

-   c063516: rework the end-to-end prediction flow around prediction setups, with a per-setup dashboard, follow-up forecasting, persisted import mappings, and outbreak alerts

### Minor Changes

-   7f26cb9: Replace native monthly and weekly period inputs with DHIS2-aware period picker components backed by multi-calendar period generation.
-   4e396b2: Add a DHIS2 dashboard plugin for CHAP uncertainty charts and allow uncertainty area charts to receive an explicit chart height for dashboard layouts.

### Patch Changes

-   6f83436: Remove the mock endemic threshold fallback and route completed evaluation jobs to their result dashboard.
-   6f83436: Regenerate the CHAP API client with the latest backtest request fields.
-   Updated dependencies [7f26cb9]
    -   @dhis2-chap/core@6.0.0

## 5.1.0

## 5.0.0

### Major Changes

-   9d9e103: Release v5.0.0 to support CHAP v1.3.0

    BREAKING CHANGES:

    -   The modeling app now requires CHAP v1.3.0 or higher to work.
    -   Upgraded @dhis2/cli-app-scripts from 12.8.0-alpha.3 to 12.11.0 (latest stable).

## 4.0.1

### Patch Changes

-   c5bc1e3: fix: normalize and stabilize evaluation chart axes

## 4.0.0

## 3.3.0

### Patch Changes

-   56cfc6a: Added two extra eslint checks and refactored accordingly
-   015930a: refactor: convert CSS width/height to logical properties
-   23e228a: Update readme with correct package manager and changeset workflow [CLIM-366]

## 3.2.1

### Patch Changes

-   1de692b: added custom release scripts and changelog management
