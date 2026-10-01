import { useChapStatus } from '../features/settings/ChapSettings/hooks/useChapStatus';
import { isVersionCompatible } from '../utils/compareVersions';
import { useRoute } from './useRoute';

/**
 * Centralized feature toggle configuration.
 * Maps feature names to their minimum required CHAP backend version.
 */
export const FEATURE_MIN_VERSIONS = {
    datasetDownload: '1.1.5',
    metricsDownload: '1.4.1',
    multiModelBacktests: '2.4.0',
    benchmarks: '2.4.0',
} as const;

/**
 * Exported feature keys for type-safe usage throughout the codebase.
 */
export const Features = {
    DATASET_DOWNLOAD: 'datasetDownload',
    METRICS_DOWNLOAD: 'metricsDownload',
    MULTI_MODEL_BACKTESTS: 'multiModelBacktests',
    BENCHMARKS: 'benchmarks',
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
