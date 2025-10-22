import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const PARAM_KEYS = {
    search: 'search',
    status: 'status',
    type: 'type',
};

export const useJobsTableFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get(PARAM_KEYS.search) || '';
    const status = searchParams.get(PARAM_KEYS.status) || undefined;
    const type = searchParams.get(PARAM_KEYS.type) || undefined;

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

    const setStatus = useCallback(
        (newStatus: string | undefined) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);
                if (newStatus) {
                    updatedParams.set(PARAM_KEYS.status, newStatus);
                } else {
                    updatedParams.delete(PARAM_KEYS.status);
                }
                return updatedParams;
            });
        },
        [setSearchParams],
    );

    const setType = useCallback(
        (newType: string | undefined) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);
                if (newType) {
                    updatedParams.set(PARAM_KEYS.type, newType);
                } else {
                    updatedParams.delete(PARAM_KEYS.type);
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
            status,
            setStatus,
            type,
            setType,
        }),
        [search, setSearch, status, setStatus, type, setType],
    );
};
