import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, ButtonStrip, CircularLoader, NoticeBox } from '@dhis2/ui';
import { ApiError, BacktestsService, BacktestSpecificationRead, Card, MakeBacktestsResponse, getPeriodNameFromId } from '@dhis2-chap/ui';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { RunningJobsIndicator } from '../../components/RunningJobsIndicator';
import { JOB_TYPES } from '../../hooks/useJobs';
import { AddBenchmarkModels } from './AddBenchmarkModels';
import { BenchmarkLeaderboard } from './BenchmarkLeaderboard';
import { SpecificationParameters } from './SpecificationParameters';
import styles from './BenchmarksPage.module.css';

export const BenchmarkDetailsPage = () => {
    const { specificationId } = useParams();
    const id = Number(specificationId);
    // Keep model selection and submission feedback scoped to the current specification.
    return <BenchmarkDetails key={specificationId} id={id} />;
};

const BenchmarkDetails = ({ id }: { id: number }) => {
    const [addingModels, setAddingModels] = useState(false);
    const [submitted, setSubmitted] = useState<MakeBacktestsResponse>();
    const validId = Number.isInteger(id) && id > 0;
    const query = useQuery<BacktestSpecificationRead, ApiError>({
        queryKey: ['backtest-specifications', id],
        queryFn: () => BacktestsService.getBacktestSpecificationV1CrudBacktestSpecificationsSpecificationIdGet(id),
        enabled: validId,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    if (!validId) return <NoticeBox error title={i18n.t('Invalid benchmark')} />;
    if (query.isLoading) return <div className={styles.loading}><CircularLoader /></div>;
    if (query.error) return <ChapErrorNotice error={query.error} title={i18n.t('Could not load benchmark')} />;
    if (!query.data) return null;
    const specification = query.data;
    const { dataset } = specification;

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Benchmark {{id}} — {{dataset}}', { id, dataset: dataset.name })}
                pageDescription={i18n.t('Compare model runs with the same evaluation setup.')}
            />
            <Card className={styles.content}>
                <div className={styles.toolbar}>
                    <Link to="/benchmarks">{i18n.t('All benchmarks')}</Link>
                    <ButtonStrip>
                        <RunningJobsIndicator jobType={JOB_TYPES.BACKTEST} />
                        <Button small disabled={query.isFetching} onClick={() => query.refetch()}>{i18n.t('Refresh')}</Button>
                        <Button small primary disabled={addingModels} onClick={() => setAddingModels(true)}>{i18n.t('Add models')}</Button>
                    </ButtonStrip>
                </div>
                <p className={styles.parameters}>
                    {dataset.firstPeriod && dataset.lastPeriod
                        ? `${getPeriodNameFromId(dataset.firstPeriod, 'short')} – ${getPeriodNameFromId(dataset.lastPeriod, 'short')} · `
                        : ''}
                    {i18n.t('Organisation units ({{count}})', { count: specification.orgUnits.length })}
                </p>
                <SpecificationParameters specification={specification} />
                {submitted && (
                    <NoticeBox title={i18n.t('Model runs queued')}>
                        {i18n.t('{{count}} model runs queued. Completed results will appear in the leaderboard.', { count: submitted.jobs.length })}
                        {' '}
                        <Link to="/jobs">{i18n.t('View jobs and failures')}</Link>
                        {submitted.specificationId !== id && (
                            <p><Link to={`/benchmarks/${submitted.specificationId}`}>{i18n.t('Open the benchmark returned by CHAP')}</Link></p>
                        )}
                    </NoticeBox>
                )}
                {addingModels && (
                    <AddBenchmarkModels
                        specification={specification}
                        onClose={() => setAddingModels(false)}
                        onSuccess={(result) => {
                            setSubmitted(result);
                            setAddingModels(false);
                        }}
                    />
                )}
                <BenchmarkLeaderboard specification={specification} />
            </Card>
        </>
    );
};
