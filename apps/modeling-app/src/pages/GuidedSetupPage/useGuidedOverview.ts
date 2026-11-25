import type { DataSetInfo } from '@dhis2-chap/ui';
import { useBacktests } from '../../hooks/useBacktests';
import { useBacktestSpecifications } from '../BenchmarksPage/useBacktestSpecification';
import { useRunningBenchmarkJobs } from '../BenchmarksPage/useRunningBenchmarkJobs';
import { getGuidedSetupSummary } from './guidedStatus';

export const useGuidedOverview = (datasets: (DataSetInfo & { id: number })[]) => {
    const specifications = useBacktestSpecifications();
    const { backtests, error, isLoading } = useBacktests();
    const runningJobs = useRunningBenchmarkJobs();

    const setups = datasets.map(dataset => getGuidedSetupSummary(
        dataset,
        specifications.data ?? [],
        backtests ?? [],
        runningJobs.filter(({ request }) => request.datasetId === dataset.id).length,
    ));

    return {
        setups,
        isLoading: isLoading || specifications.isInitialLoading,
        error: error ?? specifications.error,
    };
};
