import { ApiError, DefaultService, ModelSpec } from "@dhis2-chap/ui";
import { useQuery } from "@tanstack/react-query";

export const useAvailableModelTemplates = () => {
    const { data, error, isLoading } = useQuery<ModelSpec[], ApiError>({
        queryKey: ['modelTemplatesAvailable'],
        queryFn: () => DefaultService.listModelsListModelsGet(),
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: 0,
    });

    return {
        modelTemplates: data,
        error,
        isLoading,
    };
}

