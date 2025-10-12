import z from 'zod';
import { dataItemSchema } from '../../../components/NewEvaluationForm/hooks/useFormController';
import { useDataEngine } from '@dhis2/app-runtime';
import { Query, useQuery, useQueryClient } from '@tanstack/react-query';

type Props = {
    dataItemIds: string[];
};

type DataItem = z.infer<typeof dataItemSchema>;

// Zod schemas for validation
const dataItemsResponseSchema = z.object({ dataItems: z.array(dataItemSchema) });
const dataElementsResponseSchema = z.object({ dataElements: z.object({ dataElements: z.array(dataItemSchema) }) });
const indicatorsResponseSchema = z.object({ indicators: z.object({ indicators: z.array(dataItemSchema) }) });
const programIndicatorsResponseSchema = z.object({ programIndicators: z.object({ programIndicators: z.array(dataItemSchema) }) });

const extractCachedDataItems = (query: Query<any>): DataItem[] => {
    const cachedData = query.state.data;
    if (!cachedData) return [];

    const arrayResult = z.array(dataItemSchema).safeParse(cachedData);
    if (arrayResult.success) return arrayResult.data;

    const responseResult = dataItemsResponseSchema.safeParse(cachedData);
    return responseResult.success ? responseResult.data.dataItems : [];
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

        const fetchDataElements = async (requestedIds: string[]): Promise<DataItem[]> => {
            if (requestedIds.length === 0) return [];
            const response = await dataEngine.query({
                dataElements: {
                    resource: 'dataElements',
                    params: {
                        fields: ['id', 'displayName', 'dimensionItemType'],
                        filter: `id:in:[${requestedIds.join(',')}]`,
                    },
                },
            });
            const result = dataElementsResponseSchema.safeParse(response);
            return result.success ? result.data.dataElements.dataElements : [];
        };

        const fetchIndicators = async (requestedIds: string[]): Promise<DataItem[]> => {
            if (requestedIds.length === 0) return [];
            const response = await dataEngine.query({
                indicators: {
                    resource: 'indicators',
                    params: {
                        fields: ['id', 'displayName', 'dimensionItemType'],
                        filter: `id:in:[${requestedIds.join(',')}]`,
                    },
                },
            });
            const result = indicatorsResponseSchema.safeParse(response);
            return result.success ? result.data.indicators.indicators : [];
        };

        const fetchProgramIndicators = async (requestedIds: string[]): Promise<DataItem[]> => {
            if (requestedIds.length === 0) return [];
            const response = await dataEngine.query({
                programIndicators: {
                    resource: 'programIndicators',
                    params: {
                        fields: ['id', 'displayName', 'dimensionItemType'],
                        filter: `id:in:[${requestedIds.join(',')}]`,
                    },
                },
            });
            const result = programIndicatorsResponseSchema.safeParse(response);
            return result.success ? result.data.programIndicators.programIndicators : [];
        };

        const dataElements = await fetchDataElements(Array.from(remainingIds));
        dataElements.forEach((item) => {
            resultsMap.set(item.id, item);
            remainingIds.delete(item.id);
            fetchedItems.push(item);
        });

        if (remainingIds.size > 0) {
            const indicators = await fetchIndicators(Array.from(remainingIds));
            indicators.forEach((item) => {
                resultsMap.set(item.id, item);
                remainingIds.delete(item.id);
                fetchedItems.push(item);
            });
        }

        if (remainingIds.size > 0) {
            const programIndicators = await fetchProgramIndicators(Array.from(remainingIds));
            programIndicators.forEach((item) => {
                resultsMap.set(item.id, item);
                remainingIds.delete(item.id);
                fetchedItems.push(item);
            });
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
    data?.forEach(item => combinedMap.set(item.id, item));

    const combinedItems = dataItemIds
        .map(id => combinedMap.get(id))
        .filter((item): item is DataItem => !!item);

    return {
        dataItems: combinedItems.length > 0 ? combinedItems : (!shouldFetch ? cachedItems : undefined),
        isLoading: shouldFetch ? isLoading : false,
        error,
    };
};
