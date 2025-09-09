import { useQuery } from "@tanstack/react-query";
import { ApiError, VisualizationService } from "@dhis2-chap/ui";

type UseVisualizationParams = {
    evaluationId?: number;
    visualizationName: string;
    metricId: string;
};

export const useCustomVisualization = ({
    evaluationId,
    visualizationName,
    metricId,
}: UseVisualizationParams) => {
    const { data, isLoading, error } = useQuery<unknown, ApiError>({
        queryKey: [
            "custom-visualizations",
            evaluationId,
            visualizationName,
            metricId,
        ],
        queryFn: () =>
            VisualizationService.generateVisualizationVisualizationVisualizationNameBacktestIdMetricIdGet(
                visualizationName,
                Number(evaluationId),
                metricId
            ),
        enabled: typeof evaluationId === "number" && evaluationId > 0,
    });

    return {
        visualization: data,
        isLoading,
        error,
    };
};


