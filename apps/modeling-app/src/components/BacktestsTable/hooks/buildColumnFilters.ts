import type { ColumnFiltersState } from '@tanstack/react-table';

type BacktestsTableFilterParams = {
    modelId?: string;
    search?: string;
};

export const buildColumnFilters = ({ modelId, search }: BacktestsTableFilterParams): ColumnFiltersState => [
    ...(modelId ? [{ id: 'configuredModel.id', value: modelId }] : []),
    ...(search ? [{ id: 'name', value: search }] : []),
];
