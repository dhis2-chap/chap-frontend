import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    NoticeBox,
} from '@dhis2/ui';
import {
    getPeriodNameFromId,
    getSupportedOutbreakProbabilityBucket,
    OrgUnitMenu,
    OUTBREAK_PROBABILITY_OPTIONS,
    Pill,
    sortAlertLevels,
    UncertaintyAreaChart,
    useEndemicThresholdsForParams,
    usePredictionSeries,
    Widget,
    type AlertLevel,
    type AlertPolicyRead,
    type AlertRead,
    type PredictionInfo,
} from '@dhis2-chap/ui';
import { canonicalizePeriodId } from '@dhis2-chap/core';
import { ErrorNotice, Loading } from './StateViews';
import { normalizeAlertPeriod, severity } from '../utils/reviewData';
import styles from './ForecastReview.module.css';

type Props = {
    prediction: PredictionInfo;
    alerts: AlertRead[];
    policies: AlertPolicyRead[];
};

// Levels sharing threshold parameters share one threshold line.
const groupByThresholdParams = (levels: AlertLevel[]) => {
    const groups = new Map<string, AlertLevel[]>();
    for (const level of levels) {
        const key = JSON.stringify(level.thresholdParams);
        groups.set(key, [...groups.get(key) ?? [], level]);
    }
    return [...groups.values()];
};

const formatNumber = (value: number | null | undefined) => (
    value == null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 1 })
);

