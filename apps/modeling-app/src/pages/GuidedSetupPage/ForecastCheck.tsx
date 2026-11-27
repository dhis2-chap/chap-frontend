import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, MenuItem, NoticeBox, SingleSelect } from '@dhis2/ui';
import { LeaderboardBacktestRead, ResultPlot } from '@dhis2-chap/ui';
import { ALL_LOCATIONS_ORG_UNIT } from '../../components/PageContent/EvaluationDetails/ModelExecutionResultWidget/ModelExecutionResultWidget.container';
import { useOrgUnitsById } from '../../hooks/useOrgUnitsById';
import { usePlotDataForEvaluationsByOrgUnit } from '../../hooks/usePlotDataForEvaluationsByOrgUnit';
import { stitchForecasts } from './stitchForecasts';
import { getRunModelName } from './useGuidedProgress';
import styles from './GuidedSetupPage.module.css';

/** The model's forecasts over the whole evaluation next to what happened, for all locations or one. */
export const ForecastCheck = ({ run }: { run: LeaderboardBacktestRead }) => {
    const [orgUnitId, setOrgUnitId] = useState(ALL_LOCATIONS_ORG_UNIT.id);
    const { data: orgUnits } = useOrgUnitsById(run.orgUnits ?? []);
    const { viewData, isLoading, error } = usePlotDataForEvaluationsByOrgUnit(run, orgUnitId);
    const overview = useMemo(() => stitchForecasts(viewData.flatMap(window => window.evaluation[0]?.models[0]?.data ?? [])), [viewData]);
    const locations = [...orgUnits?.organisationUnits ?? []].sort((a, b) => a.displayName.localeCompare(b.displayName));

    return (
        <div className={styles.forecast} data-test="guided-forecast-check">
            <div className={styles.sectionHeader}>
                <div>
                    <p className={styles.checkQuestion}>{i18n.t('What it predicted, and what happened')}</p>
                    <p className={styles.muted}>
                        {i18n.t('The shaded range is where the model expected the numbers to land, up to {{count}} periods ahead. The orange line is what happened.', { count: run.nPeriods })}
                    </p>
                </div>
                <SingleSelect dense selected={orgUnitId} onChange={({ selected }) => setOrgUnitId(selected)} dataTest="guided-forecast-location">
                    <MenuItem value={ALL_LOCATIONS_ORG_UNIT.id} label={ALL_LOCATIONS_ORG_UNIT.displayName} />
                    {locations.map(location => <MenuItem key={location.id} value={location.id} label={location.displayName} />)}
                </SingleSelect>
            </div>
            {isLoading ? <CircularLoader small /> : error ? (
                <NoticeBox warning title={i18n.t('Could not load the forecasts')} />
            ) : !overview.data.periods.length ? (
                <p className={styles.muted}>{i18n.t('No forecasts for this location.')}</p>
            ) : (
                <>
                    <ResultPlot data={overview.data} modelName={getRunModelName(run)} nameLabel={i18n.t('Model')} />
                    {overview.scored > 0 && (
                        <p className={styles.forecastSummary}>
                            {i18n.t('What happened was inside the predicted range in {{inside}} of {{scored}} periods.', { inside: overview.inside, scored: overview.scored })}
                        </p>
                    )}
                </>
            )}
        </div>
    );
};
