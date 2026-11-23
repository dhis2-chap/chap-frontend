import i18n from '@dhis2/d2-i18n';
import { Button, Card, CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption } from '@dhis2/ui';
import { Link, useNavigate } from 'react-router-dom';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { useDatasetFilter } from '../../components/DatasetFilter/useDatasetFilter';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { useDatasets } from '../../hooks/useDatasets';
import { Features, useIsFeatureAvailable } from '../../hooks/useIsFeatureAvailable';
import styles from './WorkflowPage.module.css';

export const WorkflowPage = () => {
    const navigate = useNavigate();
    const datasets = useDatasets();
    const { datasetId, setDatasetId } = useDatasetFilter();
    const { isAvailable: hasBenchmarks, isLoading: isVersionLoading } = useIsFeatureAvailable(Features.BENCHMARKS);
    const savedDatasets = (datasets.data ?? []).filter(dataset => dataset.id != null);
    const dataset = savedDatasets.find(item => String(item.id) === datasetId);
    // Resolve the selection against the server before offering dataset-specific actions.
    const canContinue = !!dataset && !datasets.isLoading && !datasets.error && !isVersionLoading;
    const params = new URLSearchParams({ datasetId: String(dataset?.id), origin: 'all' });
    const evaluationPath = hasBenchmarks ? '/evaluate/benchmarks/new' : '/evaluate/from-dataset';
    const reviewPath = hasBenchmarks ? '/evaluate/benchmarks' : '/evaluate';

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Evaluate & predict')}
                pageDescription={i18n.t('Prepare data once, compare models on the same data, then choose a model for predictions.')}
            />
            <div className={styles.stack}>
                <NoticeBox title={i18n.t('Workflow preview')}>
                    {i18n.t('Explore a simpler way through the existing tools. Model selection and promotion are still decisions you make.')}
                </NoticeBox>
                <Card>
                    <section className={styles.section} aria-labelledby="workflow-data">
                        <h3 id="workflow-data">{i18n.t('Start with your data')}</h3>
                        <p>{i18n.t('A saved dataset keeps the target, periods, locations and data sources together. Reuse it for every model you want to compare.')}</p>
                        {datasets.isLoading ? <CircularLoader small /> : datasets.error ? (
                            <ChapErrorNotice error={datasets.error} title={i18n.t('Could not load datasets')}>
                                <Button small onClick={() => datasets.refetch()}>{i18n.t('Retry')}</Button>
                            </ChapErrorNotice>
                        ) : (
                            <>
                                <SingleSelectField
                                    className={styles.datasetField}
                                    label={i18n.t('Dataset')}
                                    placeholder={i18n.t('Choose a saved dataset')}
                                    selected={dataset ? String(dataset.id) : ''}
                                    filterable
                                    clearable
                                    dataTest="workflow-dataset-select"
                                    onChange={({ selected }) => setDatasetId(selected)}
                                >
                                    {savedDatasets.map(item => (
                                        <SingleSelectOption key={item.id} value={String(item.id)} label={item.name} />
                                    ))}
                                </SingleSelectField>
                                {datasetId && !dataset && (
                                    <NoticeBox warning title={i18n.t('Dataset unavailable')}>
                                        {i18n.t('Choose another dataset. The dataset in this link may have been removed.')}
                                    </NoticeBox>
                                )}
                                {!savedDatasets.length && (
                                    <p>{i18n.t('Create a dataset before evaluating models.')}</p>
                                )}
                                <div className={styles.links}>
                                    {dataset && <Link to={`/datasets/${dataset.id}`}>{i18n.t('Inspect selected dataset')}</Link>}
                                    <Link to="/datasets/new">{i18n.t('Create dataset')}</Link>
                                    <Link to="/datasets">{i18n.t('Manage datasets')}</Link>
                                </div>
                            </>
                        )}
                    </section>
                </Card>
                <div className={styles.tasks}>
                    <Card>
                        <section className={styles.section} aria-labelledby="workflow-evaluate">
                            <h3 id="workflow-evaluate">{i18n.t('1. Set up evaluation')}</h3>
                            <p>{i18n.t('Choose compatible models and evaluate them with the same backtest settings. You can leave while Chap runs the jobs.')}</p>
                            <Button primary disabled={!canContinue} onClick={() => navigate(`${evaluationPath}?${params}`)}>
                                {i18n.t('Evaluate models')}
                            </Button>
                            <Link to="/jobs">{i18n.t('View jobs and failures')}</Link>
                        </section>
                    </Card>
                    <Card>
                        <section className={styles.section} aria-labelledby="workflow-review">
                            <h3 id="workflow-review">{i18n.t('2. Review & promote')}</h3>
                            <p>{i18n.t('Compare results and baselines for the same evaluation settings. Open an evaluation to inspect its forecasts and create a prediction setup when it is suitable.')}</p>
                            <Button disabled={!canContinue} onClick={() => navigate(`${reviewPath}?${params}`)}>
                                {i18n.t('Review results')}
                            </Button>
                            {!isVersionLoading && <Link to={reviewPath}>{i18n.t('Review all results')}</Link>}
                        </section>
                    </Card>
                    <Card>
                        <section className={styles.section} aria-labelledby="workflow-predict">
                            <h3 id="workflow-predict">{i18n.t('3. Predict & monitor')}</h3>
                            <p>{i18n.t('Open a prediction setup to run forecasts, inspect predictions and review raised signals. This includes setups from all datasets.')}</p>
                            <Button onClick={() => navigate('/predictions')}>{i18n.t('Open prediction setups')}</Button>
                            <Link to="/signals">{i18n.t('Manage signal policies')}</Link>
                        </section>
                    </Card>
                </div>
            </div>
        </>
    );
};
