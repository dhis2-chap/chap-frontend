import { useApiDataQuery } from '@/utils/useApiDataQuery';
import type { OutbreakIndicatorDataElement } from '../utils/outbreakIndicatorCompatibility';

type DataElementsResult = {
    dataElements: OutbreakIndicatorDataElement[];
};

export const useOutbreakIndicatorDataElement = (id: string | undefined) => {
    const { data, isLoading } = useApiDataQuery<
        DataElementsResult,
        Error,
        OutbreakIndicatorDataElement | undefined
    >({
        queryKey: ['dataElement', 'valueType', id],
        enabled: !!id,
        query: {
            resource: 'dataElements',
            params: {
                fields: 'id,displayName,valueType,optionSet[options[code]]',
                filter: `id:eq:${id}`,
            },
        },
        select: result => result.dataElements[0],
        staleTime: 60 * 1000,
    });

    return { dataElement: data, isLoading: !!id && isLoading };
};
