import i18n from '@dhis2/d2-i18n';
import { Button, CircularLoader, NoticeBox, Switch } from '@dhis2/ui';
import type { usePredictionAlerts } from '@/hooks/usePredictionAlerts';
import styles from './PredictionDetailsGrid.module.css';

type Props = {
    alerts: ReturnType<typeof usePredictionAlerts>;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
};

const NoAlerts = ({ message }: { message: string }) => (
    <div className={styles.panelSection}>
        <h3>{i18n.t('Alert levels')}</h3>
        <p className={styles.panelHelp}>{message}</p>
    </div>
);

export const AlertLevelsSection = ({ alerts, enabled, onEnabledChange }: Props) => {
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

    if (status.kind === 'noPolicy') {
        return (
            <NoAlerts
                message={i18n.t('No alerts were recorded for this run. The prediction setup has no alert policy. Add one to raise alerts on future runs.')}
            />
        );
    }

    if (status.kind === 'noAlerts') {
        return (
            <NoAlerts
                message={status.setupPolicy
                    ? i18n.t('No alerts were recorded for this run. The prediction setup now uses {{policy}}, but no level may have been reached, or the policy may have been added after this run.', {
                            policy: status.setupPolicy.name,
                        })
                    : i18n.t('No alerts were recorded for this run.')}
            />
        );
    }

    const policyNames = status.policies.map(policy => policy.name).join(', ');

    return (
        <>
            <Switch
                className={styles.toggleButton}
                aria-label={i18n.t('Alert levels')}
                checked={enabled}
                onChange={({ checked }) => onEnabledChange(checked)}
                label={(
                    <span className={styles.toggleText}>
                        <span className={styles.toggleTitle}>{i18n.t('Alert levels')}</span>
                        <span className={styles.toggleDescription}>
                            {policyNames
                                ? i18n.t('Show {{alertCount}} alerts raised by {{policy}} on the plots.', {
                                        alertCount: status.alertCount,
                                        policy: policyNames,
                                    })
                                : i18n.t('Show recorded alerts on the plots.')}
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
