import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, VisualizationInfo, VisualizationService } from "@dhis2-chap/ui";

type Props = {
    evaluationId?: number;
};

export const useCustomVisualizationTypes = ({ evaluationId }: Props) => {
    const { data, error, isLoading } = useQuery<VisualizationInfo[], ApiError>({
        queryKey: ["custom-visualization-types", evaluationId],
        queryFn: () =>
            VisualizationService.listVisualizationsVisualizationBacktestIdGet(
                Number(evaluationId)
            ),
        enabled: typeof evaluationId === "number" && evaluationId > 0,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    useEffect(() => {
        if (!error) return;
        console.error("useCustomVisualizationTypes: error loading visualization types", {
            message: error?.message,
            error,
            evaluationId,
        });
    }, [error, evaluationId]);

    return {
        visualizationTypes: data,
        error,
        isLoading,
    };
};


