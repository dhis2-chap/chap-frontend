import { useEffect, useRef, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox } from '@dhis2/ui';
import type { DataSetInfo } from '@dhis2-chap/ui';
import { useQueryClient } from '@tanstack/react-query';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { useDatasetFilter } from '../../components/DatasetFilter/useDatasetFilter';
import { PageHeader } from '../../features/common-features/PageHeader/PageHeader';
import { useDatasets } from '../../hooks/useDatasets';
import { Features, useIsFeatureAvailable } from '../../hooks/useIsFeatureAvailable';
import { sortByCreatedDesc } from '../../utils/sortByCreated';
import { requestMatchesSpecification } from '../BenchmarksPage/benchmarkUtils';
import { formatPeriodRange } from '../BenchmarksPage/SpecificationParameters';
import { useBacktestSpecification, useBacktestSpecifications } from '../BenchmarksPage/useBacktestSpecification';
import { useRunningBenchmarkJobs } from '../BenchmarksPage/useRunningBenchmarkJobs';
import { ChooseModelStep } from './ChooseModelStep';
import { DataStep } from './DataStep';
import { EvaluateStep } from './EvaluateStep';
import { PredictStep } from './PredictStep';
import { Step } from './Step';
import styles from './GuidedSetupPage.module.css';

type StepId = 'data' | 'evaluate' | 'choose' | 'predict';

const isSaved = (dataset: DataSetInfo): dataset is DataSetInfo & { id: number } => dataset.id != null;

/**
 * One path from data to predictions. Nothing is stored for it: the steps are read from what
 * exists in Chap for the chosen dataset, so the page picks up where anyone left off.
 */
