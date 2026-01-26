import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const SEARCH_PARAM_KEY = 'search';

export const useTableSearchFilter = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get(SEARCH_PARAM_KEY) || '';

    const setSearch = useCallback(
        (newSearch: string | undefined) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);
                if (newSearch) {
                    updatedParams.set(SEARCH_PARAM_KEY, newSearch);
                } else {
                    updatedParams.delete(SEARCH_PARAM_KEY);
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
