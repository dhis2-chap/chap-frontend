# CHAP Frontend

A monorepo for the **CHAP Modeling platform**, enabling predictive modeling and forecasting for health information systems. The primary application integrates with DHIS2 for disease forecasting and health analytics.

## Project Structure

```
chap-frontend/
├── apps/
│   └── modeling-app/          # DHIS2-integrated application
├── packages/
│   └── ui/                    # Component library + API client
└── .github/workflows/         # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm 10.x or higher

### Installation and Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development server
pnpm start
```

### Code Quality

```bash
pnpm linter:check    # Run linting
pnpm tsc:check       # Type checking
pnpm format          # Format code
```

## API Client Generation

The UI package includes an auto-generated TypeScript API client from OpenAPI specifications:

```bash
cd packages/ui
pnpm generate              # Generate from a running backend at http://localhost:8000
```

## Development instance deployment

The `deploy-modeling-app` GitHub Actions workflow builds and deploys the latest
`main` to [climate-demo-dev](https://climate.im.dhis2.org/climate-demo-dev/apps/dashboard)
on each push to `main`. It can also be run manually from the Actions tab on `main`.
Deployments run one at a time, and retries check out the latest `main`.

Before enabling deployment, add these repository Actions secrets for a DHIS2
account with permission to install and update apps on that instance:

- `CLIMATE_DEMO_DEV_USERNAME`
- `CLIMATE_DEMO_DEV_PASSWORD`

The workflow reuses the Modeling App's [DHIS2 deploy command](https://developers.dhis2.org/docs/app-platform/scripts/deploy/)
to upload its build ZIP and verify that the installed app responds. The destination
is the DHIS2 instance root (`/climate-demo-dev`); `/apps/dashboard` is its dashboard,
not the upload endpoint. Missing credentials or a failed upload fail the workflow.
This workflow deploys only the Modeling App; Chap Core is managed separately.

## Commit Standards

This project follows Conventional Commits:

- `fix:` → Patch release
- `feat:` → Minor release
- `BREAKING CHANGE:` → Major release

## Changeset Workflow

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

### Adding a Changeset

When making changes that should be part of the changelog or released, create a changeset:

```bash
pnpm changeset
```

This will prompt you to:
1. Select the packages affected by your change
2. Choose the version bump type (patch, minor, or major)
3. Write a summary of the changes

### Version Bumps

- `patch` → Bug fixes (1.0.0 → 1.0.1)
- `minor` → New features (1.0.0 → 1.1.0)
- `major` → Breaking changes (1.0.0 → 2.0.0)

### Changeset Message Format

Include the ticket number at the end of your changeset description when applicable:

```
Fixed the broken navigation link [CLIM-XXX]
```

## License

BSD-3-Clause License for modeling-app, MIT License for shared packages.

## Links

- [Changelog](./CHANGELOG.md)
- [GitHub Issues](https://github.com/dhis2-chap/chap-frontend/issues)
- [DHIS2 Community](https://community.dhis2.org/)
