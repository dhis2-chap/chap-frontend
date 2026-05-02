import { useQuery } from '@tanstack/react-query';
import { XaiService, type GlobalExplanationResponse, ApiError } from '@dhis2-chap/ui';

export const useGlobalExplanation = (predictionId: number | undefined, xaiMethod?: string) => {
    const { data, error, isLoading, isFetching, isPreviousData, refetch } = useQuery<GlobalExplanationResponse, ApiError>({
        queryKey: ['globalExplanation', predictionId, xaiMethod],
        queryFn: () => XaiService.getGlobalExplanationV1XaiPredictionsPredictionIdGlobalGet(predictionId!, xaiMethod),
        enabled: !!predictionId,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        keepPreviousData: true,
    });

    return {
        globalExplanation: data,
        error,
        isLoading,
        isFetching,
        isPreviousData,
        refetch,
    };
};
