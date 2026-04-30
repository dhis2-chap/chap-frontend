import { useQuery } from '@tanstack/react-query';
import { ApiError, XaiService, type XaiMethodRead } from '@dhis2-chap/ui';

export const useXaiMethods = () => {
    const { data, error, isLoading } = useQuery<XaiMethodRead[], ApiError>({
        queryKey: ['xaiMethods'],
        queryFn: () => XaiService.listXaiMethods(),
        staleTime: 30 * 60 * 1000,
        retry: 0,
        select: methods => methods.filter(m => !m.archived),
    });

    return {
        xaiMethods: data,
        error,
        isLoading,
    };
};
