import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const PARAM_KEYS = {
    search: 'search',
    includeArchived: 'includeArchived',
};

export const useModelsTableFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get(PARAM_KEYS.search) || '';
    const includeArchived = searchParams.get(PARAM_KEYS.includeArchived) === 'true';

    const setSearch = useCallback(
        (newSearch: string | undefined) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);
                if (newSearch) {
                    updatedParams.set(PARAM_KEYS.search, newSearch);
                } else {
                    updatedParams.delete(PARAM_KEYS.search);
                }
                return updatedParams;
            });
        },
        [setSearchParams],
    );

    const setIncludeArchived = useCallback(
        (newIncludeArchived: boolean) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);
                if (newIncludeArchived) {
                    updatedParams.set(PARAM_KEYS.includeArchived, 'true');
                } else {
                    updatedParams.delete(PARAM_KEYS.includeArchived);
                }
                return updatedParams;
            });
        },
        [setSearchParams],
    );

    return useMemo(
        () => ({
            search,
            setSearch,
            includeArchived,
            setIncludeArchived,
        }),
        [search, setSearch, includeArchived, setIncludeArchived],
    );
};
