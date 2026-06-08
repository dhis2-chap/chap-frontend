import { useDataEngine } from '@dhis2/app-runtime';
import {
    QueryKey,
    UseQueryOptions,
    useQuery,
} from '@tanstack/react-query';

type QueryParameterValue =
    | string
    | number
    | boolean
    | Array<string | number | boolean>
    | undefined;

type ResourceQuery = {
    resource: string;
    id?: string;
    data?: unknown;
    params?: Record<string, QueryParameterValue>;
};

type UseApiDataQueryProps<
    TResultData,
    TError = Error,
    TData = TResultData,
    TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TResultData, TError, TData, TQueryKey>, 'queryFn'> & {
    query: ResourceQuery;
};

export const useApiDataQuery = <
    TResultData,
    TError = Error,
    TData = TResultData,
    TQueryKey extends QueryKey = QueryKey,
>({
    query,
    queryKey,
    ...options
}: UseApiDataQueryProps<TResultData, TError, TData, TQueryKey>) => {
    const engine = useDataEngine();

    return useQuery<TResultData, TError, TData, TQueryKey>({
        queryKey,
        queryFn: async () => {
            const response = await engine.query({
                data: query,
            });
            return response.data as TResultData;
        },
        ...options,
    });
};
