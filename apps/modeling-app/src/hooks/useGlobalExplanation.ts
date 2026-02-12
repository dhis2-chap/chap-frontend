import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XaiService, type GlobalExplanationResponse, ApiError } from '@dhis2-chap/ui';

export const useGlobalExplanation = (predictionId: number | undefined) => {
    const queryClient = useQueryClient();

    const { data, error, isLoading, refetch } = useQuery<GlobalExplanationResponse, ApiError>({
        queryKey: ['globalExplanation', predictionId],
        queryFn: () => XaiService.getGlobalExplanation(predictionId!),
        enabled: !!predictionId,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const computeMutation = useMutation<GlobalExplanationResponse, ApiError, { topK?: number }>({
        mutationFn: ({ topK = 10 }) =>
            XaiService.computeGlobalExplanation(predictionId!, topK),
        onSuccess: (newData) => {
            queryClient.setQueryData(['globalExplanation', predictionId], newData);
        },
    });

    return {
        globalExplanation: data,
        error,
        isLoading,
        refetch,
        computeExplanation: computeMutation.mutate,
        isComputing: computeMutation.isPending,
        computeError: computeMutation.error,
    };
};
