import i18n from '@dhis2/d2-i18n';
import { z } from 'zod';
import { getPeriodsInRange } from '@dhis2-chap/core';
import type { DatasetMakeRequest } from '@dhis2-chap/ui';
import type { useDataEngine } from '@dhis2/app-runtime';
import { fetchAnalytics, fetchOrgUnits } from '../ModelExecutionForm/utils/queryUtils';
import { buildOrgUnitFeatureCollection } from '../ModelExecutionForm/utils/orgUnitGeoJson';
import type { Dhis2PeriodSettings } from '@/hooks/useDhis2PeriodSettings';

export const datasetSchema = z.object({
    name: z.string().trim().min(1, i18n.t('Name is required')),
    periodType: z.enum(['MONTH', 'WEEK']),
    fromPeriodId: z.string().min(1, i18n.t('Start period is required')),
    toPeriodId: z.string().min(1, i18n.t('End period is required')),
    orgUnits: z.array(z.object({ id: z.string(), displayName: z.string().optional(), path: z.string().optional() })).min(1, i18n.t('Select at least one organisation unit')),
    rows: z.array(z.object({
        name: z.string().trim().min(1, i18n.t('Covariate name is required')),
        source: z.string().min(1),
        dataElementId: z.string(),
        displayName: z.string(),
        dimensionItemType: z.enum(['DATA_ELEMENT', 'INDICATOR', 'PROGRAM_INDICATOR']),
    })).min(1, i18n.t('Add at least one data column')).refine(rows => rows.every(row => row.source !== 'dhis2' || row.dataElementId), i18n.t('Select a data item for every DHIS2 row'))
        .refine(rows => new Set(rows.map(row => row.name)).size === rows.length, i18n.t('Covariate names must be unique'))
        .refine(rows => rows.some(row => row.source === 'dhis2'), i18n.t('Provide at least one DHIS2 data item to define the dataset periods')),
});

export type DatasetFormValues = z.infer<typeof datasetSchema>;

export const prepareDataset = async (
    form: DatasetFormValues,
    dataEngine: ReturnType<typeof useDataEngine>,
    settings: Dhis2PeriodSettings,
): Promise<DatasetMakeRequest> => {
    const periods = getPeriodsInRange({
        startPeriodId: form.fromPeriodId,
        endPeriodId: form.toPeriodId,
        calendar: settings.calendar,
        locale: settings.locale,
    }).map(period => period.id);
    if (!periods.length) throw new Error(i18n.t('End period must be after start period'));
    const providedRows = form.rows.filter(row => row.source === 'dhis2');
    const { response } = await fetchAnalytics(
        [...new Set(providedRows.map(row => row.dataElementId))], periods, form.orgUnits.map(unit => unit.id), dataEngine,
    );
    const providedData = providedRows.flatMap(mapping => response.rows
        .filter(row => row[0] === mapping.dataElementId)
        .map(row => ({
            featureName: mapping.name,
            orgUnit: row[1],
            period: row[2],
            value: row[3] === '' || !Number.isFinite(Number(row[3])) ? null : Number(row[3]),
        })));
    if (providedRows.some(mapping => !providedData.some(observation => observation.featureName === mapping.name))) {
        throw new Error(i18n.t('Some selected data items have no observations for these periods and organisation units'));
    }
    const orgUnits = await fetchOrgUnits(response.metaData.dimensions.ou, dataEngine);
    if (!orgUnits.geojson.organisationUnits.length || orgUnits.geojson.organisationUnits.some(unit => !unit.geometry)) {
        throw new Error(i18n.t('The selected organisation units must have geometry'));
    }
    return {
        name: form.name,
        type: 'evaluation',
        geojson: buildOrgUnitFeatureCollection(orgUnits.geojson.organisationUnits),
        providedData,
        dataSources: providedRows.map(row => ({ covariate: row.name, dataElementId: row.dataElementId })),
        dataToBeFetched: form.rows.filter(row => row.source !== 'dhis2').map(row => ({ featureName: row.name, dataSourceName: row.source })),
    };
};
