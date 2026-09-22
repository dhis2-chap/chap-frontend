import { ApiError } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { modelsQueryOptions } from './modelsQuery';
import type { ModelWithHealth } from '../utils/modelHealth';

type Props = {
    includeArchived?: boolean;
};

export const useModels = ({ includeArchived = false }: Props = {}) => {
    const { data, error, isLoading } = useQuery<ModelWithHealth[], ApiError>(modelsQueryOptions);

    const models = useMemo(
        () => (includeArchived ? data : data?.filter(model => !model.archived)),
        [data, includeArchived],
    );

    return {
        models,
        error,
        isLoading,
    };
};
