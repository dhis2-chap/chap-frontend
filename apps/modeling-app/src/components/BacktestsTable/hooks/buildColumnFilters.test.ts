import { describe, expect, it } from 'vitest';
import { buildColumnFilters } from './buildColumnFilters';

describe('buildColumnFilters', () => {
    it('returns an empty array when neither filter is set', () => {
        const filters = buildColumnFilters({});

        expect(Array.isArray(filters)).toBe(true);
        expect(filters).toEqual([]);
    });

    it('returns only the model filter when modelId is set', () => {
        const filters = buildColumnFilters({ modelId: 'model-123' });

        expect(filters).toEqual([
            { id: 'configuredModel.id', value: 'model-123' },
        ]);
    });

    it('returns only the search filter when search is set', () => {
        const filters = buildColumnFilters({ search: 'malaria' });

        expect(filters).toEqual([
            { id: 'name', value: 'malaria' },
        ]);
    });

    it('returns both filters when modelId and search are set', () => {
        const filters = buildColumnFilters({ modelId: 'model-123', search: 'malaria' });

        expect(filters).toEqual([
            { id: 'configuredModel.id', value: 'model-123' },
            { id: 'name', value: 'malaria' },
        ]);
    });

    it('ignores empty-string params', () => {
        expect(buildColumnFilters({ modelId: '', search: '' })).toEqual([]);
    });
});
