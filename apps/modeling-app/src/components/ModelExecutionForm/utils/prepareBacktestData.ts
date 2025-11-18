import { QueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { ModelExecutionFormValues } from '../hooks/useModelExecutionFormState';
import {
    DataSource,
    ModelSpecRead,
    ObservationBase,
} from '@dhis2-chap/ui';
import { useDataEngine } from '@dhis2/app-runtime';
import { PERIOD_TYPES } from '../constants';
import { toDHIS2PeriodData } from '@/utils/timePeriodUtils';
import { AnalyticsResponse, OrgUnitResponse, ANALYTICS_QUERY, ORG_UNITS_QUERY } from './queryUtils';
import { generateBacktestDataHash } from './hashUtils';

const calculatePeriods = (periodType: keyof typeof PERIOD_TYPES, fromDate: string, toDate: string): string[] => {
    const selectedPeriodType = PERIOD_TYPES[periodType];
    if (!selectedPeriodType) return [];

    const dateRange = toDHIS2PeriodData(fromDate, toDate, selectedPeriodType.toLowerCase());
    return dateRange.map(period => period.id);
};

export type PreparedBacktestData = {
    model: ModelSpecRead;
    periods: string[];
    observations: ObservationBase[];
    orgUnitResponse: OrgUnitResponse;
    orgUnitIds: string[];
    hash: string;
    dataSources: DataSource[];
    orgUnitsWithoutGeometry: { id: string; displayName: string }[];
};

export const prepareBacktestData = async (
    formData: ModelExecutionFormValues,
    dataEngine: ReturnType<typeof useDataEngine>,
    queryClient: QueryClient,
): Promise<PreparedBacktestData> => {
    const model = queryClient.getQueryData<ModelSpecRead[]>(['models'])
        ?.find(model => model.id === Number(formData.modelId));

    if (!model) {
        throw new Error(
            i18n.t('Model not found'),
        );
    }

    const periods = calculatePeriods(
        formData.periodType,
        formData.fromDate,
        formData.toDate,
    );

    const dataItems = [
        ...formData.covariateMappings.map(mapping => mapping.dataItem.id),
        formData.targetMapping.dataItem.id,
    ];

    const dataSources: DataSource[] = [
        ...formData.covariateMappings.map(mapping => ({
            covariate: mapping.covariateName,
            dataElementId: mapping.dataItem.id,
        })),
        {
            covariate: formData.targetMapping.covariateName,
            dataElementId: formData.targetMapping.dataItem.id,
        },
    ];

    // Create a unique hash of the data elements, periods, and org units for caching
    console.log('jj selected org units', formData.orgUnits);
    const hash = await generateBacktestDataHash(dataItems, periods, formData.orgUnits.map(ou => ou.id));

    // First, fetch analytics to get the actual org unit IDs (accounts for level selection)
    const cachedAnalyticsResponse = queryClient.getQueryData(['new-backtest-data', 'analytics', hash]) as AnalyticsResponse | undefined;
    console.log('jj cached analytics response', cachedAnalyticsResponse);

    const analyticsResponse = cachedAnalyticsResponse || await dataEngine.query(
        ANALYTICS_QUERY(
            dataItems,
            periods,
            formData.orgUnits.map(ou => ou.id),
        ),
    ) as AnalyticsResponse;

    // if (!cachedAnalyticsResponse) {
    //     queryClient.setQueryData(['new-backtest-data', 'analytics', hash], analyticsResponse);
    // }

    // Get the actual org unit IDs from analytics response (these account for level selection)
    const orgUnitIds: string[] = analyticsResponse.response.metaData.dimensions.ou;

    // Now fetch org units to check for geometry
    const cachedOrgUnitResponse = queryClient.getQueryData(['new-backtest-data', 'org-units', hash]) as OrgUnitResponse | undefined;

    console.log('jj cached org unit response', cachedOrgUnitResponse);
    const orgUnitResponse = cachedOrgUnitResponse || await dataEngine.query(
        ORG_UNITS_QUERY(orgUnitIds),
    ) as OrgUnitResponse;

    // Temporary test: set first org unit geometry to empty
    if (orgUnitResponse.geojson.organisationUnits.length > 0) {
        orgUnitResponse.geojson.organisationUnits[0].geometry = null as any;
    }

    // Filter out org units without geometry
    const orgUnitsWithGeometry = orgUnitResponse.geojson.organisationUnits.filter(ou => ou.geometry);
    const orgUnitsWithoutGeometry = orgUnitResponse.geojson.organisationUnits.filter(ou => !ou.geometry);
    const orgUnitIdsWithGeometry = orgUnitsWithGeometry.map(ou => ou.id);

    // Filter observations to only include org units with geometry
    const convertDhis2AnalyticsToChap = (data: [string, string, string, string][]): ObservationBase[] => {
        return data
            .filter(row => orgUnitIdsWithGeometry.includes(row[1])) // Only include org units with geometry
            .map((row) => {
                const dataItemId = row[0];
                const dataLayer = formData
                    .targetMapping
                    .dataItem
                    .id === dataItemId ? formData.targetMapping : formData.covariateMappings.find(mapping => mapping.dataItem.id === dataItemId);

                if (!dataLayer) {
                    throw new Error(i18n.t('Data layer not found for data item id{{escape}} {{dataItemId}}', {
                        dataItemId,
                        escape: ':',
                    }));
                }

                return {
                    featureName: dataLayer.covariateName,
                    orgUnit: row[1],
                    period: row[2],
                    value: parseFloat(row[3]),
                };
            });
    };

    const observations = convertDhis2AnalyticsToChap(analyticsResponse.response.rows);

    return {
        model,
        periods,
        observations,
        orgUnitResponse,
        orgUnitIds: orgUnitIdsWithGeometry,
        hash,
        dataSources,
        orgUnitsWithoutGeometry: orgUnitsWithoutGeometry.map(ou => ({ id: ou.id, displayName: ou.displayName })),
    };
};
