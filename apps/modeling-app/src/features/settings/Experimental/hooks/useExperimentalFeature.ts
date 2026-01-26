import { useMinimumChapVersion } from '../../../../hooks/useMinimumChapVersion';
import { defaultSettings } from './useExperimentalSettings';
import { FeatureKey, FEATURE_MIN_VERSIONS } from '../constants';
import { useExperimentalSettingsQuery } from './useExperimentalSettingsQuery';

type UseExperimentalFeatureResult = {
    enabled: boolean;
    isLoading: boolean;
    isError: boolean;
    versionSupported: boolean;
};

export const useExperimentalFeature = (featureName: FeatureKey): UseExperimentalFeatureResult => {
    const query = useExperimentalSettingsQuery();
    const minVersion = FEATURE_MIN_VERSIONS[featureName];

    const { isSupported: versionSupported, isLoading: versionLoading } = useMinimumChapVersion({
        version: minVersion ?? '0.0.0',
    });

    const settings = query.data ?? defaultSettings;
    const isFeatureToggled = settings.enabled && (settings.features[featureName] ?? false);

    const isFeatureEnabled = isFeatureToggled && versionSupported;

    return {
        enabled: isFeatureEnabled,
        isLoading: query.isLoading || versionLoading,
        isError: query.isError,
        versionSupported,
    };
};
