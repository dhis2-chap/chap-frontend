import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    XaiService,
    type LocalExplanationResponse,
    type LocalExplanationRequest,
    ApiError,
} from '@dhis2-chap/ui';
import { pickLatestExplanation } from './pickLatestExplanation';

export const useLocalExplanation = (
    predictionId: number | undefined,
    orgUnit: string | undefined,
    period: string | undefined,
    xaiMethod?: string,
) => {
    const queryClient = useQueryClient();

    const { data, error, isLoading, isFetching, isPreviousData } = useQuery<LocalExplanationResponse[], ApiError>({
        queryKey: ['localExplanations', predictionId, orgUnit, period, xaiMethod],
        queryFn: () => XaiService.listLocalExplanationsV1XaiPredictionsPredictionIdLocalGet(predictionId!, orgUnit, period, xaiMethod),
        enabled: !!predictionId && !!orgUnit && period != null && period !== '',
        staleTime: Infinity,
        retry: 0,
        keepPreviousData: true,
    });

    const computeMutation = useMutation<LocalExplanationResponse, ApiError, LocalExplanationRequest>({
        mutationFn: request =>
            XaiService.computeLocalExplanationV1XaiPredictionsPredictionIdLocalPost(predictionId!, request),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['localExplanations', predictionId],
            });
        },
    });

    // keepPreviousData surfaces the prior orgUnit's response during a transition;
    // filter so the UI never shows another orgUnit's explanation while refetching.
    const matches = data?.filter(exp => exp.orgUnit === orgUnit) ?? [];

    const currentExplanation = matches.length > 0 ? pickLatestExplanation(matches) : undefined;

    return {
        currentExplanation,
        error,
        isLoading,
        isFetching,
        isPreviousData,
        computeExplanation: computeMutation.mutate,
        isComputing: computeMutation.isPending,
    };
};
