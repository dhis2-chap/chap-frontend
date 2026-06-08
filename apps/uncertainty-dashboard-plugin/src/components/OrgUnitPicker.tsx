import {
    useEffect,
    useMemo,
    useRef,
} from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    CircularLoader,
    NoticeBox,
    OrganisationUnitTree,
} from '@dhis2/ui';
import { useApiDataQuery } from '@/utils/useApiDataQuery';
import type { OrgUnitOption } from '@/types';
import styles from './OrgUnitPicker.module.css';

type DataViewRootOrgUnitsResponse = {
    organisationUnits: OrgUnitOption[];
};

type OrganisationUnitEventPayload = OrgUnitOption & {
    checked: boolean;
    selected: string[];
};

type OrgUnitPickerProps = {
    value: OrgUnitOption | null;
    onChange: (value: OrgUnitOption | null) => void;
    options?: OrgUnitOption[];
    disabled?: boolean;
};

const DATA_VIEW_ROOT_ORG_UNITS_QUERY = {
    resource: 'organisationUnits',
    params: {
        userDataViewFallback: true,
        fields: [
            'id',
            'displayName',
            'path',
        ],
    },
};

const getPathAncestors = (path: string | undefined): string[] => {
    if (!path) {
        return [];
    }

    const ids = path.split('/').filter(Boolean);
    return ids
        .slice(0, -1)
        .map((_, index) => `/${ids.slice(0, index + 1).join('/')}`);
};

const getUniquePaths = (paths: string[]): string[] => (
    Array.from(new Set(paths.filter(Boolean)))
);

const getFilterPaths = (options: OrgUnitOption[] | undefined): string[] => (
    options
        ?.map(option => option.path)
        .filter((path): path is string => !!path) ?? []
);

const getInitiallyExpandedPaths = ({
    roots,
    selectedPath,
    filterPaths,
}: {
    roots: OrgUnitOption[];
    selectedPath: string | undefined;
    filterPaths: string[];
}): string[] => (
    getUniquePaths([
        ...(roots.length === 1 && roots[0].path ? [roots[0].path] : []),
        ...getPathAncestors(selectedPath),
        ...filterPaths.flatMap(getPathAncestors),
    ])
);

const toSelectedPaths = (value: OrgUnitOption | null): string[] => (
    value?.path ? [value.path] : []
);

export const OrgUnitPicker = ({
    value,
    onChange,
    options: fixedOptions,
    disabled = false,
}: OrgUnitPickerProps) => {
    const treePanelRef = useRef<HTMLDivElement>(null);
    const {
        data,
        error,
        isLoading,
    } = useApiDataQuery<DataViewRootOrgUnitsResponse>({
        queryKey: [
            'organisationUnits',
            'dataViewRoots',
        ],
        query: DATA_VIEW_ROOT_ORG_UNITS_QUERY,
        staleTime: Infinity,
        cacheTime: Infinity,
    });
    const roots = data?.organisationUnits ?? [];
    const rootIds = useMemo(() => roots.map(root => root.id), [roots]);
    const filterPaths = useMemo(() => getFilterPaths(fixedOptions), [fixedOptions]);
    const selectedPaths = useMemo(() => toSelectedPaths(value), [value]);
    const initiallyExpanded = useMemo(() => getInitiallyExpandedPaths({
        roots,
        selectedPath: value?.path,
        filterPaths,
    }), [filterPaths, roots, value?.path]);

    useEffect(() => {
        const treePanel = treePanelRef.current;

        if (!treePanel || selectedPaths.length === 0) {
            return undefined;
        }

        const scrollSelectedNodeIntoView = () => {
            const selectedNode = treePanel.querySelector<HTMLElement>('.checked');

            if (!selectedNode) {
                return;
            }

            const scrollTop = (
                selectedNode.offsetTop
                - treePanel.offsetTop
                - (treePanel.clientHeight / 2)
                + (selectedNode.clientHeight / 2)
            );
            treePanel.scrollTop = Math.max(0, scrollTop);
            observer.disconnect();
        };
        const observer = new MutationObserver(scrollSelectedNodeIntoView);

        scrollSelectedNodeIntoView();

        observer.observe(treePanel, {
            attributes: true,
            attributeFilter: ['class'],
            childList: true,
            subtree: true,
        });

        const timeoutId = window.setTimeout(() => {
            scrollSelectedNodeIntoView();
            observer.disconnect();
        }, 1000);

        return () => {
            observer.disconnect();
            window.clearTimeout(timeoutId);
        };
    }, [rootIds.length, selectedPaths]);

    const handleChange = (payload: OrganisationUnitEventPayload) => {
        if (disabled) {
            return;
        }

        onChange(payload.checked
            ? {
                    id: payload.id,
                    displayName: payload.displayName,
                    path: payload.path,
                }
            : null);
    };

    if (isLoading) {
        return (
            <div className={styles.treeState}>
                <CircularLoader />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.treeNotice}>
                <NoticeBox title={i18n.t('Could not load organisation units')} />
            </div>
        );
    }

    if (rootIds.length === 0) {
        return (
            <div className={styles.treeNotice}>
                <NoticeBox title={i18n.t('No organisation units available')} />
            </div>
        );
    }

    return (
        <div ref={treePanelRef} className={styles.treePanel}>
            <OrganisationUnitTree
                roots={rootIds}
                selected={selectedPaths}
                initiallyExpanded={initiallyExpanded}
                filter={filterPaths.length ? filterPaths : undefined}
                onChange={handleChange}
                disableSelection={disabled}
                singleSelection
                isUserDataViewFallback
                dataTest="chap-org-unit-tree"
            />
        </div>
    );
};
