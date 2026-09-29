import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow, NoticeBox } from '@dhis2/ui';
import { ApiError, BacktestsService, BacktestSpecificationSummary, Card, getPeriodNameFromId } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { SpecificationParameters } from './SpecificationParameters';
import styles from './BenchmarksPage.module.css';

export const BenchmarksPage = () => {
    const query = useQuery<BacktestSpecificationSummary[], ApiError>({
        queryKey: ['backtest-specifications'],
        queryFn: () => BacktestsService.getBacktestSpecificationsV1CrudBacktestSpecificationsGet(),
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Benchmarks')}
                pageDescription={i18n.t('Compare model runs evaluated on the same dataset and backtest parameters.')}
            />
            <Card className={styles.content}>
                <div className={styles.toolbar}>
                    <span>{i18n.t('Each benchmark groups evaluations with an identical setup.')}</span>
                    <Button small disabled={query.isFetching} onClick={() => query.refetch()}>{i18n.t('Refresh')}</Button>
                </div>
                {query.isLoading ? <div className={styles.loading}><CircularLoader /></div> : query.error ? (
                    query.error.status === 404 ? (
                        <NoticeBox title={i18n.t('Benchmarks unavailable')}>
                            {i18n.t('This CHAP server does not support backtest specifications. Update CHAP Core to use benchmarks.')}
                        </NoticeBox>
                    ) : <ChapErrorNotice error={query.error} title={i18n.t('Could not load benchmarks')} />
                ) : !query.data?.length ? (
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
                                    {[i18n.t('Benchmark'), i18n.t('Dataset'), i18n.t('Period range'), i18n.t('Backtest parameters'), i18n.t('Organisation units'), i18n.t('Model runs')].map(label => (
                                        <DataTableColumnHeader key={label}>{label}</DataTableColumnHeader>
                                    ))}
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                {query.data.map(specification => (
                                    <DataTableRow key={specification.id}>
                                        <DataTableCell>
                                            <Link to={`/benchmarks/${specification.id}`}>
                                                #
                                                {specification.id}
                                            </Link>
                                        </DataTableCell>
                                        <DataTableCell><Link to={`/benchmarks/${specification.id}`}>{specification.dataset.name}</Link></DataTableCell>
                                        <DataTableCell>
                                            {specification.dataset.firstPeriod && specification.dataset.lastPeriod
                                                ? `${getPeriodNameFromId(specification.dataset.firstPeriod, 'short')} – ${getPeriodNameFromId(specification.dataset.lastPeriod, 'short')}`
                                                : '—'}
                                        </DataTableCell>
                                        <DataTableCell><SpecificationParameters specification={specification} /></DataTableCell>
                                        <DataTableCell>{specification.orgUnitCount}</DataTableCell>
                                        <DataTableCell>{specification.backtestCount}</DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTableBody>
                        </DataTable>
                    </div>
                )}
            </Card>
        </>
    );
};
