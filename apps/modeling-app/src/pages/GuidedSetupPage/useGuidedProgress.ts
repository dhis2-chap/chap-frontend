import { useCallback, useEffect, useRef } from 'react';
import type { BacktestRead, DataSetInfo } from '@dhis2-chap/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useBacktests } from '../../hooks/useBacktests';
import { useDatasets } from '../../hooks/useDatasets';
import { Features, useIsFeatureAvailable } from '../../hooks/useIsFeatureAvailable';
import { sortByCreatedDesc } from '../../utils/sortByCreated';
import { requestMatchesSpecification } from '../BenchmarksPage/benchmarkUtils';
import { useBacktestSpecification, useBacktestSpecifications } from '../BenchmarksPage/useBacktestSpecification';
import { useRunningBenchmarkJobs } from '../BenchmarksPage/useRunningBenchmarkJobs';

export const GUIDED_STEPS = ['data', 'evaluate', 'promote', 'predict'] as const;
export type GuidedStep = typeof GUIDED_STEPS[number];

export const getRunModelName = (run: BacktestRead) => (
    run.configuredModel?.modelTemplate?.displayName || run.configuredModel?.name || run.modelId
);

const isSaved = (dataset: DataSetInfo): dataset is DataSetInfo & { id: number } => dataset.id != null;

/**
 * Where a dataset is on the way to predictions. Nothing is stored for it: the steps are read
 * from what exists in Chap for the dataset, so the setup picks up where anyone left off.
 */
export const useGuidedProgress = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const datasetId = searchParams.get('datasetId');
    const { isAvailable, isLoading: isVersionLoading } = useIsFeatureAvailable(Features.BENCHMARKS);
    const datasets = useDatasets();
    const specifications = useBacktestSpecifications(isAvailable);
    const { backtests, isLoading: isBacktestsLoading, error: backtestsError } = useBacktests();

    const savedDatasets = sortByCreatedDesc((datasets.data ?? []).filter(isSaved));
    const importedDatasets = savedDatasets.filter(dataset => dataset.createdManually !== false);
    // A new setup starts from nothing; otherwise the newest imported data is picked up.
    const isNewSetup = !datasetId && searchParams.get('import') === 'true';
    const dataset = datasetId
        ? savedDatasets.find(item => String(item.id) === datasetId)
        : isNewSetup ? undefined : importedDatasets[0];
    // Each evaluation of the data has its own settings, and only results with the same settings can be compared.
    // The guided setup follows the one chosen on the evaluation step, or the newest.
    const datasetSpecifications = (specifications.data ?? []).filter(item => item.dataset.id === dataset?.id).sort((a, b) => b.id - a.id);
    const specificationId = searchParams.get('specificationId');
    const latest = datasetSpecifications.find(item => String(item.id) === specificationId) ?? datasetSpecifications[0];
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
    // A model promoted from an earlier evaluation keeps predicting when the data is evaluated again.
    // The newest evaluation is read as well, since the list of all runs can lag behind a promotion.
    const promotedRuns = [...runs, ...(backtests ?? []).filter(run => run.datasetId === dataset?.id && !runs.some(item => item.id === run.id))]
        .filter(run => run.predictionSetupId != null);
    const predictionSetupIds = [...new Set(promotedRuns.map(run => run.predictionSetupId!))].sort((a, b) => b - a);
    const selectedId = dataset?.id;
    // The chosen evaluation stays chosen between the steps of the same data.
    const newestSpecificationId = datasetSpecifications[0]?.id;
    const chosenSpecificationId = latest && latest.id !== newestSpecificationId ? latest.id : undefined;
    const pathTo = useCallback((step: GuidedStep, id = selectedId) => {
        if (id == null) return `/guided/${step}`;
        return `/guided/${step}?datasetId=${id}${id === selectedId && chosenSpecificationId != null ? `&specificationId=${chosenSpecificationId}` : ''}`;
    }, [selectedId, chosenSpecificationId]);
    const selectSpecification = useCallback((id?: number) => setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (id == null || id === newestSpecificationId) next.delete('specificationId');
        else next.set('specificationId', String(id));
        next.delete('evaluationId');
        return next;
    }, { replace: true }), [setSearchParams, newestSpecificationId]);
    // The furthest step that can be worked on.
    const current: GuidedStep = !dataset ? 'data' : predictionSetupIds.length ? 'predict' : runs.length ? 'promote' : 'evaluate';

    return {
        isAvailable,
        isVersionLoading,
        isLoading: isVersionLoading || datasets.isLoading || specifications.isInitialLoading || isBacktestsLoading || (!!latest && !specification),
        error: datasets.error ?? specifications.error ?? details.error ?? backtestsError,
        importedDatasets,
        dataset,
        isDatasetMissing: !!datasetId && !dataset,
        specification,
        datasetSpecifications,
        selectSpecification,
        runs,
        runningJobs,
        promotedRuns,
        predictionSetupIds,
        current,
        pathTo,
    };
};

export type GuidedProgress = ReturnType<typeof useGuidedProgress>;

/** The progress the guided setup layout hands to its step pages. */
export const useGuided = () => useOutletContext<GuidedProgress>();
