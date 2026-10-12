import { useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { NoticeBox, SingleSelectField, SingleSelectOption, DataTable, DataTableHead, DataTableBody, DataTableRow, DataTableColumnHeader, DataTableCell } from '@dhis2/ui';
import { UncertaintyAreaChart, Widget, getPeriodNameFromId } from '@dhis2-chap/ui';
import { useReviewData, type ReviewData } from '../hooks/useReviewData';
import { ErrorNotice, Loading } from './StateViews';
import { estimateExceedance, normalizeAlertPeriod } from '../utils/reviewData';
import styles from './ForecastReview.module.css';

const formatNumber = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
const formatProbability = (estimate: ReturnType<typeof estimateExceedance>) => {
    if (!estimate) return '—';
    const prefix = estimate.bound === 'above' ? '≥ ' : estimate.bound === 'below' ? '≤ ' : '≈ ';
    return `${prefix}${(100 * estimate.probability).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
};

export const ForecastReview = ({ review }: { review: ReviewData }) => {
    const [orgUnitId, setOrgUnitId] = useState('');
    const [thresholdKey, setThresholdKey] = useState('');
    const series = review.series.find(item => item.orgUnitId === orgUnitId) ?? review.series[0];
    const choices = review.policies.flatMap(policy => (policy.levels ?? []).map(level => ({
        key: `${policy.id}:${level.name}`, policy, level,
    })));
    const chosen = choices.find(choice => choice.key === thresholdKey) ?? choices[0];
    const threshold = chosen && series
        ? review.thresholdsByPolicy.get(chosen.policy.id)?.get(chosen.level.name)?.get(series.orgUnitId)
        : undefined;

    return (
        <>
            <Widget header={i18n.t('Forecast')} noncollapsible>
                <div className={styles.content}>
                    {!!review.thresholdError && (
                        <NoticeBox warning title={i18n.t('Some forecast context could not be loaded')}>
                            {review.thresholdError instanceof Error ? review.thresholdError.message : i18n.t('Please refresh to try again.')}
                        </NoticeBox>
                    )}
                    {review.thresholdsLoading && <p>{i18n.t('Loading observed cases and thresholds…')}</p>}
                    {!series ? <p>{i18n.t('No forecast values are available.')}</p> : (
                        <>
                            <div className={styles.selectors}>
                                <SingleSelectField label={i18n.t('Organisation unit')} selected={series.orgUnitId} filterable onChange={({ selected }) => setOrgUnitId(selected)}>
                                    {review.series.map(item => <SingleSelectOption key={item.orgUnitId} value={item.orgUnitId} label={item.orgUnitName} />)}
                                </SingleSelectField>
                                {choices.length > 0 && (
                                    <SingleSelectField label={i18n.t('Alert threshold')} selected={chosen?.key} onChange={({ selected }) => setThresholdKey(selected)}>
                                        {choices.map(choice => <SingleSelectOption key={choice.key} value={choice.key} label={`${choice.policy.name} · ${choice.level.name}`} />)}
                                    </SingleSelectField>
                                )}
                            </div>
                            <UncertaintyAreaChart series={series} predictionTargetName={i18n.t('Cases')} endemicThresholds={threshold} />
                        </>
                    )}
                </div>
            </Widget>
            <Widget header={i18n.t('Alert statistics')} noncollapsible>
                <div className={styles.content}>
                    <p>{i18n.t('Thresholds reflect the current alert policy and available observations.')}</p>
                    <p>{i18n.t('Exceedance probabilities are estimates from forecast quantiles. CHAP determines alerts using the full forecast distribution.')}</p>
                    {review.alerts.length === 0 ? <p>{i18n.t('No alerts for this prediction.')}</p> : (
                        <DataTable>
                            <DataTableHead>
                                <DataTableRow>
                                    <DataTableColumnHeader>{i18n.t('Organisation unit')}</DataTableColumnHeader>
                                    <DataTableColumnHeader>{i18n.t('Period')}</DataTableColumnHeader>
                                    <DataTableColumnHeader>{i18n.t('Alert level')}</DataTableColumnHeader>
                                    <DataTableColumnHeader>{i18n.t('Forecast (80% range)')}</DataTableColumnHeader>
                                    <DataTableColumnHeader>{i18n.t('Threshold')}</DataTableColumnHeader>
                                    <DataTableColumnHeader>{i18n.t('Chance of exceeding')}</DataTableColumnHeader>
                                    <DataTableColumnHeader>{i18n.t('Policy trigger')}</DataTableColumnHeader>
                                </DataTableRow>
                            </DataTableHead>
                            <DataTableBody>
                                {review.alerts.map((alert) => {
                                    const unitSeries = review.series.find(item => item.orgUnitId === alert.orgUnit);
                                    const period = normalizeAlertPeriod(alert.timePeriod);
                                    const point = unitSeries?.points.find(item => normalizeAlertPeriod(item.period) === period);
                                    const value = review.thresholdsByPolicy.get(alert.alertPolicyId)?.get(alert.level)?.get(alert.orgUnit)
                                        ?.find(item => normalizeAlertPeriod(item.period) === period)?.value;
                                    const level = review.policies.find(policy => policy.id === alert.alertPolicyId)?.levels?.find(item => item.name === alert.level);
                                    return (
                                        <DataTableRow key={alert.id}>
                                            <DataTableCell>{review.orgUnits.get(alert.orgUnit)?.displayName ?? alert.orgUnit}</DataTableCell>
                                            <DataTableCell>{getPeriodNameFromId(normalizeAlertPeriod(alert.timePeriod))}</DataTableCell>
                                            <DataTableCell>{alert.level}</DataTableCell>
                                            <DataTableCell>{point ? `${formatNumber(point.quantiles.quantile_low)} – ${formatNumber(point.quantiles.quantile_high)}` : '—'}</DataTableCell>
                                            <DataTableCell>{formatNumber(value)}</DataTableCell>
                                            <DataTableCell>{formatProbability(point && value != null ? estimateExceedance(point.quantiles, value) : undefined)}</DataTableCell>
                                            <DataTableCell>{level ? `${Math.round(level.exceedanceThreshold * 100)}%` : '—'}</DataTableCell>
                                        </DataTableRow>
                                    );
                                })}
                            </DataTableBody>
                        </DataTable>
                    )}
                </div>
            </Widget>
        </>
    );
};

export const ForecastDetails = ({ predictionId }: { predictionId: number }) => {
    const review = useReviewData(predictionId);
    if (review.isLoading) return <Loading />;
    if (review.error) return <ErrorNotice error={review.error} />;
    return <ForecastReview review={review} />;
};
