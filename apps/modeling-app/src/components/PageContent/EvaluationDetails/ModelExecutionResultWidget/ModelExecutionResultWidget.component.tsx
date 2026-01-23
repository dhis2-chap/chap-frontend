import { useMemo, useState } from 'react';
import { CircularLoader, Menu, MenuItem } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Widget, ResultPlot, BackTestRead } from '@dhis2-chap/ui';
import { SplitPeriodSlider } from '../../../../features/evaluation-compare/SplitPeriodSlider';
import styles from './ModelExecutionResultWidget.module.css';
import { usePlotDataForEvaluationsByOrgUnit } from '@/hooks/usePlotDataForEvaluationsByOrgUnit';
import { ALL_LOCATIONS_ORG_UNIT } from './ModelExecutionResultWidget.container';

type Props = {
    backtest: BackTestRead;
    orgUnitIds: string[];
    orgUnitsMap: Map<string, { id: string; displayName: string }>;
    splitPeriods: string[];
};

const STATUSES = {
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success',
    EMPTY: 'empty',
} as const;

export const ModelExecutionResultWidgetComponent = ({
    backtest,
    orgUnitIds,
    orgUnitsMap,
    splitPeriods,
}: Props) => {
    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string | undefined>(ALL_LOCATIONS_ORG_UNIT.id);
    const [selectedSplitPeriod, setSelectedSplitPeriod] = useState<string | undefined>(splitPeriods[0]);
    const [open, setOpen] = useState(true);

    const {
        viewData,
        isLoading: isPlotDataLoading,
        error: plotDataError,
    } = usePlotDataForEvaluationsByOrgUnit(backtest, selectedOrgUnitId);

    const { dataForSplitPeriod, periods } = useMemo(() => {
        const dataForSplitPeriod = viewData
            .filter(v => v.splitPoint === selectedSplitPeriod)
            .flatMap(v =>
                v.evaluation.map(e => ({
                    ...e,
                    orgUnitName:
                        orgUnitsMap.get(e.orgUnitId)?.displayName ?? e.orgUnitId,
                })),
            )
            .sort((a, b) => a.orgUnitName.localeCompare(b.orgUnitName));
        const periods = dataForSplitPeriod[0]?.models[0].data.periods ?? [];
        return { dataForSplitPeriod, periods };
    }, [viewData, selectedSplitPeriod, orgUnitsMap]);

    const status = useMemo(() => {
        if (isPlotDataLoading) {
            return STATUSES.LOADING;
        }
        if (plotDataError) {
            return STATUSES.ERROR;
        }
        if (dataForSplitPeriod.length === 0) {
            return STATUSES.EMPTY;
        }
        return STATUSES.SUCCESS;
    }, [isPlotDataLoading, plotDataError]);

    return (
        <div className={styles.container}>
            <Widget
                header={i18n.t('Evaluation result')}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
            >
                <div className={styles.content}>
                    <div className={styles.mainLayout}>
                        <div className={styles.sidebar}>
                            <Menu dense>
                                <MenuItem
                                    active={selectedOrgUnitId === ALL_LOCATIONS_ORG_UNIT.id}
                                    label={ALL_LOCATIONS_ORG_UNIT.displayName}
                                    onClick={() => setSelectedOrgUnitId(ALL_LOCATIONS_ORG_UNIT.id)}
                                />
                                {orgUnitIds.map(orgUnitId => (
                                    <MenuItem
                                        active={selectedOrgUnitId === orgUnitId}
                                        key={orgUnitId}
                                        label={orgUnitsMap.get(orgUnitId)?.displayName ?? orgUnitId}
                                        onClick={() => setSelectedOrgUnitId(orgUnitId)}
                                    />
                                ))}
                            </Menu>
                        </div>

                        <div className={styles.plotArea}>
                            {status === STATUSES.SUCCESS && (
                                <ResultPlot
                                    data={dataForSplitPeriod[0].models[0].data}
                                    modelName={dataForSplitPeriod[0].models[0].modelName}
                                    syncZoom={false}
                                    nameLabel={i18n.t('Evaluation')}
                                />
                            )}
                            {status === STATUSES.LOADING && (
                                <div className={styles.formLoaderContainer}>
                                    <CircularLoader />
                                </div>
                            )}
                            {status === STATUSES.ERROR && (
                                <div className={styles.errorContainer}>
                                    <p>{i18n.t('There was an error loading the data.')}</p>
                                </div>
                            )}
                            {status === STATUSES.EMPTY && (
                                <div className={styles.emptyState}>
                                    <p>{i18n.t('No data available for the selected organization unit and split period.')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.sliderContainer}>
                        <SplitPeriodSlider
                            splitPeriods={splitPeriods}
                            selectedSplitPeriod={selectedSplitPeriod ?? splitPeriods[0]}
                            onChange={setSelectedSplitPeriod}
                            periods={periods}
                        />
                    </div>
                </div>
            </Widget>
        </div>
    );
};