export const ForecastReview = ({ prediction, alerts, policies }: Props) => {
    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string>();
    const { series, predictionTargetName, isLoading, error } = usePredictionSeries({ prediction, historyYears: 1 });

    // Most severe alert first within each org unit.
    const alertsByOrgUnit = useMemo(() => {
        const grouped = new Map<string, AlertRead[]>();
        for (const alert of alerts) {
            grouped.set(alert.orgUnit, [...grouped.get(alert.orgUnit) ?? [], alert]);
        }
        grouped.forEach(orgUnitAlerts => orgUnitAlerts.sort((a, b) => severity(b, policies) - severity(a, policies)
            || a.timePeriod.localeCompare(b.timePeriod)));
        return grouped;
    }, [alerts, policies]);

    // Org units with the most severe and most alerts first, so reviewers start where it matters.
    const sortedSeries = useMemo(() => {
        const rank = (orgUnitId: string) => {
            const orgUnitAlerts = alertsByOrgUnit.get(orgUnitId);
            return orgUnitAlerts ? [severity(orgUnitAlerts[0], policies), orgUnitAlerts.length] : [-1, 0];
        };
        return [...series].sort((a, b) => {
            const [severityA, countA] = rank(a.orgUnitId);
            const [severityB, countB] = rank(b.orgUnitId);
            return severityB - severityA || countB - countA;
        });
    }, [series, alertsByOrgUnit, policies]);

    const selectedSeries = sortedSeries.find(s => s.orgUnitId === selectedOrgUnitId) ?? sortedSeries[0];
    const selectedAlerts = (selectedSeries && alertsByOrgUnit.get(selectedSeries.orgUnitId)) || [];

    // Alerts from one prediction come from its setup's policy; chart all of its levels.
    const policy = policies.find(p => p.id === alerts[0]?.alertPolicyId);
    const levels = useMemo(() => sortAlertLevels(policy?.levels ?? []), [policy]);
    const levelGroups = useMemo(() => groupByThresholdParams(levels), [levels]);
    const { thresholdMaps, error: thresholdsError } = useEndemicThresholdsForParams({
        datasetId: prediction.datasetId,
        series,
        paramsList: levelGroups.map(group => group[0].thresholdParams),
    });
    const thresholdsFor = (level: AlertLevel | undefined) => {
        const index = levelGroups.findIndex(group => level && group.includes(level));
        return selectedSeries && thresholdMaps[index]?.get(selectedSeries.orgUnitId);
    };
    const thresholdLines = levelGroups.length > 1
        ? levelGroups.map(group => ({
                name: i18n.t('Endemic threshold ({{levels}})', { levels: group.map(level => level.name).join(', ') }),
                thresholds: thresholdsFor(group[0]) ?? [],
            }))
        : undefined;
    // The forecast has quantiles for these probabilities only, so other levels have no line.
    const alertLines = levels.flatMap((level) => {
        const probability = OUTBREAK_PROBABILITY_OPTIONS.find(p => p === Math.round(level.exceedanceThreshold * 100));
        return probability ? [{ name: level.name, probability }] : [];
    });

    const rows = [...selectedAlerts].sort((a, b) => a.timePeriod.localeCompare(b.timePeriod)).map((alert) => {
        const period = normalizeAlertPeriod(alert.timePeriod);
        const point = selectedSeries?.points.find(p => canonicalizePeriodId(p.period) === period);
        const alertLevel = levels.find(l => l.name === alert.level);
        const threshold = thresholdsFor(alertLevel)
            ?.find(t => canonicalizePeriodId(t.period) === period)?.value ?? undefined;
        const chance = point && threshold !== undefined ? getSupportedOutbreakProbabilityBucket(point, threshold) : undefined;
        return { alert, period, point, alertLevel, threshold, chance };
    });

    if (isLoading) return <Loading />;
    if (error) return <ErrorNotice error={error} />;

    return (
        <Widget header={i18n.t('Forecast')} noncollapsible>
            <div className={styles.content}>
                {!selectedSeries ? <p>{i18n.t('No forecast values are available.')}</p> : (
                    <div className={styles.layout}>
                        <OrgUnitMenu
                            series={sortedSeries}
                            selectedOrgUnitId={selectedSeries.orgUnitId}
                            onSelect={setSelectedOrgUnitId}
                            getSuffix={(orgUnitId) => {
                                const count = alertsByOrgUnit.get(orgUnitId)?.length;
                                return count ? <Pill variant="destructive">{count}</Pill> : null;
                            }}
                        />
                        <div className={styles.plotArea}>
                            {!!thresholdsError && (
                                <NoticeBox warning title={i18n.t('Thresholds could not be loaded')}>
                                    {thresholdsError.message}
                                </NoticeBox>
                            )}
                            <UncertaintyAreaChart
                                series={selectedSeries}
                                predictionTargetName={predictionTargetName}
                                endemicThresholds={thresholdLines ? undefined : thresholdsFor(levels[0]) || undefined}
                                thresholdLines={thresholdLines}
                                alertLines={alertLines}
                                outbreakPeriods={rows.map(({ period, chance }) => ({
                                    period,
                                    outbreak: true,
                                    supportedProbability: chance ?? '<10',
                                    value: '1',
                                }))}
                            />
                            {rows.length === 0 ? <p>{i18n.t('No pending alerts for this organisation unit.')}</p> : (
                                <>
                                    <DataTable>
                                        <DataTableHead>
                                            <DataTableRow>
                                                <DataTableColumnHeader>{i18n.t('Period')}</DataTableColumnHeader>
                                                <DataTableColumnHeader>{i18n.t('Level')}</DataTableColumnHeader>
                                                <DataTableColumnHeader>{i18n.t('Forecast (80% range)')}</DataTableColumnHeader>
                                                <DataTableColumnHeader>{i18n.t('Threshold')}</DataTableColumnHeader>
                                                <DataTableColumnHeader>{i18n.t('Chance of exceeding')}</DataTableColumnHeader>
                                                <DataTableColumnHeader>{i18n.t('Policy trigger')}</DataTableColumnHeader>
                                            </DataTableRow>
                                        </DataTableHead>
                                        <DataTableBody>
                                            {rows.map(({ alert, period, point, alertLevel, threshold, chance }) => (
                                                <DataTableRow key={alert.id}>
                                                    <DataTableCell>{getPeriodNameFromId(period)}</DataTableCell>
                                                    <DataTableCell><Pill>{alert.level}</Pill></DataTableCell>
                                                    <DataTableCell>
                                                        {point ? `${formatNumber(point.quantiles.quantile_low)} – ${formatNumber(point.quantiles.quantile_high)}` : '—'}
                                                    </DataTableCell>
                                                    <DataTableCell>{formatNumber(threshold)}</DataTableCell>
                                                    <DataTableCell>{chance === undefined ? '—' : chance === '<10' ? '< 10%' : `≥ ${chance}%`}</DataTableCell>
                                                    <DataTableCell>{alertLevel ? `${Math.round(alertLevel.exceedanceThreshold * 100)}%` : '—'}</DataTableCell>
                                                </DataTableRow>
                                            ))}
                                        </DataTableBody>
                                    </DataTable>
                                    <p className={styles.note}>
                                        {i18n.t('Thresholds use the current alert policy and observations. Chances are estimated from forecast quantiles.')}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Widget>
    );
};
