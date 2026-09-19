import { describe, expect, it } from 'vitest';
import { createDatasetFormSchema, type DatasetFormValues } from './useDatasetFormState';

const dataItem = { id: 'data1', displayName: 'Cases', dimensionItemType: 'DATA_ELEMENT' as const };

const formData: DatasetFormValues = {
    name: 'Reusable data',
    periodType: 'MONTH',
    fromPeriodId: '202401',
    toPeriodId: '202402',
    orgUnits: [{ id: 'LEVEL-2' }],
    columns: [{ covariateName: 'disease_cases', dataItem }],
};

const schema = createDatasetFormSchema({ calendar: 'gregory', locale: 'en', timeZone: 'UTC' });

describe('datasetFormSchema', () => {
    it('accepts a complete dataset', () => {
        expect(schema.safeParse(formData).success).toBe(true);
    });

    it('requires a data item and at least one column', () => {
        expect(schema.safeParse({ ...formData, columns: [{ covariateName: 'cases' }] }).success).toBe(false);
        expect(schema.safeParse({ ...formData, columns: [] }).success).toBe(false);
    });

    it('rejects duplicate covariate names, ignoring surrounding whitespace', () => {
        expect(schema.safeParse({
            ...formData,
            columns: [
                { covariateName: 'disease_cases', dataItem },
                { covariateName: ' disease_cases ', dataItem },
            ],
        }).success).toBe(false);
    });

    it('rejects a reversed period range', () => {
        expect(schema.safeParse({ ...formData, fromPeriodId: '202402', toPeriodId: '202401' }).success).toBe(false);
    });
});
