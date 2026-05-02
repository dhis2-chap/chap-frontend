import { useQuery } from '@tanstack/react-query';
import { XaiService } from '@dhis2-chap/ui';

type Args = {
    predictionId: number;
    xaiMethod: string;
    enabled: boolean;
};

export const useShapBeeswarm = ({ predictionId, xaiMethod, enabled }: Args) => {
    const { data, isFetching, error, refetch } = useQuery({
        queryKey: ['shapBeeswarm', predictionId, xaiMethod],
        queryFn: () =>
            XaiService.computeShapBeeswarmV1XaiPredictionsPredictionIdShapBeeswarmPost(
                predictionId,
                'median',
                xaiMethod,
            ),
        enabled,
        staleTime: Infinity,
        retry: 0,
    });

    return {
        beeswarmData: data,
        isBeeswarmLoading: isFetching,
        beeswarmError: error
            ? error instanceof Error
                ? error.message
                : String(error)
            : null,
        refetch,
    };
};
