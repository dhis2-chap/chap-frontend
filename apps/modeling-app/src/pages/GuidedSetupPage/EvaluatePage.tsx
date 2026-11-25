import { useCallback, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, SingleSelectField, SingleSelectOption, Tag } from '@dhis2/ui';
import { ApiError, BacktestSpecificationSummary, BacktestsService, Card, LeaderboardBacktestRead, MakeBacktestsRequest, ModelSpecRead, ModelTemplateRole } from '@dhis2-chap/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { ModelHealthNotice } from '../../components/ModelHealth/ModelHealth';
import { sortByReadiness } from '../../components/ModelExecutionForm/Sections/ModelSelector/ModelSelectionModal/ModelSelectionModal';
import { datasetSupportsModel, getBacktestColumns } from '../../components/NewDatasetForm/utils/datasetModels';
import { ForecastHorizonNotice } from '../../components/NewEvaluationForm/ForecastHorizonNotice';
import { getMinimumEvaluationPeriods, toBacktestDefaults } from '../../components/NewEvaluationForm/hooks/backtestDefaults';
import type { BacktestParameters } from '../../components/NewEvaluationForm/hooks/backtestParameters';
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
import { CustomConfigurationModal } from './CustomConfigurationModal';
import { EvaluationSettingsForm } from './EvaluationSettingsForm';
import { getTemplateName, type ModelChoice, ModelConfigurations } from './ModelConfigurations';
import { StepNav } from './StepNav';
import { useGuided } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

/** The configurations of each model, in the order of their first one. */
const groupByTemplate = (models: ModelSpecRead[]) => {
    const groups = new Map<string, ModelSpecRead[]>();
    models.forEach(model => groups.set(getTemplateName(model), [...(groups.get(getTemplateName(model)) ?? []), model]));
    return groups;
};

const PARAMETER_KEYS = ['nPeriods', 'nSplits', 'stride', 'nRetrain', 'futureWeatherProvider'] as const;

const pickParameters = (parameters: Partial<BacktestParameters>) => (
    Object.fromEntries(PARAMETER_KEYS.map(key => [key, parameters[key]])) as BacktestParameters
);

const isSameParameters = (a?: Partial<BacktestParameters>, b?: Partial<BacktestParameters>) => (
    PARAMETER_KEYS.every(key => a?.[key] === b?.[key])
);

/** Tells the evaluations of the same data apart by their settings. */
const describeEvaluation = (item: BacktestSpecificationSummary, isNewest: boolean) => [
    i18n.t('{{count}} periods ahead', { count: item.nPeriods, defaultValue: '{{count}} period ahead', defaultValue_plural: '{{count}} periods ahead' }),
    i18n.t('{{count}} splits', { count: item.nSplits, defaultValue: '{{count}} split', defaultValue_plural: '{{count}} splits' }),
    i18n.t('{{count}} models', { count: item.backtestCount, defaultValue: '{{count}} model', defaultValue_plural: '{{count}} models' }),
].join(' · ') + (isNewest ? ` (${i18n.t('newest')})` : '');

