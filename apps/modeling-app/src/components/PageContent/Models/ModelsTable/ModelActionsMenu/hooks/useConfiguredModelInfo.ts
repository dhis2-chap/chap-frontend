import { useQuery } from '@tanstack/react-query';
import { ApiError, ConfiguredModelInfoRead } from '@dhis2-chap/ui';
import { configuredModelInfoQueryOptions } from '@/hooks/modelsQuery';

type Props = {
    id: number | null;
    enabled?: boolean;
};

export const useConfiguredModelInfo = ({ id, enabled = true }: Props) => {
    const { data, error, isLoading } = useQuery<ConfiguredModelInfoRead, ApiError>({
        ...configuredModelInfoQueryOptions(id as number),
        enabled: enabled && id !== null,
    });

    return {
        info: data,
        error,
        isLoading,
    };
};
