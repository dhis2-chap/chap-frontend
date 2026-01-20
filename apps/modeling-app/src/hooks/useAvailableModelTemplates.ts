import { useQuery } from '@tanstack/react-query';
import { ApiError, ApprovedTemplate, CrudService } from '@dhis2-chap/ui';

export const useAvailableModelTemplates = () => {
    const { data: availableTemplates, error, isLoading } = useQuery<ApprovedTemplate[], ApiError>({
        queryKey: ['availableModelTemplates'],
        queryFn: () => CrudService.listAvailableModelTemplatesCrudModelTemplatesAvailableGet(),
        retry: 0,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
    });

    return {
        availableTemplates,
        error,
        isLoading,
    };
};
