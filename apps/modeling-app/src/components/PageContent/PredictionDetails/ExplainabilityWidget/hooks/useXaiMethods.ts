import { useQuery } from '@tanstack/react-query';
import { ApiError, XaiService, type XaiMethodRead } from '@dhis2-chap/ui';

export const useXaiMethods = (predictionId?: number) => {
    const { data, error, isLoading } = useQuery<XaiMethodRead[], ApiError>({
        queryKey: ['xaiMethods', predictionId],
        queryFn: () => XaiService.listXaiMethodsV1XaiMethodsGet(false, predictionId),
        staleTime: 30 * 60 * 1000,
        retry: 0,
    });

    return {
        xaiMethods: data,
        error,
        isLoading,
    };
};
