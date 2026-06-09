import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DateRangeValue } from '../../../utils/jobDateRange';

const PARAM_KEYS = {
    fromDate: 'fromDate',
    search: 'search',
    status: 'status',
    toDate: 'toDate',
    type: 'type',
};

export const useJobsTableFilters = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get(PARAM_KEYS.search) || '';
    const status = searchParams.get(PARAM_KEYS.status) || undefined;
    const fromDate = searchParams.get(PARAM_KEYS.fromDate) || undefined;
    const toDate = searchParams.get(PARAM_KEYS.toDate) || undefined;
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

    const setDateRange = useCallback(
        (dateRange: DateRangeValue) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);

                if (dateRange.fromDate) {
                    updatedParams.set(PARAM_KEYS.fromDate, dateRange.fromDate);
                } else {
                    updatedParams.delete(PARAM_KEYS.fromDate);
                }

                if (dateRange.toDate) {
                    updatedParams.set(PARAM_KEYS.toDate, dateRange.toDate);
                } else {
                    updatedParams.delete(PARAM_KEYS.toDate);
                }

                return updatedParams;
            });
        },
        [setSearchParams],
    );

    return useMemo(
        () => ({
            dateRange: {
                fromDate,
                toDate,
            },
            search,
            setSearch,
            setDateRange,
            status,
            setStatus,
            type,
            setType,
        }),
        [fromDate, search, setDateRange, setSearch, setStatus, setType, status, toDate, type],
    );
};
