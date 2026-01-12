# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CHAP Frontend is a monorepo for the CHAP Modeling platform, enabling predictive modeling and forecasting for health information systems. The application integrates with DHIS2 for disease forecasting and health analytics.

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm start                    # Start dev server for all packages

# Build
pnpm build                    # Build all packages

# Code Quality
pnpm linter:check             # Run ESLint
pnpm linter:check -- --fix    # Run ESLint and fix errors
pnpm tsc:check                # TypeScript type checking
pnpm format                   # Format code with d2-style

# Testing
pnpm test                     # Run tests with Vitest

# API Client Generation (in packages/ui)
cd packages/ui
pnpm generate                 # Generate from local OpenAPI spec
pnpm generate-localhost       # Generate from running backend at localhost:8000
```

## Architecture

### Monorepo Structure

- **apps/modeling-app**: Main DHIS2 application (React + TypeScript)
- **packages/ui**: Shared component library and auto-generated API client

### Key Technologies

- **Package Manager**: pnpm with Turborepo for task orchestration
- **Build System**: DHIS2 cli-app-scripts (`d2-app-scripts`) with Vite
- **State Management**: TanStack Query (React Query v4)
- **Routing**: react-router-dom v7 with hash router
- **Forms**: react-hook-form with Zod validation
- **Charts**: Highcharts and Vega/Vega-Lite
- **UI Components**: @dhis2/ui component library

### Application Structure (apps/modeling-app/src)

- **App.tsx**: Main router configuration with route definitions
- **pages/**: Page components corresponding to routes
- **components/**: Reusable components
- **features/**: Feature-specific modules with business logic [WILL BE REMOVED, DO NOT ADD NEW FEATURES HERE, ADD NEW FEATURES TO COMPONENTS]
- **hooks/**: Custom React hooks for data fetching and state
- **content/**: MDX content files (guides)

### UI Package (packages/ui/src)

- **httpfunctions/**: Auto-generated API client from OpenAPI spec (do not edit manually)
- **components/**: Shared visualization components (charts, maps, plots)
- **ui/**: Basic UI primitives (Card, Pill, Tag, etc.)
- **utils/**: Shared utilities including time period handling

# i18n and translations

- All strings should be translated using the `i18n.t('string')` function.
- Translations will be automatically generated and managed, do not edit the translation files manually.
- Import as `import i18n from '@dhis2/d2-i18n';`

### Data Flow

The app uses TanStack Query for server state. API calls go through the generated client in `packages/ui/src/httpfunctions/`. The CHAP backend URL is configured via DHIS2 datastore and managed by `SetChapUrl` context.

## Code Style

- ESLint with @stylistic plugin (4-space indent, single quotes, semicolons)
- TypeScript strict mode
- Conventional Commits for PR titles (feat:, fix:, chore:, refactor:, docs:)
- PRs should always be created as drafts

## DHIS2 Integration

- App requires DHIS2 2.40+ and `F_CHAP_MODELING_APP` custom authority
- Uses `@dhis2/app-runtime` for DHIS2 API access
- Configuration stored in DHIS2 datastore

## Git 

- When creating a new branch, use the conventional commit prefixes: `feat/`, `fix/`, `docs/`, `refactor/`, etc.
- When committing, use the conventional commit format: `feat: add new feature`, `fix: fix bug`, `docs: update documentation`, `refactor: refactor code`, etc.