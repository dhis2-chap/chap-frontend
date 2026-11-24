import type { useDataEngine } from '@dhis2/app-runtime';
import type { QueryClient } from '@tanstack/react-query';
import { generateBacktestDataHash } from './hashUtils';
import { fetchAnalytics, fetchOrgUnits } from './queryUtils';

/** Share the fetched inputs between a check and an import, rebuilding the request from the current form. */
export const fetchDhis2Data = async (
    dataItems: string[],
    periods: string[],
    orgUnits: string[],
    dataEngine: ReturnType<typeof useDataEngine>,
    queryClient: QueryClient,
    onProgress?: (message: string) => void,
) => {
    const hash = generateBacktestDataHash(dataItems, periods, orgUnits);
    const analyticsResponse = await queryClient.fetchQuery({
        queryKey: ['new-backtest-data', 'analytics', hash],
        queryFn: () => fetchAnalytics(dataItems, periods, orgUnits, dataEngine, onProgress),
        staleTime: Infinity,
        retry: false,
    });
    const orgUnitIds = analyticsResponse.response.metaData.dimensions.ou;
    const orgUnitResponse = await queryClient.fetchQuery({
        queryKey: ['new-backtest-data', 'org-units', hash],
        queryFn: () => fetchOrgUnits(orgUnitIds, dataEngine, onProgress),
        staleTime: Infinity,
        retry: false,
    });
    return { analyticsResponse, orgUnitResponse, orgUnitIds, hash };
};
