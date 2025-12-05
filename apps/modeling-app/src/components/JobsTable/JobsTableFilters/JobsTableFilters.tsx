import React from 'react';
import {
    Input,
    SingleSelect,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './JobsTableFilters.module.css';
import { JOB_STATUSES, JOB_TYPES } from '../../../hooks/useJobs';
import { useJobsTableFilters } from '../hooks/useJobsTableFilters';

export const JobsTableFilters = () => {
    const { search, setSearch, status, setStatus, type, setType } = useJobsTableFilters();
    return (
        <>
            <div className={styles.inputContainer}>
                <Input
                    dense
                    placeholder={i18n.t('Search')}
                    value={search}
                    onChange={e => setSearch(e.value || undefined)}
                />
            </div>

            <div className={styles.singleSelectContainer}>
                <SingleSelect
                    dense
                    clearable
                    clearText={i18n.t('Clear')}
                    selected={status}
                    placeholder={i18n.t('Status')}
                    onChange={e => setStatus(e.selected)}
                >
                    <MenuItem
                        label={i18n.t('Pending')}
                        value={JOB_STATUSES.PENDING}
                    />
                    <MenuItem
                        label={i18n.t('Running')}
                        value={JOB_STATUSES.STARTED}
                    />
                    <MenuItem
                        label={i18n.t('Success')}
                        value={JOB_STATUSES.SUCCESS}
                    />
                    <MenuItem
                        label={i18n.t('Failed')}
                        value={JOB_STATUSES.FAILED}
                    />

                    <MenuItem
                        label={i18n.t('Revoked')}
                        value={JOB_STATUSES.REVOKED}
                    />
                </SingleSelect>
            </div>
            <div className={styles.singleSelectContainer}>
                <SingleSelect
                    dense
                    clearable
                    clearText={i18n.t('Clear')}
                    selected={type}
                    placeholder={i18n.t('Type')}
                    onChange={e => setType(e.selected)}
                >
                    <MenuItem
                        label={i18n.t('Create evaluation')}
                        value={JOB_TYPES.CREATE_BACKTEST_WITH_DATA}
                    />
                    <MenuItem
                        label={i18n.t('Make prediction')}
                        value={JOB_TYPES.MAKE_PREDICTION}
                    />
                    {/* <MenuItem
                        label={i18n.t('Create dataset (deprecated)')}
                        value={JOB_TYPES.CREATE_DATASET}
                    />
                    <MenuItem
                        label={i18n.t('Create evaluation (deprecated)')}
                        value={JOB_TYPES.BACKTEST}
                    />  */}
                </SingleSelect>
            </div>
        </>
    );
};
