import { ApiError, CrudService, ModelSpecRead } from "@dhis2-chap/ui";
import { useQuery } from "@tanstack/react-query";

export const useModels = () => {
    const { data, error, isLoading } = useQuery<ModelSpecRead[], ApiError>({
        queryKey: ['models'],
        queryFn: () => CrudService.listConfiguredModelsCrudConfiguredModelsGet(),
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