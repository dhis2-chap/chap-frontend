import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const PARAM_KEYS = {
    modelId: 'modelId',
    search: 'search',
};

export const useBacktestsTableFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const modelId = searchParams.get(PARAM_KEYS.modelId) || undefined;
    const search = searchParams.get(PARAM_KEYS.search) || '';

    const setModelId = useCallback(
        (newModelId: string | undefined) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);
                if (newModelId) {
                    updatedParams.set(PARAM_KEYS.modelId, newModelId);
                } else {
                    updatedParams.delete(PARAM_KEYS.modelId);
                }
                return updatedParams;
            });
        },
        [setSearchParams],
    );

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
            modelId,
            setModelId,
            search,
            setSearch,
        }),
        [modelId, setModelId, search, setSearch],
    );
};

