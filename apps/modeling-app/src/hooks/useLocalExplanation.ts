import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    XaiService,
    type LocalExplanationResponse,
    type LocalExplanationRequest,
    ApiError,
} from '@dhis2-chap/ui';

export const useLocalExplanation = (
    predictionId: number | undefined,
    orgUnit: string | undefined,
    period: string | undefined,
) => {
    const queryClient = useQueryClient();

    const { data, error, isLoading, refetch } = useQuery<LocalExplanationResponse[], ApiError>({
        queryKey: ['localExplanations', predictionId, orgUnit, period],
        queryFn: () => XaiService.listLocalExplanations(predictionId!, orgUnit, period),
        enabled: !!predictionId,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const computeMutation = useMutation<LocalExplanationResponse, ApiError, LocalExplanationRequest>({
        mutationFn: (request) =>
            XaiService.computeLocalExplanation(predictionId!, request),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['localExplanations', predictionId],
            });
        },
    });

    const currentExplanation = data?.find(
        (exp) => exp.orgUnit === orgUnit && exp.period === period
    );

    return {
        localExplanations: data || [],
        currentExplanation,
        error,
        isLoading,
        refetch,
        computeExplanation: computeMutation.mutate,
        isComputing: computeMutation.isPending,
        computeError: computeMutation.error,
    };
};
