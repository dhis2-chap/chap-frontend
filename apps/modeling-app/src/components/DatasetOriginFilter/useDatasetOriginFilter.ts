import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataSetInfo } from '@dhis2-chap/ui';

const PARAM_KEY = 'origin';
const ALL = 'all';

export type DatasetOrigin = 'manual' | 'generated';

// Backends without the flag leave it undefined, so every dataset counts as manual there.
const isCreatedManually = (dataset: DataSetInfo) => dataset.createdManually !== false;

export const matchesOrigin = (dataset: DataSetInfo, origin: DatasetOrigin | undefined) => (
    !origin || isCreatedManually(dataset) === (origin === 'manual')
);

export const useDatasetOriginFilter = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const param = searchParams.get(PARAM_KEY);
    const origin: DatasetOrigin | undefined = param === ALL ? undefined : param === 'generated' ? 'generated' : 'manual';

    const setOrigin = useCallback(
        (newOrigin: DatasetOrigin | undefined) => {
            setSearchParams((prev) => {
                const updatedParams = new URLSearchParams(prev);
                // A different filter means a different result set, so start from page 1
                updatedParams.delete('page');
                if (newOrigin === 'manual') {
                    updatedParams.delete(PARAM_KEY);
                } else {
                    updatedParams.set(PARAM_KEY, newOrigin || ALL);
                }
                return updatedParams;
            });
        },
        [setSearchParams],
    );

    return useMemo(() => ({ origin, setOrigin }), [origin, setOrigin]);
};
