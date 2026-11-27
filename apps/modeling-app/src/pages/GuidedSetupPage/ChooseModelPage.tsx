import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, NoticeBox, Radio, Tag } from '@dhis2/ui';
import { AlertPolicyRead, Card, LeaderboardBacktestRead } from '@dhis2-chap/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getAlertLevelDisplay } from '../../components/BackendAlerts/alertLevelDisplay';
import { AlertLevelTag } from '../../components/BackendAlerts/AlertLevelTag';
import { CreateAlertPolicyModal } from '../../components/BackendAlerts/CreateAlertPolicyModal';
import { referenceName } from '../../components/ModelComparisons/referenceModels';
import { describeAlertLevel } from '../../components/BackendAlerts/describeAlertLevel';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { getDefaultMetricIds } from '../../components/PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { useCreatePredictionSetup } from '../../components/PageContent/EvaluationDetails/QuickActionsWidget/hooks/useCreatePredictionSetup';
import { ImportMappingFields, SetupNameField, SignalPolicyField, usePredictionSetupForm } from '../../components/PredictionSetup/MarkReadyForForecastingModal';
import { SelectionBiasSummary } from '../../components/SelectionBias/SelectionBiasSummary';
import { useAlertPolicies } from '../../hooks/useAlertPolicies';
import { BACKTESTS_LIST_QUERY_KEY } from '../../hooks/useBacktests';
import { useAlertPolicyDisplay } from '../../hooks/useAlertPolicyDisplay';
import { buildQuantileTargetsFromForm } from '../../utils/predictionSetupImportMapping';
import { getBestRunIds, getMetricIds, metricSortKey } from '../BenchmarksPage/benchmarkUtils';
import { getBaselineComparison, ModelTrustCheck } from './ModelTrustCheck';
import { StepNav } from './StepNav';
import { getRunModelName, useGuided } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

/** What the chosen policy raises, so the choice is not just a name. */
const PolicyLevels = ({ policy }: { policy: AlertPolicyRead }) => {
    const display = useAlertPolicyDisplay(policy.id);
    return (
        <div className={styles.row}>
            {(policy.levels ?? []).map(level => (
                <AlertLevelTag key={level.name} display={getAlertLevelDisplay(level.name, policy, display.data)}>
                    {describeAlertLevel(level)}
                </AlertLevelTag>
            ))}
        </div>
    );
};

