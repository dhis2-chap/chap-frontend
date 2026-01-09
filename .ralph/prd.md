# Data Maintenance Feature Implementation Plan

## Overview
Add a Data Maintenance feature under Settings that allows administrators with ALL authority to permanently delete all data values for selected data elements across all organisation units and time periods.

---

## Phase 1: Extract Generic NestedSidebar Component

### Create `/apps/modeling-app/src/components/NestedSidebar/`

**Files to create:**
- `NestedSidebarLayout.tsx` - Two-column layout wrapper (sidebar + content)
- `NestedSidebarLayout.module.css` - Copy dark theme styles from `GuidesLayout.module.css`
- `NestedSidebar.tsx` - Generic navigation component with categories and NavLinks
- `NestedSidebar.module.css` - Copy styles from `GuidesSidebar.module.css`
- `index.ts` - Barrel exports

**Key Props for NestedSidebarLayout:**
```tsx
interface NestedSidebarLayoutProps {
    children: ReactNode;
    sidebar: ReactNode;
    backLinkTo?: string;      // Default: '/'
    backLinkText?: string;    // Default: 'Back to app'
}
```

**Key Props for NestedSidebar:**
```tsx
interface SidebarItem { to: string; label: string; }
interface SidebarCategory { title?: string; items: SidebarItem[]; }
interface NestedSidebarProps { categories: SidebarCategory[]; }
```

---

## Phase 2: Restructure Settings Page

### 2.1 Create SettingsSidebar
**File:** `/apps/modeling-app/src/features/settings/SettingsSidebar/SettingsSidebar.tsx`

```tsx
const categories: SidebarCategory[] = [{
    items: [
        { to: '/settings', label: i18n.t('General') },
        { to: '/settings/data-maintenance', label: i18n.t('Data Maintenance') },
    ],
}];
```

### 2.2 Create GeneralSettings
**File:** `/apps/modeling-app/src/features/settings/GeneralSettings/GeneralSettings.tsx`

Move existing content from `Settings.tsx` (RouteSettings + ChapSettings) into this component.

### 2.3 Update Settings Layout
**File:** `/apps/modeling-app/src/features/settings/SettingsLayout.tsx` (new)

Wrap content with NestedSidebarLayout and render `<Outlet />` for child routes.

---

## Phase 3: Create Data Maintenance Card

**File:** `/apps/modeling-app/src/features/settings/DataMaintenance/DataMaintenanceCard/DataMaintenanceCard.tsx`

**Content:**
- Card title: "Data Maintenance"
- Section title: "Data Pruning"
- Description explaining that pruning permanently deletes ALL data values for selected data elements regardless of org unit and time period
- Button: "Go to Data Pruning" - navigates to `/settings/data-maintenance/pruning`
- Button disabled with tooltip if user lacks ALL authority

**Authority Check:**
```tsx
const { isSuperUser, isLoading } = useAuthority({ authority: 'ALL' });
const canPrune = isSuperUser === true;
```

---

## Phase 4: Create Data Pruning Page

### 4.1 DataElementSelector Component
**File:** `/apps/modeling-app/src/features/settings/DataMaintenance/DataPruning/DataElementSelector/DataElementSelector.tsx`

Adapt from existing `SearchSelectField.tsx` pattern:
- Query `/dataElements` endpoint (not dataItems)
- Filter out already-selected IDs via `excludeIds` prop
- Include remove (X) button when `showRemoveButton` is true
- Debounced search with 300ms delay

### 4.2 useDataPruning Hook
**File:** `/apps/modeling-app/src/features/settings/DataMaintenance/DataPruning/hooks/useDataPruning.ts`

```tsx
mutationFn: async (dataElements: DataElement[]) => {
    const results = await Promise.allSettled(
        dataElements.map(de =>
            dataEngine.mutate({
                resource: `maintenance/dataPruning/dataElements/${de.id}`,
                type: 'create',  // POST
            })
        )
    );
    // Map results to { dataElement, success, error? }[]
}
```

### 4.3 ConfirmPruningModal
**File:** `/apps/modeling-app/src/features/settings/DataMaintenance/DataPruning/ConfirmPruningModal/ConfirmPruningModal.tsx`

- Error NoticeBox with warning about irreversible action
- List of data elements to be pruned
- Input field requiring user to type "delete" (case-insensitive)
- Confirm button disabled until `confirmText.toLowerCase() === 'delete'`
- Destructive button style

### 4.4 PruningResultsModal
**File:** `/apps/modeling-app/src/features/settings/DataMaintenance/DataPruning/PruningResultsModal/PruningResultsModal.tsx`

- Shows success/failure count
- Lists each data element with checkmark (success) or X (failure)
- Shows error message for failed items
- Close button returns to Data Pruning page with form reset

### 4.5 DataPruningPage
**File:** `/apps/modeling-app/src/features/settings/DataMaintenance/DataPruning/DataPruningPage.tsx`

**State:**
```tsx
const [selectedDataElements, setSelectedDataElements] = useState<(DataElement | null)[]>([null]);
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [pruningResults, setPruningResults] = useState<PruningResult[] | null>(null);
```

