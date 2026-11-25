import { useCallback, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, Checkbox, CircularLoader, NoticeBox, Tag } from '@dhis2/ui';
import { ApiError, BacktestsService, Card, LeaderboardBacktestRead, MakeBacktestsRequest, ModelSpecRead, ModelTemplateRole } from '@dhis2-chap/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { ModelHealthNotice } from '../../components/ModelHealth/ModelHealth';
import { sortByReadiness } from '../../components/ModelExecutionForm/Sections/ModelSelector/ModelSelectionModal/ModelSelectionModal';
import { datasetSupportsModel, getBacktestColumns } from '../../components/NewDatasetForm/utils/datasetModels';
import { ForecastHorizonNotice } from '../../components/NewEvaluationForm/ForecastHorizonNotice';
import { getMinimumEvaluationPeriods, toBacktestDefaults } from '../../components/NewEvaluationForm/hooks/backtestDefaults';
import { useForecastHorizonValidation } from '../../components/NewEvaluationForm/hooks/useForecastHorizonValidation';
import { ModelsSelector } from '../../components/NewEvaluationForm/DatasetEvaluationForm/ModelsSelector/ModelsSelector';
import { fetchRunnableModel } from '../../hooks/modelsQuery';
import { useBacktestParameters } from '../../hooks/useBacktestParameters';
import { useModels } from '../../hooks/useModels';
import { useModelTemplates } from '../../hooks/useModelTemplates';
import { hasRevisionMismatch } from '../../utils/modelHealth';
import { countPeriods } from '../../utils/periods';
import { BenchmarkRunsIndicator } from '../BenchmarksPage/BenchmarkRunsIndicator';
import { BenchmarkTable } from '../BenchmarksPage/BenchmarkTable';
import { getModelsWithRun, makeBenchmarkRequest } from '../BenchmarksPage/benchmarkUtils';
import { SpecificationParameters } from '../BenchmarksPage/SpecificationParameters';
import { StepNav } from './StepNav';
import { useGuided } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

/** A configured model is named "template:configuration". */
const getTemplateName = (model: ModelSpecRead) => model.name.split(':')[0];

