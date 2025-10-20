# CHAP Frontend

A monorepo containing web applications for the **Contextualized Health Analytics Platform (CHAP)**, a system designed for predictive modeling and forecasting in health information systems.

## Overview

CHAP Frontend enables public health analysts and data scientists to create, evaluate, and deploy machine learning models for disease forecasting and health analytics. The primary application integrates deeply with DHIS2 (District Health Information Software 2), the world's largest health management information system used by 73+ countries.

### Key Features

- **Dataset Management**: Create and manage datasets from DHIS2 health data for model training
- **Model Evaluation**: Configure and evaluate predictive models using historical backtesting
- **Predictions**: Generate forecasts for future time periods using trained models
- **Visualizations**: Interactive charts and metrics powered by Highcharts and Vega
- **Job Monitoring**: Track background jobs for long-running data processing tasks
- **DHIS2 Integration**: Import predictions back into DHIS2 for operational use

## Technology Stack

- **Frontend Framework**: React 18.3.1 with TypeScript 5.7.2
- **Build System**: Turborepo for monorepo orchestration, DHIS2 CLI tools for app bundling
- **Data Fetching**: @tanstack/react-query for server state management
- **Form Management**: react-hook-form with Zod schema validation
- **Visualization**: Highcharts (interactive charts) and Vega/Vega-Lite (declarative specifications)
- **API Client**: Auto-generated TypeScript client from OpenAPI specifications
- **DHIS2 Integration**: @dhis2/app-runtime for platform API access, @dhis2/ui component library

## Project Structure

```
chap-frontend/
├── apps/
│   └── modeling-app/          # Primary DHIS2-integrated application
├── packages/
│   └── ui/                    # @dhis2-chap/ui - Component library + API client
├── .github/workflows/         # CI/CD pipeline definitions
├── package.json               # Root workspace configuration
├── yarn.lock                  # Dependency lockfile
└── CHANGELOG.md              # Auto-generated release history
```

### Applications

#### Modeling App

The primary DHIS2-integrated application for creating evaluations, predictions, and managing datasets.

**Key Routes** (hash-based routing):
- `/` → redirects to `/evaluate`
- `/evaluate` → Evaluation listing and comparison
- `/evaluate/new` → Create new evaluation
- `/evaluate/:evaluationId` → Evaluation details and visualizations
- `/predict` → Prediction creation and management
- `/jobs` → Background job monitoring
- `/settings` → DHIS2 Route configuration and model templates
- `/get-started` → Onboarding guide

### Packages

#### @dhis2-chap/ui

Shared UI component library and auto-generated API client for CHAP Core backend.

**Key Features**:
- Reusable React components built on @dhis2/ui
- TypeScript API client generated from OpenAPI specifications
- Request queue management using p-queue for concurrency control

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- Yarn 1.22.19 (specified in package.json)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dhis2-chap/chap-frontend.git
cd chap-frontend
```

2. Install dependencies:
```bash
yarn install
```

3. Build all packages:
```bash
yarn build
```

### Development

#### Run All Applications

From the root directory:

```bash
yarn start
```

This will start all applications in parallel using Turborepo.

#### Run Specific Application

To run the modeling app:

```bash
cd apps/modeling-app
yarn start
```

The modeling-app will be available at http://localhost:3000/

#### Develop UI Package

The UI package needs to be built before other applications can use it:

```bash
cd packages/ui
yarn build        # Build once
yarn start        # Build and watch for changes
```

### Code Quality

#### Linting

```bash
yarn linter:check
```

#### Type Checking

```bash
yarn tsc:check
```

#### Code Formatting

```bash
yarn format
```

## API Client Generation

The UI package includes an auto-generated TypeScript API client from OpenAPI specifications.

### Generate from Local Spec

```bash
cd packages/ui
yarn generate
```

This generates the client from `packages/ui/public/openapi.json`.

### Generate from Running Backend

```bash
cd packages/ui
yarn generate-localhost
```

This generates the client from `http://localhost:8000/v1/openapi.json`.

## Building for Production

Build all packages and applications:

```bash
yarn build
```

Copy the modeling-app build to the root directory for deployment:

```bash
yarn cp-build
```

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:

- **Install**: Install dependencies with frozen lockfile
- **Lint**: Run ESLint across all workspaces
- **Build**: Build all packages with Turborepo caching
- **TypeScript**: Type checking with turbo cache
- **Release**: Semantic release to DHIS2 AppHub and GitHub (main branch only)

## Commit Standards

This project follows Conventional Commits specification:

- `fix:` → Patch release (e.g., 1.0.1)
- `feat:` → Minor release (e.g., 1.1.0)
- `BREAKING CHANGE:` → Major release (e.g., 2.0.0)

Examples:
```bash
git commit -m "fix: resolve evaluation loading issue"
git commit -m "feat: add new visualization type"
git commit -m "feat!: update API client for v2.0"
```

## DHIS2 Integration

The modeling app integrates with DHIS2 through:

1. **@dhis2/app-runtime**: Authenticated API access for analytics queries, organizational unit data, and metadata
2. **DHIS2 Route**: Configurable proxy connecting the app to CHAP Core server
3. **@dhis2/ui**: DHIS2 design system components

### Configuration

Configure the CHAP Core connection in the Settings page:
- Navigate to `/settings`
- Configure the DHIS2 Route that proxies requests to CHAP Core
- Test the connection to ensure proper setup

## Architecture

### Data Flow

```
User Input → Form Validation (react-hook-form + zod)
→ Data Preparation (DHIS2 Analytics)
→ Job Submission (CHAP Core API)
→ Background Processing
→ Visualization Retrieval (Vega specs from backend)
→ Chart Rendering
```

### API Integration

The application uses a dual-integration pattern:

1. **DHIS2 Integration** (via @dhis2/app-runtime):
   - Analytics queries for historical data
   - Organizational unit hierarchy and geometry
   - Data item metadata

2. **CHAP Core Integration** (via generated API client):
   - Backtest (evaluation) CRUD operations
   - Prediction CRUD operations
   - Dataset CRUD operations
   - Model template and configured model listing
   - Visualization generation

## Version Compatibility

- **DHIS2**: Minimum version 2.40
- **CHAP Core**: Version 1.0.9 or higher (for v2.0.0+)
- **React**: 18.3.1
- **TypeScript**: 5.7.2

## License

This project is licensed under the BSD-3-Clause License for the modeling-app and MIT License for shared packages. See the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes following Conventional Commits (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or contributions, please visit:
- GitHub Issues: https://github.com/dhis2-chap/chap-frontend/issues
- DHIS2 Community: https://community.dhis2.org/

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of changes.

## Current Version

**v2.2.4** - Released August 29, 2025

Latest changes:
- Add data mapping to form state
- Add turborepo for monorepo orchestration
- Add viteConfigExtensions to d2.config.js files
