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
import { useAlertPolicies } from '../../hooks/useAlertPolicies';
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

export const PromotePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const { dataset, specification, runs, promotedRuns, pathTo } = useGuided();
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
    // A model chosen on the evaluation step is the only one in view; without a choice, all of them are offered.
    const visibleRuns = selectedRun ? [selectedRun] : rankedRuns;
    const chooseAnother = () => setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.delete('evaluationId');
        return next;
    }, { replace: true });

    const promote = form.handleSubmit(async (values) => {
        try {
            await createPredictionSetup({
                data: {
                    backtestId: selectedRun!.id,
                    name: values.name,
                    quantileTargets: buildQuantileTargetsFromForm(values),
                    alertPolicyId: values.alert_policy_id ? Number(values.alert_policy_id) : null,
                },
            });
        } catch {
            // The error is shown below the form.
            return;
        }
        // The next step opens once the evaluation says which model is promoted.
        await queryClient.invalidateQueries({ queryKey: ['backtest-specifications'] });
        navigate(pathTo('predict'));
    });

    return (
        <>
            {promotedRuns.length > 0 && (
                <NoticeBox valid title={i18n.t('Promoted{{colon}} {{models}}', { colon: ':', models: promotedRuns.map(getRunModelName).join(', ') })}>
                    <Link className={styles.link} to={pathTo('predict')}>{i18n.t('Go to predictions')}</Link>
                </NoticeBox>
            )}
            <form className={styles.form} onSubmit={promote} noValidate>
                <Card className={styles.card}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h3 className={styles.title}>{selectedRun ? i18n.t('The model to promote') : i18n.t('Choose the model to promote')}</h3>
                            <p className={styles.description}>
                                {i18n.t('Promoting a model makes it the one that produces your predictions. Nothing runs until you start a prediction.')}
                            </p>
                        </div>
                        {selectedRun && runs.length > 1 && (
                            <span className={styles.nowrap}>
                                <Button small onClick={chooseAnother} disabled={isCreating} dataTest="guided-promote-choose-another">
                                    {i18n.t('Choose another model')}
                                </Button>
                            </span>
                        )}
                    </div>
                    <ul className={styles.list}>
                        {visibleRuns.map((run) => {
                            const score = getScore(run);
                            const isPromoted = run.predictionSetupId != null;
                            const { baseline, value: improvement } = specification ? getBaselineComparison(specification, run, metric) : { baseline: undefined, value: undefined };
                            return (
                                <li key={run.id} className={styles.listItem}>
                                    <div className={styles.modelRow}>
                                        <Radio
                                            name="guided-promote-model"
                                            value={String(run.id)}
                                            checked={selectedRun?.id === run.id}
                                            disabled={isPromoted || isCreating}
                                            onChange={() => setSearchParams((previous) => {
                                                const next = new URLSearchParams(previous);
                                                next.set('evaluationId', String(run.id));
                                                return next;
                                            }, { replace: true })}
                                            dataTest={`guided-promote-model-${run.id}`}
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
                                            {isPromoted && <Tag positive>{i18n.t('Promoted')}</Tag>}
                                            <Link className={styles.link} to={`/evaluate/${run.id}`}>{i18n.t('View evaluation')}</Link>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </Card>
                {specification && selectedRun && (
                    <Card className={styles.card}>
                        <div>
                            <h3 className={styles.title}>{i18n.t('Is it good enough?')}</h3>
                            <p className={styles.description}>
                                {i18n.t('Two checks and a look at the forecasts of {{model}}. They describe the past; the next step keeps checking the model once it is in use.', { model: getRunModelName(selectedRun) })}
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
                        <h3 className={styles.title}>{i18n.t('Name and promote')}</h3>
                        <p className={styles.description}>{i18n.t('You can change the name, the signal policy and the DHIS2 output later.')}</p>
                    </div>
                    <div className={styles.field}>
                        <SetupNameField form={form} />
                    </div>
                    {error && <ChapErrorNotice error={error} title={i18n.t('Could not promote the model')} />}
                    <div className={styles.row}>
                        <Button primary type="submit" loading={isCreating} disabled={!selectedRun || isCreating} dataTest="guided-promote-submit">
                            {i18n.t('Promote model')}
                        </Button>
                        {!selectedRun && <span className={styles.muted}>{i18n.t('Choose a model first')}</span>}
                    </div>
                </Card>
            </form>
            <StepNav
                back={pathTo('evaluate')}
                next={pathTo('predict')}
                nextLabel={i18n.t('Continue to predictions')}
                blockedReason={promotedRuns.length ? undefined : i18n.t('Promote a model first')}
            />
            {isCreatingPolicy && <CreateAlertPolicyModal onClose={() => setIsCreatingPolicy(false)} />}
        </>
    );
};
