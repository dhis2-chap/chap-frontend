import { useCallback, useEffect, useRef } from 'react';
import type { BacktestRead, DataSetInfo } from '@dhis2-chap/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useOutletContext, useSearchParams } from 'react-router-dom';
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
    const [searchParams] = useSearchParams();
    const datasetId = searchParams.get('datasetId');
    const { isAvailable, isLoading: isVersionLoading } = useIsFeatureAvailable(Features.BENCHMARKS);
    const datasets = useDatasets();
    const specifications = useBacktestSpecifications(isAvailable);

    const savedDatasets = sortByCreatedDesc((datasets.data ?? []).filter(isSaved));
    const importedDatasets = savedDatasets.filter(dataset => dataset.createdManually !== false);
    // A new setup starts from nothing; otherwise the newest imported data is picked up.
    const isNewSetup = !datasetId && searchParams.get('import') === 'true';
    const dataset = datasetId
        ? savedDatasets.find(item => String(item.id) === datasetId)
        : isNewSetup ? undefined : importedDatasets[0];
    // The guided setup follows the newest evaluation of the data; older ones stay under All tools.
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
    const promotedRuns = runs.filter(run => run.predictionSetupId != null);
    const predictionSetupIds = [...new Set(promotedRuns.map(run => run.predictionSetupId!))].sort((a, b) => b - a);
    const selectedId = dataset?.id;
    const pathTo = useCallback((step: GuidedStep, id = selectedId) => (
        `/guided/${step}${id != null ? `?datasetId=${id}` : ''}`
    ), [selectedId]);
    // The furthest step that can be worked on.
    const current: GuidedStep = !dataset ? 'data' : !runs.length ? 'evaluate' : !predictionSetupIds.length ? 'promote' : 'predict';

    return {
        isAvailable,
        isVersionLoading,
        isLoading: isVersionLoading || datasets.isLoading || specifications.isInitialLoading || (!!latest && !specification),
        error: datasets.error ?? specifications.error ?? details.error,
        importedDatasets,
        dataset,
        isDatasetMissing: !!datasetId && !dataset,
        specification,
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
