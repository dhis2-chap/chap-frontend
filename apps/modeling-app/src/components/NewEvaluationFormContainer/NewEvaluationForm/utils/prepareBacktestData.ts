import { QueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { EvaluationFormValues } from '../hooks/useFormController';
import {
    DataSource,
    ModelSpecRead,
    ObservationBase,
} from '@dhis2-chap/ui';
import { useDataEngine } from '@dhis2/app-runtime';
import { PERIOD_TYPES } from '../Sections/PeriodSelector';
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
};

export const prepareBacktestData = async (
    formData: EvaluationFormValues,
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
    const hash = await generateBacktestDataHash(dataItems, periods, formData.orgUnits.map(ou => ou.id));

    const cachedAnalyticsResponse = queryClient.getQueryData(['new-backtest-data', 'analytics', hash]) as AnalyticsResponse | undefined;

    const analyticsResponse = cachedAnalyticsResponse || await dataEngine.query(
        ANALYTICS_QUERY(
            dataItems,
            periods,
            formData.orgUnits.map(ou => ou.id),
        ),
    ) as AnalyticsResponse;

    if (!cachedAnalyticsResponse) {
        queryClient.setQueryData(['new-backtest-data', 'analytics', hash], analyticsResponse);
    }

    const orgUnitIds: string[] = analyticsResponse.response.metaData.dimensions.ou;

    const cachedOrgUnitResponse = queryClient.getQueryData(['new-backtest-data', 'org-units', hash]) as OrgUnitResponse | undefined;

    const orgUnitResponse = cachedOrgUnitResponse || await dataEngine.query(
        ORG_UNITS_QUERY(orgUnitIds),
    ) as OrgUnitResponse;

    if (!cachedOrgUnitResponse) {
        queryClient.setQueryData(['new-backtest-data', 'org-units', hash], orgUnitResponse);
    }

    const orgUnitsWithoutGeometry = orgUnitResponse.geojson.organisationUnits.filter(ou => !ou.geometry);

    if (orgUnitsWithoutGeometry.length > 0) {
        throw new Error(
            i18n.t('The following org units have no geometry{{escape}} {{orgUnitsWithoutGeometry}}', {
                orgUnitsWithoutGeometry: orgUnitsWithoutGeometry.map(ou => ou.displayName).join(', '),
                escape: ':',
            }),
        );
    }

    const convertDhis2AnalyticsToChap = (data: [string, string, string, string][]): ObservationBase[] => {
        return data.map((row) => {
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
        orgUnitIds,
        hash,
        dataSources,
    };
};
