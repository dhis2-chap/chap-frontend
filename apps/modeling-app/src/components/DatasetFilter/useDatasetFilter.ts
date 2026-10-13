import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PARAM_KEYS as PAGINATION_PARAM_KEYS } from '../../hooks/useTablePaginationParams';

const PARAM_KEY = 'datasetId';

export const useDatasetFilter = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const datasetId = searchParams.get(PARAM_KEY) || undefined;

    const setDatasetId = useCallback((newDatasetId: string | undefined) => {
        setSearchParams((prev) => {
            const updatedParams = new URLSearchParams(prev);
            if (newDatasetId) {
                updatedParams.set(PARAM_KEY, newDatasetId);
            } else {
                updatedParams.delete(PARAM_KEY);
            }
            updatedParams.delete(PAGINATION_PARAM_KEYS.page);
            return updatedParams;
        });
    }, [setSearchParams]);

    return { datasetId, setDatasetId };
};
