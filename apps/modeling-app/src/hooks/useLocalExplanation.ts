import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    XaiService,
    type LocalExplanationResponse,
    type LocalExplanationRequest,
    ApiError,
} from '@dhis2-chap/ui';

/** When batch runs or methods are recomputed, the DB can hold multiple rows per (org, period, method). Always use the newest. */
export function pickLatestExplanation(rows: LocalExplanationResponse[]): LocalExplanationResponse | undefined {
    if (!rows.length) return undefined;
    return rows.reduce((best, exp) => {
        const eid = exp.id ?? -1;
        const bid = best.id ?? -1;
        if (eid !== bid) return eid > bid ? exp : best;
        const ta = exp.computedAt ?? '';
        const tb = best.computedAt ?? '';
        return ta >= tb ? exp : best;
    });
}

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
        staleTime: 5 * 60 * 1000,
        retry: 1,
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
