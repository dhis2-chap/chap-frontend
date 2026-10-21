import { QueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { ModelExecutionFormValues } from '../hooks/useModelExecutionFormState';
import { getPeriodsInRange, PERIOD_TYPES, toDhis2FixedPeriodType } from '@dhis2-chap/core';
import { DataSource, ModelSpecRead, ObservationBase } from '@dhis2-chap/ui';
import { useDataEngine } from '@dhis2/app-runtime';
import { AnalyticsResponse, OrgUnitResponse, fetchAnalytics, fetchOrgUnits } from './queryUtils';
import { generateBacktestDataHash } from './hashUtils';
import { type Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';
import { fetchRunnableModel } from '@/hooks/modelsQuery';

const calculatePeriods = (
    periodType: keyof typeof PERIOD_TYPES,
    fromPeriodId: string,
    toPeriodId: string,
    periodSettings: Dhis2PeriodSettings,
): string[] => {
    const selectedPeriodType = toDhis2FixedPeriodType(periodType);
    if (!selectedPeriodType) return [];

    return getPeriodsInRange({
        startPeriodId: fromPeriodId,
        endPeriodId: toPeriodId,
        calendar: periodSettings.calendar,
        locale: periodSettings.locale,
    }).map(period => period.id);
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
    formData: ModelExecutionFormValues,
    dataEngine: ReturnType<typeof useDataEngine>,
    queryClient: QueryClient,
    periodSettings: Dhis2PeriodSettings,
): Promise<PreparedBacktestData> => {
    const model = await fetchRunnableModel(queryClient, Number(formData.modelId));

    // A copied evaluation or a model switch can leave mappings that do not match the model,
    // so only the model's own covariates are sent and each of them must be mapped.
    const covariateNames = (model.covariates ?? []).map(covariate => covariate.name);
    const covariateMappings = formData.covariateMappings.filter(mapping => covariateNames.includes(mapping.covariateName));
    const mappedNames = new Set(covariateMappings.map(mapping => mapping.covariateName));
    const unmapped = covariateNames.filter(name => !mappedNames.has(name));
    if (formData.targetMapping.covariateName !== model.target.name) {
        unmapped.push(model.target.name);
    }
    if (unmapped.length > 0) {
        throw new Error(i18n.t('Map every model covariate to a data item before starting. Not mapped{{colon}} {{names}}', {
            colon: ':',
            names: unmapped.join(', '),
        }));
    }

    const periods = calculatePeriods(
        formData.periodType,
        formData.fromPeriodId,
        formData.toPeriodId,
        periodSettings,
    );

    const mappings = [...covariateMappings, formData.targetMapping];

    const dataItems = [...new Set(mappings.map(mapping => mapping.dataItem.id))];

    const dataSources: DataSource[] = mappings.map(mapping => ({
        covariate: mapping.covariateName,
        dataElementId: mapping.dataItem.id,
    }));

    // Create a unique key of the data elements, periods, and org units for caching
    const hash = generateBacktestDataHash(dataItems, periods, formData.orgUnits.map(ou => ou.id));

    const cachedAnalyticsResponse = queryClient.getQueryData(['new-backtest-data', 'analytics', hash]) as AnalyticsResponse | undefined;

    const analyticsResponse = cachedAnalyticsResponse || await fetchAnalytics(
        dataItems,
        periods,
        formData.orgUnits.map(ou => ou.id),
        dataEngine,
    );

    if (!cachedAnalyticsResponse) {
        queryClient.setQueryData(['new-backtest-data', 'analytics', hash], analyticsResponse);
    }

    const orgUnitIds: string[] = analyticsResponse.response.metaData.dimensions.ou;

    const cachedOrgUnitResponse = queryClient.getQueryData(['new-backtest-data', 'org-units', hash]) as OrgUnitResponse | undefined;

    const orgUnitResponse = cachedOrgUnitResponse || await fetchOrgUnits(
        orgUnitIds,
        dataEngine,
    );

    if (!cachedOrgUnitResponse) {
        queryClient.setQueryData(['new-backtest-data', 'org-units', hash], orgUnitResponse);
    }

    const convertDhis2AnalyticsToChap = (data: [string, string, string, string][]): ObservationBase[] => {
        return data.flatMap((row) => {
            const dataItemId = row[0];
            // A data item mapped to several covariates is sent once for each of them.
            const dataLayers = mappings.filter(mapping => mapping.dataItem.id === dataItemId);

            if (dataLayers.length === 0) {
                throw new Error(i18n.t('Data layer not found for data item id{{escape}} {{dataItemId}}', {
                    dataItemId,
                    escape: ':',
                }));
            }

            return dataLayers.map(dataLayer => ({
                featureName: dataLayer.covariateName,
                orgUnit: row[1],
                period: row[2],
                value: parseFloat(row[3]),
            }));
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