export const EvaluatePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { dataset, specification, runs, runningJobs, pathTo } = useGuided();
    const { models, isLoading, error } = useModels();
    const { modelTemplates } = useModelTemplates();
    const defaults = useBacktestParameters(dataset?.periodType);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const columns = dataset?.covariates ?? [];
    const targetColumn = specification?.targetColumn ?? dataset?.targetColumn ?? (columns.includes('disease_cases') ? 'disease_cases' : undefined);
    // More models join the evaluation that exists; a first evaluation uses Chap's default settings.
    const defaultParameters = defaults.data ? toBacktestDefaults(defaults.data) : undefined;
    const parameters = specification ?? defaultParameters;
    // Chap runs the baselines with every evaluation, so they are not offered as a choice. A configured model is named "template:configuration".
    const baselineNames = modelTemplates?.filter(template => template.role === ModelTemplateRole.BASELINE).map(template => template.name) ?? [];
    const allModels = models?.filter(model => !baselineNames.includes(getTemplateName(model))) ?? [];
    const compatibleModels = sortByReadiness(allModels.filter(model => (
        targetColumn && datasetSupportsModel(getBacktestColumns(columns, targetColumn), dataset?.periodType ?? '', model)
    )));
    const selectedModels = compatibleModels.filter(model => selectedIds.includes(model.id));
    const evaluatedModels = getModelsWithRun(runs, compatibleModels);
    const forecastHorizon = useForecastHorizonValidation(selectedModels, parameters?.nPeriods);

    const periodCount = countPeriods(dataset?.firstPeriod, dataset?.lastPeriod);
    const { nPeriods, nSplits, stride } = parameters ?? {};
    const requiredPeriodCount = nPeriods && nSplits && stride
        ? getMinimumEvaluationPeriods(dataset?.periodType, { nPeriods, nSplits, stride })
        : undefined;
    const isTooShort = periodCount != null && !!requiredPeriodCount && periodCount < requiredPeriodCount;
    const settingsPath = `/evaluate/benchmarks/new?datasetId=${dataset?.id}&origin=all&returnTo=${encodeURIComponent(pathTo('evaluate'))}`;

    const start = useMutation<unknown, ApiError | Error>({
        mutationFn: async () => {
            const runnable = await Promise.all(selectedModels.map(model => fetchRunnableModel(queryClient, model.id)));
            const modelIds = runnable.map(model => model.id);
            const request: MakeBacktestsRequest = specification
                ? makeBenchmarkRequest(specification, modelIds, dataset!.name)
                : {
                        ...defaultParameters,
                        name: dataset!.name,
                        datasetId: dataset!.id,
                        modelIds,
                        // Chap Core 2.6.0+ reads the target from the dataset.
                        ...(!dataset!.targetColumn && { targetColumn }),
                    };
            return BacktestsService.createBacktestsV1AnalyticsCreateBacktestsPost(request);
        },
        onSuccess: async () => {
            setSelectedIds([]);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['jobs'] }),
                queryClient.invalidateQueries({ queryKey: ['backtest-specifications'] }),
            ]);
        },
    });

    const promote = useCallback((run: LeaderboardBacktestRead) => (run.predictionSetupId == null ? (
        <span className={styles.nowrap}>
            <Button small primary onClick={() => navigate(`${pathTo('promote')}&evaluationId=${run.id}`)} dataTest={`guided-promote-${run.id}`}>
                {i18n.t('Promote')}
            </Button>
        </span>
    ) : (
        <Tag positive>{i18n.t('Promoted')}</Tag>
    )), [navigate, pathTo]);

    if (!dataset) return null;

    return (
        <>
            <Card className={styles.card}>
                <div>
                    <h3 className={styles.title}>{i18n.t('Choose models to evaluate')}</h3>
                    <p className={styles.description}>
                        {i18n.t('Chap hides the most recent periods of your data, lets each model predict them, and scores the predictions against what actually happened. Simple baseline models are run as well, so you can see whether a model beats them.')}
                    </p>
                </div>
                {isLoading || defaults.isInitialLoading ? <CircularLoader small /> : error ? (
                    <ChapErrorNotice error={error} title={i18n.t('Could not load models')} />
                ) : !targetColumn ? (
                    <NoticeBox warning title={i18n.t('This data has no target column')}>
                        {i18n.t('Choose what to predict when you start the evaluation.')}
                        {' '}
                        <Link className={styles.link} to={settingsPath}>{i18n.t('Open evaluation settings')}</Link>
                    </NoticeBox>
                ) : (
                    <>
                        {compatibleModels.length ? (
                            <>
                                <ModelsSelector
                                    models={compatibleModels}
                                    selectedModels={selectedModels}
                                    evaluatedIds={evaluatedModels.map(model => model.id)}
                                    disabled={start.isLoading}
                                    onChange={selected => setSelectedIds(selected.map(model => model.id))}
                                />
                                {/* Chap Core is getting a way to tune a model's hyperparameters for the data; until then the option is only shown. */}
                                <span className={styles.row} title={i18n.t('Hyperparameter optimisation (HPO) tries many values for the hyperparameters of a model on your data and keeps the best.')}>
                                    <Checkbox dense disabled checked={false} label={i18n.t('Tune hyperparameters automatically')} />
                                    <Tag>{i18n.t('Coming soon')}</Tag>
                                </span>
                            </>
                        ) : (
                            <NoticeBox warning title={i18n.t('No model can use this data')}>
                                {i18n.t('No model matches the columns and period type of this data. Import data with the columns the models need.')}
                            </NoticeBox>
                        )}
                        {allModels.length > compatibleModels.length && compatibleModels.length > 0 && (
                            <p className={styles.muted}>
                                {i18n.t('{{count}} other models need columns or a period type this data does not have.', {
                                    count: allModels.length - compatibleModels.length,
                                    defaultValue: '{{count}} other model needs columns or a period type this data does not have.',
                                    defaultValue_plural: '{{count}} other models need columns or a period type this data does not have.',
                                })}
                            </p>
                        )}
                        {parameters && (
                            <div className={styles.settings}>
                                <span className={styles.muted}>{i18n.t('Evaluation settings')}</span>
                                <SpecificationParameters specification={parameters} />
                                {/* Other settings start a new evaluation, which the guided setup then follows. */}
                                <Link className={styles.link} to={settingsPath} data-test="guided-evaluation-settings">
                                    {specification ? i18n.t('Evaluate with other settings') : i18n.t('Change')}
                                </Link>
                            </div>
                        )}
                        {isTooShort && (
                            <NoticeBox warning title={i18n.t('Not enough history')}>
                                {i18n.t('This data has {{periodCount}} periods, but an evaluation needs at least {{requiredPeriodCount}}.', {
                                    periodCount,
                                    requiredPeriodCount,
                                })}
                            </NoticeBox>
                        )}
                        {selectedModels.map(model => <ModelHealthNotice key={model.id} model={model} />)}
                        <ForecastHorizonNotice validation={forecastHorizon} />
                        {defaults.error && <ChapErrorNotice error={defaults.error} title={i18n.t('Could not load the evaluation settings')} />}
                        {start.error && <ChapErrorNotice error={start.error} title={i18n.t('Could not start the evaluation')} />}
                        <div>
                            <Button
                                primary
                                loading={start.isLoading}
                                disabled={start.isLoading || !parameters || !selectedModels.length || isTooShort || selectedModels.some(hasRevisionMismatch) || forecastHorizon.isBlocked}
                                onClick={() => start.mutate()}
                                dataTest="guided-start-evaluation"
                            >
                                {selectedModels.length
                                    ? i18n.t('Evaluate {{count}} models', { count: selectedModels.length, defaultValue: 'Evaluate {{count}} model', defaultValue_plural: 'Evaluate {{count}} models' })
                                    : i18n.t('Evaluate models')}
                            </Button>
                        </div>
                    </>
                )}
            </Card>
            {specification && (
                <Card className={styles.card}>
                    {runningJobs.length > 0 && (
                        <div className={styles.row}>
                            <BenchmarkRunsIndicator specification={specification} runningJobs={runningJobs} />
                            <span className={styles.muted}>
                                {i18n.t('This can take a while. You can leave this page; the results will be here when you come back.')}
                            </span>
                            <Link className={styles.link} to="/jobs">{i18n.t('View progress')}</Link>
                        </div>
                    )}
                    {runs.length > 0 ? (
                        <BenchmarkTable specification={specification} title={i18n.t('Results')} rowAction={promote} compareByDefault />
                    ) : !runningJobs.length && (
                        <NoticeBox warning title={i18n.t('No results yet')}>
                            {i18n.t('No model has finished. See what happened, then evaluate the models again.')}
                            {' '}
                            <Link className={styles.link} to="/jobs">{i18n.t('View jobs')}</Link>
                        </NoticeBox>
                    )}
                </Card>
            )}
            <StepNav
                back={pathTo('data')}
                next={pathTo('promote')}
                nextLabel={i18n.t('Continue to promotion')}
                blockedReason={runs.length ? undefined : runningJobs.length ? i18n.t('Waiting for a model to finish') : i18n.t('Evaluate a model first')}
            />
        </>
    );
};