export const ChooseModelPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const { dataset, specification, runs, chosenRuns, pathTo } = useGuided();
    const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
    const form = usePredictionSetupForm({ name: dataset?.name });
    const { createPredictionSetup, isCreating, error } = useCreatePredictionSetup();
    const { data: policies } = useAlertPolicies();
    const selectedPolicy = policies?.find(policy => String(policy.id) === form.watch('alert_policy_id'));

    // Models are listed by the first metric of the modeling defaults, best first.
    const metrics = specification?.metrics;
    const [metricId] = metrics ? getDefaultMetricIds(getMetricIds(runs, metrics), metrics) : [];
    const metric = metrics?.find(item => item.id === metricId);
    const getScore = (run: LeaderboardBacktestRead) => {
        const value = metric && run.aggregateMetrics[metric.id];
        return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
    };
    const getRank = (run: LeaderboardBacktestRead) => {
        const score = getScore(run);
        return score === undefined ? Infinity : metricSortKey(score, metric);
    };
    const rankedRuns = [...runs].sort((a, b) => getRank(a) - getRank(b));
    const bestRunIds = runs.length > 1 ? getBestRunIds(runs, metric) : new Set<number>();
    const selectedRun = runs.find(run => String(run.id) === searchParams.get('evaluationId') && run.predictionSetupId == null);
    // The chosen model is the only one in view; without a choice, all of them are offered.
    const visibleRuns = selectedRun ? [selectedRun] : rankedRuns;
    const chooseAnother = () => setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.delete('evaluationId');
        return next;
    }, { replace: true });

    const confirm = form.handleSubmit(async (values) => {
        if (!selectedRun) return;
        try {
            await createPredictionSetup({
                data: {
                    backtestId: selectedRun.id,
                    name: values.name,
                    quantileTargets: buildQuantileTargetsFromForm(values),
                    alertPolicyId: values.alert_policy_id ? Number(values.alert_policy_id) : null,
                },
            });
        } catch {
            // The error is shown below the form.
            return;
        }
        // The next step opens once the evaluation says which model is in use.
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['backtest-specifications'] }),
            queryClient.invalidateQueries({ queryKey: [BACKTESTS_LIST_QUERY_KEY] }),
        ]);
        navigate(pathTo('predict'));
    });

    return (
        <>
            {chosenRuns.length > 0 && (
                <NoticeBox valid title={i18n.t('In use{{colon}} {{models}}', { colon: ':', models: chosenRuns.map(getRunModelName).join(', ') })}>
                    <Link className={styles.link} to={pathTo('predict')}>{i18n.t('Go to predictions')}</Link>
                </NoticeBox>
            )}
            <form className={styles.form} onSubmit={confirm} noValidate>
                <Card className={styles.card}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.title}>{selectedRun ? i18n.t('The configured model to use') : i18n.t('Choose the configured model to use')}</h3>
                            <p className={styles.description}>
                                {i18n.t('Each row is a configured model you evaluated. The one you choose makes your predictions. Every prediction trains it on your newest data, and that trained model makes the forecast. Nothing runs until you start a prediction.')}
                            </p>
                        </div>
                        <div className={styles.actions}>
                            {selectedRun && runs.length > 1 && (
                                <Button small onClick={chooseAnother} disabled={isCreating} dataTest="guided-choose-another">
                                    {i18n.t('Choose another model')}
                                </Button>
                            )}
                            {/* The models to choose between come from the step before. */}
                            <Button small onClick={() => navigate(pathTo('evaluate'))} disabled={isCreating} dataTest="guided-evaluate-more">
                                {i18n.t('Evaluate more modeling packages')}
                            </Button>
                        </div>
                    </div>
                    <ul className={styles.list}>
                        {visibleRuns.map((run) => {
                            const score = getScore(run);
                            const isInUse = run.predictionSetupId != null;
                            const { baseline, value: improvement } = specification ? getBaselineComparison(specification, run, metric) : { baseline: undefined, value: undefined };
                            return (
                                <li key={run.id} className={styles.listItem}>
                                    <div className={styles.modelRow}>
                                        <Radio
                                            name="guided-choose-model"
                                            value={String(run.id)}
                                            checked={selectedRun?.id === run.id}
                                            disabled={isInUse || isCreating}
                                            onChange={() => setSearchParams((previous) => {
                                                const next = new URLSearchParams(previous);
                                                next.set('evaluationId', String(run.id));
                                                return next;
                                            }, { replace: true })}
                                            dataTest={`guided-choose-model-${run.id}`}
                                            label={(
                                                <span className={styles.itemLabel}>
                                                    <span className={styles.itemName}>{getRunModelName(run)}</span>
                                                    {metric && score !== undefined && (
                                                        <span className={styles.muted}>
                                                            {`${metric.displayName} ${score.toLocaleString(undefined, { maximumSignificantDigits: 4 })}`}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        />
                                        <div className={styles.row}>
                                            {improvement !== undefined && baseline && (
                                                <span className={improvement > 0 ? styles.good : styles.warn}>
                                                    {improvement > 0
                                                        ? i18n.t('Better than {{baseline}}', { baseline: referenceName(baseline) })
                                                        : i18n.t('Not better than {{baseline}}', { baseline: referenceName(baseline) })}
                                                </span>
                                            )}
                                            {metric && bestRunIds.has(run.id) && <Tag>{i18n.t('Best {{metric}}', { metric: metric.displayName })}</Tag>}
                                            {isInUse && <Tag positive>{i18n.t('In use')}</Tag>}
                                            <Link className={styles.link} to={`/evaluate/${run.id}`}>{i18n.t('View evaluation')}</Link>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {/* About the best of the evaluated models, whichever one is chosen. */}
                    {specification && (
                        <SelectionBiasSummary
                            specification={specification}
                            metric={metric}
                            getModelName={(backtestId) => {
                                const run = runs.find(item => item.id === backtestId);
                                return run && getRunModelName(run);
                            }}
                        />
                    )}
                </Card>
                {specification && selectedRun && (
                    <Card className={styles.card}>
                        <div>
                            <h3 className={styles.title}>{i18n.t('Is it good enough?')}</h3>
                            <p className={styles.description}>
                                {i18n.t('A few checks and a look at the forecasts of {{model}}. They describe the past; the next step keeps checking the model once it is in use.', { model: getRunModelName(selectedRun) })}
                            </p>
                        </div>
                        <ModelTrustCheck key={selectedRun.id} specification={specification} run={selectedRun} metric={metric} />
                    </Card>
                )}
                <Card className={styles.card}>
                    <div>
                        <h3 className={styles.title}>{i18n.t('Signals (optional)')}</h3>
                        <p className={styles.description}>
                            {i18n.t('A signal policy turns each prediction into signals, such as an outbreak alert, for someone to review before they are released.')}
                        </p>
                    </div>
                    <div className={styles.field}>
                        <SignalPolicyField form={form} onCreateSignalPolicy={() => setIsCreatingPolicy(true)} />
                    </div>
                    {selectedPolicy && <PolicyLevels policy={selectedPolicy} />}
                    <Link className={styles.link} to="/signals">{i18n.t('Manage signal policies')}</Link>
                </Card>
                <Card className={styles.card}>
                    <div>
                        <h3 className={styles.title}>{i18n.t('DHIS2 output (optional)')}</h3>
                        <p className={styles.description}>
                            {i18n.t('Predictions are imported into DHIS2 data elements after you have reviewed them. You can choose the data elements now or at the first import.')}
                        </p>
                    </div>
                    <ImportMappingFields form={form} />
                </Card>
                <Card className={styles.card}>
                    <div>
                        <h3 className={styles.title}>{i18n.t('Name')}</h3>
                        <p className={styles.description}>{i18n.t('You can change the name, the signal policy and the DHIS2 output later.')}</p>
                    </div>
                    <div className={styles.field}>
                        <SetupNameField form={form} />
                    </div>
                </Card>
                {error && <ChapErrorNotice error={error} title={i18n.t('Could not set up predictions with the model')} />}
                {!selectedRun && chosenRuns.length > 0 ? (
                    // A model is in use and no other one is chosen, so there is nothing to confirm.
                    <StepNav back={pathTo('evaluate')} next={pathTo('predict')} nextLabel={i18n.t('Continue to predictions')} />
                ) : (
                    // The button confirms everything on the step, so it sits below all of it and says so.
                    <StepNav
                        back={pathTo('evaluate')}
                        actionNote={selectedRun
                            ? i18n.t('{{model}}, with the signals, DHIS2 output and name above', { model: getRunModelName(selectedRun) })
                            : i18n.t('Choose a model first')}
                        action={(
                            <Button primary type="submit" loading={isCreating} disabled={!selectedRun || isCreating} dataTest="guided-choose-submit">
                                {i18n.t('Use this model for predictions')}
                            </Button>
                        )}
                    />
                )}
            </form>
            {isCreatingPolicy && <CreateAlertPolicyModal onClose={() => setIsCreatingPolicy(false)} />}
        </>
    );
};
