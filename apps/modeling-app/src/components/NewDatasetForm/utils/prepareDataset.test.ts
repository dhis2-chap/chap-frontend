import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareDataset } from './prepareDataset';
import { fetchAnalytics, fetchOrgUnits } from '../../ModelExecutionForm/utils/queryUtils';
import type { DatasetFormValues } from '../hooks/useDatasetFormState';
import { indexObservations } from '../../InputCompleteness/inputCompleteness';

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
    targetColumn: 'custom_cases',
    maskedRanges: [],
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
        const { request, orgUnitNames } = await prepareDataset(formData, dataEngine, periodSettings, true);

        expect(request).not.toHaveProperty('modelId');
        expect(request).not.toHaveProperty('maskedRanges');
        expect(request.targetColumn).toBe('custom_cases');
        expect(request.dataSources).toEqual([
            { covariate: 'disease_cases', dataElementId: 'data1' },
            { covariate: 'custom_cases', dataElementId: 'data1' },
        ]);
        expect(request).not.toHaveProperty('providedData');
        expect(request.providedDataColumns).toEqual({
            orgUnit: ['resolved-unit', 'resolved-unit'],
            period: ['202401', '202402'],
            values: { disease_cases: [12, null], custom_cases: [12, null] },
        });
        expect(fetchAnalytics).toHaveBeenCalledWith(['data1'], ['202401', '202402'], ['LEVEL-2'], dataEngine);
        expect(fetchOrgUnits).toHaveBeenCalledWith(['resolved-unit'], dataEngine);
        expect(request.geojson.features[0].id).toBe('resolved-unit');
        expect(orgUnitNames).toEqual(new Map([['resolved-unit', 'District']]));
    });

    it.each(['MONTH', 'WEEK'] as const)('passes named and unnamed %s masks through to Chap', async (periodType) => {
        const [start, end] = periodType === 'MONTH' ? ['202401', '202402'] : ['2024W1', '2024W2'];
        const maskedRanges = [{ start, end: start, name: 'Excluded' }, { start: end, end }];
        const { request } = await prepareDataset({
            ...formData, targetColumn: 'disease_cases', periodType, fromPeriodId: start, toPeriodId: end, maskedRanges,
        }, dataEngine, periodSettings, false);

        expect(request.maskedRanges).toEqual(maskedRanges);
    });

    it('aligns sparse, unordered features by location and period and preserves the same completeness values', async () => {
        const form = {
            ...formData,
            columns: [...formData.columns, { covariateName: 'rainfall', dataItem: { ...dataItem, id: 'rain' } }],
        };
        vi.mocked(fetchAnalytics).mockResolvedValue({
            response: {
                metaData: { dimensions: { ou: ['a', 'b'] } },
                rows: [
                    ['data1', 'a', '202402', '0'],
                    ['rain', 'b', '202401', '2.5'],
                    ['data1', 'a', '202401', 'NaN'],
                    ['rain', 'a', '202402', 'Infinity'],
                    ['data1', 'b', '202402', ''],
                    ['rain', 'b', '202402', 'not a number'],
                ],
            },
        });

        const { request } = await prepareDataset(form, dataEngine, periodSettings, true);
        const { request: legacy } = await prepareDataset(form, dataEngine, periodSettings, false);
        expect(legacy).not.toHaveProperty('providedDataColumns');
        expect(request.providedDataColumns).toEqual({
            orgUnit: ['a', 'a', 'b', 'b'],
            period: ['202402', '202401', '202402', '202401'],
            values: {
                disease_cases: [0, null, null, null],
                custom_cases: [0, null, null, null],
                rainfall: [null, null, null, 2.5],
            },
        });
        expect(indexObservations(request.providedDataColumns!)).toEqual(indexObservations(legacy.providedData!));
    });

    it('does not silently create a dataset that is missing a chosen column', async () => {
        vi.mocked(fetchAnalytics).mockResolvedValue({
            response: { metaData: { dimensions: { ou: [] } }, rows: [] },
        });

        await expect(prepareDataset(formData, dataEngine, periodSettings, true)).rejects.toThrow('no observations');
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

        const { request, orgUnitNames } = await prepareDataset(formData, dataEngine, periodSettings, true);
        expect(request.geojson.features.map(feature => feature.id)).toEqual(['resolved-unit']);
        expect([...orgUnitNames.keys()]).toEqual(['resolved-unit', 'no-shape']);

        vi.mocked(fetchOrgUnits).mockResolvedValue({
            geojson: { organisationUnits: [{ id: 'no-shape', displayName: 'No shape', ...withoutGeometry }] },
        });
        await expect(prepareDataset(formData, dataEngine, periodSettings, true)).rejects.toThrow('geometry');
    });
});