export const EvaluatePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { dataset, specification, datasetSpecifications, selectSpecification, runs, runningJobs, pathTo } = useGuided();
    const { models, isLoading, error } = useModels();
    const { modelTemplates } = useModelTemplates();
    const defaults = useBacktestParameters(dataset?.periodType);
    // The configuration to evaluate for each chosen model, by template name.
    const [choices, setChoices] = useState<Record<string, number>>({});
    // Settings the user changed on this step, and the ones being edited.
    const [editedParameters, setEditedParameters] = useState<BacktestParameters>();
    const [settingsDraft, setSettingsDraft] = useState<BacktestParameters>();
    const [customising, setCustomising] = useState<ModelChoice>();

    const columns = dataset?.covariates ?? [];
    const targetColumn = specification?.targetColumn ?? dataset?.targetColumn ?? (columns.includes('disease_cases') ? 'disease_cases' : undefined);
    // More models join the evaluation in view; a first evaluation uses Chap's default settings.
    const defaultParameters = defaults.data ? toBacktestDefaults(defaults.data) : undefined;
    const currentParameters = specification ? pickParameters(specification) : defaultParameters;
    const parameters = editedParameters ?? currentParameters;
    // Results are only comparable with the same settings, so other settings start an evaluation of their own.
    const startsNewEvaluation = !!specification && !!editedParameters && !isSameParameters(editedParameters, currentParameters);
    // Chap runs the baselines with every evaluation, so they are not offered as a choice. A configured model is named "template:configuration".
    const baselineNames = modelTemplates?.filter(template => template.role === ModelTemplateRole.BASELINE).map(template => template.name) ?? [];
    const allModels = models?.filter(model => !baselineNames.includes(getTemplateName(model))) ?? [];
    const compatibleModels = sortByReadiness(allModels.filter(model => (
        targetColumn && datasetSupportsModel(getBacktestColumns(columns, targetColumn), dataset?.periodType ?? '', model)
    )));
    const evaluatedModels = getModelsWithRun(runs, compatibleModels);
    // The picker offers each model once, with its default configuration where it has one; the configuration is chosen below it.
    const configurations = groupByTemplate(compatibleModels);
    const pickerModels = [...configurations.values()].map(items => items.find(model => !model.name.includes(':')) ?? items[0]);
    const selectedModels = Object.values(choices).flatMap(id => compatibleModels.filter(model => model.id === id));
    const modelChoices: ModelChoice[] = Object.entries(choices).map(([templateName, selectedId]) => {
        const template = modelTemplates?.find(item => item.name === templateName);
        const items = configurations.get(templateName) ?? [];
        return { templateName, selectedId, configurations: items, templateId: template?.id, displayName: template?.displayName || items[0]?.displayName || templateName };
    });
    const forecastHorizon = useForecastHorizonValidation(selectedModels, parameters?.nPeriods);

    const periodCount = countPeriods(dataset?.firstPeriod, dataset?.lastPeriod);
    const { nPeriods, nSplits, stride } = parameters ?? {};
    const requiredPeriodCount = nPeriods && nSplits && stride
        ? getMinimumEvaluationPeriods(dataset?.periodType, { nPeriods, nSplits, stride })
        : undefined;
    const isTooShort = periodCount != null && !!requiredPeriodCount && periodCount < requiredPeriodCount;
    const settingsPath = `/evaluate/benchmarks/new?datasetId=${dataset?.id}&origin=all`;

    const start = useMutation<unknown, ApiError | Error>({
        mutationFn: async () => {
            const runnable = await Promise.all(selectedModels.map(model => fetchRunnableModel(queryClient, model.id)));
            const modelIds = runnable.map(model => model.id);
            const request: MakeBacktestsRequest = specification && !startsNewEvaluation
                ? makeBenchmarkRequest(specification, modelIds, dataset!.name)
                : {
                        ...parameters,
                        name: dataset!.name,
                        datasetId: dataset!.id,
                        modelIds,
                        // Chap Core 2.6.0+ reads the target from the dataset.
                        ...(!dataset!.targetColumn && { targetColumn }),
                    };
            return BacktestsService.createBacktestsV1AnalyticsCreateBacktestsPost(request);
        },
        onSuccess: async () => {
            setChoices({});
            setEditedParameters(undefined);
            // A new evaluation is the newest, which the step follows.
            if (startsNewEvaluation) selectSpecification(undefined);
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
                                    models={pickerModels}
                                    selectedModels={pickerModels.filter(model => getTemplateName(model) in choices)}
                                    evaluatedIds={pickerModels
                                        .filter(model => configurations.get(getTemplateName(model))?.some(item => evaluatedModels.includes(item)))
                                        .map(model => model.id)}
                                    disabled={start.isLoading}
                                    hideSelection={modelChoices.length > 0}
                                    onChange={selected => setChoices(previous => Object.fromEntries(selected.map(model => (
                                        [getTemplateName(model), previous[getTemplateName(model)] ?? model.id]
                                    ))))}
                                />
                                <ModelConfigurations
                                    choices={modelChoices}
                                    disabled={start.isLoading}
                                    onCustomise={setCustomising}
                                    onChange={(templateName, modelId) => setChoices(previous => ({ ...previous, [templateName]: modelId }))}
                                    onRemove={templateName => setChoices(previous => Object.fromEntries(Object.entries(previous).filter(([name]) => name !== templateName)))}
                                />
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
                        {parameters && (settingsDraft ? (
                            <EvaluationSettingsForm
                                periodType={dataset.periodType}
                                initialValues={settingsDraft}
                                onApply={(values) => {
                                    setEditedParameters(isSameParameters(values, currentParameters) ? undefined : values);
                                    setSettingsDraft(undefined);
                                }}
                                onCancel={() => setSettingsDraft(undefined)}
                            />
                        ) : (
                            <div className={styles.settings}>
                                <span className={styles.muted}>{i18n.t('Evaluation settings')}</span>
                                <SpecificationParameters specification={parameters} />
                                <Button small secondary disabled={start.isLoading} onClick={() => setSettingsDraft(pickParameters(parameters))} dataTest="guided-evaluation-settings">
                                    {i18n.t('Change')}
                                </Button>
                            </div>
                        ))}
                        {startsNewEvaluation && (
                            <NoticeBox title={i18n.t('These settings start a new evaluation')}>
                                {i18n.t('The models you choose get a results table of their own, since results from different settings cannot be compared.')}
                                {' '}
                                <Button small secondary onClick={() => setEditedParameters(undefined)}>{i18n.t('Keep the current settings')}</Button>
                            </NoticeBox>
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
                    {datasetSpecifications.length > 1 && (
                        <SingleSelectField
                            dense
                            className={styles.evaluationSelect}
                            label={i18n.t('Evaluation')}
                            helpText={i18n.t('Each set of evaluation settings has its own results.')}
                            selected={String(specification.id)}
                            onChange={({ selected }) => selectSpecification(Number(selected))}
                            dataTest="guided-evaluation-select"
                        >
                            {datasetSpecifications.map((item, index) => (
                                <SingleSelectOption key={item.id} value={String(item.id)} label={describeEvaluation(item, index === 0)} />
                            ))}
                        </SingleSelectField>
                    )}
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
            {customising?.templateId != null && modelTemplates && (
                <CustomConfigurationModal
                    modelTemplates={modelTemplates}
                    templateId={customising.templateId}
                    onCreated={({ id }) => id != null && setChoices(previous => ({ ...previous, [customising.templateName]: id }))}
                    onClose={() => setCustomising(undefined)}
                />
            )}
        </>
    );
};
