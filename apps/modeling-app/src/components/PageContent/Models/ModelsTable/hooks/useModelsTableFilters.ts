import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const PARAM_KEYS = {
    search: 'search',
};

export const useModelsTableFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get(PARAM_KEYS.search) || '';

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

    return useMemo(
        () => ({
            search,
            setSearch,
        }),
        [search, setSearch],
    );
};
