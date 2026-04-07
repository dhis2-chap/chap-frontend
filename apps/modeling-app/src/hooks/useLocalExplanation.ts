import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    XaiService,
    type LocalExplanationResponse,
    type LocalExplanationRequest,
    ApiError,
} from '@dhis2-chap/ui';

/** When batch runs or methods are recomputed, the DB can hold multiple rows per (org, period, method). Always use the newest. */
function pickLatestExplanation(rows: LocalExplanationResponse[]): LocalExplanationResponse | undefined {
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
    method: string = 'shap',
    xaiMethod?: string,
) => {
    const queryClient = useQueryClient();

    const methodFilter = xaiMethod ?? method;

    const { data, error, isLoading, isFetching, refetch } = useQuery<LocalExplanationResponse[], ApiError>({
        queryKey: ['localExplanations', predictionId, orgUnit, period, methodFilter],
        queryFn: () => XaiService.listLocalExplanations(predictionId!, orgUnit, period, methodFilter),
        enabled: !!predictionId && !!orgUnit && period != null && period !== '',
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

    const matches =
        data?.filter((exp) => {
            const ou = exp.orgUnit ?? (exp as { org_unit?: string }).org_unit;
            const m = exp.method ?? (exp as { method?: string }).method;
            const xm = exp.xaiMethodName ?? (exp as { xai_method_name?: string }).xai_method_name;
            if (ou !== orgUnit) return false;
            return xaiMethod ? (xm ? xm === xaiMethod : m === xaiMethod) : m === method;
        }) ?? [];

    const currentExplanation = matches.length > 0 ? pickLatestExplanation(matches) : undefined;

    return {
        localExplanations: data || [],
        currentExplanation,
        error,
        isLoading,
        isFetching,
        refetch,
        computeExplanation: computeMutation.mutate,
        isComputing: computeMutation.isPending,
        computeError: computeMutation.error,
    };
};
