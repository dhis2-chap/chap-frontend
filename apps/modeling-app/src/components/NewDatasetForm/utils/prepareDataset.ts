import i18n from '@dhis2/d2-i18n';
import { getPeriodsInRange } from '@dhis2-chap/core';
import type { DatasetMakeRequest } from '@dhis2-chap/ui';
import type { useDataEngine } from '@dhis2/app-runtime';
import { fetchAnalytics, fetchOrgUnits } from '../../ModelExecutionForm/utils/queryUtils';
import { buildOrgUnitFeatureCollection } from '../../ModelExecutionForm/utils/orgUnitGeoJson';
import type { DatasetFormValues } from '../hooks/useDatasetFormState';
import type { Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

export const prepareDataset = async (
    formData: DatasetFormValues,
    dataEngine: ReturnType<typeof useDataEngine>,
    periodSettings: Dhis2PeriodSettings,
): Promise<DatasetMakeRequest> => {
    const periods = getPeriodsInRange({
        startPeriodId: formData.fromPeriodId,
        endPeriodId: formData.toPeriodId,
        calendar: periodSettings.calendar,
        locale: periodSettings.locale,
    }).map(period => period.id);

    const { response } = await fetchAnalytics(
        [...new Set(formData.columns.map(column => column.dataItem.id))],
        periods,
        formData.orgUnits.map(orgUnit => orgUnit.id),
        dataEngine,
    );

    // A data item may be imported under several covariate names, so map per column rather than per row.
    const providedData = formData.columns.flatMap(column => response.rows
        .filter(row => row[0] === column.dataItem.id)
        .map(row => ({
            featureName: column.covariateName,
            orgUnit: row[1],
            period: row[2],
            value: row[3] === '' || !Number.isFinite(Number(row[3])) ? null : Number(row[3]),
        })));

    const emptyColumn = formData.columns.find(column => (
        !providedData.some(observation => observation.featureName === column.covariateName)
    ));
    if (emptyColumn) {
        throw new Error(i18n.t('{{covariate}} has no observations for these periods and organisation units', {
            covariate: emptyColumn.covariateName,
        }));
    }

    const { geojson } = await fetchOrgUnits(response.metaData.dimensions.ou, dataEngine);
    if (!geojson.organisationUnits.length || geojson.organisationUnits.some(orgUnit => !orgUnit.geometry)) {
        throw new Error(i18n.t('The selected organisation units must have geometry'));
    }

    return {
        name: formData.name,
        type: 'evaluation',
        geojson: buildOrgUnitFeatureCollection(geojson.organisationUnits),
        providedData,
        dataSources: formData.columns.map(column => ({
            covariate: column.covariateName,
            dataElementId: column.dataItem.id,
        })),
        dataToBeFetched: [],
    };
};
