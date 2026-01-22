import React, { Card, CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { useExperimentalSettings, FEATURES } from './hooks/useExperimentalSettings';
import { ChoiceCard } from './ChoiceCard';
import styles from './ExperimentalSettings.module.css';

export const ExperimentalSettings = () => {
    const {
        settings,
        isLoading,
        isSaving,
        toggleEnabled,
        toggleFeature,
    } = useExperimentalSettings();

    if (isLoading) {
        return (
            <div className={styles.container}>
                <Card>
                    <div className={styles.loaderContainer}>
                        <CircularLoader />
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Card>
                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h2>{i18n.t('Experimental features')}</h2>
                    </div>

                    <div className={styles.warningNotice}>
                        <NoticeBox warning title={i18n.t('Warning')}>
                            {i18n.t('These features are experimental and may be unstable or change without notice.')}
                        </NoticeBox>
                    </div>

                    <div className={styles.toggleList}>
                        <ChoiceCard
                            title={i18n.t('Enable experimental features')}
                            description={i18n.t('Turn on to access experimental features in the app')}
                            checked={settings.enabled}
                            onChange={toggleEnabled}
                            disabled={isSaving}
                        />
                    </div>

                    {settings.enabled && (
                        <div className={styles.featureTogglesSection}>
                            <div className={styles.featureTogglesHeader}>
                                <h3>{i18n.t('Available features')}</h3>
                            </div>
                            <div className={styles.toggleList}>
                                <ChoiceCard
                                    title={i18n.t('Metric plots')}
                                    description={i18n.t('Show metric visualization plots in the evaluation dashboard')}
                                    checked={settings.features[FEATURES.METRIC_PLOTS] ?? false}
                                    onChange={() => toggleFeature(FEATURES.METRIC_PLOTS)}
                                    disabled={isSaving}
                                />
                                <ChoiceCard
                                    title={i18n.t('Evaluation plots')}
                                    description={i18n.t('Show evaluation visualization plots in the evaluation dashboard')}
                                    checked={settings.features[FEATURES.EVALUATION_PLOTS] ?? false}
                                    onChange={() => toggleFeature(FEATURES.EVALUATION_PLOTS)}
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
