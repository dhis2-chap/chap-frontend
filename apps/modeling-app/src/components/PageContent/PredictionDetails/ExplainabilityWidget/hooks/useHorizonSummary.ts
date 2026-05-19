import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XaiService, type HorizonSummaryResponse, ApiError } from '@dhis2-chap/ui';
import { formatQueryError } from './formatQueryError';

type Args = {
    predictionId: number;
    orgUnit: string;
    xaiMethod: string;
    enabled: boolean;
};

export const useHorizonSummary = ({
    predictionId,
    orgUnit,
    xaiMethod,
    enabled,
}: Args) => {
    const queryClient = useQueryClient();
    const queryKey = ['horizonSummary', predictionId, orgUnit, xaiMethod];

    const { data, isFetching, error } = useQuery<HorizonSummaryResponse | undefined, ApiError>({
        queryKey,
        queryFn: () =>
            XaiService.getHorizonSummaryV1XaiPredictionsPredictionIdLocalHorizonSummaryGet(
                predictionId,
                orgUnit,
                'median',
                xaiMethod,
            ),
        enabled: enabled && !!orgUnit,
        staleTime: Infinity,
        retry: 0,
        keepPreviousData: true,
    });

    const computeMutation = useMutation<HorizonSummaryResponse, ApiError>({
        mutationFn: () =>
            XaiService.computeHorizonSummaryV1XaiPredictionsPredictionIdLocalHorizonSummaryPost(
                predictionId,
                orgUnit,
                'median',
                xaiMethod,
            ),
        onSuccess: (result) => {
            queryClient.setQueryData(queryKey, result);
        },
    });

    return {
        horizonData: data ?? null,
        isHorizonLoading: isFetching || computeMutation.isPending,
        horizonError: formatQueryError(error) ?? formatQueryError(computeMutation.error),
        computeHorizon: () => computeMutation.mutate(),
        isComputingHorizon: computeMutation.isPending,
    };
};
