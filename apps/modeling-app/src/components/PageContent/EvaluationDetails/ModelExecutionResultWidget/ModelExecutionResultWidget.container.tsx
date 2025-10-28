import React, { useMemo, useState } from 'react';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import i18n from '@dhis2/d2-i18n';
import { usePlotDataForEvaluations } from '../../../../hooks/usePlotDataForEvaluations';
import { useBacktestById } from '../../../../hooks/useBacktestById';
import { ModelExecutionResultWidgetComponent } from './ModelExecutionResultWidget.component';
import styles from './ModelExecutionResultWidget.module.css';

type Props = {
    evaluationId: number;
};

export const ModelExecutionResultWidget = ({ evaluationId }: Props) => {
    const { backtest, isLoading: isBacktestLoading, error: backtestError } = useBacktestById(evaluationId);

    const evaluations = useMemo(() => {
        return backtest ? [backtest] : [];
    }, [backtest]);

    const {
        combined,
        isLoading: isPlotDataLoading,
        error: plotDataError,
    } = usePlotDataForEvaluations(evaluations, {});

    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string | undefined>(undefined);
    const [selectedSplitPeriod, setSelectedSplitPeriod] = useState<string | undefined>(undefined);

    const { orgUnits, splitPeriods } = useMemo(() => {
        const orgUnitsSet = new Set<string>();
        const splitPeriodsSet = new Set<string>();

        combined.viewData.forEach((view) => {
            splitPeriodsSet.add(view.splitPoint);
            view.evaluation.forEach((evaluation) => {
                orgUnitsSet.add(evaluation.orgUnitId);
            });
        });

        const orgUnits = Array.from(orgUnitsSet).sort();
        const splitPeriods = Array.from(splitPeriodsSet).sort();

        return { orgUnits, splitPeriods };
    }, [combined.viewData]);

    const effectiveSelectedOrgUnit = selectedOrgUnitId ?? orgUnits[0];

    const effectiveSelectedSplitPeriod = selectedSplitPeriod ?? splitPeriods[0];

    const dataForDisplay = useMemo(() => {
        if (!effectiveSelectedOrgUnit || !effectiveSelectedSplitPeriod) {
            return undefined;
        }

        const viewForSplitPeriod = combined.viewData.find(
            v => v.splitPoint === effectiveSelectedSplitPeriod,
        );

        if (!viewForSplitPeriod) {
            return undefined;
        }

        const orgUnitData = viewForSplitPeriod.evaluation.find(
            e => e.orgUnitId === effectiveSelectedOrgUnit,
        );

        return orgUnitData;
    }, [combined.viewData, effectiveSelectedOrgUnit, effectiveSelectedSplitPeriod]);

    const periods = useMemo(() => {
        if (!dataForDisplay || !dataForDisplay.models || dataForDisplay.models.length === 0) {
            return [];
        }
        return dataForDisplay.models[0]?.data?.periods ?? [];
    }, [dataForDisplay]);

    if (isBacktestLoading || isPlotDataLoading) {
        return (
            <div className={styles.loadingContainer}>
                <CircularLoader />
            </div>
        );
    }

    if (backtestError || plotDataError) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox title={i18n.t('Unable to load data')} error>
                    <p>{i18n.t('There was a problem loading required data. See the browser console for details.')}</p>
                </NoticeBox>
            </div>
        );
    }

    if (!backtest || orgUnits.length === 0 || splitPeriods.length === 0) {
        return (
            <div className={styles.errorContainer}>
                <NoticeBox title={i18n.t('No data available')} warning>
                    <p>{i18n.t('No organization units or split periods found for this evaluation.')}</p>
                </NoticeBox>
            </div>
        );
    }

    return (
        <ModelExecutionResultWidgetComponent
            orgUnits={orgUnits}
            splitPeriods={splitPeriods}
            selectedOrgUnitId={effectiveSelectedOrgUnit}
            selectedSplitPeriod={effectiveSelectedSplitPeriod}
            dataForDisplay={dataForDisplay}
            periods={periods}
            onSelectOrgUnit={setSelectedOrgUnitId}
            onSelectSplitPeriod={setSelectedSplitPeriod}
        />
    );
};
