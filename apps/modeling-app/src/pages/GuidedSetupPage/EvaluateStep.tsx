import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox } from '@dhis2/ui';
import { ApiError, BacktestsService, BacktestSpecificationRead, DataSetInfo, MakeBacktestsRequest } from '@dhis2-chap/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { ModelHealthNotice } from '../../components/ModelHealth/ModelHealth';
import { datasetSupportsModel, getBacktestColumns } from '../../components/NewDatasetForm/utils/datasetModels';
import { ModelsSelector } from '../../components/NewEvaluationForm/DatasetEvaluationForm/ModelsSelector';
import { ForecastHorizonNotice } from '../../components/NewEvaluationForm/ForecastHorizonNotice';
import { getMinimumEvaluationPeriods, toBacktestDefaults } from '../../components/NewEvaluationForm/hooks/backtestDefaults';
import { useForecastHorizonValidation } from '../../components/NewEvaluationForm/hooks/useForecastHorizonValidation';
import { fetchRunnableModel } from '../../hooks/modelsQuery';
import { useBacktestParameters } from '../../hooks/useBacktestParameters';
import { useModels } from '../../hooks/useModels';
import { hasRevisionMismatch } from '../../utils/modelHealth';
import { countPeriods } from '../../utils/periods';
import { makeBenchmarkRequest } from '../BenchmarksPage/benchmarkUtils';
import styles from './GuidedSetupPage.module.css';

type Props = {
    dataset: DataSetInfo & { id: number };
    /** The evaluation to add models to. Without one, the models run with Chap's default evaluation settings. */
    specification?: BacktestSpecificationRead;
    onStarted: () => void;
};

export const EvaluateStep = ({ dataset, specification, onStarted }: Props) => {
    const queryClient = useQueryClient();
    const { models, isLoading, error } = useModels();
    const defaults = useBacktestParameters(dataset.periodType);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const columns = dataset.covariates ?? [];
    const targetColumn = specification?.targetColumn ?? dataset.targetColumn ?? (columns.includes('disease_cases') ? 'disease_cases' : undefined);
    const defaultParameters = defaults.data ? toBacktestDefaults(defaults.data) : undefined;
    const parameters = specification ?? defaultParameters;
    const compatibleModels = models?.filter(model => (
        targetColumn && datasetSupportsModel(getBacktestColumns(columns, targetColumn), dataset.periodType ?? '', model)
    )) ?? [];
    const selectedModels = compatibleModels.filter(model => selectedIds.includes(model.id));
    const forecastHorizon = useForecastHorizonValidation(selectedModels, parameters?.nPeriods);

    const periodCount = countPeriods(dataset.firstPeriod, dataset.lastPeriod);
    const { nPeriods, nSplits, stride } = parameters ?? {};
    const requiredPeriodCount = nPeriods && nSplits && stride
        ? getMinimumEvaluationPeriods(dataset.periodType, { nPeriods, nSplits, stride })
        : undefined;
    const isTooShort = periodCount != null && !!requiredPeriodCount && periodCount < requiredPeriodCount;
    const advancedPath = `/evaluate/benchmarks/new?datasetId=${dataset.id}&origin=all`;

    const start = useMutation<unknown, ApiError | Error>({
        mutationFn: async () => {
            const runnable = await Promise.all(selectedModels.map(model => fetchRunnableModel(queryClient, model.id)));
            const modelIds = runnable.map(model => model.id);
            const request: MakeBacktestsRequest = specification
                ? makeBenchmarkRequest(specification, modelIds, dataset.name)
                : {
                        ...defaultParameters,
                        name: dataset.name,
                        datasetId: dataset.id,
                        modelIds,
                        // Chap Core 2.6.0+ reads the target from the dataset.
                        ...(!dataset.targetColumn && { targetColumn }),
                    };
            return BacktestsService.createBacktestsV1AnalyticsCreateBacktestsPost(request);
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['jobs'] }),
                queryClient.invalidateQueries({ queryKey: ['backtest-specifications'] }),
            ]);
            onStarted();
        },
    });

    if (isLoading || defaults.isInitialLoading) return <CircularLoader small />;
    if (error) return <ChapErrorNotice error={error} title={i18n.t('Could not load models')} />;

    if (!targetColumn) {
        return (
            <NoticeBox warning title={i18n.t('This data has no target column')}>
                {i18n.t('Choose what to predict when you start the evaluation.')}
                {' '}
                <Link to={advancedPath}>{i18n.t('Open evaluation settings')}</Link>
            </NoticeBox>
        );
    }

    return (
        <>
            <p className={styles.text}>
                {i18n.t('Chap hides the most recent periods of your data, lets each model predict them, and scores the predictions against what actually happened.')}
            </p>
            <ModelsSelector
                models={compatibleModels}
                selectedModels={selectedModels}
                disabled={start.isLoading}
                onChange={selected => setSelectedIds(selected.map(model => model.id))}
            />
            {!compatibleModels.length && (
                <NoticeBox warning title={i18n.t('No model can use this data')}>
                    {i18n.t('No model matches the columns and period type of this data. Import data with the columns the models need.')}
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
            <div className={styles.row}>
                <Button
                    primary
                    loading={start.isLoading}
                    disabled={start.isLoading || !parameters || !selectedModels.length || isTooShort || selectedModels.some(hasRevisionMismatch) || forecastHorizon.isBlocked}
                    onClick={() => start.mutate()}
                    dataTest="guided-start-evaluation"
                >
                    {i18n.t('Evaluate models')}
                </Button>
                {!specification && <Link to={advancedPath}>{i18n.t('Change evaluation settings')}</Link>}
            </div>
        </>
    );
};
