import { beforeEach, describe, expect, it, vi } from 'vitest';
import { datasetSchema, prepareDataset, type DatasetFormValues } from './prepareDataset';
import { fetchAnalytics, fetchOrgUnits } from '../ModelExecutionForm/utils/queryUtils';

vi.mock('../ModelExecutionForm/utils/queryUtils', () => ({ fetchAnalytics: vi.fn(), fetchOrgUnits: vi.fn() }));
vi.mock('@dhis2-chap/ui', () => ({}));

const form: DatasetFormValues = {
    name: 'Reusable data', periodType: 'MONTH', fromPeriodId: '202401', toPeriodId: '202402',
    orgUnits: [{ id: 'LEVEL-2' }],
    rows: [
        { name: 'cases', source: 'dhis2', dataElementId: 'data1', displayName: 'Cases', dimensionItemType: 'DATA_ELEMENT' },
        { name: 'custom_cases', source: 'dhis2', dataElementId: 'data1', displayName: 'Cases', dimensionItemType: 'DATA_ELEMENT' },
        { name: 'rainfall', source: 'era5', dataElementId: '', displayName: '', dimensionItemType: 'DATA_ELEMENT' },
    ],
};
const settings = { calendar: 'gregory' as const, locale: 'en', timeZone: 'UTC' };
const engine = {} as Parameters<typeof prepareDataset>[1];

beforeEach(() => {
    vi.mocked(fetchAnalytics).mockResolvedValue({ response: { metaData: { dimensions: { ou: ['resolved-unit'] } }, rows: [['data1', 'resolved-unit', '202401', '12'], ['data1', 'resolved-unit', '202402', '']] } });
    vi.mocked(fetchOrgUnits).mockResolvedValue({ geojson: { organisationUnits: [{ id: 'resolved-unit', displayName: 'District', level: 2, geometry: { type: 'Polygon', coordinates: [] } }] } });
});

describe('prepareDataset', () => {
    it('preserves every chosen name and mapping, even when a data item is reused', async () => {
        const request = await prepareDataset(form, engine, settings);
        expect(request).not.toHaveProperty('modelId');
        expect(request.dataSources).toEqual([{ covariate: 'cases', dataElementId: 'data1' }, { covariate: 'custom_cases', dataElementId: 'data1' }]);
        expect(request.providedData).toEqual([
            { featureName: 'cases', orgUnit: 'resolved-unit', period: '202401', value: 12 },
            { featureName: 'cases', orgUnit: 'resolved-unit', period: '202402', value: null },
            { featureName: 'custom_cases', orgUnit: 'resolved-unit', period: '202401', value: 12 },
            { featureName: 'custom_cases', orgUnit: 'resolved-unit', period: '202402', value: null },
        ]);
        expect(request.dataToBeFetched).toEqual([{ featureName: 'rainfall', dataSourceName: 'era5' }]);
        expect(fetchOrgUnits).toHaveBeenCalledWith(['resolved-unit'], engine);
        expect(fetchAnalytics).toHaveBeenCalledWith(['data1'], ['202401', '202402'], ['LEVEL-2'], engine);
        expect(request.geojson.features[0].id).toBe('resolved-unit');
    });
    it('does not silently create a dataset missing a selected column', async () => {
        vi.mocked(fetchAnalytics).mockResolvedValue({ response: { metaData: { dimensions: { ou: [] } }, rows: [] } });
        await expect(prepareDataset(form, engine, settings)).rejects.toThrow('no observations');
    });
    it('accepts free text but rejects duplicate names and incomplete mappings', () => {
        expect(datasetSchema.safeParse(form).success).toBe(true);
        expect(datasetSchema.safeParse({ ...form, rows: [form.rows[0], { ...form.rows[1], name: ' cases ' }] }).success).toBe(false);
        expect(datasetSchema.safeParse({ ...form, rows: [{ ...form.rows[0], dataElementId: '' }] }).success).toBe(false);
        expect(datasetSchema.safeParse({ ...form, rows: [form.rows[2]] }).success).toBe(false);
    });
});
