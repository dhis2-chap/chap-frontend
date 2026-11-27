import { useCallback, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, Radio, Tag } from '@dhis2/ui';
import { ApiError, BacktestSpecificationSummary, BacktestsService, Card, LeaderboardBacktestRead, MakeBacktestsRequest, ModelSpecRead, ModelTemplateRole } from '@dhis2-chap/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
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
import { Features, useIsFeatureAvailable } from '../../hooks/useIsFeatureAvailable';
import { useModels } from '../../hooks/useModels';
import { useModelTemplates } from '../../hooks/useModelTemplates';
import { getTemplateName } from '../../utils/configuredModelName';
import { hasRevisionMismatch } from '../../utils/modelHealth';
import { countPeriods } from '../../utils/periods';
import { BenchmarkRunsIndicator } from '../BenchmarksPage/BenchmarkRunsIndicator';
import { BenchmarkTable } from '../BenchmarksPage/BenchmarkTable';
import { getModelsWithRun, makeBenchmarkRequest } from '../BenchmarksPage/benchmarkUtils';
import { SpecificationParameters } from '../BenchmarksPage/SpecificationParameters';
import { CustomConfigurationModal } from './CustomConfigurationModal';
import { EvaluationSettingsForm } from './EvaluationSettingsForm';
import { FailedRunsNotice } from './FailedRunsNotice';
import { type ConfigurationChoice, DEFAULT_TRIALS, type ModelChoice, ModelConfigurations, TUNE } from './ModelConfigurations';
import { StepNav } from './StepNav';
import { useGuided } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

/** The configured models of each modeling package, in the order of their first one. */
const groupByTemplate = (models: ModelSpecRead[]) => {
    const groups = new Map<string, ModelSpecRead[]>();
    models.forEach(model => groups.set(getTemplateName(model), [...(groups.get(getTemplateName(model)) ?? []), model]));
    return groups;
};

/** The configured model that runs a modeling package as it comes, or the first one where it has none. */
const getDefaultModel = (models: ModelSpecRead[]): ModelSpecRead | undefined => models.find(model => !model.name.includes(':')) ?? models[0];

const PARAMETER_KEYS = ['nPeriods', 'nSplits', 'stride', 'nRetrain', 'futureWeatherProvider'] as const;

const pickParameters = (parameters: Partial<BacktestParameters>) => (
    Object.fromEntries(PARAMETER_KEYS.map(key => [key, parameters[key]])) as BacktestParameters
);

const isSameParameters = (a?: Partial<BacktestParameters>, b?: Partial<BacktestParameters>) => (
    PARAMETER_KEYS.every(key => a?.[key] === b?.[key])
);

/** Tells the evaluation setups of the same data apart by their main settings. */
const describeSetup = (parameters: Partial<BacktestParameters>) => [
    i18n.t('{{count}} periods ahead', { count: parameters.nPeriods, defaultValue: '{{count}} period ahead', defaultValue_plural: '{{count}} periods ahead' }),
    i18n.t('{{count}} splits', { count: parameters.nSplits, defaultValue: '{{count}} split', defaultValue_plural: '{{count}} splits' }),
].join(' · ');

const countModels = (item: BacktestSpecificationSummary) => (
    i18n.t('{{count}} models evaluated', { count: item.backtestCount, defaultValue: '{{count}} model evaluated', defaultValue_plural: '{{count}} models evaluated' })
);