export const GuidedSetupPage = () => {
    const queryClient = useQueryClient();
    const { datasetId, setDatasetId } = useDatasetFilter();
    // A finished step the user opened again.
    const [reopened, setReopened] = useState<StepId>();
    const { isAvailable, isLoading: isVersionLoading } = useIsFeatureAvailable(Features.BENCHMARKS);
    const datasets = useDatasets();
    const specifications = useBacktestSpecifications(isAvailable);

    const savedDatasets = sortByCreatedDesc((datasets.data ?? []).filter(isSaved));
    const importedDatasets = savedDatasets.filter(dataset => dataset.createdManually !== false);
    const dataset = datasetId ? savedDatasets.find(item => String(item.id) === datasetId) : importedDatasets[0];
    // The guided path follows the newest evaluation of the data; older ones stay under Advanced.
    const latest = specifications.data?.filter(item => item.dataset.id === dataset?.id).sort((a, b) => b.id - a.id)[0];
    const details = useBacktestSpecification(latest?.id ?? NaN);
    // The query keeps the previous evaluation while the next one loads.
    const specification = details.data?.id === latest?.id ? details.data : undefined;
    const runningJobs = useRunningBenchmarkJobs().filter(({ request }) => latest && requestMatchesSpecification(request, latest));

    // Results are written when a model finishes, so read them again.
    const runningCount = useRef(runningJobs.length);
    useEffect(() => {
        if (runningJobs.length < runningCount.current) {
            queryClient.invalidateQueries({ queryKey: ['backtest-specifications'] });
        }
        runningCount.current = runningJobs.length;
    }, [runningJobs.length, queryClient]);

    const runs = specification?.backtests ?? [];
    const chosenRuns = runs.filter(run => run.predictionSetupId != null);
    const predictionSetupIds = [...new Set(chosenRuns.map(run => run.predictionSetupId!))].sort((a, b) => b - a);
    const current: StepId = !dataset ? 'data' : !latest ? 'evaluate' : !predictionSetupIds.length ? 'choose' : 'predict';
    const close = () => setReopened(undefined);
    // The step in progress stays open; a finished step can be opened next to it.
    const stepProps = (step: StepId, reopenLabel: string) => ({
        isOpen: step === current || step === reopened,
        onClose: step === reopened && step !== current ? close : undefined,
        action: <Button small onClick={() => setReopened(step)}>{reopenLabel}</Button>,
    });

    const error = datasets.error ?? specifications.error ?? details.error;
    const isLoading = isVersionLoading || datasets.isLoading || specifications.isInitialLoading || (!!latest && !specification);

    return (
        <>
            <PageHeader
                pageTitle={i18n.t('Guided setup')}
                pageDescription={i18n.t('Four steps from your DHIS2 data to predictions.')}
            />
            {!isVersionLoading && !isAvailable ? (
                <NoticeBox title={i18n.t('Guided setup is unavailable')}>
                    {i18n.t('This Chap server is too old for the guided setup. Update Chap Core, or use the pages under Advanced.')}
                </NoticeBox>
            ) : error ? (
                <ChapErrorNotice error={error} title={i18n.t('Could not load your setup')} />
            ) : isLoading ? (
                <CircularLoader />
            ) : (
                <div className={styles.steps}>
                    <Step
                        number={1}
                        title={i18n.t('Choose data')}
                        description={i18n.t('Import the disease cases you want to predict, and the climate and population data the models use.')}
                        summary={dataset && [
                            dataset.name,
                            formatPeriodRange(dataset),
                            i18n.t('{{count}} locations', { count: dataset.orgUnits?.length ?? 0, defaultValue: '{{count}} location', defaultValue_plural: '{{count}} locations' }),
                        ].join(' · ')}
                        isDone={!!dataset}
                        {...stepProps('data', i18n.t('Change'))}
                    >
                        {datasetId && !dataset && (
                            <NoticeBox warning title={i18n.t('This data no longer exists')}>
                                {i18n.t('Choose other data to continue.')}
                            </NoticeBox>
                        )}
                        <DataStep
                            datasets={importedDatasets}
                            selected={dataset}
                            onSelect={(id) => {
                                setDatasetId(String(id));
                                close();
                            }}
                        />
                    </Step>
                    <Step
                        number={2}
                        title={i18n.t('Evaluate models')}
                        description={i18n.t('Test models on your historical data to see how well they would have predicted.')}
                        summary={[
                            runs.length > 0 && i18n.t('{{count}} models evaluated', { count: runs.length, defaultValue: '{{count}} model evaluated', defaultValue_plural: '{{count}} models evaluated' }),
                            runningJobs.length > 0 && i18n.t('{{count}} models running', { count: runningJobs.length, defaultValue: '{{count}} model running', defaultValue_plural: '{{count}} models running' }),
                        ].filter(Boolean).join(' · ') || i18n.t('No results yet')}
                        isDone={!!latest}
                        {...stepProps('evaluate', i18n.t('Evaluate more models'))}
                    >
                        {dataset && <EvaluateStep key={dataset.id} dataset={dataset} specification={specification} onStarted={close} />}
                    </Step>
                    <Step
                        number={3}
                        title={i18n.t('Choose a model')}
                        description={i18n.t('Compare the results and pick the model to use for predictions.')}
                        summary={chosenRuns.map(run => run.configuredModel?.modelTemplate?.displayName || run.configuredModel?.name || run.modelId).join(', ')}
                        isDone={chosenRuns.length > 0}
                        {...stepProps('choose', i18n.t('Compare results'))}
                    >
                        {specification && <ChooseModelStep specification={specification} runningJobs={runningJobs} onChosen={close} />}
                    </Step>
                    <Step
                        number={4}
                        title={i18n.t('Predict')}
                        description={i18n.t('Run predictions with the model you chose, then review them and import them into DHIS2.')}
                        isDone={false}
                        isOpen={current === 'predict'}
                    >
                        {predictionSetupIds.map(id => (
                            <PredictStep key={id} predictionSetupId={id} returnTo={`/guided?datasetId=${dataset?.id}`} />
                        ))}
                    </Step>
                </div>
            )}
        </>
    );
};
