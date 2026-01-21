import { useApiDataQuery } from '../utils/useApiDataQuery';

type DataItem = {
    id: string;
    displayName: string;
};

type DataItemsResult = {
    dataItems: DataItem[];
};

export const useDataItemById = (id: string | undefined) => {
    const { data, error, isLoading } = useApiDataQuery<
        DataItemsResult,
        Error,
        DataItem | undefined
    >({
        queryKey: ['dataItem', id],
        enabled: !!id,
        query: {
            resource: 'dataItems',
            params: {
                fields: ['id', 'displayName'],
                filter: `id:eq:${id}`,
            },
        },
        select: (result: DataItemsResult) => {
            return result.dataItems[0];
        },
        staleTime: Infinity,
        cacheTime: Infinity,
    });

    return {
        dataItem: data,
        error,
        isLoading,
    };
};
