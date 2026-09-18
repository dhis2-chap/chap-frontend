import { ApiError } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { modelsQueryOptions } from './modelsQuery';
import type { ModelWithHealth } from '../utils/modelHealth';

type Props = {
    includeArchived?: boolean;
    refreshHealth?: boolean;
};

export const useModels = ({ includeArchived = false, refreshHealth = false }: Props = {}) => {
    const { data, error, isLoading } = useQuery<ModelWithHealth[], ApiError>({
        ...modelsQueryOptions,
        refetchInterval: refreshHealth ? 30_000 : false,
        cacheTime: Infinity,
    });

    const models = useMemo(
        () => includeArchived ? data : data?.filter(model => !model.archived),
        [data, includeArchived],
    );

    return {
        models,
        // Keep an open form mounted during a failed background refresh. The
        // submission preflight still requires a successful configured-model read.
        error: data ? null : error,
        isLoading,
    };
};
