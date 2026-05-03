import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XaiService, type ShapBeeswarmResponse, ApiError } from '@dhis2-chap/ui';

type Args = {
    predictionId: number;
    xaiMethod: string;
    enabled: boolean;
};

const formatError = (e: unknown): string | null =>
    e ? (e instanceof Error ? e.message : String(e)) : null;

export const useShapBeeswarm = ({ predictionId, xaiMethod, enabled }: Args) => {
    const queryClient = useQueryClient();
    const queryKey = ['shapBeeswarm', predictionId, xaiMethod];

    const { data, isFetching, error } = useQuery<ShapBeeswarmResponse, ApiError>({
        queryKey,
        queryFn: () =>
            XaiService.getShapBeeswarmV1XaiPredictionsPredictionIdShapBeeswarmGet(
                predictionId,
                'median',
                xaiMethod,
            ),
        enabled,
        staleTime: Infinity,
        retry: 0,
    });

    const computeMutation = useMutation<ShapBeeswarmResponse, ApiError>({
        mutationFn: () =>
            XaiService.computeShapBeeswarmV1XaiPredictionsPredictionIdShapBeeswarmPost(
                predictionId,
                'median',
                xaiMethod,
            ),
        onSuccess: (result) => {
            queryClient.setQueryData(queryKey, result);
        },
    });

    return {
        beeswarmData: data,
        isBeeswarmLoading: isFetching || computeMutation.isPending,
        beeswarmError: formatError(error) ?? formatError(computeMutation.error),
        computeBeeswarm: () => computeMutation.mutate(),
        isComputingBeeswarm: computeMutation.isPending,
    };
};
