import { useCallback, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, NoticeBox } from '@dhis2/ui';
import type { BacktestSpecificationRead, LeaderboardBacktestRead } from '@dhis2-chap/ui';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useCreatePredictionSetup } from '../../components/PageContent/EvaluationDetails/QuickActionsWidget/hooks/useCreatePredictionSetup';
import {
    MarkReadyForForecastingModal,
    type MarkReadyForForecastingFormValues,
} from '../../components/PredictionSetup/MarkReadyForForecastingModal';
import { buildQuantileTargetsFromForm } from '../../utils/predictionSetupImportMapping';
import { BenchmarkRunsIndicator } from '../BenchmarksPage/BenchmarkRunsIndicator';
import { BenchmarkTable } from '../BenchmarksPage/BenchmarkTable';
import type { RunningBenchmarkJob } from '../BenchmarksPage/useRunningBenchmarkJobs';
import styles from './GuidedSetupPage.module.css';

type Props = {
    specification: BacktestSpecificationRead;
    runningJobs: RunningBenchmarkJob[];
    onChosen: () => void;
};

export const ChooseModelStep = ({ specification, runningJobs, onChosen }: Props) => {
    const [chosenRun, setChosenRun] = useState<LeaderboardBacktestRead>();
    const queryClient = useQueryClient();
    const { createPredictionSetup, isCreating } = useCreatePredictionSetup({
        onSuccess: () => {
            // The results say which model is in use.
            queryClient.invalidateQueries({ queryKey: ['backtest-specifications'] });
            onChosen();
        },
    });

    const rowAction = useCallback((run: LeaderboardBacktestRead) => (run.predictionSetupId == null ? (
        <span className={styles.nowrap}>
            <Button small primary onClick={() => setChosenRun(run)} dataTest={`guided-use-model-${run.id}`}>
                {i18n.t('Use this model')}
            </Button>
        </span>
    ) : (
        <Link to={`/predictions/${run.predictionSetupId}`}>{i18n.t('In use')}</Link>
    )), []);

    const createSetup = async (values: MarkReadyForForecastingFormValues) => {
        await createPredictionSetup({
            data: {
                backtestId: chosenRun!.id,
                name: values.name,
                quantileTargets: buildQuantileTargetsFromForm(values),
                alertPolicyId: values.alert_policy_id ? Number(values.alert_policy_id) : null,
            },
        });
        setChosenRun(undefined);
    };

    return (
        <>
            {runningJobs.length > 0 && (
                <div className={styles.row}>
                    <BenchmarkRunsIndicator specification={specification} runningJobs={runningJobs} />
                    <p className={styles.muted}>
                        {i18n.t('This can take a while. You can leave this page; the results will be here when you come back.')}
                    </p>
                    <Link to="/jobs">{i18n.t('View progress')}</Link>
                </div>
            )}
            {!specification.backtests.length && !runningJobs.length && (
                <NoticeBox warning title={i18n.t('No results yet')}>
                    {i18n.t('No model has finished. See what happened, then evaluate the models again.')}
                    {' '}
                    <Link to="/jobs">{i18n.t('View jobs')}</Link>
                </NoticeBox>
            )}
            {specification.backtests.length > 0 && (
                <div className={styles.stretch}>
                    <BenchmarkTable specification={specification} title={i18n.t('Results')} rowAction={rowAction} />
                </div>
            )}
            {chosenRun && (
                <MarkReadyForForecastingModal
                    title={i18n.t('Use this model for predictions')}
                    defaultValues={{ name: specification.dataset.name }}
                    isSubmitting={isCreating}
                    onClose={() => setChosenRun(undefined)}
                    onSubmit={createSetup}
                />
            )}
        </>
    );
};
