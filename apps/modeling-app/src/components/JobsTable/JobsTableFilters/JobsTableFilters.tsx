import {
    Input,
    SingleSelect,
    MenuItem,
} from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import styles from './JobsTableFilters.module.css';
import { JOB_STATUSES, JOB_TYPES } from '../../../hooks/useJobs';
import { useJobsTableFilters } from '../hooks/useJobsTableFilters';
import { DateRangePicker } from '../../DateRangePicker';

export type JobsTableFilterKey = 'date' | 'search' | 'status' | 'type';

const DEFAULT_VISIBLE_FILTERS: JobsTableFilterKey[] = ['search', 'status', 'type', 'date'];

type Props = {
    visibleFilters?: JobsTableFilterKey[];
};

export const JobsTableFilters = ({ visibleFilters = DEFAULT_VISIBLE_FILTERS }: Props) => {
    const {
        dateRange,
        search,
        setDateRange,
        setSearch,
        status,
        setStatus,
        type,
        setType,
    } = useJobsTableFilters();

    return (
        <>
            {visibleFilters.includes('search') && (
                <div className={styles.inputContainer}>
                    <Input
                        dense
                        placeholder={i18n.t('Search')}
                        value={search}
                        onChange={e => setSearch(e.value || undefined)}
                    />
                </div>
            )}

            {visibleFilters.includes('status') && (
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
            )}
            {visibleFilters.includes('type') && (
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
                    </SingleSelect>
                </div>
            )}
            {visibleFilters.includes('date') && (
                <div className={styles.dateRangeContainer}>
                    <DateRangePicker
                        value={dateRange}
                        onChange={setDateRange}
                    />
                </div>
            )}
        </>
    );
};