export const EvaluatePage = () => {
    const queryClient = useQueryClient();
    const { dataset, specification, datasetSpecifications, selectSpecification, runs, runningJobs, failedRuns, pathTo } = useGuided();
    const { models, isLoading, error } = useModels();
    const { modelTemplates } = useModelTemplates();
    const defaults = useBacktestParameters(dataset?.periodType);
    const { isAvailable: canTune } = useIsFeatureAvailable(Features.HYPERPARAMETER_TUNING);
    // What to evaluate for each chosen modeling package, by its name: one of its configured models, or tuning.
    const [choices, setChoices] = useState<Record<string, ConfigurationChoice>>({});
    // How many configurations to try for the modeling packages that are tuned.
    const [trials, setTrials] = useState<Record<string, number>>({});
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
    // A new setup has evaluated nothing yet.
    const evaluatedModels = startsNewEvaluation ? [] : getModelsWithRun(runs, compatibleModels);
    // The picker offers each model once, with its default configuration where it has one; the configuration is chosen below it.
    const configurations = groupByTemplate(compatibleModels);
    const pickerModels = [...configurations.values()].flatMap(items => getDefaultModel(items) ?? []);
    // A model that is running has no result yet, but does not need to be started again.
    const runningModelIds = startsNewEvaluation ? [] : runningJobs.map(({ job }) => job.model_id);
    const modelChoices: ModelChoice[] = Object.entries(choices).map(([templateName, selected]) => {
        const template = modelTemplates?.find(item => item.name === templateName);
        const items = configurations.get(templateName) ?? [];
        const defaultModel = getDefaultModel(items);
        return {
            templateName,
            selected,
            configurations: items,
            evaluatedIds: items.filter(item => evaluatedModels.includes(item)).map(item => item.id),
            templateId: template?.id,
            displayName: template?.displayName || items[0]?.displayName || templateName,
            tuningUnavailable: !canTune
                ? i18n.t('needs Chap Core 2.9.0 or newer')
                : !Object.keys(template?.hpoSearchSpace ?? {}).length ? i18n.t('not supported by this modeling package') : undefined,
            tunedOptions: Object.keys(template?.hpoSearchSpace ?? {}),
            trials: trials[templateName] ?? DEFAULT_TRIALS,
            comparesWithDefault: !!defaultModel && !evaluatedModels.includes(defaultModel) && !runningModelIds.includes(defaultModel.id),
        };
    });
    const tunedChoices = modelChoices.filter(choice => choice.selected === TUNE);
    // Tuning is compared with the default configuration. Evaluating it also makes the evaluation setup the tuned model is filed under.
    const selectedModels = modelChoices.flatMap((choice) => {
        if (choice.selected !== TUNE) return choice.configurations.filter(model => model.id === choice.selected);
        const defaultModel = getDefaultModel(choice.configurations);
        return defaultModel && choice.comparesWithDefault ? [defaultModel] : [];
    });
    const evaluationCount = selectedModels.length + tunedChoices.length;
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
            let specificationId = specification && !startsNewEvaluation ? specification.id : undefined;
            if (runnable.length) {
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
                ({ specificationId } = await BacktestsService.createBacktestsV1AnalyticsCreateBacktestsPost(request));
            }
            // Tuning adds to an evaluation setup that exists, which the request above makes when there was none.
            const tuning = await Promise.allSettled(tunedChoices.map(async (choice) => {
                if (specificationId == null || choice.templateId == null) throw new Error(i18n.t('Tuning needs an evaluation setup to add to. Evaluate a model first.'));
                const defaultModel = getDefaultModel(choice.configurations);
                return BacktestsService.createHpoBacktestV1AnalyticsCreateHpoBacktestPost({
                    name: `${dataset!.name}/${i18n.t('{{model}} (tuned)', { model: choice.displayName })}`,
                    modelTemplateId: choice.templateId,
                    backtestSpecificationId: specificationId,
                    // Tuned with the covariates the default configuration comes with.
                    additionalContinuousCovariates: defaultModel?.additionalContinuousCovariates ?? [],
                    nTrials: choice.trials,
                });
            }));
            const failed = tunedChoices.filter((_, index) => tuning[index].status === 'rejected');
            if (runnable.length || failed.length < tunedChoices.length) {
                // What could not start stays chosen, so it can be tried again without starting the rest twice.
                setChoices(Object.fromEntries(failed.map(choice => [choice.templateName, TUNE])));
                setEditedParameters(undefined);
                // A new evaluation is the newest, which the step follows.
                if (startsNewEvaluation) selectSpecification(undefined);
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['jobs'] }),
                    queryClient.invalidateQueries({ queryKey: ['backtest-specifications'] }),
                ]);
            }
            const failure = tuning.find((result): result is PromiseRejectedResult => result.status === 'rejected');
            if (failure) throw failure.reason;
        },
    });

    // The results are for comparing; which model to use is chosen on the next step, so a row only says when it is in use.
    const markInUse = useCallback((run: LeaderboardBacktestRead) => (
        run.predictionSetupId != null && <Tag positive>{i18n.t('In use')}</Tag>
    ), []);

    if (!dataset) return null;

    return (
        <>
            <Card className={styles.card}>
                <div>
                    <h3 className={styles.title}>{i18n.t('Evaluation setup')}</h3>
                    <p className={styles.description}>
                        {i18n.t('Chap hides the most recent periods of your data, lets each model predict them, and scores the predictions against what actually happened. The setup says how far ahead and how many times. Results can only be compared within one setup, so each setup has results of its own.')}
                    </p>
                </div>
                {datasetSpecifications.length > 0 && (
                    <ul className={styles.list}>
                        {datasetSpecifications.map((item, index) => (
                            <li key={item.id} className={styles.listItem}>
                                <Radio
                                    name="guided-evaluation-setup"
                                    value={String(item.id)}
                                    checked={!editedParameters && specification?.id === item.id}
                                    disabled={start.isLoading}
                                    onChange={() => {
                                        setEditedParameters(undefined);
                                        selectSpecification(item.id);
                                    }}
                                    dataTest={`guided-evaluation-setup-${item.id}`}
                                    label={(
                                        <span className={styles.itemLabel}>
                                            <span className={styles.itemName}>
                                                {describeSetup(item)}
                                                {index === 0 && <span className={styles.muted}>{` · ${i18n.t('newest')}`}</span>}
                                            </span>
                                            <span className={styles.muted}>{countModels(item)}</span>
                                        </span>
                                    )}
                                />
                            </li>
                        ))}
                        {startsNewEvaluation && editedParameters && (
                            <li className={styles.listItem}>
                                <div className={styles.modelRow}>
                                    <Radio
                                        name="guided-evaluation-setup"
                                        value="new"
                                        checked
                                        dataTest="guided-evaluation-setup-new"
                                        label={(
                                            <span className={styles.itemLabel}>
                                                <span className={styles.itemName}>{`${i18n.t('New setup')} · ${describeSetup(editedParameters)}`}</span>
                                                <span className={styles.muted}>{i18n.t('Not evaluated yet. The models you evaluate next get results of their own.')}</span>
                                            </span>
                                        )}
                                    />
                                    <Button small secondary disabled={start.isLoading} onClick={() => setEditedParameters(undefined)}>{i18n.t('Discard')}</Button>
                                </div>
                            </li>
                        )}
                    </ul>
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
                        <SpecificationParameters specification={parameters} />
                        <Button small secondary disabled={start.isLoading} onClick={() => setSettingsDraft(pickParameters(parameters))} dataTest="guided-evaluation-settings">
                            {specification ? i18n.t('New evaluation setup') : i18n.t('Change settings')}
                        </Button>
                    </div>
                ))}
                {isTooShort && (
                    <NoticeBox warning title={i18n.t('Not enough history')}>
                        {i18n.t('This data has {{periodCount}} periods, but an evaluation needs at least {{requiredPeriodCount}}.', {
                            periodCount,
                            requiredPeriodCount,
                        })}
                    </NoticeBox>
                )}
                {defaults.error && <ChapErrorNotice error={defaults.error} title={i18n.t('Could not load the evaluation settings')} />}
            </Card>
            <Card className={styles.card}>
                <div>
                    <h3 className={styles.title}>{i18n.t('Choose modeling packages to evaluate')}</h3>
                    <p className={styles.description}>
                        {i18n.t('A modeling package becomes a configured model once its configuration is chosen, and a configured model is what gets evaluated. Simple baseline models are evaluated as well, so you can see whether a model beats them.')}
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
                                    label={i18n.t('Modeling packages')}
                                    selectLabel={i18n.t('Select modeling packages')}
                                    onChange={selected => setChoices(previous => Object.fromEntries(selected.map(model => (
                                        [getTemplateName(model), previous[getTemplateName(model)] ?? model.id]
                                    ))))}
                                />
                                <ModelConfigurations
                                    choices={modelChoices}
                                    disabled={start.isLoading}
                                    onCustomise={setCustomising}
                                    onChange={(templateName, selected) => setChoices(previous => ({ ...previous, [templateName]: selected }))}
                                    onTrialsChange={(templateName, count) => setTrials(previous => ({ ...previous, [templateName]: count }))}
                                    onRemove={templateName => setChoices(previous => Object.fromEntries(Object.entries(previous).filter(([name]) => name !== templateName)))}
                                />
                            </>
                        ) : (
                            <NoticeBox warning title={i18n.t('No modeling package can use this data')}>
                                {i18n.t('No modeling package matches the columns and period type of this data. Import data with the columns the modeling packages need.')}
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
                        {selectedModels.map(model => <ModelHealthNotice key={model.id} model={model} />)}
                        <ForecastHorizonNotice validation={forecastHorizon} />
                        {start.error && (
                            <ChapErrorNotice
                                error={start.error}
                                // Tuning starts after the configured models, so it is what is left when the start fails part-way.
                                title={tunedChoices.length && !selectedModels.length ? i18n.t('Could not start tuning') : i18n.t('Could not start the evaluation')}
                            />
                        )}
                        <div>
                            <Button
                                primary
                                loading={start.isLoading}
                                disabled={start.isLoading || !parameters || !evaluationCount || isTooShort || selectedModels.some(hasRevisionMismatch) || forecastHorizon.isBlocked}
                                onClick={() => start.mutate()}
                                dataTest="guided-start-evaluation"
                            >
                                {evaluationCount
                                    ? i18n.t('Evaluate {{count}} models', { count: evaluationCount, defaultValue: 'Evaluate {{count}} model', defaultValue_plural: 'Evaluate {{count}} models' })
                                    : i18n.t('Evaluate models')}
                            </Button>
                        </div>
                    </>
                )}
            </Card>
            {startsNewEvaluation && editedParameters ? (
                <Card className={styles.card}>
                    <h2 className={styles.title}>{i18n.t('Results')}</h2>
                    <NoticeBox title={i18n.t('No results for the new setup yet')}>
                        {i18n.t('Choose modeling packages above and evaluate them with {{setup}}.', { setup: describeSetup(editedParameters) })}
                    </NoticeBox>
                </Card>
            ) : specification && (
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
                        <BenchmarkTable specification={specification} title={i18n.t('Results for {{setup}}', { setup: describeSetup(specification) })} rowAction={markInUse} compareByDefault />
                    ) : !runningJobs.length && !failedRuns.length && (
                        <NoticeBox warning title={i18n.t('No results yet')}>
                            {i18n.t('No model has finished. See what happened, then evaluate the models again.')}
                            {' '}
                            <Link className={styles.link} to="/jobs">{i18n.t('View jobs')}</Link>
                        </NoticeBox>
                    )}
                    <FailedRunsNotice failedRuns={failedRuns} />
                </Card>
            )}
            <StepNav
                back={pathTo('data')}
                next={pathTo('model')}
                nextLabel={i18n.t('Continue to choose a model')}
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
