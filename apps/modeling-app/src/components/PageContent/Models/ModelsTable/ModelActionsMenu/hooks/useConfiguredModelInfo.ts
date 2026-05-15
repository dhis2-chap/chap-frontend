import { useQuery } from '@tanstack/react-query';
import { ApiError, ConfiguredModelInfoRead, ModelsService } from '@dhis2-chap/ui';

type Props = {
    id: number | null;
    enabled?: boolean;
};

export const useConfiguredModelInfo = ({ id, enabled = true }: Props) => {
    const { data, error, isLoading } = useQuery<ConfiguredModelInfoRead, ApiError>({
        queryKey: ['configuredModelInfo', id],
        queryFn: () => ModelsService.getConfiguredModelInfoV1CrudConfiguredModelsConfiguredModelIdGet(id as number),
        enabled: enabled && id !== null,
        staleTime: 300000,
        cacheTime: 300000,
        retry: 0,
    });

    return {
        info: data,
        error,
        isLoading,
    };
};
