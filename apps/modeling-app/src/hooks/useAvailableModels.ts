import { ApiError, DefaultService, ModelSpec } from "@dhis2-chap/ui";
import { useQuery } from "@tanstack/react-query";

export const useAvailableModels = () => {
    const { data, error, isLoading } = useQuery<ModelSpec[], ApiError>({
        queryKey: ['availableModels'],
        queryFn: () => DefaultService.listModelsListModelsGet(),
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: 0,
    });

    return {
        models: data,
        error,
        isLoading,
    };
}

