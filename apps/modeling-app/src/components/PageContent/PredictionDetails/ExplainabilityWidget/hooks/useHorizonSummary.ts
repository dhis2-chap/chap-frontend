import { useQuery } from '@tanstack/react-query';
import { XaiService } from '@dhis2-chap/ui';

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
    const { data, isFetching, isPreviousData, error } = useQuery({
        queryKey: ['horizonSummary', predictionId, orgUnit, xaiMethod],
        queryFn: () =>
            XaiService.computeHorizonSummaryV1XaiPredictionsPredictionIdLocalHorizonSummaryPost(
                predictionId,
                orgUnit,
                'median',
                xaiMethod,
            ),
        enabled: enabled && !!orgUnit,
        staleTime: Infinity,
        keepPreviousData: true,
    });

    return {
        horizonData: data ?? null,
        isHorizonLoading: isFetching,
        isHorizonPreviousData: isPreviousData,
        horizonError: error
            ? error instanceof Error
                ? error.message
                : String(error)
            : null,
    };
};
