import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const PARAM_KEYS = {
    tab: 'tab',
};

export type ModelsPageTab = 'configured' | 'templates';

const DEFAULT_TAB: ModelsPageTab = 'configured';

export const useModelsPageTab = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const rawTab = searchParams.get(PARAM_KEYS.tab);
    const tab: ModelsPageTab = rawTab === 'templates' ? 'templates' : DEFAULT_TAB;

    const setTab = useCallback(
        (newTab: ModelsPageTab) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);
                if (newTab === DEFAULT_TAB) {
                    updatedParams.delete(PARAM_KEYS.tab);
                } else {
                    updatedParams.set(PARAM_KEYS.tab, newTab);
                }
                // Reset filters when switching tabs
                updatedParams.delete('page');
                updatedParams.delete('search');
                updatedParams.delete('includeArchived');
                return updatedParams;
            });
        },
        [setSearchParams],
    );

    return useMemo(
        () => ({
            tab,
            setTab,
            isConfiguredTab: tab === 'configured',
            isTemplatesTab: tab === 'templates',
        }),
        [tab, setTab],
    );
};
