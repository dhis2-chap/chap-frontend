import { useQuery } from '@tanstack/react-query';
import { Route } from '../../../../hooks/useRoute';
import { ApiError, DefaultService } from '@dhis2-chap/ui';

type Props = {
    route: Route | undefined;
};

export const useChapStatus = ({ route }: Props) => {
    const { data: status, error, isLoading } = useQuery<Awaited<ReturnType<typeof DefaultService.systemInfoSystemInfoGet>>, ApiError>({
        queryKey: ['systemInfo', route?.url],
        queryFn: () => DefaultService.systemInfoSystemInfoGet(),
        enabled: !!route,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 5 * 60 * 1000, // 5 minutes
        retry: 0, // Don't retry on error
    });

    return {
        status,
        error,
        isLoading,
    };
};
