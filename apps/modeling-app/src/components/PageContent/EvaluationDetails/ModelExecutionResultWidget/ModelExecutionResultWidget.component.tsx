import React, { useMemo, useState } from 'react';
import { CircularLoader, Menu, MenuItem } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { Widget, ResultPlot, BackTestRead } from '@dhis2-chap/ui';
import { SplitPeriodSlider } from '../../../../features/evaluation-compare/SplitPeriodSlider';
import styles from './ModelExecutionResultWidget.module.css';
import { usePlotDataForEvaluationsByOrgUnit } from '@/hooks/usePlotDataForEvaluationsByOrgUnit';

type Props = {
    backtest: BackTestRead;
    orgUnitIds: string[];
    orgUnitsMap: Map<string, { id: string; displayName: string }>;
    splitPeriods: string[];
    selectedOrgUnitId: string | undefined;
    selectedSplitPeriod: string | undefined;
    onSelectOrgUnit: (orgUnitId: string) => void;
    onSelectSplitPeriod: (splitPeriod: string) => void;
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
    selectedOrgUnitId,
    selectedSplitPeriod,
    onSelectOrgUnit,
    onSelectSplitPeriod,
}: Props) => {
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
                                {orgUnitIds.map(orgUnitId => (
                                    <MenuItem
                                        active={selectedOrgUnitId === orgUnitId}
                                        key={orgUnitId}
                                        label={orgUnitsMap.get(orgUnitId)?.displayName ?? orgUnitId}
                                        onClick={() => onSelectOrgUnit(orgUnitId)}
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
                            onChange={onSelectSplitPeriod}
                            periods={periods}
                        />
                    </div>
                </div>
            </Widget>
        </div>
    );
};
