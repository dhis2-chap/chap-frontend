import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareDataset } from './prepareDataset';
import { fetchAnalytics, fetchOrgUnits } from '../../ModelExecutionForm/utils/queryUtils';
import type { DatasetFormValues } from '../hooks/useDatasetFormState';

vi.mock('../../ModelExecutionForm/utils/queryUtils', () => ({ fetchAnalytics: vi.fn(), fetchOrgUnits: vi.fn() }));
vi.mock('@dhis2-chap/ui', () => ({}));

const dataItem = { id: 'data1', displayName: 'Cases', dimensionItemType: 'DATA_ELEMENT' as const };

const formData: DatasetFormValues = {
    name: 'Reusable data',
    periodType: 'MONTH',
    fromPeriodId: '202401',
    toPeriodId: '202402',
    orgUnits: [{ id: 'LEVEL-2' }],
    columns: [
        { covariateName: 'disease_cases', dataItem },
        { covariateName: 'custom_cases', dataItem },
    ],
};

const periodSettings = { calendar: 'gregory' as const, locale: 'en', timeZone: 'UTC' };
const dataEngine = {} as Parameters<typeof prepareDataset>[1];

beforeEach(() => {
    vi.mocked(fetchAnalytics).mockResolvedValue({
        response: {
            metaData: { dimensions: { ou: ['resolved-unit'] } },
            rows: [['data1', 'resolved-unit', '202401', '12'], ['data1', 'resolved-unit', '202402', '']],
        },
    });
    vi.mocked(fetchOrgUnits).mockResolvedValue({
        geojson: {
            organisationUnits: [{
                id: 'resolved-unit',
                displayName: 'District',
                level: 2,
                geometry: { type: 'Polygon', coordinates: [] },
            }],
        },
    });
});

describe('prepareDataset', () => {
    it('keeps every chosen covariate name, even when one data item is reused', async () => {
        const { request, periods, orgUnits } = await prepareDataset(formData, dataEngine, periodSettings);

        expect(request).not.toHaveProperty('modelId');
        expect(request.dataSources).toEqual([
            { covariate: 'disease_cases', dataElementId: 'data1' },
            { covariate: 'custom_cases', dataElementId: 'data1' },
        ]);
        expect(request.providedData).toEqual([
            { featureName: 'disease_cases', orgUnit: 'resolved-unit', period: '202401', value: 12 },
            { featureName: 'disease_cases', orgUnit: 'resolved-unit', period: '202402', value: null },
            { featureName: 'custom_cases', orgUnit: 'resolved-unit', period: '202401', value: 12 },
            { featureName: 'custom_cases', orgUnit: 'resolved-unit', period: '202402', value: null },
        ]);
        expect(fetchAnalytics).toHaveBeenCalledWith(['data1'], ['202401', '202402'], ['LEVEL-2'], dataEngine);
        expect(fetchOrgUnits).toHaveBeenCalledWith(['resolved-unit'], dataEngine);
        expect(request.geojson.features[0].id).toBe('resolved-unit');
        expect(periods).toEqual(['202401', '202402']);
        expect(orgUnits).toEqual([{ id: 'resolved-unit', displayName: 'District', hasGeometry: true }]);
    });

    it('does not silently create a dataset that is missing a chosen column', async () => {
        vi.mocked(fetchAnalytics).mockResolvedValue({
            response: { metaData: { dimensions: { ou: [] } }, rows: [] },
        });

        await expect(prepareDataset(formData, dataEngine, periodSettings)).rejects.toThrow('no observations');
    });

    it('leaves out organisation units without geometry, unless none have it', async () => {
        const withoutGeometry = { level: 2, geometry: undefined as unknown as { type: string; coordinates: number[][] } };
        const withGeometry = { level: 2, geometry: { type: 'Polygon', coordinates: [] } };
        vi.mocked(fetchOrgUnits).mockResolvedValue({
            geojson: {
                organisationUnits: [
                    { id: 'resolved-unit', displayName: 'District', ...withGeometry },
                    { id: 'no-shape', displayName: 'No shape', ...withoutGeometry },
                ],
            },
        });

        const { request, orgUnits } = await prepareDataset(formData, dataEngine, periodSettings);
        expect(request.geojson.features.map(feature => feature.id)).toEqual(['resolved-unit']);
        expect(orgUnits.map(orgUnit => orgUnit.hasGeometry)).toEqual([true, false]);

        vi.mocked(fetchOrgUnits).mockResolvedValue({
            geojson: { organisationUnits: [{ id: 'no-shape', displayName: 'No shape', ...withoutGeometry }] },
        });
        await expect(prepareDataset(formData, dataEngine, periodSettings)).rejects.toThrow('geometry');
    });
});
