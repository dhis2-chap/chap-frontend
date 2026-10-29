import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, Switch } from '@dhis2/ui';
import type { usePredictionAlerts } from '@/hooks/usePredictionAlerts';
import styles from './PredictionDetailsGrid.module.css';

type Props = {
    alerts: ReturnType<typeof usePredictionAlerts>;
    enabled: boolean;
    // Exploration takes precedence over the policy view, so the switch has no effect while it is on.
    disabled?: boolean;
    onEnabledChange: (enabled: boolean) => void;
};

export const AlertLevelsSection = ({ alerts, enabled, disabled, onEnabledChange }: Props) => {
    if (alerts.isLoading) {
        return <CircularLoader small />;
    }

    if (alerts.error) {
        return (
            <NoticeBox error title={i18n.t('Unable to load raised alerts')}>
                <Button small onClick={() => alerts.refetch()}>{i18n.t('Retry')}</Button>
            </NoticeBox>
        );
    }

    const { status } = alerts;

    if (status.kind !== 'policy') {
        return (
            <div className={styles.panelSection}>
                <h3>{i18n.t('Alert levels')}</h3>
                <p className={styles.panelHelp}>
                    {status.kind === 'noPolicy'
                        ? i18n.t('No alert policy was recorded for this run.')
                        : i18n.t('No alerts were recorded for this run.')}
                </p>
            </div>
        );
    }

    const policy = status.policies.map(({ name }) => name).join(', ');
    let description = i18n.t('Show recorded alerts on the plots.');
    if (policy) {
        description = status.alertCount > 0
            ? i18n.t('Show {{alertCount}} alerts from {{policy}} with their thresholds.', { alertCount: status.alertCount, policy })
            : i18n.t('{{policy}} raised no alerts for this run. Show its thresholds.', { policy });
    }

    return (
        <>
            <Switch
                className={styles.toggleButton}
                aria-label={i18n.t('Alert levels')}
                checked={enabled}
                disabled={disabled}
                onChange={({ checked }) => onEnabledChange(checked)}
                label={(
                    <span className={styles.toggleText}>
                        <span className={styles.toggleTitle}>{i18n.t('Alert levels')}</span>
                        <span className={styles.toggleDescription}>
                            {description}
                        </span>
                    </span>
                )}
            />
            {enabled && alerts.displayError && (
                <NoticeBox warning title={i18n.t('Saved alert colours could not be loaded')}>
                    {i18n.t('Alerts are shown with default colours.')}
                </NoticeBox>
            )}
        </>
    );
};
