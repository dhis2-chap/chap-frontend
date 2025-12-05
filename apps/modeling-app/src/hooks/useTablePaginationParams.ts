import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const PARAM_KEYS = {
    page: 'page',
    pageSize: 'pageSize',
};

const DEFAULT_PAGE_SIZE = 10;

export const useTablePaginationParams = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const page = searchParams.get(PARAM_KEYS.page);
    const pageSize = searchParams.get(PARAM_KEYS.pageSize);

    const pageIndex = Math.max(0, (Number(page) || 1) - 1);
    const pageSizeValue = Number(pageSize) || DEFAULT_PAGE_SIZE;

    const setPageIndex = useCallback(
        (newPageIndex: number) => {
            const newPage = newPageIndex + 1;
            const currentPage = Number(searchParams.get(PARAM_KEYS.page)) || 1;

            if (newPage === currentPage) {
                return;
            }

            setSearchParams(
                (prev) => {
                    const updatedParams = new URLSearchParams(prev);
                    if (newPage === 1) {
                        updatedParams.delete(PARAM_KEYS.page);
                    } else {
                        updatedParams.set(PARAM_KEYS.page, String(newPage));
                    }
                    return updatedParams;
                },
                { replace: true },
            );
        },
        [searchParams, setSearchParams],
    );

    const setPageSize = useCallback(
        (newPageSize: number) => {
            const currentPageSize = Number(searchParams.get(PARAM_KEYS.pageSize)) || DEFAULT_PAGE_SIZE;

            if (newPageSize === currentPageSize) {
                return;
            }

            setSearchParams(
                (prev) => {
                    const updatedParams = new URLSearchParams(prev);
                    if (newPageSize === DEFAULT_PAGE_SIZE) {
                        updatedParams.delete(PARAM_KEYS.pageSize);
                    } else {
                        updatedParams.set(PARAM_KEYS.pageSize, String(newPageSize));
                    }
                    updatedParams.delete(PARAM_KEYS.page);
                    return updatedParams;
                },
                { replace: true },
            );
        },
        [searchParams, setSearchParams],
    );

    return useMemo(
        () => ({
            pageIndex,
            pageSize: pageSizeValue,
            setPageIndex,
            setPageSize,
        }),
        [pageIndex, pageSizeValue, setPageIndex, setPageSize],
    );
};
