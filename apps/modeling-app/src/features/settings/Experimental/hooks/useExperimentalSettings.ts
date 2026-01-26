import { useDataEngine, useAlert } from '@dhis2/app-runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { z } from 'zod';
import { useExperimentalSettingsQuery } from './useExperimentalSettingsQuery';

export const ExperimentalSettingsSchema = z.object({
    version: z.number(),
    enabled: z.boolean(),
    features: z.record(z.string(), z.boolean()),
});

export type ExperimentalSettings = z.infer<typeof ExperimentalSettingsSchema>;

export const defaultSettings: ExperimentalSettings = {
    version: 1,
    enabled: false,
    features: {},
};

export const QUERY_KEY = ['dataStore', 'modeling', 'experimental'];
export const DATASTORE_RESOURCE = 'dataStore/modeling/experimental';

export const useExperimentalSettings = () => {
    const engine = useDataEngine();
    const queryClient = useQueryClient();
    const query = useExperimentalSettingsQuery();

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Settings saved successfully'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to save settings'),
        { critical: true },
    );

    const mutation = useMutation({
        mutationFn: async (newSettings: ExperimentalSettings) => {
            const currentData = queryClient.getQueryData<ExperimentalSettings | null>(QUERY_KEY);

            // If we had a 404 before (no data exists), create the key
            // Otherwise update the existing key
            const isCreate = currentData === null || currentData === undefined;

            const mutationConfig = {
                resource: DATASTORE_RESOURCE,
                type: isCreate ? 'create' : 'update',
                data: newSettings,
            };

            return engine.mutate(mutationConfig as Parameters<typeof engine.mutate>[0]);
        },
        onSuccess: (_data, newSettings) => {
            queryClient.setQueryData(QUERY_KEY, newSettings);
            showSuccessAlert();
        },
        onError: (error) => {
            showErrorAlert();
            console.error('Failed to save experimental settings:', error);
        },
    });

    const updateSettings = (updates: Partial<ExperimentalSettings>) => {
        const currentSettings = query.data ?? defaultSettings;
        const newSettings: ExperimentalSettings = {
            ...currentSettings,
            ...updates,
            features: {
                ...currentSettings.features,
                ...(updates.features ?? {}),
            },
        };
        mutation.mutate(newSettings);
    };

    const toggleEnabled = () => {
        const currentSettings = query.data ?? defaultSettings;
        updateSettings({ enabled: !currentSettings.enabled });
    };

    const toggleFeature = (featureKey: string) => {
        const currentSettings = query.data ?? defaultSettings;
        const currentFeatureValue = currentSettings.features[featureKey] ?? false;
        updateSettings({
            features: {
                [featureKey]: !currentFeatureValue,
            },
        });
    };

    return {
        settings: query.data ?? defaultSettings,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        isSaving: mutation.isPending,
        updateSettings,
        toggleEnabled,
        toggleFeature,
    };
};
