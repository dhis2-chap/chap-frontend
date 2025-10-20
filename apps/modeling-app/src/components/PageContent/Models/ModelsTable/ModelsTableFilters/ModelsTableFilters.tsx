import React from 'react';
import { Input } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Table } from '@tanstack/react-table';
import { ModelSpecRead } from '@dhis2-chap/ui';
import styles from './ModelsTableFilters.module.css';
import { useModelsTableFilters } from '../hooks/useModelsTableFilters';

type Props = {
    table: Table<ModelSpecRead>;
};

export const ModelsTableFilters = ({ table }: Props) => {
    const { search, setSearch } = useModelsTableFilters();

    const handleSearchChange = (value: string | undefined) => {
        const searchValue = value || undefined;
        table.getColumn('name')?.setFilterValue(searchValue);
        setSearch(searchValue);
    };

    return (
        <div className={styles.inputContainer}>
            <Input
                dense
                placeholder={i18n.t('Search')}
                value={search}
                onChange={e => handleSearchChange(e.value)}
            />
        </div>
    );
};
