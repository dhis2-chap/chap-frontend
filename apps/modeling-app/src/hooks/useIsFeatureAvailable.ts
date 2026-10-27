import { isVersionCompatible } from '../utils/compareVersions';
import { useChapStatus, useRoute } from '@dhis2-chap/ui';

/**
 * Centralized feature toggle configuration.
 * Maps feature names to their minimum required Chap backend version.
 */
export const FEATURE_MIN_VERSIONS = {
    datasetDownload: '1.1.5',
    metricsDownload: '1.4.1',
    multiModelBacktests: '2.4.0',
    benchmarks: '2.4.0',
    backtestParameters: '2.4.0',
    backtestTargetColumn: '2.4.0',
    // Chap raises alerts when a prediction run finishes from 2.5.0.
    predictionAlerts: '2.5.0',
    jobDiagnostics: '2.6.0',
} as const;

/**
 * Exported feature keys for type-safe usage throughout the codebase.
 */
export const Features = {
    DATASET_DOWNLOAD: 'datasetDownload',
    METRICS_DOWNLOAD: 'metricsDownload',
    MULTI_MODEL_BACKTESTS: 'multiModelBacktests',
    BENCHMARKS: 'benchmarks',
    BACKTEST_PARAMETERS: 'backtestParameters',
    BACKTEST_TARGET_COLUMN: 'backtestTargetColumn',
    PREDICTION_ALERTS: 'predictionAlerts',
    JOB_DIAGNOSTICS: 'jobDiagnostics',
} as const;

export type Feature = keyof typeof FEATURE_MIN_VERSIONS;

export const useIsFeatureAvailable = (feature: Feature) => {
    const { route } = useRoute();
    const { status, isLoading } = useChapStatus({ route });

    const isAvailable = status?.chap_core_version
        ? isVersionCompatible(status.chap_core_version, FEATURE_MIN_VERSIONS[feature])
        : false;

    return { isAvailable, isLoading };
};
