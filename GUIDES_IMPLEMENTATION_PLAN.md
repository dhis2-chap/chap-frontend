# Plan: Add Guides Page with MDX Support

## Overview
Add a new `/guides` route with:
- Dedicated sidebar navigation for browsing guides
- MDX support for content with interactive widgets
- Dummy content as first iteration (real content added later)

## Files to Modify
- `/apps/modeling-app/package.json` - Add MDX dependencies
- `/apps/modeling-app/vite.config.mts` - Configure MDX plugin
- `/apps/modeling-app/src/App.tsx` - Add /guides route
- `/apps/modeling-app/src/components/sidebar/Sidebar.tsx` - Add Guides nav link

## Files to Create
```
apps/modeling-app/src/
├── mdx.d.ts                              # TypeScript declarations for MDX
├── content/
│   └── guides/
│       ├── index.ts                      # Guide registry with metadata
│       └── getting-started.mdx           # Dummy guide
├── components/
│   └── guides/
│       ├── GuidesLayout.tsx              # Layout wrapper with sidebar
│       ├── GuidesLayout.module.css
│       ├── GuidesSidebar.tsx             # Dedicated guides navigation
│       ├── GuidesSidebar.module.css
│       ├── GuideContent.tsx              # MDX content renderer
│       ├── GuideContent.module.css
│       ├── MDXProvider.tsx               # Custom component mappings
│       ├── MDXProvider.module.css
│       └── widgets/
│           ├── index.ts
│           ├── Stepper/                  # Step-by-step walkthrough widget
│           │   ├── Stepper.tsx
│           │   └── Stepper.module.css
│           ├── DataVisualization/        # Chart widget (uses Highcharts)
│           │   ├── DataVisualization.tsx
│           │   └── DataVisualization.module.css
│           └── Callout/                  # Info/warning boxes
│               ├── Callout.tsx
│               └── Callout.module.css
└── pages/
    └── GuidesPage/
        ├── index.ts
        ├── GuidesPage.tsx
        └── GuidesPage.module.css
```

## Implementation Steps

### Step 1: Install MDX dependencies
```bash
pnpm add -F modeling-app @mdx-js/react
pnpm add -F modeling-app -D @mdx-js/rollup @types/mdx
```

### Step 2: Configure Vite for MDX
Update `/apps/modeling-app/vite.config.mts`:
```typescript
import path from 'path';
import { defineConfig } from 'vite';

const viteConfig = defineConfig(async () => {
    const mdx = await import('@mdx-js/rollup');

    return {
        plugins: [
            mdx.default({
                providerImportSource: '@mdx-js/react',
            }),
        ],
        server: {
            fs: {
                allow: [path.resolve(__dirname, '../..')],
            },
        },
        resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
        clearScreen: true,
    };
});

export default viteConfig;
```

### Step 3: Add TypeScript declarations
Create `/apps/modeling-app/src/mdx.d.ts`:
```typescript
declare module '*.mdx' {
    import type { MDXProps } from 'mdx/types';
    export default function MDXContent(props: MDXProps): JSX.Element;
}
```

### Step 4: Create guide registry
Create `/apps/modeling-app/src/content/guides/index.ts` with:
- `Guide` interface (slug, title, description, order, category, Component)
- `guides` array
- Helper functions: `getGuideBySlug()`, `getGuidesByCategory()`

### Step 5: Create dummy MDX guide
Create `/apps/modeling-app/src/content/guides/getting-started.mdx` with placeholder content demonstrating widgets.

### Step 6: Create interactive widget components
- `Callout` - Info/warning/tip boxes using DHIS2 UI icons
- `Stepper` + `Step` - Multi-step walkthrough with navigation
- `DataVisualization` - Simple chart wrapper using existing Highcharts

### Step 7: Create MDXProvider
Create provider that maps custom components to MDX and styles base elements (h1, h2, p, code, etc.)

### Step 8: Create GuidesLayout and GuidesSidebar
- `GuidesLayout` - Wrapper with sidebar slot and main content area
- `GuidesSidebar` - Renders guide links grouped by category, following existing Sidenav patterns

### Step 9: Create GuidesPage
- Uses `useParams` to get `guideSlug`
- Redirects to first guide if no slug
- Renders `GuidesLayout` with `GuideContent`

### Step 10: Add route to App.tsx
Add `/guides` route **outside** ChapValidator (guides don't require server):
```typescript
{
    path: '/guides',
    element: <GuidesPage />,
    handle: {
        collapseSidebar: true,
    } satisfies RouteHandle,
    children: [
        { index: true },
        { path: ':guideSlug' },
    ],
},
```

### Step 11: Add navigation link
In `Sidebar.tsx`, add after Settings (at the bottom of the navigation):
```typescript
<SidebarNavLink to="/guides" label={i18n.t('Guides')} />
```

## Key Decisions

1. **Route placement**: `/guides` sits outside `ChapValidator` so guides are accessible without CHAP server configuration

2. **Sidebar behavior**: Uses `collapseSidebar: true` to hide main sidebar, letting guides page render its own dedicated sidebar

3. **MDX plugin position**: Dynamic import required because `@mdx-js/rollup` is ESM-only

4. **Content storage**: Bundled MDX files imported at build time - simple and version-controlled

## Potential Issues

1. **d2-app-scripts compatibility**: May need to verify the MDX plugin merges correctly with d2-app-scripts. If not, we may need to adjust the configuration approach.

2. **Highcharts import**: DataVisualization widget assumes Highcharts is available - verify it's in dependencies or simplify the first iteration to use basic HTML visualizations.
