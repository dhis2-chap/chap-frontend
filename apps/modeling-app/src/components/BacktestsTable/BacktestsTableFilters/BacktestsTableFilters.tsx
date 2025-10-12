import React from 'react';
import {
    Input,
    SingleSelect,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Table } from '@tanstack/react-table';
import { BackTestRead, ModelSpecRead } from '@dhis2-chap/ui';
import styles from './BacktestsTableFilters.module.css';
import { useBacktestsTableFilters } from '../hooks/useBacktestsTableFilters';

type Props = {
    table: Table<BackTestRead>;
    models: ModelSpecRead[];
};

export const BacktestsTableFilters = ({ table, models }: Props) => {
    const { setModelId, setSearch } = useBacktestsTableFilters();

    const handleSearchChange = (value: string | undefined) => {
        const searchValue = value || undefined;
        table.getColumn('name')?.setFilterValue(searchValue);
        setSearch(searchValue);
    };

    const handleModelChange = (selected: string | undefined) => {
        table.getColumn('modelId')?.setFilterValue(selected);
        setModelId(selected);
    };

    return (
        <>
            <div className={styles.inputContainer}>
                <Input
                    dense
                    placeholder={i18n.t('Search')}
                    value={(table.getColumn('name')?.getFilterValue() as string | undefined) ?? ''}
                    onChange={e => handleSearchChange(e.value)}
                />
            </div>

            <div className={styles.singleSelectContainer}>
                <SingleSelect
                    filterable
                    noMatchText={i18n.t('No models found')}
                    dense
                    clearable
                    clearText={i18n.t('Clear')}
                    selected={table.getColumn('modelId')?.getFilterValue() as string | undefined}
                    placeholder={i18n.t('Model')}
                    onChange={e => handleModelChange(e.selected)}
                >
                    {models.map(model => (
                        <MenuItem
                            key={model.id}
                            className={styles.singleSelectMenuItem}
                            label={model.displayName ?? model.name}
                            value={model.name.toString()}
                        />
                    ))}
                </SingleSelect>
            </div>
        </>
    );
};