**Features:**
- Warning NoticeBox at top (error style)
- Max 10 data elements limit
- "Add another data element" button (visible when < 10 items)
- Remove button on each row (visible when > 1 items)
- Prevent duplicates: pass `selectedIds` to exclude from each dropdown
- Cancel button navigates back to Data Maintenance
- "Prune Data" button opens ConfirmPruningModal

**Access Control:**
- Check `isSuperUser` on page load
- If unauthorized, show access denied message with back button

---

## Phase 5: Update Router Configuration

**File:** `/apps/modeling-app/src/App.tsx`

```tsx
{
    path: '/settings',
    element: <SettingsLayout />,
    handle: { collapseSidebar: true } satisfies RouteHandle,
    children: [
        {
            index: true,
            element: <GeneralSettings />,
        },
        {
            path: 'data-maintenance',
            children: [
                { index: true, element: <DataMaintenanceCard /> },
                { path: 'pruning', element: <DataPruningPage /> },
            ],
        },
    ],
},
```

---

## Phase 6 (Optional): Refactor GuidesPage

Update `GuidesLayout.tsx` to use the new `NestedSidebarLayout` component for code reuse.

---

## File Structure Summary

```
apps/modeling-app/src/
├── components/
│   └── NestedSidebar/
│       ├── NestedSidebarLayout.tsx
│       ├── NestedSidebarLayout.module.css
│       ├── NestedSidebar.tsx
│       ├── NestedSidebar.module.css
│       └── index.ts
└── features/
    └── settings/
        ├── SettingsLayout.tsx (new - wraps with NestedSidebarLayout)
        ├── SettingsSidebar/
        │   └── SettingsSidebar.tsx
        ├── GeneralSettings/
        │   ├── GeneralSettings.tsx
        │   └── GeneralSettings.module.css
        └── DataMaintenance/
            ├── DataMaintenanceCard/
            │   ├── DataMaintenanceCard.tsx
            │   └── DataMaintenanceCard.module.css
            └── DataPruning/
                ├── DataPruningPage.tsx
                ├── DataPruningPage.module.css
                ├── DataElementSelector/
                │   ├── DataElementSelector.tsx
                │   └── DataElementSelector.module.css
                ├── ConfirmPruningModal/
                │   ├── ConfirmPruningModal.tsx
                │   └── ConfirmPruningModal.module.css
                ├── PruningResultsModal/
                │   ├── PruningResultsModal.tsx
                │   └── PruningResultsModal.module.css
                └── hooks/
                    └── useDataPruning.ts
```

---

## Critical Files to Reference

| Pattern | Source File |
|---------|-------------|
| Sidebar layout | `/apps/modeling-app/src/components/Guides/GuidesLayout/GuidesLayout.tsx` |
| Sidebar navigation | `/apps/modeling-app/src/components/Guides/GuidesSidebar/GuidesSidebar.tsx` |
| Card layout | `/apps/modeling-app/src/features/settings/RouteSettings/RouteSettings.tsx` |
| Data element dropdown | `/apps/modeling-app/.d2/shell/src/D2App/features/search-dataitem/SearchSelectField.tsx` |
| Authority hook | `/apps/modeling-app/.d2/shell/src/D2App/hooks/useAuthority.ts` |
| Delete modal | `/apps/modeling-app/.d2/shell/src/D2App/components/BacktestsTable/BacktestActionsMenu/DeleteBacktestModal/DeleteBacktestModal.tsx` |
| Mutation hook | `/apps/modeling-app/.d2/shell/src/D2App/features/settings/RouteSettings/hooks/useDeleteRoute.ts` |

---

## Verification Plan

### 1. Component Rendering
- [ ] Settings page shows sidebar with "General" and "Data Maintenance" items
- [ ] Clicking "General" shows RouteSettings and ChapSettings cards
- [ ] Clicking "Data Maintenance" shows DataMaintenanceCard
- [ ] "Back to app" link navigates to home

### 2. Authority Check
- [ ] User without ALL authority sees disabled "Go to Data Pruning" button
- [ ] Tooltip appears on hover explaining authority requirement
- [ ] User with ALL authority can click button and navigate

### 3. Data Pruning Page
- [ ] Warning notice box displays at top
- [ ] Initial state shows one empty dropdown
- [ ] Can search and select data elements
- [ ] Can add up to 10 data elements
- [ ] Cannot add more than 10 (button hidden)
- [ ] Cannot add duplicate data elements (filtered from dropdown)
- [ ] Can remove individual items with X button
- [ ] X button hidden when only 1 item

### 4. Confirmation Flow
- [ ] Clicking "Prune Data" opens confirmation modal
- [ ] Modal shows list of selected data elements
- [ ] "Delete Data" button disabled until "delete" is typed
- [ ] Case-insensitive matching works (DELETE, Delete, delete all work)
- [ ] Cancel closes modal without action

### 5. API Integration
- [ ] POST requests sent in parallel to `/api/maintenance/dataPruning/dataElements/{uid}`
- [ ] Results modal shows after all requests complete
- [ ] Success items show checkmark
- [ ] Failed items show X with error message
- [ ] Closing results modal resets form

### 6. Manual Testing
```bash
# Start dev server
pnpm dev

# Navigate to Settings
# Test sidebar navigation
# Test authority behavior (may need test user)
# Test full pruning flow with test data elements
```
