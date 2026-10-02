import i18n from '@dhis2/d2-i18n';
import { CircularLoader, DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, NoticeBox } from '@dhis2/ui';
import { ApiError, BacktestsService, BacktestSpecificationSummary, Card } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { CountPill } from '../../components/CountPill';
import { DatasetOriginFilter, matchesOrigin, useDatasetOriginFilter } from '../../components/DatasetOriginFilter';
import { DatasetFilter } from '../../components/DatasetFilter/DatasetFilter';
import { useDatasetFilter } from '../../components/DatasetFilter/useDatasetFilter';
import { SpecificationParameters, formatPeriodRange } from './SpecificationParameters';
import { BenchmarkRunsIndicator } from './BenchmarkRunsIndicator';
import { BenchmarkActionsMenu } from './BenchmarkActionsMenu';
import { useRunningBenchmarkJobs } from './useRunningBenchmarkJobs';
import styles from './BenchmarksPage.module.css';

const COLUMNS = () => [
    { label: i18n.t('Dataset') },
    { label: i18n.t('Period range') },
    { label: i18n.t('Backtest parameters') },
    { label: i18n.t('Locations') },
    { label: i18n.t('Model runs') },
    { label: i18n.t('Actions') },
];

export const BenchmarksPage = () => {
    const { origin } = useDatasetOriginFilter();
    const { datasetId } = useDatasetFilter();
    const query = useQuery<BacktestSpecificationSummary[], ApiError>({
        queryKey: ['backtest-specifications'],
        queryFn: () => BacktestsService.getBacktestSpecificationsV1CrudBacktestSpecificationsGet(),
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });
    const runningJobs = useRunningBenchmarkJobs();
    const specifications = query.data ?? [];
    const visible = specifications
        .filter(specification => matchesOrigin(specification.dataset, origin))
        .filter(specification => !datasetId || specification.dataset.id.toString() === datasetId)
        .sort((a, b) => b.id - a.id);
    const columns = COLUMNS();

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Benchmarks')}
                pageDescription={i18n.t('Compare model runs evaluated on the same dataset and backtest parameters.')}
            />
            <Card className={styles.card}>
                <div className={styles.toolbar}>
                    <div className={styles.actions}>
                        <DatasetOriginFilter datasets={specifications.map(specification => specification.dataset)} />
                        <DatasetFilter datasets={specifications.map(specification => specification.dataset)} />
                    </div>
                </div>
                {query.isLoading ? <div className={styles.loading}><CircularLoader /></div> : query.error ? (
                    query.error.status === 404 ? (
                        <NoticeBox title={i18n.t('Benchmarks unavailable')}>
                            {i18n.t('This CHAP server does not support backtest specifications. Update CHAP Core to use benchmarks.')}
                        </NoticeBox>
                    ) : <ChapErrorNotice error={query.error} title={i18n.t('Could not load benchmarks')} />
                ) : !specifications.length ? (
                    <NoticeBox title={i18n.t('No benchmarks yet')}>
                        {i18n.t('Benchmarks appear when evaluations are run on a saved dataset.')}
                        {' '}
                        <Link to="/evaluate/from-dataset">{i18n.t('New evaluation')}</Link>
                    </NoticeBox>
                ) : (
                    <div className={styles.table}>
                        <DataTable>
                            <DataTableHead>
                                <DataTableRow>
                                    {columns.map(({ label }) => (
                                        <DataTableColumnHeader key={label}>{label}</DataTableColumnHeader>
                                    ))}
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                {visible.length ? visible.map(specification => (
                                    <DataTableRow key={specification.id}>
                                        <DataTableCell>
                                            <Link className={styles.strong} to={`/evaluate/benchmarks/${specification.id}`}>
                                                {specification.dataset.name}
                                            </Link>
                                            <span className={styles.muted}>{i18n.t('Benchmark {{id}}', { id: `#${specification.id}` })}</span>
                                        </DataTableCell>
                                        <DataTableCell className={styles.nowrap}>{formatPeriodRange(specification.dataset)}</DataTableCell>
                                        <DataTableCell><SpecificationParameters specification={specification} /></DataTableCell>
                                        <DataTableCell>
                                            <CountPill count={specification.orgUnitCount} tooltip={i18n.t('Evaluated on {{count}} locations', { count: specification.orgUnitCount })} />
                                        </DataTableCell>
                                        <DataTableCell>
                                            <div className={styles.runs}>
                                                <CountPill count={specification.backtestCount} tooltip={i18n.t('{{count}} model runs in this benchmark', { count: specification.backtestCount })} />
                                                <BenchmarkRunsIndicator specification={specification} runningJobs={runningJobs} />
                                            </div>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <BenchmarkActionsMenu specification={specification} />
                                        </DataTableCell>
                                    </DataTableRow>
                                )) : (
                                    <DataTableRow>
                                        <DataTableCell colSpan={String(columns.length)} align="center">
                                            {i18n.t('No benchmarks match the selected filters.')}
                                        </DataTableCell>
                                    </DataTableRow>
                                )}
                            </DataTableBody>
                        </DataTable>
                    </div>
                )}
            </Card>
        </>
    );
};
