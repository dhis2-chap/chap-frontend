import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { AlertMap, Widget, getPeriodNameFromId } from '@dhis2-chap/ui';
import { sortPeriodIds, DEFAULT_DHIS2_CALENDAR } from '@dhis2-chap/core';
import { normalizeAlertPeriod } from '../utils/reviewData';
import type { ReviewData } from '../hooks/useReviewData';
import { useOrgUnitGeometry } from '../hooks/useOrgUnitGeometry';
import styles from './ForecastReview.module.css';

export const ReviewOverview = ({ review, colors }: { review: ReviewData; colors: Record<string, string> }) => {
    const geometry = useOrgUnitGeometry([...review.orgUnits.keys()].sort());
    const counts = {
        pending: review.alerts.filter(alert => !alert.approved || alert.approved === 'pending').length,
        accepted: review.alerts.filter(alert => alert.approved === 'approved').length,
        declined: review.alerts.filter(alert => alert.approved === 'declined').length,
    };
    const periods = sortPeriodIds([...new Set(review.entries.map(entry => normalizeAlertPeriod(entry.period)))], { calendar: DEFAULT_DHIS2_CALENDAR });
    return (
        <Widget header={i18n.t('Overview')} noncollapsible>
            <div className={styles.content}>
                <dl className={styles.selectors}>
                    <div>
                        <dt>{i18n.t('Pending')}</dt>
                        <dd>{counts.pending}</dd>
                    </div>
                    <div>
                        <dt>{i18n.t('Accepted')}</dt>
                        <dd>{counts.accepted}</dd>
                    </div>
                    <div>
                        <dt>{i18n.t('Declined')}</dt>
                        <dd>{counts.declined}</dd>
                    </div>
                    <div>
                        <dt>{i18n.t('Organisation units with alerts')}</dt>
                        <dd>{new Set(review.alerts.map(alert => alert.orgUnit)).size}</dd>
                    </div>
                </dl>
                {geometry.isInitialLoading ? <CircularLoader /> : geometry.error ? (
                    <NoticeBox warning title={i18n.t('Unable to load map boundaries')}>
                        {i18n.t('The review counts and forecasts are still available.')}
                    </NoticeBox>
                ) : geometry.data?.features.length ? (
                    <AlertMap
                        orgUnits={geometry.data}
                        periods={periods.map(id => ({ id, label: getPeriodNameFromId(id) }))}
                        levels={Object.entries(colors).map(([name, color]) => ({ name, color }))}
                        alerts={review.alerts.filter(alert => alert.approved !== 'declined').map(alert => ({ orgUnit: alert.orgUnit, period: normalizeAlertPeriod(alert.timePeriod), level: alert.level }))}
                    />
                ) : <p>{i18n.t('No map boundaries are available for these organisation units.')}</p>}
            </div>
        </Widget>
    );
};
