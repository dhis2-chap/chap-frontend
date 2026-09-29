import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox } from '@dhis2/ui';
import { Card, MakeBacktestsResponse } from '@dhis2-chap/ui';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { AddBenchmarkModels } from './AddBenchmarkModels';
import { BenchmarkLeaderboard } from './BenchmarkLeaderboard';
import { BenchmarkRunsIndicator } from './BenchmarkRunsIndicator';
import { isValidSpecificationId, useBacktestSpecification } from './useBacktestSpecification';
import { SpecificationSummary } from './SpecificationParameters';
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
    const [jobIds, setJobIds] = useState<string[]>([]);
    const query = useBacktestSpecification(id);

    if (!isValidSpecificationId(id)) return <NoticeBox error title={i18n.t('Invalid benchmark')} />;
    if (query.isLoading) return <div className={styles.loading}><CircularLoader /></div>;
    if (query.error) return <ChapErrorNotice error={query.error} title={i18n.t('Could not load benchmark')} />;
    if (!query.data) return null;
    const specification = query.data;
    const { dataset } = specification;

    return (
        <>
            <PageHeader
                pageTitle={dataset.name}
                pageDescription={i18n.t('Benchmark {{id}}. Compare model runs that share this dataset and backtest setup.', { id: `#${id}` })}
            />
            <div className={styles.stack}>
                <Card className={styles.card}>
                    <SpecificationSummary specification={specification} orgUnitCount={specification.orgUnits.length} />
                </Card>
                {submitted && (
                    <NoticeBox title={i18n.t('Model runs queued')}>
                        {i18n.t('{{count}} model runs queued. Completed results will appear in the leaderboard.', { count: submitted.jobs.length })}
                        {' '}
                        <Link to="/jobs">{i18n.t('View jobs and failures')}</Link>
                        {submitted.specificationId !== id && (
                            <p><Link to={`/evaluate/benchmarks/${submitted.specificationId}`}>{i18n.t('Open the benchmark returned by CHAP')}</Link></p>
                        )}
                    </NoticeBox>
                )}
                <Card className={styles.card}>
                    <BenchmarkLeaderboard
                        specification={specification}
                        actions={(
                            <>
                                <BenchmarkRunsIndicator jobIds={jobIds} />
                                <Button small disabled={query.isFetching} onClick={() => query.refetch()}>{i18n.t('Refresh')}</Button>
                                <Button small primary disabled={addingModels} onClick={() => setAddingModels(true)}>{i18n.t('Add models')}</Button>
                            </>
                        )}
                    >
                        {addingModels && (
                            <AddBenchmarkModels
                                specification={specification}
                                onClose={() => setAddingModels(false)}
                                onSuccess={(result) => {
                                    setSubmitted(result);
                                    setJobIds(ids => [...ids, ...result.jobs.map(job => job.jobId)]);
                                    setAddingModels(false);
                                }}
                            />
                        )}
                    </BenchmarkLeaderboard>
                </Card>
            </div>
        </>
    );
};
