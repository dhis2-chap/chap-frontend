import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTableSearchFilter } from '../../../../../hooks/useTableSearchFilter';

const INCLUDE_ARCHIVED_PARAM_KEY = 'includeArchived';

export const useConfiguredModelsTableFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { search, setSearch } = useTableSearchFilter();

    const includeArchived = searchParams.get(INCLUDE_ARCHIVED_PARAM_KEY) === 'true';

    const setIncludeArchived = useCallback(
        (newIncludeArchived: boolean) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);
                if (newIncludeArchived) {
                    updatedParams.set(INCLUDE_ARCHIVED_PARAM_KEY, 'true');
                } else {
                    updatedParams.delete(INCLUDE_ARCHIVED_PARAM_KEY);
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
