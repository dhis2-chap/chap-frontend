import z from 'zod';
import { dataItemSchema } from '../../../components/NewEvaluationForm/hooks/useFormController';
import { useDataEngine } from '@dhis2/app-runtime';
import { Query, useQuery, useQueryClient } from '@tanstack/react-query';

type Props = {
    dataItemIds: string[];
};

type DataItem = z.infer<typeof dataItemSchema>;

type DataItemsResponse = {
    dataItems: DataItem[];
};

const isDataItem = (value: unknown): value is DataItem => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Partial<DataItem>;

    return (
        typeof candidate.id === 'string' &&
        typeof candidate.displayName === 'string' &&
        typeof candidate.dimensionItemType === 'string'
    );
};

const isDataItemArray = (data: unknown): data is DataItem[] => {
    return Array.isArray(data) && data.every(isDataItem);
};

const isDataItemsResponse = (data: unknown): data is DataItemsResponse => {
    return (
        !!data &&
        typeof data === 'object' &&
        isDataItemArray((data as DataItemsResponse).dataItems)
    );
};

const extractCachedDataItems = (query: Query<any>): DataItem[] => {
    const cachedData = query.state.data;

    if (!cachedData) {
        return [];
    }

    if (isDataItemArray(cachedData)) {
        return cachedData;
    }

    if (isDataItemsResponse(cachedData)) {
        return cachedData.dataItems;
    }

    return [];
};

const collectCachedDataItems = (
    queryClient: ReturnType<typeof useQueryClient>,
    dataItemIds: string[],
) => {
    const idsSet = new Set(dataItemIds);
    const cachedMap = new Map<string, DataItem>();

    queryClient
        .getQueryCache()
        .findAll({
            queryKey: ['dataItems'],
            exact: false,
        })
        .flatMap(extractCachedDataItems)
        .forEach((dataItem) => {
            if (idsSet.has(dataItem.id) && !cachedMap.has(dataItem.id)) {
                cachedMap.set(dataItem.id, dataItem);
            }
        });

    const cachedItems = dataItemIds
        .map(id => cachedMap.get(id))
        .filter((dataItem): dataItem is DataItem => !!dataItem);

    const missingIds = dataItemIds.filter(id => !cachedMap.has(id));

    return {
        cachedItems,
        cachedMap,
        missingIds,
    };
};

export const useDataItemByIds = ({ dataItemIds }: Props) => {
    const dataEngine = useDataEngine();
    const queryClient = useQueryClient();

    const { cachedItems, cachedMap, missingIds } = collectCachedDataItems(
        queryClient,
        dataItemIds,
    );

    const shouldFetch = dataItemIds.length > 0 && missingIds.length > 0;

    const queryFn = async (ids: string[]): Promise<DataItem[]> => {
        const { cachedMap: freshCachedMap, missingIds: freshMissingIds } =
            collectCachedDataItems(queryClient, ids);

        if (freshMissingIds.length === 0) {
            return ids
                .map(id => freshCachedMap.get(id))
                .filter((dataItem): dataItem is DataItem => !!dataItem);
        }

        const resultsMap = new Map(freshCachedMap);
        const remainingIds = new Set(freshMissingIds);
        const fetchedItems: DataItem[] = [];

        const fetchDataElements = async (requestedIds: string[]) => {
            if (requestedIds.length === 0) {
                return [] as DataItem[];
            }

            const response = await dataEngine.query({
                dataElements: {
                    resource: 'dataElements',
                    params: {
                        fields: ['id', 'displayName', 'dimensionItemType'],
                        filter: `id:in:[${requestedIds.join(',')}]`,
                    },
                },
            }) as { dataElements: { dataElements: DataItem[] } };

            return response.dataElements?.dataElements ?? [];
        };

        const fetchIndicators = async (requestedIds: string[]) => {
            if (requestedIds.length === 0) {
                return [] as DataItem[];
            }

            const response = await dataEngine.query({
                indicators: {
                    resource: 'indicators',
                    params: {
                        fields: ['id', 'displayName', 'dimensionItemType'],
                        filter: `id:in:[${requestedIds.join(',')}]`,
                    },
                },
            }) as { indicators: { indicators: DataItem[] } };

            return response.indicators?.indicators ?? [];
        };

        const dataElements = await fetchDataElements(Array.from(remainingIds));

        if (dataElements.length > 0) {
            dataElements.forEach((dataElement) => {
                resultsMap.set(dataElement.id, dataElement);
                remainingIds.delete(dataElement.id);
                fetchedItems.push(dataElement);
            });
        }

        if (remainingIds.size > 0) {
            const indicators = await fetchIndicators(Array.from(remainingIds));

            if (indicators.length > 0) {
                indicators.forEach((indicator) => {
                    resultsMap.set(indicator.id, indicator);
                    remainingIds.delete(indicator.id);
                    fetchedItems.push(indicator);
                });
            }
        }

        return fetchedItems;
    };

    const { data, isLoading, error } = useQuery<DataItem[]>({
        queryKey: ['dataItems', missingIds],
        queryFn: () => queryFn(dataItemIds),
        enabled: shouldFetch,
        staleTime: Infinity,
        cacheTime: Infinity,
    });

    const combinedMap = new Map(cachedMap);
    data?.forEach((item) => {
        combinedMap.set(item.id, item);
    });

    const combinedItems = dataItemIds
        .map(id => combinedMap.get(id))
        .filter((dataItem): dataItem is DataItem => !!dataItem);

    return {
        dataItems: combinedItems.length > 0
            ? combinedItems
            : (!shouldFetch ? cachedItems : undefined),
        isLoading: shouldFetch ? isLoading : false,
        error,
    };
};
