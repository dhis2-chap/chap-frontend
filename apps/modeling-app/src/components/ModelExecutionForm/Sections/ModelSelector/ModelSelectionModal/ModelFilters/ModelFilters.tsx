import React from 'react';
import {
    Input,
    SingleSelect,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Table } from '@tanstack/react-table';
import { ModelSpecRead, PeriodType, AuthorAssessedStatus } from '@dhis2-chap/ui';
import styles from './ModelFilters.module.css';

type Props = {
    table: Table<ModelSpecRead>;
};

export const ModelFilters = ({ table }: Props) => {
    return (
        <div className={styles.filtersContainer}>
            <div className={styles.inputContainer}>
                <Input
                    dense
                    placeholder={i18n.t('Search by title')}
                    value={(table.getColumn('displayName')?.getFilterValue() as string | undefined) ?? ''}
                    onChange={e => table.getColumn('displayName')?.setFilterValue(e.value)}
                />
            </div>

            <div className={styles.filtersGroup}>
                <div className={styles.singleSelectContainer}>
                    <SingleSelect
                        dense
                        clearable
                        clearText={i18n.t('Clear')}
                        selected={table.getColumn('supportedPeriodType')?.getFilterValue() as string | undefined}
                        placeholder={i18n.t('Period Type')}
                        onChange={e => table.getColumn('supportedPeriodType')?.setFilterValue(e.selected)}
                    >
                        <MenuItem
                            key={PeriodType.WEEK}
                            className={styles.singleSelectMenuItem}
                            label={i18n.t('Weekly')}
                            value={PeriodType.WEEK}
                        />
                        <MenuItem
                            key={PeriodType.MONTH}
                            className={styles.singleSelectMenuItem}
                            label={i18n.t('Monthly')}
                            value={PeriodType.MONTH}
                        />
                        <MenuItem
                            key={PeriodType.YEAR}
                            className={styles.singleSelectMenuItem}
                            label={i18n.t('Yearly')}
                            value={PeriodType.YEAR}
                        />
                        <MenuItem
                            key={PeriodType.ANY}
                            className={styles.singleSelectMenuItem}
                            label={i18n.t('Any')}
                            value={PeriodType.ANY}
                        />
                    </SingleSelect>
                </div>

                <div className={styles.singleSelectContainer}>
                    <SingleSelect
                        dense
                        clearable
                        clearText={i18n.t('Clear')}
                        selected={table.getColumn('authorAssessedStatus')?.getFilterValue() as string | undefined}
                        placeholder={i18n.t('Assessment Status')}
                        onChange={e => table.getColumn('authorAssessedStatus')?.setFilterValue(e.selected)}
                    >
                        <MenuItem
                            key={AuthorAssessedStatus.GREEN}
                            className={styles.singleSelectMenuItem}
                            label={i18n.t('Production')}
                            value={AuthorAssessedStatus.GREEN}
                        />
                        <MenuItem
                            key={AuthorAssessedStatus.YELLOW}
                            className={styles.singleSelectMenuItem}
                            label={i18n.t('Testing')}
                            value={AuthorAssessedStatus.YELLOW}
                        />
                        <MenuItem
                            key={AuthorAssessedStatus.ORANGE}
                            className={styles.singleSelectMenuItem}
                            label={i18n.t('Limited')}
                            value={AuthorAssessedStatus.ORANGE}
                        />
                        <MenuItem
                            key={AuthorAssessedStatus.RED}
                            className={styles.singleSelectMenuItem}
                            label={i18n.t('Experimental')}
                            value={AuthorAssessedStatus.RED}
                        />
                        <MenuItem
                            key={AuthorAssessedStatus.GRAY}
                            className={styles.singleSelectMenuItem}
                            label={i18n.t('Deprecated')}
                            value={AuthorAssessedStatus.GRAY}
                        />
                    </SingleSelect>
                </div>
            </div>
        </div>
    );
};
