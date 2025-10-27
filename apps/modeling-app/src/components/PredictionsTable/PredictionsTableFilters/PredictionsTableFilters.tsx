import React from 'react';
import {
    Input,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Table } from '@tanstack/react-table';
import { PredictionBaseRead } from '@dhis2-chap/ui';
import styles from './PredictionsTableFilters.module.css';

type Props = {
    table: Table<PredictionBaseRead>;
};

export const PredictionsTableFilters = ({ table }: Props) => {
    return (
        <div className={styles.inputContainer}>
            <Input
                dense
                placeholder={i18n.t('Search')}
                value={(table.getColumn('name')?.getFilterValue() as string | undefined) ?? ''}
                onChange={e => table.getColumn('name')?.setFilterValue(e.value)}
            />
        </div>
    );
};
