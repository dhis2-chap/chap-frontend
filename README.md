# CHAP Frontend

A monorepo for the **Contextualized Health Analytics Platform (CHAP)**, enabling predictive modeling and forecasting for health information systems. The primary application integrates with DHIS2 for disease forecasting and health analytics.

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
- Yarn 1.22.19

### Installation and Development

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Start development server
yarn start
```

### Code Quality

```bash
yarn linter:check    # Run linting
yarn tsc:check       # Type checking
yarn format          # Format code
```

## API Client Generation

The UI package includes an auto-generated TypeScript API client from OpenAPI specifications:

```bash
cd packages/ui
yarn generate              # Generate from local spec
yarn generate-localhost    # Generate from running backend
```

## Commit Standards

This project follows Conventional Commits:

- `fix:` → Patch release
- `feat:` → Minor release
- `BREAKING CHANGE:` → Major release

## License

BSD-3-Clause License for modeling-app, MIT License for shared packages.

## Links

- [Changelog](./CHANGELOG.md)
- [GitHub Issues](https://github.com/dhis2-chap/chap-frontend/issues)
- [DHIS2 Community](https://community.dhis2.org/)
