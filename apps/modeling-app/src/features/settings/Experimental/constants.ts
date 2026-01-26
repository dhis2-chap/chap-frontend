import i18n from '@dhis2/d2-i18n';

export const FEATURES = {
    METRIC_PLOTS: 'metricPlots',
    EVALUATION_PLOTS: 'evaluationPlots',
    UPLOAD_MODEL_TEMPLATE: 'uploadModelTemplate',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];

export const FEATURE_MIN_VERSIONS: Partial<Record<FeatureKey, string>> = {
    [FEATURES.UPLOAD_MODEL_TEMPLATE]: '1.1.5',
};

export type FeatureConfig = {
    key: FeatureKey;
    title: string;
    description: string;
};

export const featureConfigs: FeatureConfig[] = [
    {
        key: FEATURES.METRIC_PLOTS,
        title: i18n.t('Metric plots'),
        description: i18n.t('Show metric visualization plots in the evaluation dashboard'),
    },
    {
        key: FEATURES.EVALUATION_PLOTS,
        title: i18n.t('Evaluation plots'),
        description: i18n.t('Show evaluation visualization plots in the evaluation dashboard'),
    },
    {
        key: FEATURES.UPLOAD_MODEL_TEMPLATE,
        title: i18n.t('Upload model template'),
        description: i18n.t('Allow uploading custom model templates as ZIP files'),
    },
];
