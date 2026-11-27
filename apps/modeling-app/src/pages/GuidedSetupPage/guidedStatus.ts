import type { BacktestRead, BacktestSpecificationSummary, DataSetInfo } from '@dhis2-chap/ui';
import type { GuidedStep } from './useGuidedProgress';

/** How far below the expected share a model's range may catch the actual values and still pass. */
const COVERAGE_PASS_MARGIN = 0.05;
/** Below the expected share by more than this, the model is too sure of itself to trust. */
const COVERAGE_FAIL_MARGIN = 0.2;

export type Status = 'good' | 'caution' | 'bad';

export const getCoverageStatus = (coverage: number, target: number): Status => {
    // Rounded, so a share right on a boundary is not pushed below it by floating point.
    const shortfall = Math.round((target - coverage) * 1000) / 1000;
    return shortfall <= COVERAGE_PASS_MARGIN ? 'good' : shortfall <= COVERAGE_FAIL_MARGIN ? 'caution' : 'bad';
};

export type GuidedStage = 'notEvaluated' | 'evaluating' | 'readyToChoose' | 'inUse';

export type GuidedSetupSummary = {
    dataset: DataSetInfo & { id: number };
    stage: GuidedStage;
    /** The step Continue opens. */
    step: GuidedStep;
    runs: BacktestRead[];
    chosenRuns: BacktestRead[];
    runningCount: number;
};

/**
 * Where each imported dataset is on the way to predictions. It reads the same things as the
 * steps do: the newest evaluation of the data, its models and which of them is in use.
 */
export const getGuidedSetupSummary = (
    dataset: DataSetInfo & { id: number },
    specifications: BacktestSpecificationSummary[],
    backtests: BacktestRead[],
    runningCount: number,
): GuidedSetupSummary => {
    const latest = specifications.filter(item => item.dataset.id === dataset.id).sort((a, b) => b.id - a.id)[0];
    const runs = latest ? backtests.filter(run => run.specificationId === latest.id) : [];
    // A model chosen from an earlier evaluation keeps predicting when the data is evaluated again.
    const chosenRuns = backtests.filter(run => run.datasetId === dataset.id && run.predictionSetupId != null);
    const stage: GuidedStage = chosenRuns.length
        ? 'inUse'
        : runs.length ? 'readyToChoose' : runningCount ? 'evaluating' : 'notEvaluated';
    const step: GuidedStep = stage === 'inUse' ? 'predict' : stage === 'readyToChoose' ? 'model' : 'evaluate';
    return { dataset, stage, step, runs, chosenRuns, runningCount };
};
