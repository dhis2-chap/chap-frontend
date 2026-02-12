import { defaultSettings, FeatureKey } from './useExperimentalSettings';
import { useExperimentalSettingsQuery } from './useExperimentalSettingsQuery';

type UseExperimentalFeatureResult = {
    enabled: boolean;
    isLoading: boolean;
    isError: boolean;
};

export const useExperimentalFeature = (featureName: FeatureKey): UseExperimentalFeatureResult => {
    const query = useExperimentalSettingsQuery();

    const settings = query.data ?? defaultSettings;

    const isFeatureEnabled = settings.enabled && (settings.features[featureName] ?? false);

    return {
        enabled: isFeatureEnabled,
        isLoading: query.isLoading,
        isError: query.isError,
    };
};
