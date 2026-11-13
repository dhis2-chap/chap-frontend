import i18n from '@dhis2/d2-i18n';
import { useNavigate } from 'react-router-dom';
import { Button, CircularLoader, NoticeBox, Switch } from '@dhis2/ui';
import { AlertApproval } from '@dhis2-chap/ui';
import type { usePredictionAlerts } from '@/hooks/usePredictionAlerts';
import styles from './PredictionDetailsGrid.module.css';

const countReview = (alerts: { approved?: AlertApproval }[]) => ({
    // A signal without a decision is pending.
    pending: alerts.filter(alert => (alert.approved ?? AlertApproval.PENDING) === AlertApproval.PENDING).length,
    approved: alerts.filter(alert => alert.approved === AlertApproval.APPROVED).length,
    declined: alerts.filter(alert => alert.approved === AlertApproval.DECLINED).length,
    total: alerts.length,
});

// The review lives on its own page, so this notice is the way in: it says what is left to do and leads there.
const SignalReviewNotice = ({ alerts }: { alerts: { approved?: AlertApproval }[] }) => {
    const navigate = useNavigate();
    const { pending, approved, declined, total } = countReview(alerts);
    return (
        <NoticeBox title={i18n.t('Signal review')} valid={pending === 0}>
            <p className={styles.reviewStatus} data-test="signal-review-status">
                {pending === 0
                    ? i18n.t('All signals reviewed{{colon}} {{approved}} approved, {{declined}} declined.', { colon: ':', approved, declined })
                    : i18n.t('{{pending}} of {{total}} signals awaiting review ({{approved}} approved, {{declined}} declined).', {
                            pending, total, approved, declined,
                        })}
            </p>
            <Button small primary={pending > 0} onClick={() => navigate('signals')}>
                {i18n.t('Review signals')}
            </Button>
        </NoticeBox>
    );
};

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
            <NoticeBox error title={i18n.t('Unable to load raised signals')}>
                <Button small onClick={() => alerts.refetch()}>{i18n.t('Retry')}</Button>
            </NoticeBox>
        );
    }

    const { status } = alerts;

    if (status.kind !== 'policy') {
        return (
            <div className={styles.panelSection}>
                <h3>{i18n.t('Signal levels')}</h3>
                <p className={styles.panelHelp}>
                    {status.kind === 'noPolicy'
                        ? i18n.t('No signal policy was recorded for this run.')
                        : i18n.t('No signals were recorded for this run.')}
                </p>
            </div>
        );
    }

    const policy = status.policies.map(({ name }) => name).join(', ');
    let description = i18n.t('Show recorded signals on the plots.');
    if (policy) {
        description = status.alertCount > 0
            ? i18n.t('Show {{alertCount}} signals from {{policy}} with their thresholds.', { alertCount: status.alertCount, policy })
            : i18n.t('{{policy}} raised no signals for this run. Show its thresholds.', { policy });
    }

    return (
        <>
            {alerts.displayedAlerts.length > 0 && <SignalReviewNotice alerts={alerts.displayedAlerts} />}
            <Switch
                className={styles.toggleButton}
                aria-label={i18n.t('Signal levels')}
                checked={enabled}
                disabled={disabled}
                onChange={({ checked }) => onEnabledChange(checked)}
                label={(
                    <span className={styles.toggleText}>
                        <span className={styles.toggleTitle}>{i18n.t('Signal levels')}</span>
                        <span className={styles.toggleDescription}>
                            {description}
                        </span>
                    </span>
                )}
            />
            {enabled && alerts.displayError && (
                <NoticeBox warning title={i18n.t('Saved signal colours could not be loaded')}>
                    {i18n.t('Signals are shown with default colours.')}
                </NoticeBox>
            )}
        </>
    );
};
