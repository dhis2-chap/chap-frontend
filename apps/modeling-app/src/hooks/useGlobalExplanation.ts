import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XaiService, type GlobalExplanationResponse, ApiError } from '@dhis2-chap/ui';

export const useGlobalExplanation = (predictionId: number | undefined, xaiMethod?: string) => {
    const queryClient = useQueryClient();

    const { data, error, isLoading, isFetching, refetch } = useQuery<GlobalExplanationResponse, ApiError>({
        queryKey: ['globalExplanation', predictionId, xaiMethod],
        queryFn: () => XaiService.getGlobalExplanation(predictionId!, xaiMethod),
        enabled: !!predictionId,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const computeMutation = useMutation<GlobalExplanationResponse, ApiError, { topK?: number }>({
        mutationFn: ({ topK = 10 }) =>
            XaiService.computeGlobalExplanation(predictionId!, topK, undefined, xaiMethod),
        onSuccess: (newData) => {
            queryClient.setQueryData(['globalExplanation', predictionId, xaiMethod], newData);
        },
    });

    return {
        globalExplanation: data,
        error,
        isLoading,
        isFetching,
        refetch,
        computeExplanation: computeMutation.mutate,
        isComputing: computeMutation.isPending,
        computeError: computeMutation.error,
    };
};
